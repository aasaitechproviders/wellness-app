import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { showToast } from '../components/Toast'
import logo from '../assets/logo.png'

export default function Login() {
  const [phone, setPhone] = useState('')
  const [wa, setWa]       = useState(true)
  const [busy, setBusy]   = useState(false)
  const { login } = useAuth()
  const nav = useNavigate()

  const go = async () => {
    if (phone.length !== 10) return showToast('Enter a valid 10-digit number', 'error')
    setBusy(true)
    try {
      const d = await login(phone)
      localStorage.setItem('kp_phone', phone)
      nav(d.profileComplete ? '/home' : '/setup', { replace:true })
    } catch(e) { showToast(e.message || 'Login failed', 'error') }
    finally { setBusy(false) }
  }

  return (
    <div style={{ minHeight:'100dvh', display:'flex', flexDirection:'column', background:'var(--cream)', overflow:'hidden' }}>

      {/* ── Hero area ── */}
      <div style={{ flex:'0 0 auto', padding:'48px 28px 0', textAlign:'center', position:'relative' }}>
        {/* Basket photo — top right decorative */}
        <div style={{ position:'absolute', top:0, right:-8, fontSize:110, lineHeight:1, opacity:0.85, pointerEvents:'none', filter:'drop-shadow(2px 4px 8px rgba(0,0,0,0.12))' }}>🧺</div>
        {/* Floating leaves */}
        <div style={{ position:'absolute', top:20, left:12, fontSize:28, opacity:0.5, transform:'rotate(-20deg)' }}>🌿</div>

        {/* Logo mark */}
        <img src={logo} alt="Krisha Pure" style={{ width:72, height:72, borderRadius:18, objectFit:'contain', margin:'0 auto 10px', position:'relative', zIndex:1 }} />

        {/* Brand name */}
        <div style={{ fontFamily:'var(--font-serif)', fontSize:30, fontWeight:700, color:'var(--green-dark)', letterSpacing:-0.5, lineHeight:1 }}>KRISHA</div>
        <div style={{ fontSize:11, fontWeight:700, letterSpacing:5, color:'var(--gold)', margin:'4px 0 12px', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
          <span style={{ height:1, width:24, background:'var(--gold)', display:'inline-block' }} />
          PURE
          <span style={{ height:1, width:24, background:'var(--gold)', display:'inline-block' }} />
        </div>

        {/* Tagline */}
        <div style={{ fontSize:18, fontWeight:700, color:'var(--green-dark)', lineHeight:1.35, marginBottom:20, position:'relative', zIndex:1 }}>
          Turning Wellness Goals<br/>into <span style={{ color:'var(--green)' }}>Daily Nutrition</span>
        </div>

        {/* 3 feature badges */}
        <div style={{ display:'flex', justifyContent:'center', gap:12, marginBottom:28, position:'relative', zIndex:1 }}>
          {[['🌿','Fresh'],['💚','Pure'],['🌱','Nutrient Rich']].map(([ic,lb]) => (
            <div key={lb} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:5 }}>
              <div style={{ width:48, height:48, borderRadius:'50%', background:'var(--white)', border:'1.5px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, boxShadow:'0 2px 6px rgba(0,0,0,0.06)' }}>{ic}</div>
              <span style={{ fontSize:11, fontWeight:500, color:'var(--text-mid)' }}>{lb}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── White card panel ── */}
      <div style={{ flex:1, background:'var(--white)', borderRadius:'28px 28px 0 0', padding:'28px 22px 32px', display:'flex', flexDirection:'column', gap:18, boxShadow:'0 -4px 20px rgba(0,0,0,0.06)' }}>

        {/* Heading */}
        <div style={{ textAlign:'center' }}>
          <div style={{ fontFamily:'var(--font-serif)', fontSize:22, fontWeight:700, color:'var(--text)', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
            Welcome to Krisha Pure <span style={{ fontSize:14 }}>🌿</span>
          </div>
          <div style={{ fontSize:13, color:'var(--text-light)', marginTop:4 }}>Enter your mobile number to get started</div>
        </div>

        {/* Phone input */}
        <div>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:1, textTransform:'uppercase', color:'var(--text-light)', marginBottom:7 }}>Mobile Number</div>
          <div style={{ display:'flex', border:'1.5px solid var(--border-mid)', borderRadius:14, overflow:'hidden', background:'var(--white)' }}>
            {/* Country code */}
            <div style={{ padding:'13px 14px', borderRight:'1.5px solid var(--border)', background:'#FAFAFA', display:'flex', alignItems:'center', gap:5, flexShrink:0 }}>
              <span style={{ fontSize:14, fontWeight:600, color:'var(--text)' }}>+91</span>
              <span style={{ fontSize:10, color:'var(--text-light)' }}>▾</span>
            </div>
            {/* Number field */}
            <input type="tel" inputMode="numeric" maxLength={10}
              placeholder="98765 43210"
              value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g,''))}
              onKeyDown={e => e.key==='Enter' && go()}
              style={{ flex:1, padding:'13px 14px', border:'none', outline:'none', fontSize:15, letterSpacing:0.5, fontWeight:500, color:'var(--text)', background:'transparent' }}
            />
          </div>
        </div>

        {/* OTP note */}
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:32, height:32, borderRadius:'50%', background:'var(--green-pale)', border:'1px solid #C8E6C9', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, flexShrink:0 }}>🛡️</div>
          <span style={{ fontSize:13, color:'var(--text-mid)' }}>
            We'll send a <strong style={{ color:'var(--green)' }}>6-digit OTP</strong> to verify your number.
          </span>
        </div>

        {/* WhatsApp consent */}
        <div style={{ display:'flex', alignItems:'flex-start', gap:10, cursor:'pointer' }} onClick={() => setWa(p=>!p)}>
          <div style={{ width:22, height:22, borderRadius:5, border:`2px solid ${wa?'var(--green)':'var(--border-mid)'}`, background:wa?'var(--green)':'var(--white)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:1, transition:'all 0.15s' }}>
            {wa && <span style={{ color:'#fff', fontSize:13, lineHeight:1 }}>✓</span>}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:28, height:28, borderRadius:'50%', background:'#25D366', display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, flexShrink:0 }}>💬</div>
            <span style={{ fontSize:13, color:'var(--text-mid)', lineHeight:1.5 }}>Send order, delivery and wellness<br/>updates through WhatsApp</span>
          </div>
        </div>

        {/* CTA */}
        <button className="btn btn-primary" onClick={go} disabled={busy} style={{ fontSize:16, letterSpacing:0.3 }}>
          {busy ? <span className="spin" /> : 'Continue  →'}
        </button>

        {/* Terms */}
        <div style={{ textAlign:'center', fontSize:12, color:'var(--text-light)', lineHeight:2 }}>
          By continuing, you agree to our<br/>
          <span style={{ borderBottom:'1px solid var(--text-light)', cursor:'pointer' }}>Terms of Use</span>
          <span style={{ margin:'0 6px' }}>and</span>
          <span style={{ borderBottom:'1px solid var(--text-light)', cursor:'pointer' }}>Privacy Policy</span>
        </div>

        {/* Trust badges */}
        <div style={{ borderTop:'1px solid var(--border)', paddingTop:18, display:'flex' }}>
          {[['🛡️','100% Natural\n& Safe'],['🏅','Quality You\nCan Trust'],['👨‍👩‍👧','Made for Your\nFamily']].map(([ic,lb],i) => (
            <div key={lb} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:8, borderRight: i<2 ? '1px solid var(--border)' : 'none' }}>
              <span style={{ fontSize:26, color:'var(--green)' }}>{ic}</span>
              <span style={{ fontSize:11, fontWeight:500, color:'var(--text-mid)', textAlign:'center', whiteSpace:'pre-line', lineHeight:1.5 }}>{lb}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
