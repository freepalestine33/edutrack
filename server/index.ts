/// <reference path="./pdfkit-nodemailer.d.ts" />
import cors from 'cors'
import express from 'express'
import { attendanceRouter } from './routes/attendance.routes'
import { authRouter } from './routes/auth.routes'
import { classRouter } from './routes/class.routes'
import { dashboardRouter } from './routes/dashboard.routes'
import { financeRouter } from './routes/finance.routes'
import { organizationRouter } from './routes/organization.routes'
import { reminderRouter } from './routes/reminder.routes'
import { subscriptionRouter } from './routes/subscription.routes'
import { studentRouter } from './routes/student.routes'
import { filesRouter } from './routes/files.routes'
import { ensureReceiptDir, ensureUploadDir } from './services/pdf.service'
import { globalErrorHandler } from './middleware/errorHandler'

const app = express()
const PORT = Number(process.env.PORT || 3001)

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  process.env.CLIENT_URL,
].filter(Boolean) as string[]

const isLocalhostOrigin = (origin: string) =>
  /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)

app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        /\.vercel\.app$/.test(origin) ||
        allowedOrigins.includes(origin) ||
        (process.env.NODE_ENV !== 'production' && origin && isLocalhostOrigin(origin))
      ) {
        callback(null, true)
      } else {
        callback(new Error('Not allowed by CORS'))
      }
    },
    credentials: true,
  }),
)

app.use(express.json())
app.use(filesRouter)

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', app: 'Edutrack' })
})

app.use('/api/auth', authRouter)
app.use('/api', organizationRouter)
app.use('/api', dashboardRouter)
app.use('/api', studentRouter)
app.use('/api', classRouter)
app.use('/api', subscriptionRouter)
app.use('/api', attendanceRouter)
app.use('/api', financeRouter)
app.use('/api', reminderRouter)

// Global error handler — must be last
app.use(globalErrorHandler)

async function startServer() {
  await ensureReceiptDir()
  await ensureUploadDir()
  app.listen(PORT, () => {
    console.log(`Edutrack API running on port ${PORT}`)
  })
}

startServer().catch((err) => {
  console.error('Failed to start Edutrack API server:', err)
})

