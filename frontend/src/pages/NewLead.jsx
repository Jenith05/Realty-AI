import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Home,
  IndianRupee,
  LayoutDashboard,
  Lightbulb,
  List,
  LogOut,
  MapPin,
  MessageSquareText,
  Phone,
  Plus,
  Settings,
  Sparkles,
  Star,
  Target,
  UserRound,
  RefreshCw,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import Sidebar from '../components/Sidebar'

const propertyTypes = ['Apartment', 'Villa', 'Townhouse', 'Commercial', 'Land', 'Other']
const budgetRanges = ['Under 50 lakh', '50 lakh–1 crore', '1–2 crore', '2–5 crore', '5 crore+']
const buyingTimelines = ['Immediately', '1–3 months', '3–6 months', '6+ months']

const analysisFeatures = [
  { icon: MessageSquareText, title: 'AI-Summary', description: 'Quick overview of the lead and key highlights.' },
  { icon: Target, title: 'Intent Detection', description: 'Understand what the customer is looking for.' },
  { icon: List, title: 'Key Requirements', description: 'Extract must-haves and deal-breakers.' },
  { icon: RefreshCw, title: 'Recommended Next Action', description: 'Get a clear plan on what to do next.' },
  { icon: Star, title: 'Priority Score', description: 'Know how urgent and valuable the lead is.' },
]

const initialForm = {
  fullName: '',
  phone: '',
  location: '',
  propertyType: '',
  budgetRange: '',
  buyingTimeline: '',
  notes: '',
}

function SelectField({ id, label, icon: Icon, value, onChange, options, placeholder }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[12px] font-semibold text-gray-900">{label} <span aria-hidden="true">*</span></label>
      <div className="relative">
        <Icon size={16} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-600" />
        <select
          id={id}
          required
          value={value}
          onChange={onChange}
          className="h-[40px] w-full appearance-none rounded-md border border-gray-200 bg-white pl-9 pr-8 text-[12px] text-gray-800 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
        >
          <option value="" disabled>{placeholder}</option>
          {options.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
        <ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
      </div>
    </div>
  )
}

