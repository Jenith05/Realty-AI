import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Home,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Zap,
  BarChart2,
  Cpu,
  MessageCircle,
  Flame,
  ChevronUp,
  FlaskConical,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const features = [
  {
    icon: Cpu,
    title: 'AI Lead Analysis',
    desc: 'Get instant insights, intent, and priorities for every lead.',
  },
  {
    icon: MessageCircle,
    title: 'Smart Follow-up Suggestions',
    desc: 'Know what to say, what to ask, and how to respond.',
  },
  {
    icon: BarChart2,
    title: 'Priority Lead Scoring',
    desc: 'Focus on high-value leads and close deals faster.',
  },
]

const demoCredentials = {
  email: 'demo@realtyai.test',
  password: 'RealtyAI-Demo-2026',
}

function GoogleIcon() {
  return <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#4285F4" d="M47.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h13.2c-.6 3-2.3 5.5-4.8 7.2v6h7.7c4.5-4.1 7.4-10.2 7.4-17.2z" />
    <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.7-6c-2.1 1.4-4.9 2.3-8.2 2.3-6.3 0-11.6-4.2-13.5-9.9H2.6v6.2C6.5 42.6 14.7 48 24 48z" />
    <path fill="#FBBC05" d="M10.5 28.6c-.5-1.4-.8-3-.8-4.6s.3-3.2.8-4.6v-6.2H2.6C.9 16.6 0 20.2 0 24s.9 7.4 2.6 10.8l7.9-6.2z" />
    <path fill="#EA4335" d="M24 9.5c3.5 0 6.7 1.2 9.2 3.6l6.9-6.9C36 2.1 30.5 0 24 0 14.7 0 6.5 5.4 2.6 13.2l7.9 6.2C12.4 13.7 17.7 9.5 24 9.5z" />
  </svg>
}

function LeadScoreCard() {
  return (
    <div className="absolute left-[42%] bottom-[54px] z-20 w-[174px] rounded-xl border border-gray-100 bg-white/95 p-3 shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[9px] font-semibold text-gray-700">Lead Score</span>
        <ChevronUp size={11} className="text-gray-400" />
      </div>
      <div className="flex items-center gap-3">
        <div className="relative h-[46px] w-[46px] flex-shrink-0">
          <svg viewBox="0 0 52 52" className="h-full w-full -rotate-90">
            <circle cx="26" cy="26" r="20" fill="none" stroke="#e5e7eb" strokeWidth="5" />
            <circle
              cx="26" cy="26" r="20"
              fill="none"
              stroke="#111827"
              strokeWidth="5"
              strokeDasharray={`${(92 / 100) * 125.6} 125.6`}
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[13px] font-bold text-gray-900">
            92
          </span>
        </div>
        <div className="flex flex-1 flex-col gap-1.5">
          <span className="h-[5px] w-full rounded-full bg-gray-300" />
          <span className="h-[5px] w-4/5 rounded-full bg-gray-200" />
          <span className="h-[5px] w-3/5 rounded-full bg-gray-200" />
        </div>
      </div>
      <div className="mt-1.5 flex items-center gap-1">
        <Flame size={10} className="text-gray-900" />
        <span className="text-[9px] font-bold text-gray-800">HOT</span>
      </div>
    </div>
  )
}

