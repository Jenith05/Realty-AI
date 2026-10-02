import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  ArrowRight,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Flame,
  Home,
  List,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  Snowflake,
  Sparkles,
  Target,
  TrendingUp,
  UsersRound,
  Zap,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import Sidebar from '../components/Sidebar'

const avatarColors = ['bg-rose-100 text-rose-800', 'bg-blue-100 text-blue-800', 'bg-emerald-100 text-emerald-800', 'bg-amber-100 text-amber-800', 'bg-sky-100 text-sky-800']
const statusColors = { Hot: 'bg-rose-100 text-rose-700', Warm: 'bg-amber-100 text-amber-800', Cold: 'bg-blue-100 text-blue-700' }
const stageColor = (index) => ['bg-blue-100 text-blue-800', 'bg-emerald-100 text-emerald-800', 'bg-amber-100 text-amber-800', 'bg-sky-100 text-sky-800', 'bg-rose-100 text-rose-800'][index % 5]
const initialsFor = (name = 'Lead') => name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()
const scoreForLead = (lead) => Number.isFinite(lead.score) ? lead.score : 0
const statusForLead = (lead) => ['Hot', 'Warm', 'Cold'].includes(lead.status) ? lead.status : scoreForLead(lead) >= 68 ? 'Hot' : scoreForLead(lead) >= 35 ? 'Warm' : 'Cold'
const stagesForLead = (lead) => lead.followUp?.stages?.length ? lead.followUp.stages : ['Initial Call', 'Property Visit', 'Follow-up', 'Site Visit', 'Closure']
const dateValue = (value) => value ? new Date(value) : null
const isValidDate = (value) => value instanceof Date && Number.isFinite(value.getTime())
const formatDate = (value, options = { month: 'short', day: 'numeric' }) => {
  const date = dateValue(value)
  return isValidDate(date) ? date.toLocaleDateString([], options) : 'Date unavailable'
}
const formatTime = (value) => {
  const date = dateValue(value)
  return isValidDate(date) ? date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : ''
}
const relativeTime = (value) => {
  const date = dateValue(value)
  if (!isValidDate(date)) return 'Recently'
  const days = Math.floor((Date.now() - date.getTime()) / 86400000)
  if (days <= 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  return formatDate(date)
}

function Metric({ label, value, detail, icon: Icon, tone = 'blue' }) {
  const tones = {
    blue: 'bg-blue-50 text-blue-700',
    rose: 'bg-rose-50 text-rose-700',
    amber: 'bg-amber-50 text-amber-700',
    green: 'bg-emerald-50 text-emerald-700',
    slate: 'bg-slate-100 text-slate-700',
  }
  return <section className="flex min-w-0 items-center justify-between gap-2 rounded-lg border border-gray-200/80 bg-white p-3 shadow-[0_2px_9px_rgba(15,23,42,0.025)] sm:p-3.5"><div className="min-w-0"><p className="truncate text-[9px] font-semibold uppercase text-gray-500">{label}</p><p className="mt-1 text-[20px] font-bold leading-6 text-gray-950">{value}</p><p className="mt-1 truncate text-[8px] text-gray-500">{detail}</p></div><span className={`grid h-8 w-8 flex-shrink-0 place-items-center rounded-full ${tones[tone]}`}><Icon size={15} /></span></section>
}

function TrendChart({ leads, today }) {
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today)
    date.setDate(date.getDate() - 6 + index)
    const daily = leads.filter((lead) => {
      const created = dateValue(lead.createdAt)
      return isValidDate(created) && created.toDateString() === date.toDateString()
    })
    return {
      date,
      hot: daily.filter((lead) => statusForLead(lead) === 'Hot').length,
      warm: daily.filter((lead) => statusForLead(lead) === 'Warm').length,
      cold: daily.filter((lead) => statusForLead(lead) === 'Cold').length,
    }
  })
  const maximum = Math.max(1, ...days.flatMap((day) => [day.hot, day.warm, day.cold]))
  const yFor = (value) => 122 - (value / maximum) * 100
  const pointsFor = (key) => days.map((day, index) => `${24 + index * 55},${yFor(day[key])}`).join(' ')

  return (
    <section className="min-w-0 rounded-lg border border-gray-200/80 bg-white p-3.5 shadow-[0_2px_9px_rgba(15,23,42,0.025)]">
      <div className="flex flex-wrap items-start justify-between gap-2"><div><h2 className="text-[12px] font-semibold">Lead Performance</h2><p className="mt-0.5 text-[9px] text-gray-500">New leads by priority · Last 7 days</p></div><span className="text-[9px] text-gray-500">From saved lead dates</span></div>
      <div className="mt-2 flex justify-end gap-3 text-[8px] text-gray-600"><span className="flex items-center gap-1"><i className="h-1.5 w-1.5 rounded-full bg-rose-500" />Hot</span><span className="flex items-center gap-1"><i className="h-1.5 w-1.5 rounded-full bg-amber-500" />Warm</span><span className="flex items-center gap-1"><i className="h-1.5 w-1.5 rounded-full bg-blue-500" />Cold</span></div>
      <div className="mt-1 overflow-hidden"><svg viewBox="0 0 400 145" role="img" aria-label="Daily saved leads split by priority" className="h-[140px] w-full">
        {[22, 52, 82, 112].map((y) => <line key={y} x1="24" x2="376" y1={y} y2={y} stroke="#e8edf0" strokeWidth="1" />)}
        <polyline points={pointsFor('hot')} fill="none" stroke="#e35b50" strokeWidth="2.3" strokeLinejoin="round" strokeLinecap="round" />
        <polyline points={pointsFor('warm')} fill="none" stroke="#e4a22e" strokeWidth="2.3" strokeLinejoin="round" strokeLinecap="round" />
        <polyline points={pointsFor('cold')} fill="none" stroke="#4385e6" strokeWidth="2.3" strokeLinejoin="round" strokeLinecap="round" />
        {days.map((day, index) => <text key={day.date.toISOString()} x={24 + index * 55} y="140" textAnchor="middle" fill="#71808a" fontSize="8">{day.date.toLocaleDateString([], { month: 'short', day: 'numeric' })}</text>)}
      </svg></div>
    </section>
  )
}

