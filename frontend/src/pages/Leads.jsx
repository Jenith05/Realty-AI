import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Bell,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Crown,
  Filter,
  Flame,
  List,
  LogOut,
  MapPin,
  MoreVertical,
  Plus,
  Search,
  Snowflake,
  Sparkles,
  TrendingUp,
  UserRound,
  UsersRound,
  Zap,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import Sidebar from '../components/Sidebar'

const statusForScore = (score) => score >= 68 ? 'Hot' : score >= 35 ? 'Warm' : 'Cold'
const statusRank = { Hot: 0, Warm: 1, Cold: 2 }
const initialsFor = (name) => name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()
const avatarColors = ['bg-rose-100 text-rose-800', 'bg-violet-100 text-violet-800', 'bg-blue-100 text-blue-800', 'bg-emerald-100 text-emerald-800', 'bg-red-100 text-red-800', 'bg-sky-100 text-sky-800']

function scoreForLead(lead) {
  if (Number.isFinite(lead.score)) return lead.score
  let score = 42
  const timelinePoints = { Immediately: 35, '1–3 months': 28, '3–6 months': 20, '6+ months': 10 }
  score += timelinePoints[lead.buyingTimeline] || 8
  if (lead.notes?.trim()) score += 10
  if (lead.propertyType) score += 5
  if (lead.budgetRange) score += 5
  return Math.min(98, score)
}

function rankLeads(leads) {
  return leads
    .map((lead) => {
      const score = scoreForLead(lead)
      const status = ['Hot', 'Warm', 'Cold'].includes(lead.status) ? lead.status : statusForScore(score)
      return { ...lead, score, status }
    })
    .sort((left, right) => statusRank[left.status] - statusRank[right.status] || right.score - left.score)
}

