import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { showToast } from '../components/Toast'
import logo from '../assets/logo.png'

export default function Login() {
  const [phone, setPhone]     = useState('')
  const [whatsapp, setWA]     = useState(true)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const nav = useNavigate()

  const go = async () => {
    if (phone.length !== 10) return showToast('Enter a valid 10-digit number', 'error')
    setLoading(true)
    try {
      const d = await login(phone)
      localStorage.setItem('kp_phone', phone)
      nav(d.profileComplete ? '/home' : '/setup', { replace: true })
    } catch(e) {
      showToast(e.message || 'Login failed', 'error')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight:'100dvh', display:'flex', flexDirection:'column', background:'var(--cream)' }}>

      {/* ── Hero section ── */}
      <div style={{ background:'var(--cream)', padding:'40px 24px 0', textAlign:'center', position:'relative', overflow:'hidden' }}>
        {/* Basket image top-right */}
        <div style={{ position:'absolute', top:0, right:-10, width:160, height:180, opacity:0.9 }}>
          <div style={{ fontSize:80, lineHeight:1, filter:'drop-shadow(0 4px 12px rgba(0,0,0,0.15))' }}>🧺</div>
        </div>

        {/* Logo */}
        <img src={logo} alt="Krisha Pure" style={{ width:80, height:80, objectFit:'contain', borderRadius:20, margin:'0 auto 10px', position:'relative', zIndex:1 }} />
        <div style={{ fontFamily:'var(--font-head)', fontSize:28, fontWeight:700, color:'var(--green-dark)', letterSpacing:-0.5 }}>KRISHA</div>
        <div style={{ fontSize:13, fontWeight:700, letterSpacing:4, color:'var(--gold)', marginBottom:10 }}>── PURE ──</div>
        <div style={{ fontSize:18, fontWeight:700, color:'var(--green-dark)', lineHeight:1.35, marginBottom:4 }}>
          Turning Wellness Goals<br/>into <span style={{ color:'var(--green)' }}>Daily Nutrition</span>
        </div>

        {/* Fresh / Pure / Nutrient Rich */}
        <div style={{ display:'flex', gap:12, justifyContent:'center', marginTop:16, marginBottom:28 }}>
          {[['🌿','Fresh'],['💚','Pure'],['🌱','Nutrient Rich']].map(([ic,lb]) => (
            <div key={lb} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
              <div style={{ width:44, height:44, borderRadius:14, background:'var(--white)', border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>{ic}</div>
              <span style={{ fontSize:11, fontWeight:600, color:'var(--text-mid)' }}>{lb}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── White form panel ── */}
      <div style={{ flex:1, background:'var(--white)', borderRadius:'28px 28px 0 0', padding:'28px 22px 32px', display:'flex', flexDirection:'column', gap:20, boxShadow:'0 -4px 24px rgba(0,0,0,0.08)' }}>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontFamily:'var(--font-head)', fontSize:22, fontWeight:700, color:'var(--text)' }}>Welcome to Krisha Pure 🌿</div>
          <div style={{ fontSize:13, color:'var(--text-light)', marginTop:4 }}>Enter your mobile number to get started</div>
        </div>

        {/* Phone field */}
        <div>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:0.8, textTransform:'uppercase', color:'var(--text-light)', marginBottom:7 }}>Mobile Number</div>
          <div style={{ display:'flex', border:'1.5px solid var(--border-mid)', borderRadius:12, overflow:'hidden', background:'var(--white)' }}>
            <div style={{ padding:'12px 14px', borderRight:'1.5px solid var(--border)', background:'#FAFAFA', display:'flex', alignItems:'center', gap:6, fontSize:14, fontWeight:600, color:'var(--text-mid)', flexShrink:0 }}>
              +91 <span style={{ fontSize:11, color:'var(--text-light)' }}>▾</span>
            </div>
            <input
              type="tel" inputMode="numeric" maxLength={10}
              placeholder="98765 43210"
              value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g,''))}
              onKeyDown={e => e.key==='Enter' && go()}
              style={{ flex:1, padding:'12px 14px', border:'none', outline:'none', fontSize:15, fontWeight:500, letterSpacing:0.5, color:'var(--text)', background:'transparent' }}
            />
          </div>
        </div>

        {/* OTP note */}
        <div style={{ display:'flex', alignItems:'center', gap:10, background:'var(--green-light)', borderRadius:10, padding:'10px 14px' }}>
          <span style={{ fontSize:18 }}>🛡️</span>
          <span style={{ fontSize:13, color:'var(--text-mid)' }}>
            We'll send a <strong style={{ color:'var(--green)' }}>6-digit OTP</strong> to verify your number.
          </span>
        </div>

        {/* WhatsApp toggle */}
        <label style={{ display:'flex', alignItems:'center', gap:12, cursor:'pointer' }}>
          <div onClick={() => setWA(p=>!p)} style={{ width:22, height:22, border:`2px solid ${whatsapp?'var(--green)':'var(--border-mid)'}`, borderRadius:6, background:whatsapp?'var(--green)':'var(--white)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all 0.15s' }}>
            {whatsapp && <span style={{ color:'#fff', fontSize:13, fontWeight:700 }}>✓</span>}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:22 }}>💬</span>
            <span style={{ fontSize:13, color:'var(--text-mid)', lineHeight:1.4 }}>Send order, delivery and wellness<br/>updates through WhatsApp</span>
          </div>
        </label>

        {/* CTA */}
        <button className="btn btn-primary" onClick={go} disabled={loading} style={{ fontSize:16, padding:'16px' }}>
          {loading ? <span className="spinner" style={{ width:20,height:20,borderWidth:2 }} /> : <>Continue →</>}
        </button>

        <div style={{ textAlign:'center', fontSize:12, color:'var(--text-light)', lineHeight:1.8 }}>
          By continuing, you agree to our<br/>
          <span style={{ borderBottom:'1px solid var(--text-light)', cursor:'pointer' }}>Terms of Use</span>
          {' '}and{' '}
          <span style={{ borderBottom:'1px solid var(--text-light)', cursor:'pointer' }}>Privacy Policy</span>
        </div>

        {/* Trust badges */}
        <div style={{ display:'flex', borderTop:'1px solid var(--border)', paddingTop:16, gap:0 }}>
          {[['🛡️','100% Natural\n& Safe'],['🏅','Quality You\nCan Trust'],['👨‍👩‍👧','Made for Your\nFamily']].map(([ic,lb]) => (
            <div key={lb} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:8, borderRight:lb==='Made for Your\nFamily'?'none':'1px solid var(--border)' }}>
              <div style={{ fontSize:26, color:'var(--green)' }}>{ic}</div>
              <span style={{ fontSize:11, fontWeight:600, color:'var(--text-mid)', textAlign:'center', whiteSpace:'pre-line', lineHeight:1.4 }}>{lb}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
