/// <reference path="../pdfkit-nodemailer.d.ts" />
import fs from 'fs'
import path from 'path'
import PDFDocument from 'pdfkit'

export const RECEIPT_DIR = path.join(process.cwd(), 'receipts')
export const UPLOAD_DIR = path.join(process.cwd(), 'uploads')

export async function ensureReceiptDir() {
  await fs.promises.mkdir(RECEIPT_DIR, { recursive: true })
}

export async function ensureUploadDir() {
  await fs.promises.mkdir(UPLOAD_DIR, { recursive: true })
}

export async function getLogoBuffer(org: { logoUrl?: string }) {
  if (!org.logoUrl) return undefined
  try {
    if (org.logoUrl.startsWith('http')) {
      const res = await fetch(org.logoUrl)
      if (!res.ok) return undefined
      return Buffer.from(await res.arrayBuffer())
    }

    const logoPath = path.isAbsolute(org.logoUrl)
      ? org.logoUrl
      : path.join(process.cwd(), org.logoUrl)

    if (fs.existsSync(logoPath)) {
      return fs.promises.readFile(logoPath)
    }
  } catch (error) {
    console.log('Failed to load logo:', error)
  }
  return undefined
}

export async function generateReceiptPdf(payment: any, student: any, org: any): Promise<Buffer> {
  const logoBuffer = await getLogoBuffer(org)

  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40 })
    const buffers: Buffer[] = []

    doc.on('data', (chunk: any) => buffers.push(Buffer.from(chunk)))
    doc.on('error', reject)
    doc.on('end', () => resolve(Buffer.concat(buffers)))

    if (logoBuffer) {
      try {
        doc.image(logoBuffer, { fit: [120, 60], align: 'left' })
      } catch {
        /* ignore logo rendering errors */
      }
    }

    doc.fontSize(20).fillColor('#111827').text(org?.name || 'Edutrack Academy', { align: 'right' })
    doc.moveDown(1)
    doc.fontSize(16).fillColor('#0f766e').text('Payment Receipt', { underline: true })
    doc.moveDown(1)

    doc.fontSize(12).fillColor('#374151').text(`Receipt ID: ${payment.id}`)
    doc.text(`Date: ${new Date(payment.paidAt).toLocaleDateString()}`)
    doc.text(`Student: ${student.firstName} ${student.lastName}`)
    doc.text(`Email: ${student.email || 'N/A'}`)
    doc.text(`Phone: ${student.phone || 'N/A'}`)
    doc.moveDown(1)

    doc.fontSize(14).fillColor('#111827').text('Payment details', { underline: true })
    doc.moveDown(0.5)
    doc.fontSize(12).text(`Amount: ${payment.currency} ${payment.amount.toFixed(2)}`)
    doc.text(`Method: ${payment.method}`)
    doc.text(`Type: ${payment.type}`)
    if (payment.subscriptionId) {
      doc.text(`Subscription: ${payment.subscriptionId}`)
    }

    doc.moveDown(1)
    doc.fontSize(10).fillColor('#6b7280').text('Thank you for your payment. This receipt has been generated automatically and securely.', { align: 'left' })
    doc.end()
  })
}
