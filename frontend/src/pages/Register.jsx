import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Home, Mail, Lock, Eye, EyeOff, User, ArrowRight, Zap } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <path fill="#4285F4" d="M47.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h13.2c-.6 3-2.3 5.5-4.8 7.2v6h7.7c4.5-4.1 7.4-10.2 7.4-17.2z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.7-6c-2.1 1.4-4.9 2.3-8.2 2.3-6.3 0-11.6-4.2-13.5-9.9H2.6v6.2C6.5 42.6 14.7 48 24 48z" />
      <path fill="#FBBC05" d="M10.5 28.6c-.5-1.4-.8-3-.8-4.6s.3-3.2.8-4.6v-6.2H2.6C.9 16.6 0 20.2 0 24s.9 7.4 2.6 10.8l7.9-6.2z" />
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.7 1.2 9.2 3.6l6.9-6.9C36 2.1 30.5 0 24 0 14.7 0 6.5 5.4 2.6 13.2l7.9 6.2C12.4 13.7 17.7 9.5 24 9.5z" />
    </svg>
  )
}

export default function Register() {
  const navigate = useNavigate()
  const { register } = useAuth()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register(name, email, password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-[#f3f3f3] font-sans">
      {/* Left branding panel */}
      <div className="hidden lg:flex flex-col flex-1 px-14 py-10">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-9 h-9 border-2 border-gray-900 rounded-lg flex items-center justify-center">
            <Home size={18} strokeWidth={2.5} className="text-gray-900" />
          </div>
          <div>
            <p className="text-[15px] font-bold text-gray-900 leading-tight">Realty AI</p>
            <p className="text-[11px] text-gray-500 leading-tight">AI Real Estate Platform</p>
          </div>
        </div>
        <div className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-1.5 w-fit mb-8 shadow-sm">
          <Zap size={13} className="text-gray-700" />
          <span className="text-[12px] font-medium text-gray-700">Start closing smarter today.</span>
        </div>
        <h1 className="text-[40px] font-extrabold text-gray-900 leading-[1.1] mb-5 max-w-sm">
          Join Thousands of<br />Top Agents
        </h1>
        <p className="text-[14px] text-gray-500 leading-relaxed max-w-xs">
          Create your free account and unlock AI-powered lead scoring, insights, and automation built for real estate professionals.
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 items-center justify-center px-6 py-12 lg:px-16">
        <div className="w-full max-w-[420px] bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-[26px] font-bold text-gray-900 mb-1">Create an Account</h2>
          <p className="text-[13.5px] text-gray-500 mb-7">Fill in your details to get started</p>

          {error && (
            <div className="mb-5 bg-red-50 border border-red-200 text-red-600 text-[13px] rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div>
              <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Full Name</label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Smith"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-[13.5px] text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-[13.5px] text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  className="w-full pl-10 pr-11 py-2.5 border border-gray-300 rounded-lg text-[13.5px] text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 disabled:opacity-60 text-white font-semibold text-[14px] py-3 rounded-xl transition duration-150"
            >
              {loading ? (
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              ) : (
                <>Create Account <ArrowRight size={15} /></>
              )}
            </button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-[12px] text-gray-400">or</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <button
            type="button"
            className="w-full flex items-center justify-center gap-3 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-medium text-[13.5px] py-2.5 rounded-xl transition duration-150 shadow-sm"
          >
            <GoogleIcon />
            Continue with Google
          </button>

          <p className="text-center text-[13px] text-gray-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-gray-900 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
