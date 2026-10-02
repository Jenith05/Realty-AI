import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  CheckCheck,
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  FileText,
  Flame,
  Home,
  List,
  LogOut,
  MapPin,
  MessageSquare,
  Pencil,
  Phone,
  Plus,
  Send,
  Share2,
  Sparkles,
  Target,
  UserRound,
  Wallet,
  X,
  Zap,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import Sidebar from '../components/Sidebar'

const initialsFor = (name = 'Lead') => name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()
const scoreFor = (lead) => lead.score ?? (lead.notes ? 78 : 58)
const defaultFollowUpStages = ['Initial Call', 'Property Visit', 'Follow-up', 'Site Visit', 'Closure']
const followUpAdvice = {
  'Initial Call': 'Confirm the lead’s requirements, budget, preferred location, and buying timeline.',
  'Property Visit': 'Share matching properties and agree on a date and time for the visit.',
  'Follow-up': 'Ask for feedback, answer concerns, and confirm which options best fit.',
  'Site Visit': 'Coordinate access, walk through the property, and record the lead’s feedback.',
  Closure: 'Confirm the preferred property, explain the next paperwork steps, and agree on a decision date.',
}

function toLocalDateTime(value) {
  if (!value) return ''
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return ''
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

function SectionCard({ icon: Icon, title, tone = 'blue', children }) {
  const tones = {
    blue: 'border-blue-100 bg-[#f2f7ff] text-blue-600',
    green: 'border-emerald-100 bg-[#f0fbf6] text-emerald-600',
    violet: 'border-violet-100 bg-[#f7f5ff] text-violet-600',
    orange: 'border-orange-100 bg-[#fff7f2] text-orange-600',
    cyan: 'border-cyan-100 bg-[#f0fbfd] text-sky-600',
  }
  return (
    <section className={`min-h-[100px] rounded-lg border p-3 ${tones[tone]}`}>
      <h3 className="flex items-center gap-2 text-[12px] font-semibold text-gray-800"><span className={`grid h-6 w-6 place-items-center rounded-md ${tones[tone]}`}><Icon size={14} /></span>{title}</h3>
      <div className="mt-2 text-[10px] leading-[1.3] text-gray-600">{children}</div>
    </section>
  )
}

function DetailRow({ icon: Icon, label, children }) {
  return <div className="grid grid-cols-[16px_76px_minmax(0,1fr)] items-start gap-2 py-1.5 text-[10px]"><Icon size={14} className="mt-0.5 text-gray-700" /><span className="text-gray-600">{label}</span><span className="min-w-0 break-words font-medium text-gray-800">{children || 'Not provided'}</span></div>
}

function ActivityItem({ title, time, last = false }) {
  return <div className="relative flex gap-3 pb-4 last:pb-0"><span className={`relative z-10 mt-1 h-2 w-2 flex-shrink-0 rounded-full border-2 border-white bg-slate-500 ${last ? '' : 'ring-1 ring-slate-200'}`} />{!last && <span className="absolute bottom-0 left-[3px] top-3 w-px bg-gray-200" />}<span><span className="block text-[10px] font-medium text-gray-700">{title}</span><span className="mt-0.5 block text-[9px] text-gray-500">{time}</span></span></div>
}

export default function LeadDetails() {
  const { leadId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [lead, setLead] = useState(location.state?.lead || null)
  const [activeTab, setActiveTab] = useState('AI Analysis')
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [callPrep, setCallPrep] = useState(location.state?.lead?.callPrep || null)
  const [callPrepLoading, setCallPrepLoading] = useState(false)
  const [followUpPlanLoading, setFollowUpPlanLoading] = useState(false)
  const [followUpSaving, setFollowUpSaving] = useState(false)
  const [newFollowUpStage, setNewFollowUpStage] = useState('')
  const [followUpNotice, setFollowUpNotice] = useState('')
  const [followUpDraft, setFollowUpDraft] = useState({
    stage: location.state?.lead?.followUp?.stage || 'Initial Call',
    completedStages: location.state?.lead?.followUp?.completedStages || [],
    isComplete: location.state?.lead?.followUp?.isComplete || false,
    nextAction: location.state?.lead?.followUp?.nextAction || 'Make initial contact',
    scheduledAt: toLocalDateTime(location.state?.lead?.followUp?.scheduledAt),
    channel: location.state?.lead?.followUp?.channel || 'Phone',
    note: '',
  })
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const followUpNoteRef = useRef(null)
  const isSavedLead = Boolean(user && lead && !String(lead._id).startsWith('sample-'))

  useEffect(() => {
    if (!user) return
    let cancelled = false
    api.get(`/leads/${leadId}`)
      .then(({ data }) => {
        if (!cancelled) {
          setLead({ ...data.lead, score: scoreFor(data.lead) })
          setCallPrep(data.lead.callPrep || null)
          const followUp = data.lead.followUp || {}
          setFollowUpDraft({
            stage: followUp.stage || 'Initial Call',
            completedStages: followUp.completedStages || [],
            isComplete: followUp.isComplete || false,
            nextAction: followUp.nextAction || 'Make initial contact',
            scheduledAt: toLocalDateTime(followUp.scheduledAt),
            channel: followUp.channel || 'Phone',
            note: '',
          })
        }
      })
      .catch((requestError) => { if (!cancelled) setError(requestError.response?.data?.message || 'Unable to load this lead.') })
    return () => { cancelled = true }
  }, [leadId, location.state, user])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }
  const sendChat = async (event) => {
    event.preventDefault()
    if (!chatInput.trim()) return
    if (!user) {
      setError('Sign in to chat about this lead.')
      return
    }
    const message = chatInput.trim()
    setChatLoading(true)
    setError('')
    try {
      const { data } = await api.post(`/leads/${leadId}/chat`, { message })
      setLead((current) => ({ ...current, chatHistory: data.chatHistory }))
      setChatInput('')
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'AI chat is unavailable. Please retry.')
    } finally {
      setChatLoading(false)
    }
  }
  const generateCallPrep = async () => {
    setActiveTab('Call Prep')
    if (!user) {
      setError('Sign in to generate AI call preparation.')
      return
    }
    if (!lead || String(lead._id).startsWith('sample-')) {
      setError('Save this sample as a lead before generating AI call preparation.')
      return
    }
    setCallPrepLoading(true)
    setError('')
    try {
      const { data } = await api.post(`/leads/${leadId}/call-prep`)
      setCallPrep(data.callPrep)
      setLead((current) => ({ ...current, callPrep: data.callPrep }))
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'AI call preparation is unavailable. Please retry.')
    } finally {
      setCallPrepLoading(false)
    }
  }
  const saveFollowUp = async (updates) => {
    if (!isSavedLead) {
      setError('Sign in and open a saved lead to update follow-up progress.')
      return false
    }
    const payload = { ...updates }
    if (payload.scheduledAt) payload.scheduledAt = new Date(payload.scheduledAt).toISOString()
    setFollowUpSaving(true)
    setError('')
    setFollowUpNotice('')
    try {
      const { data } = await api.patch(`/leads/${leadId}/follow-up`, payload)
      setLead((current) => ({ ...current, followUp: data.followUp }))
      setFollowUpDraft((current) => ({
        stage: data.followUp.stage,
        completedStages: data.followUp.completedStages || [],
        isComplete: data.followUp.isComplete || false,
        nextAction: data.followUp.nextAction,
        scheduledAt: toLocalDateTime(data.followUp.scheduledAt),
        channel: data.followUp.channel,
        note: updates.note ? '' : current.note,
      }))
      setFollowUpNotice('Follow-up progress saved.')
      return true
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not save follow-up progress.')
      return false
    } finally {
      setFollowUpSaving(false)
    }
  }
  const regenerateFollowUpPlan = async () => {
    if (!isSavedLead) {
      setError('Sign in and open a saved lead to generate a follow-up plan.')
      return
    }
    setFollowUpPlanLoading(true)
    setError('')
    setFollowUpNotice('')
    try {
      const { data } = await api.post(`/leads/${leadId}/follow-up/plan`)
      const followUp = data.followUp
      setLead((current) => ({ ...current, followUp }))
      setFollowUpDraft((current) => ({
        ...current,
        stage: followUp.stage,
        nextAction: followUp.nextAction,
        scheduledAt: toLocalDateTime(followUp.scheduledAt),
        channel: followUp.channel,
      }))
      setFollowUpNotice('AI follow-up plan generated and saved.')
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'AI follow-up planning is unavailable.')
    } finally {
      setFollowUpPlanLoading(false)
    }
  }
  const markCallCompleted = () => {
    completeFollowUpStage(followUpDraft.stage)
  }
  const completeFollowUpStage = (stage) => {
    const stageIndex = followUpStages.indexOf(stage)
    const completedStages = [...new Set([...(followUpDraft.completedStages || []), ...followUpStages.slice(0, stageIndex + 1)])]
    const nextStage = followUpStages.find((item) => !completedStages.includes(item)) || followUpStages[followUpStages.length - 1]
    const isComplete = completedStages.length === followUpStages.length
    saveFollowUp({
      stage: nextStage,
      completedStages,
      isComplete,
      nextAction: isComplete ? 'Confirm handover and remain available for any final questions.' : followUpAdvice[nextStage] || `Complete the ${nextStage} stage.`,
      note: `${stage} marked complete.${isComplete ? ' The follow-up journey is complete.' : ''}`,
      noteStage: stage,
    })
  }
  const addFollowUpStage = async (event) => {
    event.preventDefault()
    const stageName = newFollowUpStage.trim()
    if (!stageName) return
    const saved = await saveFollowUp({ addStage: stageName })
    if (saved) setNewFollowUpStage('')
  }
  const removeFollowUpStage = (stage) => saveFollowUp({ removeStage: stage })
  const copyFollowUpDraft = async () => {
    const messageDraft = lead?.followUp?.plan?.messageDraft
    if (!messageDraft) {
      setError('Generate a follow-up plan first to create a message draft.')
      return
    }
    try {
      await navigator.clipboard.writeText(messageDraft)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setError('Could not copy the message draft. Please copy it manually from the plan.')
    }
  }
  const shareLead = async () => {
    const shareText = `${lead.fullName} | ${lead.location} | Score ${scoreFor(lead)}`
    try {
      await navigator.clipboard.writeText(shareText)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setError('Could not copy lead details. Please copy them manually.')
    }
  }

  const score = lead ? scoreFor(lead) : 0
  const name = lead?.fullName || 'Lead'
  const notes = lead?.notes || 'No customer message was provided. Add more context to prepare a tailored recommendation.'
  const propertyType = lead?.propertyType || 'Property'
  const status = score >= 68 ? 'Hot Lead' : score >= 35 ? 'Warm Lead' : 'Cold Lead'
  const analysis = lead?.analysis
  const summary = analysis?.summary || lead?.notes?.trim() || `${name} is looking for ${propertyType} in ${lead?.location || 'their preferred location'}, with a budget of ${lead?.budgetRange || 'not specified'}. They are planning to buy ${lead?.buyingTimeline?.toLowerCase() || 'at a flexible time'}.`
  const keyRequirements = analysis?.keyRequirements?.length ? analysis.keyRequirements : [`Property type: ${propertyType}`, `Location: ${lead?.location || 'Not specified'}`, `Budget: ${lead?.budgetRange || 'Not specified'}`, `Timeline: ${lead?.buyingTimeline || 'Not specified'}`]
  const potentialObjections = analysis?.potentialObjections?.length ? analysis.potentialObjections : ['Confirm budget flexibility', 'Clarify preferred move-in date']
  const followUp = lead?.followUp || {}
  const followUpStages = Array.isArray(followUp.stages) && followUp.stages.length
    ? followUp.stages
    : defaultFollowUpStages
  const followUpNotes = [...(followUp.notes || [])].reverse()
  const currentStageIndex = followUpDraft.isComplete ? followUpStages.length : Math.max(0, followUpStages.indexOf(followUpDraft.stage))
  const completedStageSet = new Set(
    followUpDraft.completedStages?.length
      ? followUpDraft.completedStages
      : followUpStages.slice(0, currentStageIndex)
  )
  const followUpPlan = followUp.plan
  const followUpActivity = [...(followUp.activity || [])].reverse()
  return (
    <div className="min-h-screen bg-[#f7f9fb] font-sans text-gray-950">
      <Sidebar user={user} onLogout={handleLogout} />
      <div className="ml-[58px] min-h-screen md:ml-[174px]">
        <header className="flex h-[40px] items-center justify-end bg-white px-4 md:px-5">
          <div className="flex items-center gap-4"><button type="button" aria-label="Notifications" className="relative text-gray-800"><Bell size={14} /><span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-red-500" /></button>{user ? <details className="relative"><summary className="flex cursor-pointer list-none items-center gap-2 text-[10px] font-medium"><span className="grid h-6 w-6 place-items-center rounded-full bg-gray-100 text-[10px]">{initialsFor(user.name || 'John Doe')}</span><span className="hidden sm:inline">{user.name || 'John Doe'}</span><ChevronDown size={11} /></summary><button type="button" onClick={handleLogout} className="absolute right-0 top-8 z-20 flex w-28 items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-left text-[11px] shadow-lg"><LogOut size={13} />Sign out</button></details> : <Link to="/login" className="rounded-md bg-gray-950 px-3 py-1.5 text-[10px] font-semibold text-white">Sign in</Link>}</div>
        </header>

        <main className="mx-auto max-w-[1440px] px-4 pb-0 pt-0 sm:px-5">
          <Link to="/leads" className="inline-flex items-center gap-1.5 text-[11px] font-medium text-gray-700 hover:text-black"><ArrowLeft size={13} />Back to Leads</Link>
          {error && <p role="alert" className="mt-3 rounded-md bg-rose-50 px-3 py-2 text-[11px] text-rose-700">{error}</p>}
          {!lead && !error && (user ? <p className="mt-8 text-sm text-gray-500">Loading lead details...</p> : <p className="mt-8 text-sm text-gray-600">Sign in to view a saved lead. <Link to="/login" className="font-semibold underline">Sign in</Link></p>)}
          {!lead && error && <Link to="/leads" className="mt-3 inline-flex text-sm font-medium underline">Return to Leads</Link>}

          {lead && <div className="mt-0 grid grid-cols-1 items-start gap-3 lg:grid-cols-[minmax(0,1fr)_282px]">
            <section className="min-w-0">
            <div className="mt-0 flex flex-wrap items-center gap-x-4 gap-y-2">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-slate-200 text-[13px] font-semibold text-slate-800">{initialsFor(name)}</span>
              <h1 className="text-[20px] font-bold tracking-tight">{name}</h1>
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold ${score >= 68 ? 'bg-rose-100 text-rose-700' : score >= 35 ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}><Flame size={11} fill="currentColor" />{status}</span>
              <div className="flex items-center gap-2"><span className="grid h-[30px] w-[30px] place-items-center rounded-full" style={{ background: `conic-gradient(#16b86b ${score * 3.6}deg,#e8edf0 0deg)` }}><span className="grid h-[23px] w-[23px] place-items-center rounded-full bg-white text-[10px] font-bold">{score}</span></span><span className="text-[10px] text-gray-600">Lead Score</span></div>
            </div>
            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 pl-1 text-[10px] text-gray-600 sm:pl-[54px]">
              <span className="inline-flex items-center gap-1.5"><MapPin size={13} />{lead.location || 'Location not provided'}</span>
              <span className="inline-flex items-center gap-1.5"><Home size={13} />{propertyType}</span>
              <span className="inline-flex items-center gap-1.5"><Wallet size={13} />{lead.budgetRange || 'Budget not provided'}</span>
              <span className="inline-flex items-center gap-1.5"><CalendarDays size={13} />{lead.buyingTimeline || 'Timeline not provided'}</span>
            </div>

            <div className="mt-2">
                <div role="tablist" aria-label="Lead workspace" className="mb-3 flex flex-wrap gap-1 border-b border-gray-200">
                  {['AI Analysis', 'AI Chat', 'Call Prep', 'Follow-up Plan'].map((tab) => <button type="button" role="tab" aria-selected={activeTab === tab} key={tab} onClick={() => setActiveTab(tab)} className={`flex items-center gap-2 border-b-2 px-2 py-2 text-[11px] font-medium ${activeTab === tab ? 'border-gray-900 text-gray-950' : 'border-transparent text-gray-500 hover:text-gray-900'}`}>{tab === 'AI Analysis' ? <Sparkles size={13} /> : tab === 'AI Chat' ? <MessageSquare size={13} /> : tab === 'Call Prep' ? <Phone size={13} /> : <CalendarDays size={13} />}{tab}</button>)}
                </div>

                {activeTab === 'AI Analysis' && <section className="rounded-lg border border-gray-200/80 bg-white p-3 shadow-[0_3px_14px_rgba(15,23,42,0.03)]">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex gap-2.5"><Sparkles size={18} fill="currentColor" className="mt-0.5 text-gray-900" /><div><h2 className="text-[14px] font-semibold">AI Analysis</h2><p className="mt-1 max-w-[440px] text-[10px] leading-4 text-gray-500">AI-powered insights based on the lead&apos;s information to help you understand their needs and plan your next steps.</p></div></div>
                    <span className="inline-flex items-center gap-1.5 text-[9px] text-gray-500"><Clock3 size={12} />{lead.createdAt ? 'Recently added' : 'Analyzed 2 hours ago'}</span>
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                    <SectionCard icon={FileText} title="Summary" tone="blue"><p>{summary}</p></SectionCard>
                    <SectionCard icon={Target} title="Intent" tone="green"><span className="float-right -mt-7 rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-semibold text-emerald-700">{analysis?.intentLevel || (score >= 68 ? 'High' : score >= 35 ? 'Medium' : 'Low')}</span><ul className="list-disc space-y-1 pl-4"><li>{analysis?.intentLevel || (score >= 68 ? 'Strong' : 'Developing')} purchase intent</li><li>Looking for a {propertyType.toLowerCase()}</li><li>Location: {lead.location || 'Not specified'}</li><li>Timeline: {lead.buyingTimeline || 'Not specified'}</li></ul></SectionCard>
                    <SectionCard icon={List} title="Key Requirements" tone="violet"><ul className="list-disc space-y-1 pl-4">{keyRequirements.map((item) => <li key={item}>{item}</li>)}</ul></SectionCard>
                    <SectionCard icon={Zap} title="Potential Objections" tone="orange"><ul className="list-disc space-y-1 pl-4">{potentialObjections.map((item) => <li key={item}>{item}</li>)}</ul></SectionCard>
                    <SectionCard icon={ArrowRight} title="Recommended Next Action" tone="cyan"><p>{analysis?.recommendedNextAction || `Schedule a follow-up to discuss ${propertyType} options in ${lead.location || 'the preferred area'}.`}</p></SectionCard>
                    <SectionCard icon={MessageSquare} title="Suggested Response" tone="violet"><p className="italic">{analysis?.suggestedResponse || `Hi ${name.split(' ')[0]}, thanks for sharing your requirements. I have options that match your preferences. Would you be available to discuss them and schedule a visit?`}</p></SectionCard>
                  </div>

                  <div className="mt-3 grid grid-cols-[36px_70px_minmax(0,1fr)] items-center gap-x-2 gap-y-0 rounded-lg border border-gray-100 bg-[#f7f9fc] p-1.5">
                    <span className="row-span-2 grid h-9 w-9 place-items-center rounded-full" style={{ background: `conic-gradient(#16b86b ${score * 3.6}deg,#e4eaf0 0deg)` }}><span className="grid h-[29px] w-[29px] place-items-center rounded-full bg-white text-[12px] font-bold">{score}</span></span>
                    <div><p className="text-[10px] font-semibold">AI Lead Score</p><span className="text-[9px] text-gray-500">{status}</span></div>
                    <div className="flex flex-wrap items-center gap-1">{['High Intent', 'Clear Budget', 'Short Timeline', 'Ready-to-Move'].map((item) => <span key={item} className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[8px] font-medium text-emerald-800"><Check size={9} />{item}</span>)}</div>
                    <p className="col-start-2 col-span-2 text-[8px] text-gray-500">This lead shows {score >= 68 ? 'strong' : 'moderate'} potential for conversion.</p>
                  </div>
                </section>}

                {activeTab === 'AI Chat' && <section className="flex h-[min(70vh,640px)] min-h-[420px] max-h-[640px] flex-col rounded-lg border border-gray-200/80 bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-2 border-b border-gray-100 pb-3"><span className="grid h-8 w-8 place-items-center rounded-lg bg-violet-50 text-violet-700"><Sparkles size={16} /></span><div><h2 className="text-[13px] font-semibold">AI Chat</h2><p className="text-[10px] text-gray-500">Ask about {name}&apos;s needs, follow-up, or next steps.</p></div></div>
                  <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain py-4 text-[11px]">
                    {!lead.chatHistory?.length && <div className="flex items-start gap-2"><span className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-full bg-violet-50 text-violet-700"><Sparkles size={14} /></span><div className="max-w-[85%] rounded-lg bg-[#f3f6fd] p-3 text-gray-700">I have the saved profile and analysis for {name}. Ask me to prepare a response, identify concerns, or plan a follow-up.</div></div>}
                    {lead.chatHistory?.map((message, index) => {
                      const isUser = message.role === 'user'
                      const time = message.createdAt ? new Date(message.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : ''
                      return <div key={`${message.role}-${message.createdAt || index}`} className={`flex items-start gap-2 ${isUser ? 'justify-end' : ''}`}>
                        {!isUser && <span className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-full bg-violet-50 text-violet-700"><Sparkles size={14} /></span>}
                        <div className={`max-w-[82%] rounded-lg px-3 py-2.5 ${isUser ? 'bg-[#f3f6fd] text-gray-800' : 'bg-[#f3f6fd] text-gray-700'}`}><p className="whitespace-pre-wrap leading-[1.55]">{message.content}</p><span className={`mt-1 flex items-center justify-end gap-1 text-[8px] ${isUser ? 'text-gray-400' : 'text-gray-400'}`}>{time}{isUser && <CheckCheck size={10} className="text-blue-500" />}</span></div>
                        {isUser && <span className="grid h-6 w-6 flex-shrink-0 place-items-center rounded-full bg-slate-200 text-[8px] font-semibold">{initialsFor(user?.name || 'JD')}</span>}
                      </div>
                    })}
                    {chatLoading && <div className="flex items-center gap-2 text-[10px] text-gray-500"><Sparkles size={14} className="text-violet-600" />Thinking about {name}&apos;s saved lead context...</div>}
                  </div>
                  <div className="mb-2 flex flex-wrap items-center gap-2 text-[9px] text-gray-500"><span>Try asking:</span>{['Summarize this lead', 'What are their key concerns?', 'Suggest a follow-up question'].map((prompt) => <button key={prompt} type="button" onClick={() => setChatInput(prompt)} className="rounded-full border border-gray-200 px-2.5 py-1.5 text-gray-600 hover:bg-gray-50">{prompt}</button>)}</div>
                  <form onSubmit={sendChat} className="flex items-center gap-2 rounded-lg border border-gray-200 p-1.5"><input value={chatInput} onChange={(event) => setChatInput(event.target.value)} disabled={!user || chatLoading} placeholder={user ? 'Ask anything about this lead...' : 'Sign in to chat about this lead'} className="h-8 min-w-0 flex-1 bg-transparent px-2 text-[10px] outline-none placeholder:text-gray-400" /><button type="submit" aria-label="Send message" disabled={!user || chatLoading || !chatInput.trim()} className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-md bg-[#17232e] text-white disabled:opacity-40"><Send size={14} /></button></form>
                </section>}

                {activeTab === 'Call Prep' && <section className="rounded-lg border border-gray-200/80 bg-white p-4 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-lg bg-gray-100"><Phone size={15} /></span><div><h2 className="text-[13px] font-semibold">Call Prep</h2><p className="text-[10px] text-gray-500">A focused outline for your conversation with {name}</p></div></div><button type="button" onClick={generateCallPrep} disabled={callPrepLoading || !user || String(lead._id).startsWith('sample-')} className="flex h-8 items-center gap-1.5 rounded-md bg-[#17232e] px-2.5 text-[10px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"><Sparkles size={12} />{callPrepLoading ? 'Generating...' : callPrep ? 'Regenerate' : 'Generate with AI'}</button></div>
                  {!user && <p className="mt-3 text-[11px] text-gray-600">Sign in to generate personalized call preparation.</p>}
                  {user && String(lead._id).startsWith('sample-') && <p className="mt-3 text-[11px] text-gray-600">Save this sample as a lead to generate personalized call preparation.</p>}
                  {callPrepLoading && <p className="mt-3 text-[11px] text-gray-500">Gemini is preparing a call plan for this lead...</p>}
                  {callPrep && <div className="mt-4 grid gap-3 sm:grid-cols-2"><SectionCard icon={UserRound} title="Opening" tone="blue"><p>{callPrep.opening}</p></SectionCard><SectionCard icon={Target} title="Qualifying questions" tone="green"><ul className="list-disc space-y-1 pl-4">{callPrep.qualifyingQuestions.map((question) => <li key={question}>{question}</li>)}</ul></SectionCard><SectionCard icon={Home} title="Property match" tone="violet"><p>{callPrep.propertyMatch}</p></SectionCard><SectionCard icon={CalendarDays} title="Next step" tone="cyan"><p>{callPrep.nextStep}</p></SectionCard></div>}
                  {!callPrep && !callPrepLoading && user && !String(lead._id).startsWith('sample-') && <p className="mt-3 text-[11px] text-gray-600">Generate a tailored opening, qualifying questions, property match, and next step.</p>}
                </section>}

                {activeTab === 'Follow-up Plan' && <section className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200/80 bg-white p-3">
                    <div className="flex items-center gap-2.5"><span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-50 text-emerald-700"><CalendarDays size={15} /></span><div><h2 className="text-[13px] font-semibold">Follow-up Plan</h2><p className="text-[10px] text-gray-500">AI-powered next steps based on this lead&apos;s profile and activity.</p></div></div>
                    <button type="button" onClick={regenerateFollowUpPlan} disabled={!isSavedLead || followUpPlanLoading} className="flex h-8 items-center gap-1.5 rounded-md bg-[#17232e] px-2.5 text-[10px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"><Sparkles size={12} />{followUpPlanLoading ? 'Generating...' : followUpPlan ? 'Regenerate Plan' : 'Generate Plan'}</button>
                  </div>
                  {followUpNotice && <p role="status" className="rounded-md bg-emerald-50 px-3 py-2 text-[10px] font-medium text-emerald-800">{followUpNotice}</p>}
                  {!isSavedLead && <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[10px] text-amber-800">Sign in and open a saved lead to generate a plan or save progress.</p>}

                  <section className="grid gap-3 rounded-lg border border-emerald-100 bg-[#f3faf7] p-3 sm:grid-cols-[minmax(0,1fr)_190px]">
                    <div><p className="text-[9px] font-bold uppercase tracking-wide text-emerald-800">Next Action <span className={`ml-1 rounded-full px-2 py-0.5 normal-case ${followUpPlan?.priority === 'High' ? 'bg-emerald-100 text-emerald-800' : 'bg-white text-gray-600'}`}>{followUpPlan?.priority || 'Set priority'}</span></p><h3 className="mt-2 text-[13px] font-semibold">{followUpDraft.nextAction || followUpPlan?.nextAction}</h3><p className="mt-1 text-[10px] leading-4 text-gray-600">{followUpPlan?.nextAction === followUpDraft.nextAction ? followUpPlan.reason : followUpAdvice[followUpDraft.stage] || analysis?.recommendedNextAction || 'Generate an AI plan for a tailored next step.'}</p></div>
                    <div className="border-t border-emerald-100 pt-2 text-[10px] sm:border-l sm:border-t-0 sm:pl-3 sm:pt-0"><p className="font-semibold text-gray-800">Recommended Follow-up</p><p className="mt-1 text-gray-600">{followUpDraft.scheduledAt ? new Date(followUpDraft.scheduledAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Choose a date'}</p><p className="mt-3 font-semibold text-gray-800">Channel</p><p className="mt-1 text-gray-600">{followUpDraft.channel}</p></div>
                  </section>

                  <div className="grid items-stretch gap-3 xl:grid-cols-2">
                    <div className="flex min-w-0 flex-col gap-3">
                      <section className="rounded-lg border border-gray-200/80 bg-white p-3">
                        <h3 className="text-[12px] font-semibold">Follow-up Journey</h3><p className="mt-0.5 text-[10px] text-gray-500">Track the next step in this lead&apos;s journey.</p>
                        <ol className="mt-4 space-y-0">{followUpStages.map((stage, index) => {
                          const completed = completedStageSet.has(stage)
                          const active = !completed && index === currentStageIndex
                          return <li key={stage} className="relative flex min-h-[48px] items-start gap-1 last:min-h-0">
                            <div className="relative min-w-0 flex-1">
                              {index < followUpStages.length - 1 && <span className={`absolute left-[11px] top-6 h-[26px] w-px ${completed ? 'bg-emerald-500' : 'bg-gray-200'}`} />}
                              <button type="button" onClick={() => completeFollowUpStage(stage)} disabled={!isSavedLead || followUpSaving || completed} aria-label={completed ? `${stage} completed` : `Mark ${stage} complete`} title={completed ? `${stage} completed` : `Mark ${stage} complete`} className="relative z-10 flex min-h-[48px] w-full items-start gap-3 text-left disabled:cursor-default">
                                <span className={`grid h-6 w-6 flex-shrink-0 place-items-center rounded-full border text-[9px] font-semibold ${completed ? 'border-emerald-600 bg-emerald-600 text-white' : active ? 'border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-100' : 'border-gray-200 bg-white text-gray-500'}`}>{completed ? <Check size={12} /> : index + 1}</span>
                                <span className="flex min-w-0 flex-1 items-start justify-between gap-2 pb-3"><span><span className="block break-words text-[10px] font-semibold text-gray-800">{stage}</span><span className="text-[9px] text-gray-500">{completed ? 'Completed' : active ? 'Current stage' : 'Upcoming'}</span></span>{active && <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[8px] font-semibold text-blue-700">In progress</span>}</span>
                              </button>
                            </div>
                            <button type="button" onClick={() => removeFollowUpStage(stage)} disabled={!isSavedLead || followUpSaving || followUpStages.length <= 1} aria-label={`Remove ${stage} stage`} title={`Remove ${stage} stage`} className="mt-0.5 grid h-6 w-6 flex-shrink-0 place-items-center rounded text-gray-400 hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-35"><X size={12} /></button>
                          </li>
                        })}</ol>
                        <form onSubmit={addFollowUpStage} className="mt-2 flex gap-2 border-t border-gray-100 pt-3">
                          <input value={newFollowUpStage} onChange={(event) => setNewFollowUpStage(event.target.value)} maxLength={60} disabled={!isSavedLead || followUpSaving || followUpStages.length >= 12} placeholder="Add a journey stage" aria-label="New follow-up stage" className="h-8 min-w-0 flex-1 rounded-md border border-gray-200 px-2 text-[10px] focus:outline-none focus:ring-2 focus:ring-gray-900/10 disabled:bg-gray-50" />
                          <button type="submit" disabled={!isSavedLead || followUpSaving || !newFollowUpStage.trim() || followUpStages.length >= 12} className="flex h-8 items-center gap-1 rounded-md border border-gray-200 px-2.5 text-[10px] font-semibold text-gray-800 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-45"><Plus size={12} />Add</button>
                        </form>
                      </section>
                      <section className="rounded-lg border border-gray-200/80 bg-white p-3">
                        <h3 className="text-[12px] font-semibold">Recent Activity</h3>
                        {followUpActivity.length ? <div className="mt-3 max-h-[220px] space-y-2 overflow-y-auto overscroll-contain pr-2">{followUpActivity.map((entry, index) => <div key={`${entry.createdAt || index}-${index}`} className="flex gap-2 text-[10px] text-gray-700"><span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-emerald-500" /><span>{entry.text}<span className="mt-0.5 block text-[9px] text-gray-500">{entry.createdAt ? new Date(entry.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : ''}</span></span></div>)}</div> : <p className="mt-2 text-[10px] text-gray-500">Follow-up updates will appear here.</p>}
                      </section>
                    </div>

                    <form onSubmit={(event) => { event.preventDefault(); saveFollowUp({ ...followUpDraft, note: followUpDraft.note }) }} className="flex h-full flex-col rounded-lg border border-gray-200/80 bg-white p-3">
                      <h3 className="text-[12px] font-semibold">Update Progress</h3><p className="mt-0.5 text-[10px] text-gray-500">Change the stage, schedule, or add a note.</p>
                      <label htmlFor="followup-stage" className="mt-3 block text-[9px] font-semibold text-gray-600">Current stage</label><select id="followup-stage" value={followUpDraft.stage} onChange={(event) => { const selectedStage = event.target.value; setFollowUpDraft((current) => ({ ...current, stage: selectedStage, completedStages: followUpStages.slice(0, followUpStages.indexOf(selectedStage)), isComplete: false, nextAction: followUpAdvice[selectedStage] || `Complete the ${selectedStage} stage.` })) }} className="mt-1 h-8 w-full rounded-md border border-gray-200 bg-white px-2 text-[10px] focus:outline-none focus:ring-2 focus:ring-gray-900/10">{followUpStages.map((stage) => <option key={stage}>{stage}</option>)}</select>
                      <label htmlFor="followup-action" className="mt-3 block text-[9px] font-semibold text-gray-600">Next action</label><input id="followup-action" maxLength={240} value={followUpDraft.nextAction} onChange={(event) => setFollowUpDraft((current) => ({ ...current, nextAction: event.target.value }))} className="mt-1 h-8 w-full rounded-md border border-gray-200 px-2 text-[10px] focus:outline-none focus:ring-2 focus:ring-gray-900/10" />
                      <label htmlFor="followup-date" className="mt-3 block text-[9px] font-semibold text-gray-600">Follow-up date and time</label><input id="followup-date" type="datetime-local" value={followUpDraft.scheduledAt} onChange={(event) => setFollowUpDraft((current) => ({ ...current, scheduledAt: event.target.value }))} className="mt-1 h-8 w-full rounded-md border border-gray-200 px-2 text-[10px] focus:outline-none focus:ring-2 focus:ring-gray-900/10" />
                      <label htmlFor="followup-channel" className="mt-3 block text-[9px] font-semibold text-gray-600">Contact channel</label><select id="followup-channel" value={followUpDraft.channel} onChange={(event) => setFollowUpDraft((current) => ({ ...current, channel: event.target.value }))} className="mt-1 h-8 w-full rounded-md border border-gray-200 bg-white px-2 text-[10px] focus:outline-none focus:ring-2 focus:ring-gray-900/10">{['Phone', 'WhatsApp', 'Email'].map((channel) => <option key={channel}>{channel}</option>)}</select>
                      <label htmlFor="followup-note" className="mt-3 block text-[9px] font-semibold text-gray-600">Progress note</label><textarea ref={followUpNoteRef} id="followup-note" maxLength={1000} value={followUpDraft.note} onChange={(event) => setFollowUpDraft((current) => ({ ...current, note: event.target.value }))} placeholder="Record a call outcome or note..." className="mt-1 min-h-[68px] w-full resize-y rounded-md border border-gray-200 p-2 text-[10px] focus:outline-none focus:ring-2 focus:ring-gray-900/10" />
                      <button type="submit" disabled={!isSavedLead || followUpSaving} className="mt-3 flex h-8 w-full items-center justify-center gap-1.5 rounded-md bg-blue-600 text-[10px] font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">{followUpSaving ? 'Saving...' : 'Save Progress'}</button>
                    </form>
                  </div>
                </section>}
            </div>
            </section>

            <aside className="flex flex-col gap-3">
              {activeTab === 'Follow-up Plan' ? <>
                <section className="rounded-lg border border-gray-200/80 bg-white p-3.5">
                  <div className="flex items-center justify-between"><h2 className="text-[12px] font-semibold">Follow-up Progress</h2><span className="text-[10px] font-semibold text-blue-700">{followUpDraft.isComplete ? `${followUpStages.length}/${followUpStages.length}` : `${currentStageIndex + 1}/${followUpStages.length}`}</span></div>
                  <p className="mt-2 text-[11px] font-semibold">{followUpDraft.isComplete ? 'Journey complete' : followUpDraft.stage}</p>
                  <div className="mt-3 flex items-center">{followUpStages.map((stage, index) => { const completed = completedStageSet.has(stage); return <div key={stage} className="flex min-w-0 flex-1 flex-col items-center"><span className={`grid h-5 w-5 place-items-center rounded-full border text-[8px] ${completed ? 'border-emerald-500 bg-emerald-500 text-white' : index === currentStageIndex ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-400'}`}>{completed ? <Check size={10} /> : index + 1}</span><span className="mt-1 max-w-full truncate text-center text-[7px] text-gray-500">{stage}</span></div> })}</div>
                  <p className="mt-3 border-t border-gray-100 pt-2 text-[9px] text-gray-500">Next follow-up: {followUpDraft.scheduledAt ? new Date(followUpDraft.scheduledAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Not scheduled'}</p>
                </section>

                <section className="rounded-lg border border-gray-200/80 bg-white p-3.5">
                  <h2 className="mb-2 text-[12px] font-semibold">Quick Actions</h2>
                  <div className="space-y-2">
                    <button type="button" onClick={markCallCompleted} disabled={!isSavedLead || followUpSaving || currentStageIndex === followUpStages.length - 1} className="flex h-8 w-full items-center gap-2 rounded-md border border-gray-200 px-2.5 text-left text-[9px] font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-50"><Check size={13} />Mark Stage Complete<ArrowRight size={11} className="ml-auto" /></button>
                    <button type="button" onClick={copyFollowUpDraft} disabled={!followUpPlan?.messageDraft} className="flex h-8 w-full items-center gap-2 rounded-md border border-gray-200 px-2.5 text-left text-[9px] font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-50"><Share2 size={13} />{copied ? 'Draft Copied' : 'Copy Follow-up Draft'}<ArrowRight size={11} className="ml-auto" /></button>
                    <button type="button" onClick={() => followUpNoteRef.current?.focus()} disabled={!isSavedLead} className="flex h-8 w-full items-center gap-2 rounded-md border border-gray-200 px-2.5 text-left text-[9px] font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-50"><FileText size={13} />Add Note<ArrowRight size={11} className="ml-auto" /></button>
                  </div>
                </section>

                <section className="flex h-[320px] min-h-0 flex-col rounded-lg border border-gray-200/80 bg-white p-3.5">
                  <h2 className="flex items-center gap-2 text-[12px] font-semibold"><FileText size={13} />Progress Notes <span className="ml-auto text-[9px] font-medium text-gray-500">{followUpNotes.length}</span></h2>
                  <p className="mt-1 text-[9px] text-gray-500">Notes recorded across this lead&apos;s stages.</p>
                  <div className="mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain pr-2">
                    {followUpNotes.length ? followUpNotes.map((entry, index) => <article key={`${entry.createdAt || index}-${index}`} className="rounded-md border border-gray-100 bg-gray-50 p-2.5"><div className="flex items-center justify-between gap-2"><span className="rounded-full bg-blue-50 px-2 py-0.5 text-[8px] font-semibold text-blue-700">{entry.stage || 'Progress note'}</span><time className="text-right text-[8px] text-gray-500">{entry.createdAt ? new Date(entry.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : ''}</time></div><p className="mt-2 whitespace-pre-wrap text-[9px] leading-4 text-gray-700">{entry.text}</p></article>) : <p className="rounded-md bg-gray-50 p-2.5 text-[9px] leading-4 text-gray-600">No progress notes yet. Add a note while updating this lead&apos;s stage.</p>}
                  </div>
                </section>
              </> : <>
                <section className="rounded-lg border border-gray-200/80 bg-white p-3 shadow-[0_3px_14px_rgba(15,23,42,0.025)] sm:p-3.5">
                  <h2 className="mb-2 flex items-center justify-between text-[12px] font-semibold">Lead Details<button type="button" onClick={() => setError('Editing saved lead details is not available yet.')} className="inline-flex items-center gap-1 text-[9px] font-medium text-gray-500 hover:text-gray-900"><Pencil size={10} />Edit</button></h2>
                  <DetailRow icon={UserRound} label="Name">{name}</DetailRow><DetailRow icon={Phone} label="Phone">{lead.phone}</DetailRow><DetailRow icon={MapPin} label="Location">{lead.location}</DetailRow><DetailRow icon={Home} label="Property Type">{propertyType}</DetailRow><DetailRow icon={Wallet} label="Budget Range">{lead.budgetRange}</DetailRow><DetailRow icon={CalendarDays} label="Timeline">{lead.buyingTimeline}</DetailRow><DetailRow icon={FileText} label="Message">{notes}</DetailRow>
                </section>

                <section className="rounded-lg border border-gray-200/80 bg-white p-3 shadow-[0_3px_14px_rgba(15,23,42,0.025)] sm:p-3.5"><h2 className="mb-2 text-[12px] font-semibold">Quick Actions</h2><div className="space-y-2"><button type="button" onClick={() => setActiveTab('AI Chat')} className="flex h-9 w-full items-center gap-2.5 rounded-md bg-[#17232e] px-2.5 text-left text-[10px] font-medium text-white"><MessageSquare size={13} />Open AI Chat<ArrowRight size={12} className="ml-auto" /></button><button type="button" onClick={generateCallPrep} className="flex h-9 w-full items-center gap-2.5 rounded-md border border-gray-200 px-2.5 text-left text-[10px] font-medium text-gray-800 hover:bg-gray-50"><CalendarDays size={13} />Generate Call Prep<ArrowRight size={12} className="ml-auto text-gray-500" /></button><button type="button" onClick={shareLead} className="flex h-9 w-full items-center gap-2.5 rounded-md border border-gray-200 px-2.5 text-left text-[10px] font-medium text-gray-800 hover:bg-gray-50"><Share2 size={13} />{copied ? 'Copied lead details' : 'Share Lead Details'}<ArrowRight size={12} className="ml-auto text-gray-500" /></button></div></section>

                <section className="rounded-lg border border-gray-200/80 bg-white p-3 shadow-[0_3px_14px_rgba(15,23,42,0.025)] sm:p-3.5"><h2 className="mb-3 flex items-center gap-2 text-[12px] font-semibold"><Clock3 size={14} />Recent Activity</h2><ActivityItem title="Lead added" time="2 hours ago" /><ActivityItem title="AI analysis completed" time="2 hours ago" /><ActivityItem title="Viewed 3 property options" time="1 hour ago" last /></section>
              </>}
            </aside>
          </div>}
        </main>
      </div>
    </div>
  )
}