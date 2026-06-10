import { useNavigate, useLocation } from 'react-router-dom'

const TABS = [
  { path:'/home',    label:'Home',    Icon:HomeIco },
  { path:'/goals',   label:'Goals',   Icon:GoalIco },
  { path:'/orders',  label:'Orders',  Icon:OrderIco },
  { path:'/profile', label:'Profile', Icon:UserIco },
]

export default function BottomNav() {
  const nav = useNavigate()
  const loc = useLocation()
  return (
    <nav className="bottom-nav">
      {TABS.map(t=>(
        <button key={t.path} className={`nav-item${loc.pathname.startsWith(t.path)?' active':''}`} onClick={()=>nav(t.path)}>
          <t.Icon/><span>{t.label}</span>
        </button>
      ))}
    </nav>
  )
}
function HomeIco(){return<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/><path d="M9 21V12h6v9"/></svg>}
function GoalIco(){return<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>}
function OrderIco(){return<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="2"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/></svg>}
function UserIco(){return<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
