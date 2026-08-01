import fs from 'fs'
import path from 'path'
import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { requireAuth } from '../middleware/auth'
import { RECEIPT_DIR, UPLOAD_DIR } from '../services/pdf.service'

export const filesRouter = Router()

function sendProtectedFile(res: import('express').Response, dir: string, filename: string) {
  const safeName = path.basename(filename)
  const resolvedDir = path.resolve(dir)
  const filePath = path.resolve(dir, safeName)
  if (!filePath.startsWith(resolvedDir)) {
    return res.status(400).json({ error: 'Invalid file path' })
  }
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' })
  }
  return res.sendFile(filePath)
}

filesRouter.get('/receipts/:filename', requireAuth, async (req, res) => {
  try {
    const orgId = req.auth!.orgId
    const filename = path.basename(String(req.params.filename))
    const receiptUrl = `/receipts/${filename}`

    const payment = await prisma.payment.findFirst({
      where: { orgId, receiptUrl },
    })
    if (!payment) {
      return res.status(404).json({ error: 'Receipt not found' })
    }

    return sendProtectedFile(res, RECEIPT_DIR, filename)
  } catch (err) {
    console.error('Error serving receipt:', err)
    res.status(500).json({ error: 'Failed to retrieve receipt' })
  }
})

filesRouter.get('/uploads/:filename', requireAuth, async (req, res) => {
  try {
    const orgId = req.auth!.orgId
    const filename = path.basename(String(req.params.filename))
    const proofUrl = `/uploads/${filename}`

    const request = await prisma.subscriptionRequest.findFirst({
      where: { orgId, proofUrl },
    })
    if (!request) {
      return res.status(404).json({ error: 'Upload not found' })
    }

    return sendProtectedFile(res, UPLOAD_DIR, filename)
  } catch (err) {
    console.error('Error serving upload:', err)
    res.status(500).json({ error: 'Failed to retrieve upload' })
  }
})
