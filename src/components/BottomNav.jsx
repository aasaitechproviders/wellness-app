import { useNavigate, useLocation } from 'react-router-dom'
import { useCart } from '../context/CartContext'

const TABS = [
  { path:'/home',    label:'Home',    Icon:HomeIco },
  { path:'/goals',   label:'Goals',   Icon:GoalIco },
  { path:'/cart',    label:'Cart',    Icon:CartIco },
  { path:'/orders',  label:'Orders',  Icon:OrderIco },
]

export default function BottomNav() {
  const nav = useNavigate()
  const loc = useLocation()
  const { cartCount } = useCart()

  return (
    <nav className="bottom-nav">
      {TABS.map(t => {
        const isCart   = t.path === '/cart'
        const isActive = loc.pathname.startsWith(t.path)
        return (
          <button key={t.path} className={`nav-item${isActive ? ' active' : ''}`} onClick={() => nav(t.path)}
            style={{ position: 'relative' }}>
            <t.Icon />
            {isCart && cartCount > 0 && (
              <span style={{
                position: 'absolute', top: 0, right: '50%', transform: 'translateX(10px)',
                background: '#E74C3C', color: '#fff',
                fontSize: 9, fontWeight: 700,
                minWidth: 16, height: 16, borderRadius: 50,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '0 4px', lineHeight: 1,
              }}>
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
            <span>{t.label}</span>
          </button>
        )
      })}
    </nav>
  )
}

function HomeIco(){return<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/><path d="M9 21V12h6v9"/></svg>}
function GoalIco(){return<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>}
function CartIco(){return<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 001.99 1.61h9.72a2 2 0 001.99-1.61L23 6H6"/></svg>}
function OrderIco(){return<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="2"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/></svg>}
