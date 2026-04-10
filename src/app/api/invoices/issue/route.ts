import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
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

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { leadId, email } = await request.json()
    if (!leadId) {
      return NextResponse.json({ error: 'leadId is required' }, { status: 400 })
    }

    const smtpHost = process.env.SMTP_HOST
    const smtpPort = Number(process.env.SMTP_PORT || 587)
    const smtpUser = process.env.SMTP_USER
    const smtpPass = process.env.SMTP_PASS
    const fromEmail = process.env.SMTP_FROM || smtpUser || process.env.GMAIL_USER

    const gmailUser = process.env.GMAIL_USER
    const gmailPass = process.env.GMAIL_APP_PASSWORD

    const isGmailConfigured = !!(gmailUser && gmailPass)
    const isSmtpConfigured = !!(smtpHost && smtpUser && smtpPass)

    if (!isGmailConfigured && !isSmtpConfigured) {
      return NextResponse.json(
        {
          error:
            'Email is not configured. Please set GMAIL_USER and GMAIL_APP_PASSWORD (or standard SMTP credentials) in your .env file.'
        },
        { status: 500 }
      )
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

    const clientEmail = email || lead.email

    if (!clientEmail) {
      return NextResponse.json(
        { error: 'Client email is missing. Add an email to this lead before issuing invoice.' },
        { status: 400 }
      )
    }

    if (email && email !== lead.email) {
      await prisma.lead.update({
        where: { id: lead.id },
        data: { email }
      })
    }

    const paymentData = lead.stageData[0] ? parseJsonData(lead.stageData[0].data) : {}
    const invoiceNumber = toText(paymentData.invoiceNumber, `INV-${lead.id.slice(-6).toUpperCase()}`)
    const invoiceDate = toText(paymentData.invoiceDate, new Date().toISOString().split('T')[0])
    const paymentDueDate = toText(paymentData.paymentDueDate, 'Not specified')
    const paymentMethod = toText(paymentData.paymentMethod)
    const paymentStatus = toText(paymentData.paymentStatus, 'Pending')
    const amountReceived = toText(paymentData.amountReceived, '0')
    const invoiceAmount = lead.dealValue ?? 0

    const subject = `Invoice ${invoiceNumber} - ${lead.clientName}`
    const html = `
      <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.5;">
        <h2 style="margin-bottom: 8px;">Invoice ${invoiceNumber}</h2>
        <p>Hello ${lead.clientName},</p>
        <p>Please find your invoice details below:</p>
        <table style="border-collapse: collapse; width: 100%; max-width: 640px;">
          <tbody>
            <tr><td style="border: 1px solid #d1d5db; padding: 8px; font-weight: 600;">Invoice Number</td><td style="border: 1px solid #d1d5db; padding: 8px;">${invoiceNumber}</td></tr>
            <tr><td style="border: 1px solid #d1d5db; padding: 8px; font-weight: 600;">Invoice Date</td><td style="border: 1px solid #d1d5db; padding: 8px;">${invoiceDate}</td></tr>
            <tr><td style="border: 1px solid #d1d5db; padding: 8px; font-weight: 600;">Due Date</td><td style="border: 1px solid #d1d5db; padding: 8px;">${paymentDueDate}</td></tr>
            <tr><td style="border: 1px solid #d1d5db; padding: 8px; font-weight: 600;">Service</td><td style="border: 1px solid #d1d5db; padding: 8px;">${toText(lead.serviceType, 'Service engagement')}</td></tr>
            <tr><td style="border: 1px solid #d1d5db; padding: 8px; font-weight: 600;">Amount (GHS)</td><td style="border: 1px solid #d1d5db; padding: 8px;">${invoiceAmount.toLocaleString()}</td></tr>
            <tr><td style="border: 1px solid #d1d5db; padding: 8px; font-weight: 600;">Amount Received (GHS)</td><td style="border: 1px solid #d1d5db; padding: 8px;">${amountReceived}</td></tr>
            <tr><td style="border: 1px solid #d1d5db; padding: 8px; font-weight: 600;">Payment Method</td><td style="border: 1px solid #d1d5db; padding: 8px;">${paymentMethod}</td></tr>
            <tr><td style="border: 1px solid #d1d5db; padding: 8px; font-weight: 600;">Payment Status</td><td style="border: 1px solid #d1d5db; padding: 8px;">${paymentStatus}</td></tr>
          </tbody>
        </table>
        <p style="margin-top: 16px;">If you have any questions, reply to this email.</p>
        <p>Best regards,<br/>${lead.assignedUser?.name || 'CRM Team'}</p>
      </div>
    `

    const transporter = nodemailer.createTransport(
      isGmailConfigured
        ? {
            service: 'gmail',
            auth: {
              user: gmailUser,
              pass: gmailPass
            }
          }
        : {
            host: smtpHost,
            port: smtpPort,
            secure: smtpPort === 465,
            auth: {
              user: smtpUser,
              pass: smtpPass
            }
          }
    )

    await transporter.sendMail({
      from: fromEmail,
      to: clientEmail,
      subject,
      html
    })

    return NextResponse.json({
      success: true,
      clientEmail: clientEmail,
      invoiceNumber
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to issue invoice' }, { status: 500 })
  }
}
