import { useNavigate, useLocation } from 'react-router-dom'

const TABS = [
  { path:'/home',    label:'Home',    Icon:HomeIco },
  { path:'/goals',   label:'Goals',   Icon:GoalIco },
  { path:'/basket-detail', label:'Basket',  Icon:BasketIco },
  { path:'/orders',  label:'Orders',  Icon:OrderIco },
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
function BasketIco(){return<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>}
function OrderIco(){return<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="2"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/></svg>}