function Distribution({ leads }) {
  const counts = ['Hot', 'Warm', 'Cold'].map((status) => leads.filter((lead) => statusForLead(lead) === status).length)
  const total = leads.length
  const hotStop = total ? counts[0] / total * 100 : 0
  const warmStop = total ? (counts[0] + counts[1]) / total * 100 : 0
  const background = total
    ? `conic-gradient(#e35b50 0 ${hotStop}%, #e4a22e ${hotStop}% ${warmStop}%, #4385e6 ${warmStop}% 100%)`
    : '#e8edf0'
  const items = [
    { label: 'Hot', count: counts[0], color: 'bg-rose-500' },
    { label: 'Warm', count: counts[1], color: 'bg-amber-500' },
    { label: 'Cold', count: counts[2], color: 'bg-blue-500' },
  ]

  return <section className="rounded-lg border border-gray-200/80 bg-white p-3.5 shadow-[0_2px_9px_rgba(15,23,42,0.025)]"><h2 className="text-[12px] font-semibold">Lead Distribution</h2><div className="mt-4 flex items-center justify-around gap-3"><div className="grid h-[112px] w-[112px] flex-shrink-0 place-items-center rounded-full" style={{ background }}><div className="grid h-[78px] w-[78px] place-items-center rounded-full bg-white text-center"><span><strong className="block text-[19px] leading-5">{total}</strong><span className="text-[8px] text-gray-500">Saved Leads</span></span></div></div><div className="min-w-0 flex-1 space-y-3">{items.map((item) => <div key={item.label} className="flex items-center gap-2 text-[9px]"><span className={`h-2 w-2 flex-shrink-0 rounded-full ${item.color}`} /><span className="flex-1 text-gray-600">{item.label}</span><span className="font-semibold text-gray-800">{item.count}</span><span className="w-8 text-right text-gray-500">{total ? Math.round(item.count / total * 100) : 0}%</span></div>)}</div></div></section>
}