export default function NewLead() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const previewMode = !user
  const [form, setForm] = useState(initialForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const setField = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }))
    setError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (previewMode) {
      setError('Sign in to save this lead.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const { data } = await api.post('/leads', form)
      navigate('/leads', { state: { notice: `${data.lead.fullName} was added to your leads.` } })
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not save the lead. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-[#fafbfc] font-sans text-gray-950">
      <Sidebar user={user} onLogout={handleLogout} />

      <div className="ml-[58px] min-h-screen md:ml-[174px]">
        <header className="sticky top-0 z-20 flex h-[54px] items-center justify-end bg-white/95 px-4 backdrop-blur md:px-[23px] lg:pr-[25px]">
          <div className="flex flex-shrink-0 items-center gap-4 md:gap-5">
            <button type="button" aria-label="Notifications" className="relative text-gray-800">
              <Bell size={15} />
              <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-red-500" />
            </button>
            {user ? (
              <details className="relative">
                <summary className="flex cursor-pointer list-none items-center gap-2 text-[10px] font-medium text-gray-800">
                  <span className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-gray-100 text-[12px]">{user.name?.[0]?.toUpperCase() || 'J'}</span>
                  <span className="hidden sm:inline">{user.name || 'John Doe'}</span>
                  <ChevronDown size={12} className="text-gray-500" />
                </summary>
                <button type="button" onClick={handleLogout} className="absolute right-0 top-9 flex w-32 items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-left text-[11px] shadow-lg">
                  <LogOut size={13} /> Sign out
                </button>
              </details>
            ) : (
              <Link to="/login" className="rounded-md bg-gray-950 px-3 py-2 text-[10px] font-semibold text-white transition hover:bg-gray-800">Sign in</Link>
            )}
          </div>
        </header>

        <main className="mx-auto grid max-w-[1440px] grid-cols-1 gap-4 px-4 pb-3 pt-3 md:px-[23px] lg:pr-[25px] lg:grid-cols-[minmax(0,1fr)_362px] lg:gap-4">
          <section className="min-w-0">
            <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-[12px] font-medium text-gray-800 hover:text-black">
              <ArrowLeft size={12} /> Back to Dashboard
            </Link>
            <div className="mt-2 flex w-fit rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">New Lead</div>
            <h1 className="mt-2 text-[32px] font-bold leading-none tracking-tight text-gray-950">Add New Lead</h1>
            <p className="mt-2 max-w-[430px] text-[14px] leading-[1.45] text-gray-600">Capture lead details and let AI analyze it for insights, intent, and the best next steps.</p>
            <div className="mt-4 rounded-lg border border-gray-200/80 bg-white p-4 shadow-[0_4px_18px_rgba(15,23,42,0.035)] sm:p-[18px]">
              <div className="mb-5 flex items-center gap-2.5">
                <span className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-gray-100"><UserRound size={19} /></span>
                <div>
                  <h2 className="text-[15px] font-semibold leading-5">Lead Information</h2>
                  <p className="mt-0.5 text-[11px] text-gray-500">Fill in the key details about your lead.</p>
                </div>
              </div>

              {error && <p role="alert" className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">{error}</p>}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="lead-name" className="mb-1.5 block text-[12px] font-semibold">Full Name <span aria-hidden="true">*</span></label>
                    <div className="relative">
                      <UserRound size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-600" />
                      <input id="lead-name" required maxLength={120} value={form.fullName} onChange={setField('fullName')} placeholder="Enter customer name" className="h-[40px] w-full rounded-md border border-gray-200 bg-white pl-9 pr-2.5 text-[12px] placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10" />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="lead-phone" className="mb-1.5 block text-[12px] font-semibold">Phone Number <span aria-hidden="true">*</span></label>
                    <div className="relative">
                      <Phone size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-600" />
                      <input id="lead-phone" type="tel" required maxLength={32} value={form.phone} onChange={setField('phone')} placeholder="+91 98765 43210" className="h-[40px] w-full rounded-md border border-gray-200 bg-white pl-9 pr-2.5 text-[12px] placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10" />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="lead-location" className="mb-1.5 block text-[12px] font-semibold">Location / Area <span aria-hidden="true">*</span></label>
                    <div className="relative">
                      <MapPin size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-600" />
                      <input id="lead-location" list="lead-locations" required maxLength={160} value={form.location} onChange={setField('location')} placeholder="e.g. Bandra, Mumbai" className="h-[40px] w-full rounded-md border border-gray-200 bg-white pl-9 pr-2.5 text-[12px] placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10" />
                      <datalist id="lead-locations"><option value="Bandra, Mumbai" /><option value="Andheri, Mumbai" /><option value="Powai, Mumbai" /><option value="Pune" /></datalist>
                    </div>
                  </div>
                  <SelectField id="lead-property" label="Property Requirement" icon={Home} value={form.propertyType} onChange={setField('propertyType')} options={propertyTypes} placeholder="Select property type" />
                  <SelectField id="lead-budget" label="Budget Range" icon={IndianRupee} value={form.budgetRange} onChange={setField('budgetRange')} options={budgetRanges} placeholder="Select budget range" />
                  <SelectField id="lead-timeline" label="Buying Timeline" icon={CalendarDays} value={form.buyingTimeline} onChange={setField('buyingTimeline')} options={buyingTimelines} placeholder="Select timeline" />
                </div>

                <div>
                  <label htmlFor="lead-notes" className="mb-1.5 block text-[12px] font-semibold">Customer Message / Notes</label>
                  <div className="relative">
                    <MessageSquareText size={16} className="absolute left-2.5 top-3 text-gray-600" />
                    <textarea id="lead-notes" maxLength={500} value={form.notes} onChange={setField('notes')} placeholder="Add any additional details, preferences, or notes from the customer..." className="h-[84px] w-full resize-none rounded-md border border-gray-200 bg-white py-3 pl-9 pr-3 text-[12px] placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10" />
                    <span className="absolute bottom-2 right-2.5 text-[10px] text-gray-400">{form.notes.length}/500</span>
                  </div>
                </div>

                <button type="submit" disabled={loading} className="flex h-[42px] w-full items-center justify-center gap-2 rounded-md bg-[#171717] text-[12px] font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60">
                  {loading ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> Analyzing and saving...</> : <><Sparkles size={16} fill="white" /> Analyze &amp; Save Lead <ArrowRight size={16} /></>}
                </button>
              </form>
            </div>
          </section>

          <aside className="flex flex-col gap-4 lg:pt-[18px]">
            <section className="rounded-lg border border-gray-200/80 bg-white/80 p-4 shadow-[0_4px_18px_rgba(15,23,42,0.025)] sm:p-[18px]">
              <div className="flex items-start gap-3">
                <Sparkles size={20} fill="currentColor" className="mt-0.5 flex-shrink-0 text-gray-950" />
                <div>
                  <h2 className="text-[15px] font-semibold">AI-Powered Lead Analysis</h2>
                  <p className="mt-1 text-[12px] leading-[1.55] text-gray-600">Get instant, detailed insights to understand your lead better and plan the right approach.</p>
                </div>
              </div>
              <div className="mt-4 space-y-3.5">
                {analysisFeatures.map(({ icon: Icon, title, description }) => (
                  <div key={title} className="flex items-center gap-3">
                    <span className="flex h-[42px] w-[42px] flex-shrink-0 items-center justify-center rounded-full bg-gray-50"><Icon size={18} strokeWidth={2.3} /></span>
                    <span>
                      <span className="block text-[12px] font-semibold leading-5">{title}</span>
                      <span className="mt-0.5 block text-[11px] leading-[1.4] text-gray-500">{description}</span>
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section className="relative min-h-[180px] overflow-hidden rounded-lg border border-gray-200/80 bg-white/70 p-4 sm:p-[18px]">
              <div className="relative z-10 max-w-[235px]">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-gray-800"><Lightbulb size={15} /> Pro Tip</span>
                <h2 className="mt-2.5 text-[16px] font-bold leading-[1.3]">The more details you add, the better the AI works.</h2>
                <p className="mt-2.5 text-[12px] leading-[1.6] text-gray-600">Be specific about the property type, budget, and timeline to get more accurate insights and recommendations.</p>
              </div>
              <div aria-hidden="true" className="absolute bottom-7 right-5 flex h-[84px] w-[84px] rotate-2 flex-col gap-2 rounded-lg border border-gray-100 bg-white p-3 shadow-[0_8px_24px_rgba(15,23,42,0.08)]">
                <div className="flex items-center justify-between"><span className="h-1.5 w-7 rounded-full bg-gray-200" /><Home size={17} strokeWidth={2.6} /></div>
                <span className="h-1.5 w-12 rounded-full bg-gray-100" />
                <span className="h-1.5 w-10 rounded-full bg-gray-100" />
                <span className="h-1.5 w-14 rounded-full bg-gray-100" />
              </div>
              <Sparkles aria-hidden="true" size={14} fill="currentColor" className="absolute right-5 top-10 text-blue-300" />
            </section>
          </aside>
        </main>
      </div>
    </div>
  )
}