function StatusBadge({ status }) {
  const styles = {
    Hot: 'bg-rose-100 text-rose-700',
    Warm: 'bg-orange-100 text-orange-700',
    Cold: 'bg-blue-100 text-blue-700',
  }
  const Icon = status === 'Hot' ? Flame : status === 'Warm' ? Flame : Snowflake
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold ${styles[status]}`}><Icon size={11} fill={status === 'Cold' ? 'none' : 'currentColor'} />{status}</span>
}

function ScoreRing({ score, status }) {
  const color = status === 'Hot' ? '#20a765' : status === 'Warm' ? '#f2aa32' : '#ef6b78'
  return <div className="grid h-[29px] w-[29px] place-items-center rounded-full" style={{ background: `conic-gradient(${color} ${score * 3.6}deg, #e9edf1 0deg)` }}><div className="grid h-[22px] w-[22px] place-items-center rounded-full bg-white text-[10px] font-bold text-gray-800">{score}</div></div>
}

export default function Leads() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(Boolean(user))
  const [loadError, setLoadError] = useState('')
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All leads')
  const [filterOpen, setFilterOpen] = useState(false)
  const [selectedStatuses, setSelectedStatuses] = useState([])
  const [page, setPage] = useState(1)
  const [selectedRows, setSelectedRows] = useState([])
  const [saveNotice, setSaveNotice] = useState(location.state?.notice || '')
  const pageSize = 10

  useEffect(() => {
    if (!user) {
      setLeads([])
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    api.get('/leads')
      .then(({ data }) => {
        if (!cancelled) {
          setLeads(rankLeads(data.leads || []))
          setLoadError('')
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLeads([])
          setLoadError('Could not load saved leads. Please retry.')
        }
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [user])

  useEffect(() => {
    if (!location.state?.notice) return
    setSaveNotice(location.state.notice)
    navigate(location.pathname, { replace: true, state: null })
  }, [location.pathname, location.state, navigate])

  const rankedLeads = rankLeads(leads)
  const counts = {
    'All leads': rankedLeads.length,
    Hot: rankedLeads.filter((lead) => lead.status === 'Hot').length,
    Warm: rankedLeads.filter((lead) => lead.status === 'Warm').length,
    Cold: rankedLeads.filter((lead) => lead.status === 'Cold').length,
  }
  const filteredLeads = rankedLeads.filter((lead) => {
    const query = search.trim().toLowerCase()
    const matchesSearch = !query || [lead.fullName, lead.location, lead.propertyType].some((value) => value?.toLowerCase().includes(query))
    const matchesCategory = activeCategory === 'All leads' || lead.status === activeCategory.split(' ')[0]
    const matchesFilter = selectedStatuses.length === 0 || selectedStatuses.includes(lead.status)
    return matchesSearch && matchesCategory && matchesFilter
  })
  const pages = Math.max(1, Math.ceil(filteredLeads.length / pageSize))
  const currentPage = Math.min(page, pages)
  const visibleLeads = filteredLeads.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const averageScore = rankedLeads.length ? Math.round(rankedLeads.reduce((sum, lead) => sum + lead.score, 0) / rankedLeads.length) : 0
  const locations = rankedLeads.reduce((result, lead) => { result[lead.location] = (result[lead.location] || 0) + 1; return result }, {})
  const topLocation = Object.entries(locations).sort((a, b) => b[1] - a[1])[0]
  const topLeads = rankedLeads.slice(0, 3)

  const selectCategory = (category) => {
    setActiveCategory(category)
    setPage(1)
  }
  const toggleStatus = (status) => {
    setSelectedStatuses((current) => current.includes(status) ? current.filter((item) => item !== status) : [...current, status])
    setPage(1)
  }
  const toggleVisibleRows = () => {
    const ids = visibleLeads.map((lead) => lead._id)
    const allSelected = ids.every((id) => selectedRows.includes(id))
    setSelectedRows((current) => allSelected ? current.filter((id) => !ids.includes(id)) : [...new Set([...current, ...ids])])
  }
  const handleLogout = () => {
    logout()
    navigate('/login')
  }
  const openLead = (lead) => navigate(`/leads/${lead._id}`, { state: { lead } })

  return (
    <div className="min-h-screen bg-[#f7f9fb] font-sans text-gray-950">
      <Sidebar user={user} onLogout={handleLogout} />
      <div className="ml-[58px] min-h-screen md:ml-[174px]">
        <header className="flex h-[40px] items-center justify-end bg-white px-4 md:px-5">
          <div className="flex items-center gap-4">
            <button type="button" aria-label="Notifications" className="relative text-gray-800"><Bell size={14} /><span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-red-500" /></button>
            {user ? <details className="relative"><summary className="flex cursor-pointer list-none items-center gap-2 text-[10px] font-medium"><span className="grid h-6 w-6 place-items-center rounded-full bg-gray-100 text-[10px]">{initialsFor(user.name || 'John Doe')}</span><span className="hidden sm:inline">{user.name || 'John Doe'}</span><ChevronDown size={11} /></summary><button type="button" onClick={handleLogout} className="absolute right-0 top-8 z-20 flex w-28 items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-left text-[11px] shadow-lg"><LogOut size={13} />Sign out</button></details> : <Link to="/login" className="rounded-md bg-gray-950 px-3 py-1.5 text-[10px] font-semibold text-white">Sign in</Link>}
          </div>
        </header>

        <main className="mx-auto max-w-[1440px] px-3 pb-3 pt-3 sm:px-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-[22px] font-bold leading-7 tracking-tight">Leads</h1>
              </div>
              <p className="text-[11px] text-gray-600">Find and prioritize your best leads with AI-powered insights and lead scores.</p>
              {saveNotice && <p role="status" className="mt-1 text-[10px] font-medium text-emerald-700">{saveNotice}</p>}
              {loadError && <p className="text-[10px] font-medium text-amber-700">{loadError}</p>}
            </div>
            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
              <label className="relative min-w-[190px] flex-1 sm:w-[275px] sm:flex-none">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} placeholder="Search by name, location, or property type..." className="h-[32px] w-full rounded-md border border-gray-200 bg-white pl-8 pr-2 text-[10px] placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10" />
              </label>
              <div className="relative">
                <button type="button" onClick={() => setFilterOpen((open) => !open)} className={`flex h-[32px] items-center gap-2 rounded-md border px-3 text-[10px] font-medium ${selectedStatuses.length ? 'border-gray-400 bg-gray-50' : 'border-gray-200 bg-white'}`}><Filter size={13} />Filter{selectedStatuses.length > 0 && <span className="rounded-full bg-gray-900 px-1.5 text-[9px] text-white">{selectedStatuses.length}</span>}</button>
                {filterOpen && <div className="absolute right-0 top-9 z-20 w-40 rounded-lg border border-gray-200 bg-white p-2 shadow-lg">{['Hot', 'Warm', 'Cold'].map((status) => <label key={status} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-[11px] hover:bg-gray-50"><input type="checkbox" checked={selectedStatuses.includes(status)} onChange={() => toggleStatus(status)} className="accent-gray-900" />{status}</label>)}<button type="button" onClick={() => setSelectedStatuses([])} className="mt-1 w-full border-t border-gray-100 px-2 pt-2 text-left text-[10px] text-gray-600">Clear filters</button></div>}
              </div>
              <Link to="/leads/new" className="flex h-[32px] items-center gap-2 rounded-md bg-[#17232e] px-3.5 text-[10px] font-semibold text-white hover:bg-gray-800"><Plus size={14} />Add Lead</Link>
            </div>
          </div>

          <div className="grid grid-cols-1 items-start gap-3 lg:grid-cols-[minmax(0,1fr)_248px]">
            <div className="min-w-0">
          <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { label: 'All leads', value: counts['All leads'], icon: UsersRound, color: 'text-white', active: 'bg-[#17232e]' },
              { label: 'Hot Leads', value: counts.Hot, icon: Flame, color: 'text-rose-600', active: 'bg-rose-50' },
              { label: 'Warm Leads', value: counts.Warm, icon: UsersRound, color: 'text-amber-600', active: 'bg-amber-50' },
              { label: 'Cold Leads', value: counts.Cold, icon: Snowflake, color: 'text-blue-600', active: 'bg-blue-50' },
            ].map(({ label, value, icon: Icon, color, active }) => {
              const selected = activeCategory === label
              return <button type="button" key={label} onClick={() => selectCategory(label)} className={`flex h-[49px] min-w-0 items-center gap-2.5 rounded-lg border border-gray-200/80 px-2.5 text-left transition sm:px-3 ${selected ? `${active} ${label === 'All leads' ? 'text-white' : 'text-gray-900'}` : 'bg-white hover:bg-gray-50'}`}><span className={`grid h-7 w-7 flex-shrink-0 place-items-center rounded-lg ${selected && label === 'All leads' ? 'bg-white/10' : 'bg-gray-50'} ${selected && label === 'All leads' ? 'text-white' : color}`}><Icon size={15} fill={label === 'Hot Leads' ? 'currentColor' : 'none'} /></span><span className="min-w-0"><span className={`block truncate text-[10px] font-semibold ${selected && label === 'All leads' ? 'text-white' : label === 'Hot Leads' ? 'text-rose-600' : 'text-gray-900'}`}>{label}</span><span className={`block text-[10px] ${selected && label === 'All leads' ? 'text-white/85' : 'text-gray-700'}`}>{value}</span></span></button>
            })}
          </div>

            <section className="min-w-0 overflow-hidden rounded-lg border border-gray-200/80 bg-white shadow-[0_3px_14px_rgba(15,23,42,0.035)]">
              {loading && <div className="p-5 text-center text-[12px] text-gray-500">Loading saved leads...</div>}
              {!loading && <>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] border-collapse text-left">
                    <thead><tr className="h-[34px] border-b border-gray-100 text-[10px] font-semibold text-gray-600"><th className="w-8 px-3"><input type="checkbox" aria-label="Select visible leads" checked={visibleLeads.length > 0 && visibleLeads.every((lead) => selectedRows.includes(lead._id))} onChange={toggleVisibleRows} className="accent-gray-900" /></th><th className="px-2">Lead</th><th className="px-2">Location</th><th className="px-2">Property Requirement</th><th className="px-2">Budget</th><th className="px-2">Timeline</th><th className="px-2">Lead Score</th><th className="px-2">Status</th><th className="w-8 px-2">Actions</th></tr></thead>
                    <tbody>
                      {visibleLeads.map((lead, index) => (
                        <tr key={lead._id} className="h-[51px] border-b border-gray-100/80 text-[10px] last:border-0 hover:bg-gray-50/70">
                          <td className="px-3"><input type="checkbox" aria-label={`Select ${lead.fullName}`} checked={selectedRows.includes(lead._id)} onChange={() => setSelectedRows((current) => current.includes(lead._id) ? current.filter((id) => id !== lead._id) : [...current, lead._id])} className="accent-gray-900" /></td>
                          <td className="px-2"><button type="button" onClick={() => openLead(lead)} className="flex max-w-[130px] items-center gap-2 text-left"><span className={`grid h-7 w-7 flex-shrink-0 place-items-center rounded-full text-[10px] font-semibold ${avatarColors[(index + (currentPage - 1) * pageSize) % avatarColors.length]}`}>{initialsFor(lead.fullName)}</span><span className="min-w-0"><span className="block truncate text-[10px] font-semibold text-gray-900">{lead.fullName}</span><span className="block max-w-[95px] truncate text-[9px] text-gray-500">{lead.notes || 'New lead'}</span></span></button></td>
                          <td className="px-2 text-gray-700">{lead.location}</td><td className="px-2 text-gray-700">{lead.propertyType}</td><td className="whitespace-nowrap px-2 text-gray-700">{lead.budgetRange}</td><td className="whitespace-nowrap px-2 text-gray-700">{lead.buyingTimeline}</td><td className="px-2"><ScoreRing score={lead.score} status={lead.status} /></td><td className="px-2"><StatusBadge status={lead.status} /></td><td className="px-2"><button type="button" aria-label={`View ${lead.fullName} details`} onClick={() => openLead(lead)} className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-900"><MoreVertical size={14} /></button></td>
                        </tr>
                      ))}
                      {visibleLeads.length === 0 && <tr><td colSpan="9" className="h-40 text-center text-[12px] text-gray-500">{!user ? <span>Sign in to view your saved leads. <Link to="/login" className="font-semibold text-gray-900 underline">Sign in</Link></span> : leads.length === 0 ? <span>No saved leads yet. <Link to="/leads/new" className="font-semibold text-gray-900 underline">Add your first lead</Link></span> : 'No leads match these filters.'}</td></tr>}
                    </tbody>
                  </table>
                </div>
                <div className="flex min-h-[40px] flex-wrap items-center justify-between gap-2 px-3 py-1.5 text-[10px] text-gray-700"><span>Showing {filteredLeads.length ? (currentPage - 1) * pageSize + 1 : 0}–{Math.min(currentPage * pageSize, filteredLeads.length)} of {filteredLeads.length} leads</span><div className="flex items-center gap-1"><button type="button" aria-label="Previous page" disabled={currentPage <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="grid h-7 w-7 place-items-center rounded border border-gray-200 disabled:opacity-40"><ChevronLeft size={14} /></button>{Array.from({ length: pages }, (_, index) => index + 1).slice(0, 3).map((number) => <button key={number} type="button" onClick={() => setPage(number)} className={`h-7 min-w-7 rounded border px-2 text-[10px] ${currentPage === number ? 'border-[#17232e] bg-[#17232e] text-white' : 'border-gray-200 bg-white'}`}>{number}</button>)}<button type="button" aria-label="Next page" disabled={currentPage >= pages} onClick={() => setPage((value) => Math.min(pages, value + 1))} className="grid h-7 w-7 place-items-center rounded border border-gray-200 disabled:opacity-40"><ChevronRight size={14} /></button></div></div>
              </>}
            </section>

            </div>
            <aside className="flex flex-col gap-3">
              <section className="rounded-lg border border-gray-200/80 bg-white p-3 shadow-[0_3px_14px_rgba(15,23,42,0.025)]">
                <h2 className="text-[12px] font-semibold">Lead Distribution</h2>
                <div className="mt-3 flex items-center gap-3">
                  <div className="grid h-[80px] w-[80px] flex-shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(#f04c55 0 ${rankedLeads.length ? counts.Hot / rankedLeads.length * 100 : 0}%, #f5ae38 0 ${rankedLeads.length ? (counts.Hot + counts.Warm) / rankedLeads.length * 100 : 0}%, #4e98f7 0 100%)` }}><div className="grid h-[58px] w-[58px] place-items-center rounded-full bg-white text-center"><span><strong className="block text-[15px] leading-4">{rankedLeads.length}</strong><span className="text-[8px] text-gray-500">Total Leads</span></span></div></div>
                  <div className="flex-1 space-y-2 text-[10px]">{[['Hot', counts.Hot, 'bg-rose-500'], ['Warm', counts.Warm, 'bg-amber-500'], ['Cold', counts.Cold, 'bg-blue-500']].map(([label, count, color]) => <div key={label} className="flex items-center gap-1.5"><span className={`h-1.5 w-1.5 rounded-full ${color}`} /><span className="flex-1 text-gray-700">{label}</span><span className="text-gray-500">{count} ({rankedLeads.length ? Math.round(count / rankedLeads.length * 100) : 0}%)</span></div>)}</div>
                </div>
              </section>

              <section className="rounded-lg border border-gray-200/80 bg-white p-3 shadow-[0_3px_14px_rgba(15,23,42,0.025)]">
                <h2 className="flex items-center justify-between text-[12px] font-semibold">Top Performing Leads <Crown size={13} className="text-amber-500" /></h2>
                <div className="mt-2 divide-y divide-gray-100">{topLeads.map((lead, index) => <button type="button" key={lead._id} onClick={() => openLead(lead)} className="flex w-full items-center gap-2 py-2 text-left"><span className={`grid h-7 w-7 flex-shrink-0 place-items-center rounded-full text-[10px] font-semibold ${avatarColors[index]}`}>{initialsFor(lead.fullName)}</span><span className="min-w-0 flex-1"><span className="block truncate text-[10px] font-semibold">{lead.fullName}</span><span className="mt-0.5 flex items-center gap-1 text-[9px] text-gray-500"><strong className="text-emerald-700">{lead.score}</strong> Score <span className="text-rose-600">• {lead.status}</span></span></span><ChevronRight size={13} className="text-gray-400" /></button>)}</div>
              </section>

              <section className="rounded-lg border border-gray-200/80 bg-white p-3 shadow-[0_3px_14px_rgba(15,23,42,0.025)]">
                <h2 className="text-[12px] font-semibold">Quick Insights</h2>
                <div className="mt-2 space-y-3 text-[10px]">
                  <div className="flex items-center gap-2.5"><span className="grid h-7 w-7 place-items-center rounded-md bg-gray-50"><TrendingUp size={14} /></span><span><strong className="block">{counts.Hot} hot leads</strong><span className="text-[9px] text-gray-500">Ready for immediate follow-up</span></span></div>
                  <div className="flex items-center gap-2.5"><span className="grid h-7 w-7 place-items-center rounded-md bg-gray-50"><CalendarDays size={14} /></span><span><strong className="block">Avg. lead score</strong><span className="text-[9px] text-gray-500">{averageScore} / 100</span></span></div>
                  <div className="flex items-center gap-2.5"><span className="grid h-7 w-7 place-items-center rounded-md bg-gray-50"><MapPin size={14} /></span><span><strong className="block">Top location</strong><span className="text-[9px] text-gray-500">{topLocation ? `${topLocation[0]} (${Math.round(topLocation[1] / Math.max(rankedLeads.length, 1) * 100)}%)` : 'No location data'}</span></span></div>
                </div>
              </section>

              <section className="relative overflow-hidden rounded-lg border border-blue-100 bg-[#edf5ff] p-3">
                <Sparkles size={14} fill="currentColor" className="absolute right-3 top-3 text-blue-400" />
                <h2 className="text-[11px] font-semibold">Let AI work for you</h2>
                <p className="mt-1 max-w-[180px] text-[9px] leading-4 text-gray-600">Get instant analysis, suggested responses, and call prep for any lead.</p>
                <Link to="/leads/new" className="mt-2 inline-flex h-7 items-center gap-1.5 rounded-md bg-[#17232e] px-2.5 text-[9px] font-semibold text-white">Analyze Leads <ArrowRight size={11} /></Link>
              </section>
            </aside>
          </div>
        </main>
      </div>
    </div>
  )
}