function LeadRow({ lead, index, onOpen }) {
  const status = statusForLead(lead)
  const followUp = lead.followUp || {}
  const score = scoreForLead(lead)
  return <button type="button" onClick={() => onOpen(lead)} className="grid w-full grid-cols-[minmax(0,1.3fr)_minmax(74px,.8fr)_40px_minmax(74px,.75fr)] items-center gap-2 border-b border-gray-100 px-2 py-2 text-left last:border-0 hover:bg-gray-50/70 sm:grid-cols-[minmax(0,1.2fr)_minmax(100px,.9fr)_44px_minmax(92px,.8fr)]">
    <span className="flex min-w-0 items-center gap-2"><span className={`grid h-7 w-7 flex-shrink-0 place-items-center rounded-full text-[8px] font-bold ${avatarColors[index % avatarColors.length]}`}>{initialsFor(lead.fullName)}</span><span className="min-w-0"><span className="block truncate text-[9px] font-semibold text-gray-900">{lead.fullName}</span><span className={`mt-0.5 inline-flex rounded-full px-1.5 py-0.5 text-[7px] font-semibold ${statusColors[status]}`}>{status}</span></span></span>
    <span className="truncate text-[8px] text-gray-600">{lead.location || 'Location not set'}</span><span className="grid h-8 w-8 place-items-center rounded-full text-[8px] font-bold text-gray-800" style={{ background: `conic-gradient(#32a879 ${score * 3.6}deg, #e8edf0 0)` }}><span className="grid h-6 w-6 place-items-center rounded-full bg-white">{score}</span></span><span className="min-w-0 text-[8px] text-gray-700"><span className={`inline-block max-w-full truncate rounded px-1.5 py-0.5 ${stageColor(Math.max(0, stagesForLead(lead).indexOf(followUp.stage)))}`}>{followUp.stage || 'Initial Call'}</span><span className="mt-1 block truncate text-gray-500">{followUp.nextAction || 'No next action set'}</span></span>
  </button>
}