function ChartCard() {
  return (
    <div className="absolute bottom-0 left-[60%] z-20 w-[112px] rounded-xl border border-gray-100 bg-white/95 p-2.5 shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
      <svg viewBox="0 0 90 45" className="h-10 w-full">
        <polyline
          points="0,39 17,27 34,33 52,13 69,19 90,2"
          fill="none"
          stroke="#111827"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="0" cy="39" r="2" fill="#111827" />
        <circle cx="17" cy="27" r="2" fill="#111827" />
        <circle cx="34" cy="33" r="2" fill="#111827" />
        <circle cx="52" cy="13" r="2" fill="#111827" />
        <circle cx="69" cy="19" r="2" fill="#111827" />
        <circle cx="90" cy="2" r="2" fill="#111827" />
      </svg>
    </div>
  )
}

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-shell relative flex min-h-screen overflow-hidden bg-[#f7f7f6] font-sans">
      <section className="login-visual relative hidden w-1/2 flex-shrink-0 flex-col overflow-hidden px-[8vw] pb-0 pt-[5vh] lg:flex">
        <div className="relative z-10 flex items-center gap-2.5">
          <Home size={38} strokeWidth={2.7} className="text-gray-950" />
          <div className="leading-tight">
            <p className="text-[21px] font-bold tracking-tight text-gray-950">RealtyAI</p>
            <p className="mt-0.5 text-[11px] text-gray-700">AI-Powered Real Estate Lead Management</p>
          </div>
        </div>

        <div className="relative z-10 mt-9 inline-flex w-fit items-center gap-2 rounded-full border border-gray-200/80 bg-white/75 px-3.5 py-1.5 shadow-sm">
          <Zap size={12} fill="#111827" className="text-gray-900" />
          <span className="text-[10px] font-medium text-gray-800">Smarter Leads. Better Deals.</span>
        </div>

        <h1 className="relative z-10 mt-5 text-[36px] font-extrabold leading-[1.04] tracking-tight text-gray-950">
          Turn Leads into<br />Real Opportunities
        </h1>
        <p className="relative z-10 mt-3 max-w-[285px] text-[14px] leading-[1.4] text-gray-600">
          Analyze leads, understand customers, and close deals faster with the power of AI.
        </p>

        <div className="relative z-10 mt-4 flex flex-col gap-4">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-center gap-4">
              <div className="flex h-[48px] w-[48px] flex-shrink-0 items-center justify-center rounded-xl border border-gray-200/70 bg-white/65 text-gray-950">
                <Icon size={23} strokeWidth={2.2} />
              </div>
              <div>
                <p className="text-[12px] font-semibold leading-4 text-gray-950">{title}</p>
                <p className="mt-0.5 max-w-[220px] text-[10.5px] leading-[1.35] text-gray-600">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="relative mt-auto min-h-[205px] flex-1">
          <div className="absolute bottom-0 left-[-8vw] right-[-6vw] h-[245px] rounded-[52%_52%_0_0/28%_28%_0_0] bg-gray-200/60" />
          <img
            src="/house.jpg"
            alt="Modern home"
            className="absolute bottom-0 left-[-4px] h-[175px] w-[330px] object-cover object-[center_64%]"
            style={{ filter: 'grayscale(100%) brightness(0.88)', maskImage: 'linear-gradient(to bottom, black 75%, transparent 100%)' }}
          />
          <LeadScoreCard />
          <ChartCard />
        </div>
      </section>

      <section className="relative z-10 flex min-h-screen w-full items-center justify-center px-6 py-8 sm:px-10 lg:w-1/2 lg:justify-start lg:py-10 lg:pl-[19px] lg:pr-0">
        <div className="w-full max-w-[480px]">
          <div className="mb-6 flex items-center gap-2.5 lg:hidden">
            <Home size={34} strokeWidth={2.6} className="text-gray-950" />
            <div className="leading-tight">
              <p className="text-[20px] font-bold tracking-tight text-gray-950">RealtyAI</p>
              <p className="text-[10px] text-gray-700">AI-Powered Real Estate Lead Management</p>
            </div>
          </div>

          <div className="login-card rounded-xl border border-gray-200/90 bg-white/90 px-7 py-9 shadow-[0_8px_36px_rgba(0,0,0,0.06)] sm:px-10 sm:py-11 lg:translate-y-2 lg:pl-[66px] lg:pr-[56px] lg:pt-[66px] lg:pb-[63px]">
            <h2 className="text-[30px] font-bold leading-tight tracking-tight text-gray-950">Welcome Back</h2>
            <p className="mt-1.5 text-[15px] text-gray-600">Sign in to your account to continue</p>

            {error && (
              <div role="alert" className="mt-5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-[12px] text-red-700">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="mt-7 space-y-5">
              <div>
                <label htmlFor="login-email" className="mb-1.5 block text-[12px] font-semibold text-gray-900">Email Address</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@company.com"
                    className="h-[43px] w-full rounded-lg border border-gray-300 bg-white pl-10 pr-3 text-[12px] text-gray-900 placeholder:text-gray-400 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="login-password" className="mb-1.5 block text-[12px] font-semibold text-gray-900">Password</label>
                <div className="relative">
                  <Lock size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    className="h-[43px] w-full rounded-lg border border-gray-300 bg-white pl-10 pr-10 text-[12px] text-gray-900 placeholder:text-gray-400 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 transition hover:text-black"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 pt-0.5">
                <label className="flex cursor-pointer items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(event) => setRememberMe(event.target.checked)}
                    className="h-[18px] w-[18px] accent-gray-950"
                  />
                  <span className="whitespace-nowrap text-[11px] text-gray-600">Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setEmail(demoCredentials.email)
                    setPassword(demoCredentials.password)
                    setError('')
                  }}
                  className="flex items-center gap-1.5 whitespace-nowrap text-[10px] font-medium text-gray-800 hover:underline sm:text-[11px]"
                >
                  <FlaskConical size={13} />
                  Use test credentials
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-[#111111] text-[14px] font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-label="Signing in">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                ) : (
                  <>Sign In <ArrowRight size={16} /></>
                )}
              </button>
            </form>

            <div className="my-5 flex items-center gap-4">
              <div className="h-px flex-1 bg-gray-200" />
              <span className="text-[11px] text-gray-500">or</span>
              <div className="h-px flex-1 bg-gray-200" />
            </div>

            <button
              type="button"
              className="flex h-[44px] w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white text-[12px] font-semibold text-gray-900 transition hover:bg-gray-50"
            >
              <GoogleIcon />
              Continue with Google
            </button>

            <p className="mt-6 text-center text-[11px] text-gray-500">
              Don&apos;t have an account?{' '}
              <Link to="/register" className="font-bold text-gray-950 underline underline-offset-2">Sign up</Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
