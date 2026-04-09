import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function getUserIdFromRequest(request: NextRequest): string | null {
  return request.headers.get('X-User-Id')
}

function parseJsonData(raw: string): Record<string, unknown> {
  try {
    return JSON.parse(raw) as Record<string, unknown>
  } catch {
    return {}
  }
}

function toText(value: unknown, fallback = 'N/A'): string {
  if (value === null || value === undefined || value === '') return fallback
  return String(value)
}

function safeFilename(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9-_]+/g, '-').replace(/-+/g, '-')
}

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const leadId = request.nextUrl.searchParams.get('leadId')
    if (!leadId) {
      return NextResponse.json({ error: 'leadId is required' }, { status: 400 })
    }

    const lead = await prisma.lead.findFirst({
      where: {
        id: leadId,
        createdBy: userId
      },
      include: {
        assignedUser: {
          select: { name: true, email: true }
        },
        stageData: {
          where: { stage: 'PAYMENT' },
          orderBy: { updatedAt: 'desc' },
          take: 1
        }
      }
    })

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found or access denied' }, { status: 404 })
    }

    const paymentData = lead.stageData[0] ? parseJsonData(lead.stageData[0].data) : {}
    const invoiceNumber = toText(paymentData.invoiceNumber, `INV-${lead.id.slice(-6).toUpperCase()}`)
    const invoiceDate = toText(paymentData.invoiceDate, new Date().toISOString().split('T')[0])
    const paymentDueDate = toText(paymentData.paymentDueDate, 'Not specified')
    const paymentMethod = toText(paymentData.paymentMethod)
    const paymentStatus = toText(paymentData.paymentStatus, 'Pending')
    const amountReceived = toText(paymentData.amountReceived, '0')
    const invoiceAmount = lead.dealValue ?? 0

    const docHtml = `
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            body { font-family: Arial, sans-serif; color: #111827; padding: 24px; }
            h1 { margin: 0 0 8px; }
            .muted { color: #6b7280; margin-bottom: 18px; }
            table { width: 100%; border-collapse: collapse; max-width: 700px; }
            td, th { border: 1px solid #d1d5db; padding: 8px; text-align: left; vertical-align: top; }
            th { background: #f3f4f6; }
            .field { width: 240px; font-weight: 600; }
          </style>
        </head>
        <body>
          <h1>Invoice ${invoiceNumber}</h1>
          <p class="muted">Generated: ${new Date().toISOString()}</p>
          <table>
            <tbody>
              <tr><td class="field">Client Name</td><td>${toText(lead.clientName)}</td></tr>
              <tr><td class="field">Client Email</td><td>${toText(lead.email, '-')}</td></tr>
              <tr><td class="field">Invoice Number</td><td>${invoiceNumber}</td></tr>
              <tr><td class="field">Invoice Date</td><td>${invoiceDate}</td></tr>
              <tr><td class="field">Payment Due Date</td><td>${paymentDueDate}</td></tr>
              <tr><td class="field">Service Type</td><td>${toText(lead.serviceType, 'Service engagement')}</td></tr>
              <tr><td class="field">Service Category</td><td>${toText(lead.serviceCategory, '-')}</td></tr>
              <tr><td class="field">Total Amount (GHS)</td><td>${invoiceAmount.toLocaleString()}</td></tr>
              <tr><td class="field">Amount Received (GHS)</td><td>${amountReceived}</td></tr>
              <tr><td class="field">Payment Method</td><td>${paymentMethod}</td></tr>
              <tr><td class="field">Payment Status</td><td>${paymentStatus}</td></tr>
              <tr><td class="field">Account Manager</td><td>${toText(lead.assignedUser?.name)}</td></tr>
            </tbody>
          </table>
        </body>
      </html>
    `

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `invoice-${safeFilename(lead.clientName)}-${timestamp}.doc`

    return new NextResponse(docHtml, {
      status: 200,
      headers: {
        'Content-Type': 'application/msword; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to download invoice' }, { status: 500 })
  }
}