export default function Dashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setLoadError('')
    api.get('/leads')
      .then(({ data }) => {
        if (!cancelled) setLeads(Array.isArray(data.leads) ? data.leads : [])
      })
      .catch((error) => {
        if (!cancelled) setLoadError(error.response?.data?.message || 'Could not load your saved leads.')
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [reloadKey])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }
  const today = new Date()
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const currentWeekStart = new Date(todayStart)
  currentWeekStart.setDate(currentWeekStart.getDate() - 6)
  const previousWeekStart = new Date(currentWeekStart)
  previousWeekStart.setDate(previousWeekStart.getDate() - 7)
  const currentWeekCount = leads.filter((lead) => dateValue(lead.createdAt) >= currentWeekStart).length
  const previousWeekCount = leads.filter((lead) => {
    const created = dateValue(lead.createdAt)
    return isValidDate(created) && created >= previousWeekStart && created < currentWeekStart
  }).length
  const activeLeads = leads.filter((lead) => !lead.followUp?.isComplete)
  const completedLeads = leads.filter((lead) => lead.followUp?.isComplete)
  const normalizedQuery = searchQuery.trim().toLowerCase()
  const matchesSearch = (lead) => !normalizedQuery || [lead.fullName, lead.location, lead.propertyType, lead.budgetRange].some((value) => value?.toLowerCase().includes(normalizedQuery))
  const searchedLeads = leads.filter(matchesSearch)
  const inProgressLeads = searchedLeads.filter((lead) => {
    const stages = stagesForLead(lead)
    return (lead.followUp?.completedStages || []).length > 0 || (lead.followUp?.stage && lead.followUp.stage !== stages[0])
  })
  const hotLeads = leads.filter((lead) => statusForLead(lead) === 'Hot')
  const coldLeads = leads.filter((lead) => statusForLead(lead) === 'Cold')
  const averageScore = leads.length ? Math.round(leads.reduce((sum, lead) => sum + scoreForLead(lead), 0) / leads.length) : 0
  const recentLeads = [...searchedLeads].sort((left, right) => new Date(right.createdAt || 0) - new Date(left.createdAt || 0)).slice(0, 5)
  const activeSorted = [...searchedLeads.filter((lead) => !lead.followUp?.isComplete)].sort((left, right) => {
    const leftDate = dateValue(left.followUp?.scheduledAt)?.getTime() || Number.MAX_SAFE_INTEGER
    const rightDate = dateValue(right.followUp?.scheduledAt)?.getTime() || Number.MAX_SAFE_INTEGER
    return leftDate - rightDate || scoreForLead(right) - scoreForLead(left)
  })
  const progressSorted = [...inProgressLeads].sort((left, right) => scoreForLead(right) - scoreForLead(left)).slice(0, 5)
  const priorityLead = activeSorted[0] || null
  const locationCounts = Object.entries(leads.reduce((counts, lead) => {
    if (lead.location) counts[lead.location] = (counts[lead.location] || 0) + 1
    return counts
  }, {})).sort((left, right) => right[1] - left[1])
  const highIntentCount = leads.filter((lead) => lead.analysis?.intentLevel === 'High').length
  const commonTimeline = Object.entries(leads.reduce((counts, lead) => {
    if (lead.buyingTimeline) counts[lead.buyingTimeline] = (counts[lead.buyingTimeline] || 0) + 1
    return counts
  }, {})).sort((left, right) => right[1] - left[1])[0]
  const activity = searchedLeads.flatMap((lead) => (lead.followUp?.activity || []).map((entry, index) => ({ ...entry, lead, key: `${lead._id}-${entry.createdAt || index}-${index}` })))
    .sort((left, right) => new Date(right.createdAt || 0) - new Date(left.createdAt || 0))
    .slice(0, 6)
  const activityWithLeadFallback = activity.length ? activity : recentLeads.slice(0, 5).map((lead) => ({
    key: `${lead._id}-created`,
    text: 'Lead added',
    createdAt: lead.createdAt,
    lead,
  }))
  const firstName = user?.name?.trim().split(/\s+/)[0] || 'there'
  const weeklyTrend = previousWeekCount === 0
    ? currentWeekCount ? `${currentWeekCount} new this week` : 'No new leads this week'
    : `${currentWeekCount - previousWeekCount >= 0 ? '+' : ''}${currentWeekCount - previousWeekCount} vs previous week`

  return (
    <div className="min-h-screen bg-[#f4f7fa] font-sans text-gray-950">
      <Sidebar user={user} onLogout={handleLogout} />
      <div className="ml-[58px] min-h-screen md:ml-[174px]">
        <header className="flex h-[54px] items-center justify-between gap-3 border-b border-gray-200/70 bg-white px-3 sm:px-5">
          <label className="relative min-w-0 flex-1"><Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" /><input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Filter by name, area, or property" aria-label="Filter dashboard leads" className="h-8 w-full max-w-[330px] rounded-md border border-gray-200 bg-gray-50 pl-8 pr-3 text-[9px] text-gray-800 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10" /></label>
          <div className="flex flex-shrink-0 items-center gap-3 text-gray-600"><span aria-hidden="true" className="relative"><Bell size={14} /><span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-rose-500" /></span><span className="grid h-7 w-7 place-items-center rounded-full bg-slate-100 text-[8px] font-bold">{initialsFor(user?.name)}</span><span className="hidden text-[9px] font-semibold sm:inline">{user?.name || 'Agent'}</span></div>
        </header>

        <main className="mx-auto max-w-[1600px] px-3 pb-8 pt-4 sm:px-4 lg:px-5">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div><h1 className="text-[21px] font-bold leading-6">Good morning, {firstName}</h1><p className="mt-1 text-[10px] text-gray-500">Here&apos;s what&apos;s happening with your leads today.</p></div>
            <div className="flex items-center gap-2"><button type="button" onClick={() => setReloadKey((key) => key + 1)} disabled={loading} aria-label="Refresh dashboard" className="grid h-8 w-8 place-items-center rounded-md border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50"><RefreshCw size={13} /></button><span className="hidden items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2.5 py-2 text-[9px] text-gray-600 sm:inline-flex"><CalendarDays size={12} />{today.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}</span></div>
          </div>

          {loadError && <div role="alert" className="mb-4 flex items-center justify-between gap-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-[10px] text-rose-700"><span className="flex items-center gap-2"><AlertCircle size={13} />{loadError}</span><button type="button" onClick={() => setReloadKey((key) => key + 1)} className="font-semibold underline">Retry</button></div>}

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
            <Metric label="Total Leads" value={loading ? '—' : leads.length} detail={loading ? 'Loading saved leads' : weeklyTrend} icon={UsersRound} tone="blue" />
            <Metric label="Active Leads" value={loading ? '—' : activeLeads.length} detail="Open follow-up journeys" icon={Flame} tone="rose" />
            <Metric label="In Progress" value={loading ? '—' : inProgressLeads.length} detail="Past initial contact" icon={Clock3} tone="amber" />
            <Metric label="Completed" value={loading ? '—' : completedLeads.length} detail="Journeys completed" icon={CheckCircle2} tone="green" />
            <Metric label="Cold Leads" value={loading ? '—' : coldLeads.length} detail="Based on saved lead score" icon={Snowflake} tone="slate" />
          </div>

          <div className="mt-3 grid items-start gap-3 xl:grid-cols-[minmax(0,1.7fr)_minmax(300px,.9fr)]">
            <div className="grid min-w-0 gap-3 lg:grid-cols-[minmax(0,1.15fr)_minmax(260px,.85fr)]">
              <TrendChart leads={leads} today={today} />
              <Distribution leads={leads} />

              <section className="min-w-0 overflow-hidden rounded-lg border border-gray-200/80 bg-white shadow-[0_2px_9px_rgba(15,23,42,0.025)] lg:col-span-2">
                <div className="flex items-center justify-between gap-2 border-b border-gray-100 px-3.5 py-3"><div><h2 className="text-[11px] font-semibold">{normalizedQuery ? 'Matching Active Leads' : 'Active Leads'} ({normalizedQuery ? activeSorted.length : activeLeads.length})</h2><p className="mt-0.5 text-[8px] text-gray-500">Sorted by next follow-up and lead score</p></div><Link to="/leads" className="flex items-center gap-1 text-[8px] font-semibold text-gray-600 hover:text-gray-950">View all <ArrowRight size={10} /></Link></div>
                <div className="grid grid-cols-[minmax(0,1.3fr)_minmax(74px,.8fr)_40px_minmax(74px,.75fr)] gap-2 border-b border-gray-100 bg-gray-50/70 px-2 py-2 text-[7px] font-semibold uppercase text-gray-500 sm:grid-cols-[minmax(0,1.2fr)_minmax(100px,.9fr)_44px_minmax(92px,.8fr)]"><span>Lead</span><span>Location</span><span>Score</span><span>Stage / Next action</span></div>
                {loading ? <p className="p-6 text-center text-[9px] text-gray-500">Loading saved leads...</p> : activeSorted.length ? activeSorted.slice(0, 5).map((lead, index) => <LeadRow key={lead._id} lead={lead} index={index} onOpen={(item) => navigate(`/leads/${item._id}`, { state: { lead: item } })} />) : <div className="px-4 py-7 text-center"><p className="text-[10px] font-semibold text-gray-700">No active leads yet</p><p className="mt-1 text-[9px] text-gray-500">Create a lead to start tracking follow-ups here.</p><Link to="/leads/new" className="mt-3 inline-flex h-7 items-center gap-1.5 rounded-md bg-[#172c3b] px-2.5 text-[9px] font-semibold text-white"><Plus size={12} />Add lead</Link></div>}
              </section>

              <section className="min-w-0 overflow-hidden rounded-lg border border-gray-200/80 bg-white shadow-[0_2px_9px_rgba(15,23,42,0.025)]">
                <div className="flex items-center justify-between border-b border-gray-100 px-3.5 py-3"><div><h2 className="text-[11px] font-semibold">Leads in Progress ({inProgressLeads.length})</h2><p className="mt-0.5 text-[8px] text-gray-500">Current stage from each saved journey</p></div><Link to="/leads" className="text-[8px] font-semibold text-gray-600 hover:text-gray-950">View all →</Link></div>
                {loading ? <p className="p-5 text-center text-[9px] text-gray-500">Loading...</p> : progressSorted.length ? <div className="divide-y divide-gray-100">{progressSorted.map((lead, index) => <button key={lead._id} type="button" onClick={() => navigate(`/leads/${lead._id}`, { state: { lead } })} className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-gray-50"><span className={`grid h-6 w-6 flex-shrink-0 place-items-center rounded-full text-[7px] font-bold ${avatarColors[index % avatarColors.length]}`}>{initialsFor(lead.fullName)}</span><span className="min-w-0 flex-1"><span className="block truncate text-[8px] font-semibold">{lead.fullName}</span><span className="text-[8px] text-gray-500">{lead.followUp?.stage || 'Initial Call'}</span></span><span className="flex-shrink-0 text-right text-[8px] text-gray-500">{relativeTime(lead.followUp?.scheduledAt)}</span></button>)}</div> : <p className="px-3 py-6 text-center text-[9px] text-gray-500">No leads have moved beyond the first stage yet.</p>}
              </section>

              <section className="min-w-0 overflow-hidden rounded-lg border border-gray-200/80 bg-white shadow-[0_2px_9px_rgba(15,23,42,0.025)]">
                <div className="flex items-center justify-between border-b border-gray-100 px-3.5 py-3"><div><h2 className="text-[11px] font-semibold">Recently Added Leads</h2><p className="mt-0.5 text-[8px] text-gray-500">Latest records from your account</p></div><Link to="/leads" className="text-[8px] font-semibold text-gray-600 hover:text-gray-950">View all →</Link></div>
                {loading ? <p className="p-5 text-center text-[9px] text-gray-500">Loading...</p> : recentLeads.length ? <div className="divide-y divide-gray-100">{recentLeads.slice(0, 4).map((lead, index) => <button key={lead._id} type="button" onClick={() => navigate(`/leads/${lead._id}`, { state: { lead } })} className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-gray-50"><span className={`grid h-6 w-6 flex-shrink-0 place-items-center rounded-full text-[7px] font-bold ${avatarColors[(index + 2) % avatarColors.length]}`}>{initialsFor(lead.fullName)}</span><span className="min-w-0 flex-1"><span className="block truncate text-[8px] font-semibold">{lead.fullName}</span><span className="block truncate text-[8px] text-gray-500">{lead.location || 'Location not set'} · {lead.budgetRange || 'Budget not set'}</span></span><span className="flex-shrink-0 text-right text-[8px] text-gray-500">{formatDate(lead.createdAt)}<span className="block">{formatTime(lead.createdAt)}</span></span></button>)}</div> : <p className="px-3 py-6 text-center text-[9px] text-gray-500">New leads will appear here once created.</p>}
              </section>
            </div>

            <aside className="flex min-w-0 flex-col gap-3">
              <section className="rounded-lg border border-gray-200/80 bg-white p-3.5 shadow-[0_2px_9px_rgba(15,23,42,0.025)]">
                {priorityLead ? <>
                  <div className="flex items-start justify-between gap-2"><span className="rounded-full bg-emerald-50 px-2 py-1 text-[8px] font-semibold text-emerald-800">{statusForLead(priorityLead)} priority</span><span className="text-[8px] text-gray-500">Next action</span></div>
                  <button type="button" onClick={() => navigate(`/leads/${priorityLead._id}`, { state: { lead: priorityLead } })} className="mt-3 flex w-full items-center gap-2 text-left"><span className={`grid h-9 w-9 flex-shrink-0 place-items-center rounded-full text-[9px] font-bold ${avatarColors[0]}`}>{initialsFor(priorityLead.fullName)}</span><span className="min-w-0 flex-1"><span className="block truncate text-[10px] font-semibold">{priorityLead.fullName}</span><span className="mt-1 flex items-center gap-1 truncate text-[8px] text-gray-500"><MapPin size={9} />{priorityLead.location || 'Location not set'} · {priorityLead.propertyType || 'Property not set'}</span></span><span className="text-[13px] font-bold text-emerald-700">{scoreForLead(priorityLead)}</span></button>
                  <div className="mt-3 rounded-md border border-emerald-100 bg-[#f3faf7] p-2.5"><p className="text-[8px] font-semibold text-emerald-900">{priorityLead.followUp?.nextAction || 'Set a next action'}</p><p className="mt-1 text-[8px] text-gray-600">{priorityLead.followUp?.scheduledAt ? `${formatDate(priorityLead.followUp.scheduledAt, { weekday: 'short', month: 'short', day: 'numeric' })} · ${formatTime(priorityLead.followUp.scheduledAt)}` : 'No follow-up scheduled'}</p></div>
                </> : <><span className="grid h-8 w-8 place-items-center rounded-lg bg-blue-50 text-blue-700"><Target size={15} /></span><h2 className="mt-3 text-[11px] font-semibold">Your next opportunity</h2><p className="mt-1 text-[9px] leading-4 text-gray-600">{loading ? 'Loading your lead priorities...' : 'Once you add a lead, its next action and priority will show here.'}</p>{!loading && <Link to="/leads/new" className="mt-3 inline-flex h-7 items-center gap-1.5 rounded-md bg-[#172c3b] px-2.5 text-[8px] font-semibold text-white"><Plus size={11} />Add first lead</Link>}</>}
              </section>

              <section className="rounded-lg border border-gray-200/80 bg-white p-3.5 shadow-[0_2px_9px_rgba(15,23,42,0.025)]"><h2 className="flex items-center gap-2 text-[11px] font-semibold"><Clock3 size={13} />Recent Activity</h2>{loading ? <p className="mt-3 text-[9px] text-gray-500">Loading activity...</p> : activityWithLeadFallback.length ? <div className="mt-3 max-h-[250px] space-y-0 overflow-y-auto overscroll-contain pr-1">{activityWithLeadFallback.map((entry) => <button key={entry.key} type="button" onClick={() => navigate(`/leads/${entry.lead._id}`, { state: { lead: entry.lead } })} className="flex w-full gap-2.5 border-b border-gray-100 py-2.5 text-left last:border-0"><span className="mt-0.5 grid h-5 w-5 flex-shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-700"><CheckCircle2 size={11} /></span><span className="min-w-0 flex-1"><span className="block text-[8px] font-semibold text-gray-800">{entry.text}</span><span className="mt-0.5 block truncate text-[8px] text-gray-500">{entry.lead.fullName} · {relativeTime(entry.createdAt)} {formatTime(entry.createdAt)}</span></span><ChevronRight size={11} className="mt-1 flex-shrink-0 text-gray-400" /></button>)}</div> : <p className="mt-3 text-[9px] text-gray-500">Activity will appear when leads are added or updated.</p>}</section>

              <section className="rounded-lg border border-gray-200/80 bg-white p-3.5 shadow-[0_2px_9px_rgba(15,23,42,0.025)]"><h2 className="flex items-center gap-2 text-[11px] font-semibold"><Sparkles size={13} className="text-blue-700" />AI Insights</h2>{loading ? <p className="mt-3 text-[9px] text-gray-500">Calculating from your saved leads...</p> : leads.length ? <div className="mt-3 space-y-3 text-[8px]">{[{ icon: Zap, text: `${highIntentCount} ${highIntentCount === 1 ? 'lead shows' : 'leads show'} high purchase intent`, detail: 'Based on saved Gemini analysis.' }, { icon: MapPin, text: locationCounts[0] ? `${locationCounts[0][0]} is your top area` : 'No location patterns yet', detail: locationCounts[0] ? `${locationCounts[0][1]} of ${leads.length} leads` : 'Add lead locations to see patterns.' }, { icon: TrendingUp, text: `Average score is ${averageScore}`, detail: commonTimeline ? `Most common timeline: ${commonTimeline[0]}.` : 'No buying timeline patterns yet.' }].map(({ icon: Icon, text, detail }) => <div key={text} className="flex items-start gap-2"><span className="grid h-6 w-6 flex-shrink-0 place-items-center rounded-md bg-blue-50 text-blue-700"><Icon size={11} /></span><span><span className="block font-semibold text-gray-800">{text}</span><span className="mt-0.5 block text-gray-500">{detail}</span></span></div>)}</div> : <p className="mt-2 text-[9px] leading-4 text-gray-500">Insights will be based on your lead analysis and activity once leads are added.</p>}</section>

              <section className="rounded-lg border border-gray-200/80 bg-white p-3.5 shadow-[0_2px_9px_rgba(15,23,42,0.025)]"><h2 className="mb-2 text-[11px] font-semibold">Quick Actions</h2><div className="space-y-1.5"><Link to="/leads/new" className="flex min-h-9 items-center gap-2 rounded-md border border-gray-200 px-2.5 text-[8px] font-semibold text-gray-800 hover:bg-gray-50"><Plus size={12} />Add New Lead<ArrowRight size={10} className="ml-auto text-gray-400" /></Link><Link to="/leads" className="flex min-h-9 items-center gap-2 rounded-md border border-gray-200 px-2.5 text-[8px] font-semibold text-gray-800 hover:bg-gray-50"><List size={12} />View All Leads<ArrowRight size={10} className="ml-auto text-gray-400" /></Link><Link to={priorityLead ? `/leads/${priorityLead._id}` : '/leads'} className="flex min-h-9 items-center gap-2 rounded-md border border-gray-200 px-2.5 text-[8px] font-semibold text-gray-800 hover:bg-gray-50"><Home size={12} />Open Priority Lead<ArrowRight size={10} className="ml-auto text-gray-400" /></Link></div></section>
            </aside>
          </div>
        </main>
      </div>
    </div>
  )
}
