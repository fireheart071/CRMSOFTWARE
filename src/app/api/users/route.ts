import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function getUserRoleFromRequest(request: NextRequest): string | null {
  const role = request.headers.get('X-User-Role')
  return role
}

function normalizeNameToId(name: string): string {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return base || `user-${Date.now()}`
}

export async function GET(request: NextRequest) {
  try {
    const role = getUserRoleFromRequest(request)
    if (!role) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins can fetch users
    if (role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    })

    return NextResponse.json(users)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const role = getUserRoleFromRequest(request)
    if (!role) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { name } = await request.json()
    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const normalized = normalizeNameToId(name)
    let candidateId = normalized
    let suffix = 1
    let existing = await prisma.user.findUnique({ where: { id: candidateId } })
    while (existing) {
      candidateId = `${normalized}-${suffix}`
      suffix += 1
      existing = await prisma.user.findUnique({ where: { id: candidateId } })
    }

    const user = await prisma.user.create({
      data: {
        id: candidateId,
        name: name.trim(),
        email: `${candidateId}@local.crm`,
        password: 'local-auth-placeholder',
        role: 'SALES'
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    })

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}