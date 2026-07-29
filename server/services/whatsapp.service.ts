export async function sendWhatsAppReceipt(phone: string, paymentId: string) {
  const receiptFilename = `receipt-${paymentId}.pdf`
  const receiptUrl = `${process.env.APP_URL ?? 'http://localhost:4173'}/receipts/${receiptFilename}`
  try {
    await sendWhatsAppBusinessMessage(phone, `Your receipt is ready: ${receiptUrl}`)
  } catch (err) {
    console.log('WhatsApp receipt send failed for', phone, err)
  }
}

export async function sendWhatsAppBusinessMessage(phone: string, text: string) {
  const apiUrl = process.env.WHATSAPP_API_URL
  const apiToken = process.env.WHATSAPP_API_TOKEN
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID

  if (!apiToken) {
    console.log('WhatsApp token not configured, skipping message to', phone)
    return
  }

  // If WHATSAPP_API_URL is provided, use it as a generic POST endpoint
  if (apiUrl) {
    try {
      const result = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiToken}`,
        },
        body: JSON.stringify({ to: phone, message: text }),
      })
      const body = await result.text().catch(() => '')
      if (!result.ok) {
        throw new Error(`status=${result.status} body=${body}`)
      }
      console.log('WhatsApp generic API call ok for', phone, 'status', result.status)
      return
    } catch (err) {
      console.log('WhatsApp generic API error for', phone, err)
      throw err
    }
  }

  // Fallback to Meta/WhatsApp Business Cloud API if phoneNumberId is provided
  if (!phoneNumberId) {
    console.log('WhatsApp Business API not configured (no WHATSAPP_API_URL or WHATSAPP_PHONE_NUMBER_ID)')
    return
  }

  const graphUrl = `https://graph.facebook.com/v17.0/${phoneNumberId}/messages`
  try {
    const payload = {
      messaging_product: 'whatsapp',
      to: phone,
      text: { body: text },
    }
    const result = await fetch(graphUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiToken}`,
      },
      body: JSON.stringify(payload),
    })
    const body = await result.text().catch(() => '')
    if (!result.ok) {
      throw new Error(`status=${result.status} body=${body}`)
    }
    console.log('WhatsApp Business API message queued for', phone, 'status', result.status)
  } catch (err) {
    console.log('WhatsApp Business API error for', phone, err)
    throw err
  }
}
