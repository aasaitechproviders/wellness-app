import { useNavigate, useLocation } from 'react-router-dom'
import { useCart } from '../context/CartContext'

const TABS = [
  { path:'/home',    label:'Home',    icon:'🏠' },
  { path:'/goals',   label:'Goals',   icon:'🎯' },
  { path:'/cart',    label:'Cart',    icon:'🛒' },
  { path:'/orders',  label:'Orders',  icon:'📋' },
  { path:'/profile', label:'Profile', icon:'👤' },
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
          <button key={t.path} className={`nav-item${isActive ? ' active' : ''}`} onClick={() => nav(t.path)} style={{ position:'relative' }}>
            <div style={{ position:'relative', display:'inline-block' }}>
              <span style={{ fontSize:20 }}>{t.icon}</span>
              {isCart && cartCount > 0 && (
                <span style={{ position:'absolute', top:-6, right:-8, background:'#E74C3C', color:'#fff', fontSize:9, fontWeight:700, minWidth:16, height:16, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', padding:'0 4px' }}>
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </div>
            <span style={{ fontSize:10, fontWeight:isActive?700:500 }}>{t.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
