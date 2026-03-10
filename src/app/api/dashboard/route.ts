import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const totalLeads = await prisma.lead.count()
    const leadsInProgress = await prisma.lead.count({
      where: {
        stage: {
          not: 'CLIENT_RETENTION'
        }
      }
    })
    const dealsClosed = await prisma.lead.count({
      where: {
        stage: 'PAYMENT'
      }
    })

    const totalRevenue = await prisma.lead.aggregate({
      where: {
        stage: 'PAYMENT'
      },
      _sum: {
        dealValue: true
      }
    })

    const totalCommissionPaid = await prisma.commission.aggregate({
      where: {
        status: 'PAID'
      },
      _sum: {
        earned: true
      }
    })

    const pipelineData = await prisma.lead.groupBy({
      by: ['stage'],
      _count: {
        id: true
      }
    })

    return NextResponse.json({
      totalLeads,
      leadsInProgress,
      dealsClosed,
      totalRevenue: totalRevenue._sum.dealValue || 0,
      totalCommissionPaid: totalCommissionPaid._sum.earned || 0,
      pipelineData: pipelineData.map(item => ({
        stage: item.stage,
        count: item._count.id
      }))
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}