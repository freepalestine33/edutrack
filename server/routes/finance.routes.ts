import { Router } from 'express'
import fs from 'fs'
import path from 'path'
import { prisma } from '../lib/prisma'
import { requireAuth } from '../middleware/auth'
import { sendReceiptEmail } from '../services/email.service'
import { ensureReceiptDir, generateReceiptPdf, RECEIPT_DIR } from '../services/pdf.service'
import { sendWhatsAppReceipt } from '../services/whatsapp.service'

export const financeRouter = Router()

financeRouter.get('/finance', requireAuth, async (req, res) => {
  try {
    const orgId = req.auth!.orgId
    const [payments, expenses] = await Promise.all([
      prisma.payment.findMany({
        where: { orgId },
        include: { student: true },
        orderBy: { paidAt: 'desc' },
        take: 50,
      }),
      prisma.expense.findMany({
        where: { orgId },
        orderBy: { expenseDate: 'desc' },
      }),
    ])

    const totalRevenue = payments.reduce((s, p) => s + p.amount, 0)
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)

    res.json({ payments, expenses, totalRevenue, totalExpenses, profit: totalRevenue - totalExpenses })
  } catch (err) {
    console.error('Error fetching finance:', err)
    res.status(500).json({ error: 'Failed to fetch financial data' })
  }
})

financeRouter.post('/payments', requireAuth, async (req, res) => {
  try {
    const orgId = req.auth!.orgId
    const { studentId, subscriptionId, amount, currency, method, type } = req.body

    if (!studentId || !amount) return res.status(400).json({ error: 'Missing student or amount' })

    const student = await prisma.student.findFirst({ where: { id: studentId, orgId } })
    if (!student) return res.status(404).json({ error: 'Student not found in your organization' })

    const payment = await prisma.payment.create({
      data: {
        orgId,
        studentId,
        subscriptionId: subscriptionId || null,
        amount: Number(amount),
        currency: currency || 'DZD',
        method: method || 'CASH',
        type: type || 'SUBSCRIPTION',
      },
    })

    const org = await prisma.organization.findUnique({ where: { id: orgId } })
    await ensureReceiptDir()

    const receiptBuffer = await generateReceiptPdf(payment, student, org)
    const receiptFilename = `receipt-${payment.id}.pdf`
    const receiptPath = path.join(RECEIPT_DIR, receiptFilename)
    await fs.promises.writeFile(receiptPath, receiptBuffer)

    const receiptUrl = `/receipts/${receiptFilename}`
    await prisma.payment.update({ where: { id: payment.id }, data: { receiptUrl } })

    const fullPayment = await prisma.payment.findUnique({
      where: { id: payment.id },
      include: { student: true },
    })

    if (student.email) {
      await sendReceiptEmail(student.email, receiptBuffer, `${student.firstName} ${student.lastName}`, payment.id).catch((err) => {
        console.error('Email receipt error:', err)
      })
    }

    if (student.phone) {
      await sendWhatsAppReceipt(student.phone, payment.id)
    }

    res.status(201).json({ ...fullPayment, receiptUrl })
  } catch (err) {
    console.error('Error creating payment:', err)
    res.status(500).json({ error: 'Failed to record payment' })
  }
})

financeRouter.post('/expenses', requireAuth, async (req, res) => {
  try {
    const orgId = req.auth!.orgId
    const { category, amount, description, recurring } = req.body

    if (!category || amount === undefined) {
      return res.status(400).json({ error: 'Category and amount are required' })
    }

    const expense = await prisma.expense.create({
      data: { orgId, category, amount: Number(amount), description: description || null, recurring: !!recurring },
    })
    res.status(201).json(expense)
  } catch (err) {
    console.error('Error creating expense:', err)
    res.status(500).json({ error: 'Failed to record expense' })
  }
})

financeRouter.post('/test-send-receipt', requireAuth, async (req, res) => {
  const { studentId } = req.body
  if (!studentId) return res.status(400).json({ error: 'Missing studentId' })

  const orgId = req.auth!.orgId
  const student = await prisma.student.findFirst({ where: { id: studentId, orgId } })
  if (!student) return res.status(404).json({ error: 'Student not found in your organization' })

  const org = await prisma.organization.findUnique({ where: { id: orgId } })

  const paymentMock: any = {
    id: `test-${Date.now()}`,
    amount: 0,
    currency: 'DZD',
    method: 'TEST',
    type: 'TEST',
    paidAt: new Date(),
    subscriptionId: null,
  }

  try {
    const buffer = await generateReceiptPdf(paymentMock, student, org)
    const result: any = { email: 'skipped', whatsapp: 'skipped' }

    if (student.email) {
      try {
        await sendReceiptEmail(student.email, buffer, `${student.firstName} ${student.lastName}`, paymentMock.id)
        result.email = 'sent'
      } catch (err) {
        result.email = 'error'
        result.emailError = String(err)
      }
    }

    if (student.phone) {
      try {
        await sendWhatsAppReceipt(student.phone, paymentMock.id)
        result.whatsapp = 'requested'
      } catch (err) {
        result.whatsapp = 'error'
        result.whatsappError = String(err)
      }
    }

    res.json(result)
  } catch (err) {
    console.error('Test receipt generation failed:', err)
    res.status(500).json({ error: 'Failed to generate or send test receipt' })
  }
})
