require('dotenv').config()
const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')

const authRoutes = require('./routes/auth')
const leadRoutes = require('./routes/leads')

const app = express()
const PORT = process.env.PORT || 5001

let dbConnectionPromise = null

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is not defined. Set it in backend/.env before starting the app.')
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection
  }

  if (!dbConnectionPromise) {
    dbConnectionPromise = mongoose.connect(process.env.MONGO_URI)
  }

  await dbConnectionPromise
  return mongoose.connection
}

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(async (req, res, next) => {
  try {
    await connectDB()
    next()
  } catch (error) {
    next(error)
  }
})

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes)
app.use('/api/leads', leadRoutes)

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found.` })
})

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(err.statusCode || 500).json({ message: err.message || 'Internal Server Error' })
})

const startServer = async () => {
  try {
    await connectDB()
    console.log('✅  MongoDB connected')
    app.listen(PORT, () => console.log(`🚀  Server running on http://localhost:${PORT}`))
  } catch (err) {
    console.error('❌  MongoDB connection error:', err.message)
    process.exit(1)
  }
}

if (require.main === module) {
  startServer()
}

module.exports = { app, connectDB, startServer }
