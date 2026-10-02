import { Link, useLocation } from 'react-router-dom'
import { Home, LayoutDashboard, List, LogOut, Plus } from 'lucide-react'

const initialsFor = (name = 'Agent') => name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()

export default function Sidebar({ user, onLogout }) {
  const { pathname } = useLocation()
  const onDashboard = pathname === '/dashboard'
  const onAddLead = pathname === '/leads/new'
  const onLeads = pathname.startsWith('/leads') && !onAddLead
  const linkClass = (active) => `flex h-9 items-center justify-center gap-3 rounded-md px-2 transition md:justify-start md:px-2.5 ${active ? 'bg-[#172c3b] text-white' : 'text-gray-700 hover:bg-gray-100'}`

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-[58px] flex-col border-r border-gray-200 bg-white text-gray-950 md:w-[174px]">
      <Link to="/dashboard" className="flex h-[54px] flex-shrink-0 items-center justify-center gap-2 px-3 md:justify-start md:px-4">
        <span className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-md bg-gray-100"><Home size={18} strokeWidth={2.5} /></span>
        <span className="hidden min-w-0 md:block"><span className="block text-[14px] font-bold">RealtyAI</span><span className="block truncate text-[8px] text-gray-500">Smarter Leads. Better Closings.</span></span>
      </Link>

      <nav aria-label="Main navigation" className="flex flex-col gap-1 px-2 pt-4 md:px-3">
        <Link to="/dashboard" aria-current={onDashboard ? 'page' : undefined} className={linkClass(onDashboard)}><LayoutDashboard size={15} /><span className="hidden text-[10px] font-semibold md:inline">Dashboard</span></Link>
        <Link to="/leads" aria-current={onLeads ? 'page' : undefined} className={linkClass(onLeads)}><List size={15} /><span className="hidden text-[10px] font-medium md:inline">Leads</span></Link>
        <Link to="/leads/new" aria-current={onAddLead ? 'page' : undefined} className={linkClass(onAddLead)}><Plus size={16} /><span className="hidden text-[10px] font-medium md:inline">Add New Lead</span></Link>
      </nav>

      <div className="mx-2 mb-3 mt-auto hidden items-center gap-2 border-t border-gray-200 px-1 pt-3 md:flex">
        <span className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-full bg-gray-100 text-[9px] font-semibold">{initialsFor(user?.name)}</span>
        <span className="min-w-0 flex-1"><span className="block truncate text-[9px] font-semibold">{user?.name || 'Agent'}</span><span className="block text-[8px] text-gray-500">Sales Agent</span></span>
        {user && <button type="button" onClick={onLogout} aria-label="Sign out" title="Sign out" className="p-1 text-gray-500 hover:text-gray-950"><LogOut size={13} /></button>}
      </div>
    </aside>
  )
}