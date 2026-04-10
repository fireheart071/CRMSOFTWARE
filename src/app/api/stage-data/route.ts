import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function getUserIdFromRequest(request: NextRequest): string | null {
  const userId = request.headers.get('X-User-Id')
  if (!userId || userId === 'undefined' || userId === 'null') return null
  return userId
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { leadId, stage, data, stageDataId } = await request.json()

    if (!leadId || !stage || !data) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })

    // Verify that the lead belongs to the authenticated user
    const lead = await prisma.lead.findFirst({
      where: user?.role === 'ADMIN' ? { id: leadId } : {
        id: leadId,
        OR: [
          { createdBy: userId },
          { assignedTo: userId }
        ]
      }
    })

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found or access denied' }, { status: 404 })
    }

    let stageData

    if (stageDataId) {
      const existing = await prisma.stageData.findFirst({
        where: {
          id: stageDataId,
          leadId
        }
      })

      if (!existing) {
        return NextResponse.json({ error: 'Stage entry not found' }, { status: 404 })
      }

      stageData = await prisma.stageData.update({
        where: { id: stageDataId },
        data: {
          stage,
          data: JSON.stringify(data),
          updatedAt: new Date()
        }
      })
    } else {
      // Create a new stage entry to preserve full history/reference.
      stageData = await prisma.stageData.create({
        data: {
          leadId,
          stage,
          data: JSON.stringify(data)
        }
      })
    }

    // If this is CLOSE_DEAL stage and contractValue is provided, update the lead's dealValue
    if (stage === 'CLOSE_DEAL' && data.contractValue) {
      await prisma.lead.update({
        where: { id: leadId },
        data: {
          dealValue: parseFloat(data.contractValue)
        }
      })
    }

    return NextResponse.json({ success: true, stageData })
  } catch (error) {
    console.error('Error saving stage data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const leadId = searchParams.get('leadId')
    const stage = searchParams.get('stage')

    if (!leadId) {
      return NextResponse.json({ error: 'Lead ID is required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })

    // Verify that the lead belongs to the authenticated user
    const lead = await prisma.lead.findFirst({
      where: user?.role === 'ADMIN' ? { id: leadId } : {
        id: leadId,
        OR: [
          { createdBy: userId },
          { assignedTo: userId }
        ]
      }
    })

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found or access denied' }, { status: 404 })
    }

    let whereClause: any = { leadId }

    if (stage) {
      whereClause.stage = stage
    }

    const stageData = await prisma.stageData.findMany({
      where: whereClause,
      orderBy: { updatedAt: 'desc' }
    })

    // Parse the JSON data
    const parsedData = stageData.map(item => ({
      ...item,
      data: JSON.parse(item.data)
    }))

    return NextResponse.json(parsedData)
  } catch (error) {
    console.error('Error fetching stage data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}