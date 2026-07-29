/// <reference path="../pdfkit-nodemailer.d.ts" />
import nodemailer from 'nodemailer'

export function getMailTransport() {
  const { EMAIL_SMTP_HOST, EMAIL_SMTP_PORT, EMAIL_SMTP_USER, EMAIL_SMTP_PASS, EMAIL_FROM } = process.env
  if (!EMAIL_SMTP_HOST || !EMAIL_SMTP_PORT || !EMAIL_SMTP_USER || !EMAIL_SMTP_PASS || !EMAIL_FROM) {
    return null
  }

  return nodemailer.createTransport({
    host: EMAIL_SMTP_HOST,
    port: Number(EMAIL_SMTP_PORT),
    secure: Number(EMAIL_SMTP_PORT) === 465,
    auth: {
      user: EMAIL_SMTP_USER,
      pass: EMAIL_SMTP_PASS,
    },
  })
}

export async function sendReceiptEmail(toEmail: string, buffer: Buffer, studentName: string, paymentId: string) {
  const transport = getMailTransport()
  if (!transport) {
    console.log('Email transport not configured, skipping email to', toEmail)
    return
  }

  const { EMAIL_FROM } = process.env
  try {
    const info = await transport.sendMail({
      from: EMAIL_FROM,
      to: toEmail,
      subject: `Receipt #${paymentId}`,
      text: `Hello ${studentName},\n\nThank you for your payment. Your digital receipt is attached.`,
      attachments: [
        {
          filename: `receipt-${paymentId}.pdf`,
          content: buffer,
        },
      ],
    })
    console.log('Email sent to', toEmail, 'messageId=', info && (info as any).messageId)
  } catch (err) {
    console.log('Failed to send email to', toEmail, err)
    throw err
  }
}
