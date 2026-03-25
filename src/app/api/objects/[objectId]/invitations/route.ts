import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerSession } from 'next-auth/next'

import { authOptions } from '@/lib/auth/authOptions'
import { prisma } from '@/lib/db/prisma'
import { assertIsOwner } from '@/lib/acl/objectCare'
import { sendInvitationEmail } from '@/lib/email/sendInvitationEmail'

const CreateInvitationSchema = z.object({
  invitedEmail: z.string().email().max(320),
})

export async function POST(
  req: Request,
  { params }: { params: { objectId: string } },
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const inviterId = (session.user as any).id as string | undefined
  if (!inviterId) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const isOwner = await assertIsOwner(inviterId, params.objectId)
  if (!isOwner) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })

  const json = await req.json().catch(() => null)
  const parsed = CreateInvitationSchema.safeParse(json)
  if (!parsed.success) return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 })

  const invitedEmail = parsed.data.invitedEmail.toLowerCase().trim()
  if (!invitedEmail) return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 })

  // Prevent inviting yourself.
  const inviterEmail = (session.user as any).email as string | undefined
  if (inviterEmail && inviterEmail.toLowerCase() === invitedEmail) {
    return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 })
  }

  const existing = await prisma.objectShareInvitation.findFirst({
    where: {
      objectCareId: params.objectId,
      inviterId,
      invitedEmail,
      status: 'PENDING',
    },
    select: { id: true },
  })
  if (existing) return NextResponse.json({ invitation: { id: existing.id } })

  const invitedUser = await prisma.user.findUnique({
    where: { email: invitedEmail },
    select: { id: true },
  })

  const invitation = await prisma.objectShareInvitation.create({
    data: {
      objectCareId: params.objectId,
      inviterId,
      invitedEmail,
      invitedUserId: invitedUser?.id ?? null,
      permission: 'READ_AND_ADD_EVENTS',
    },
    select: {
      id: true,
      invitedEmail: true,
      invitedUserId: true,
      status: true,
      createdAt: true,
      objectCare: { select: { name: true } },
      inviter: { select: { name: true } },
    },
  })

  const acceptUrl = `${process.env.NEXTAUTH_URL ?? ''}/invitations`
  const emailResult = acceptUrl
    ? await sendInvitationEmail({
        to: invitedEmail,
        objectName: invitation.objectCare.name,
        inviterName: invitation.inviter.name,
        acceptUrl,
      })
    : { sent: false, reason: 'NEXTAUTH_URL_NOT_SET' }

  return NextResponse.json({ invitation, email: emailResult })
}

