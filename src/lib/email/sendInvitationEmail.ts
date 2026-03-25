export type SendInvitationEmailResult = {
  sent: boolean
  reason?: string
}

export async function sendInvitationEmail(params: {
  to: string
  objectName: string
  inviterName: string | null
  acceptUrl: string
}): Promise<SendInvitationEmailResult> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM
  if (!apiKey || !from) {
    return { sent: false, reason: 'EMAIL_SENDING_NOT_CONFIGURED' }
  }

  const subject = `Приглашение следить за “${params.objectName}”`
  const text = [
    `Привет! ${params.inviterName ? `${params.inviterName} ` : ''}пригласил(а) тебя следить за “${params.objectName}”.`,
    '',
    `Чтобы принять: открой ${params.acceptUrl} → “Приглашения”.`,
  ].join('\n')

  // Resend: https://resend.com/docs/api-reference/emails
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: params.to,
        subject,
        text,
      }),
    })

    if (!res.ok) {
      return { sent: false, reason: 'EMAIL_SENDING_FAILED' }
    }

    return { sent: true }
  } catch {
    return { sent: false, reason: 'EMAIL_SENDING_NETWORK_ERROR' }
  }
}

