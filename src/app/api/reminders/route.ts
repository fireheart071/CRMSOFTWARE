import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function getUserIdFromRequest(request: NextRequest): string | null {
  return request.headers.get('X-User-Id')
}

type Reminder = {
  leadId: string
  clientName: string
  stage: string
  fieldKey: string
  fieldLabel: string
  dueDate: string
  status: 'OVERDUE' | 'TODAY' | 'UPCOMING'
}

const reminderFieldLabels: Record<string, string> = {
  followUpDate: 'Follow-up Date',
  paymentDueDate: 'Payment Due Date',
  closingDate: 'Expected Closing Date',
  contractRenewalDate: 'Contract Renewal Date',
  contactDate: 'Contact Date',
  presentationDate: 'Presentation Date',
  negotiationStartDate: 'Negotiation Start Date',
  onboardingDate: 'Onboarding Date',
  invoiceDate: 'Invoice Date'
}

function toDateOnly(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function getReminderStatus(targetDate: Date): Reminder['status'] {
  const today = toDateOnly(new Date())
  const due = toDateOnly(targetDate)

  if (due.getTime() < today.getTime()) return 'OVERDUE'
  if (due.getTime() === today.getTime()) return 'TODAY'
  return 'UPCOMING'
}

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const stageEntries = await prisma.stageData.findMany({
      where: {
        lead: {
          createdBy: userId
        }
      },
      include: {
        lead: {
          select: {
            id: true,
            clientName: true,
            stage: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    // Keep only the latest saved entry for each lead + stage.
    // This ensures old reminders are cleared when new stage data is added.
    const latestByLeadStage = new Map<string, (typeof stageEntries)[number]>()
    for (const entry of stageEntries) {
      const key = `${entry.leadId}:${entry.stage}`
      if (!latestByLeadStage.has(key)) {
        latestByLeadStage.set(key, entry)
      }
    }

    const reminders: Reminder[] = []
    for (const entry of latestByLeadStage.values()) {
      // Clear reminders from previous stages once lead moves forward.
      if (entry.stage !== entry.lead.stage) continue

      const data = JSON.parse(entry.data) as Record<string, unknown>

      for (const [fieldKey, value] of Object.entries(data)) {
        if (typeof value !== 'string' || !value.trim()) continue

        const isDateField =
          fieldKey.toLowerCase().includes('date') || fieldKey.toLowerCase().includes('due')
        if (!isDateField) continue

        const parsedDate = new Date(value)
        if (Number.isNaN(parsedDate.getTime())) continue

        reminders.push({
          leadId: entry.lead.id,
          clientName: entry.lead.clientName,
          stage: entry.stage,
          fieldKey,
          fieldLabel: reminderFieldLabels[fieldKey] || fieldKey,
          dueDate: parsedDate.toISOString(),
          status: getReminderStatus(parsedDate)
        })
      }
    }

    reminders.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    return NextResponse.json(reminders)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
