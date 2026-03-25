import { prisma } from '@/lib/db/prisma'

export async function getActiveMembership(userId: string, objectCareId: string) {
  return prisma.objectCareMember.findUnique({
    where: {
      objectCareId_userId: {
        objectCareId,
        userId,
      },
    },
  })
}

export async function userCanReadObjectCare(userId: string, objectCareId: string) {
  const membership = await prisma.objectCareMember.findUnique({
    where: {
      objectCareId_userId: {
        objectCareId,
        userId,
      },
    },
    select: { endedAt: true },
  })
  if (membership && membership.endedAt === null) return true

  const obj = await prisma.objectCare.findUnique({
    where: { id: objectCareId },
    select: { ownerId: true },
  })
  return obj?.ownerId === userId
}

export async function getObjectCareOrThrow(userId: string, objectCareId: string) {
  const canRead = await userCanReadObjectCare(userId, objectCareId)
  if (!canRead) return null
  return prisma.objectCare.findUnique({ where: { id: objectCareId } })
}

export async function assertIsOwner(userId: string, objectCareId: string) {
  const membership = await prisma.objectCareMember.findUnique({
    where: {
      objectCareId_userId: { objectCareId, userId },
    },
    select: { role: true, endedAt: true },
  })
  const obj = await prisma.objectCare.findUnique({
    where: { id: objectCareId },
    select: { ownerId: true },
  })

  const isOwner =
    obj?.ownerId === userId || (membership?.endedAt === null && membership.role === 'OWNER')
  if (!isOwner) return false
  return true
}

