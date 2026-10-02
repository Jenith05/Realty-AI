const jwt = require('jsonwebtoken')
const User = require('../models/User')

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  })

const sendToken = (user, statusCode, res) => {
  const token = signToken(user._id)
  res.status(statusCode).json({
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  })
}

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide name, email and password.' })
    }

    const existing = await User.findOne({ email })
    if (existing) {
      return res.status(409).json({ message: 'An account with this email already exists.' })
    }

    const user = await User.create({ name, email, password })
    sendToken(user, 201, res)
  } catch (err) {
    console.error('register error:', err)
    res.status(500).json({ message: 'Server error. Please try again.' })
  }
}

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password.' })
    }

    const user = await User.findOne({ email }).select('+password')
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password.' })
    }

    sendToken(user, 200, res)
  } catch (err) {
    console.error('login error:', err)
    res.status(500).json({ message: 'Server error. Please try again.' })
  }
}

// GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
    res.status(200).json({ user })
  } catch (err) {
    res.status(500).json({ message: 'Server error.' })
  }
}
