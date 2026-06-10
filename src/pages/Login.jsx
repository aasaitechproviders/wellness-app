import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { showToast } from '../components/Toast'

export default function Login() {
  const [phone, setPhone] = useState('')
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
    } catch(e) { showToast(e.message || 'Login failed', 'error')
    } finally  { setLoading(false) }
  }

  return (
    <div className="page-full slide-up" style={{ minHeight:'100dvh', display:'flex', flexDirection:'column', background:'var(--white)' }}>
      {/* Green hero */}
      <div style={{ background:'linear-gradient(160deg,#1E4D26 0%,#2D6A35 60%,#3D7A45 100%)', padding:'60px 32px 56px', display:'flex', flexDirection:'column', alignItems:'center', gap:14 }}>
        {/* Logo */}
        <div style={{ width:90, height:90, background:'rgba(255,255,255,0.14)', borderRadius:24, display:'flex', alignItems:'center', justifyContent:'center', fontSize:46, boxShadow:'0 8px 24px rgba(0,0,0,0.18)', backdropFilter:'blur(4px)' }}>🌿</div>
        <div style={{ textAlign:'center', lineHeight:1 }}>
          <div style={{ fontFamily:'Playfair Display,serif', fontSize:34, fontWeight:700, color:'#fff', letterSpacing:1.5 }}>KRISHA</div>
          <div style={{ fontFamily:'DM Sans,sans-serif', fontSize:10, color:'rgba(255,255,255,0.6)', letterSpacing:7, textTransform:'uppercase', marginTop:3 }}>PURE</div>
        </div>
        <p style={{ color:'rgba(255,255,255,0.8)', fontSize:15, fontStyle:'italic', marginTop:2 }}>Eat Pure. Live Well.</p>
        <p style={{ color:'rgba(255,255,255,0.6)', fontSize:13, textAlign:'center', lineHeight:1.6 }}>Fresh Vegetables, Fruits &<br/>Microgreens at your doorstep</p>
        <div style={{ display:'flex', gap:28, marginTop:6 }}>
          {[['🥦','Fresh'],['🌿','Pure'],['🌱','Natural']].map(([e,l])=>(
            <div key={l} style={{ textAlign:'center' }}>
              <div style={{ fontSize:22 }}>{e}</div>
              <div style={{ color:'rgba(255,255,255,0.65)', fontSize:11, fontWeight:500, marginTop:4 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* White form */}
      <div style={{ flex:1, borderRadius:'28px 28px 0 0', marginTop:-22, background:'#fff', padding:'32px 22px 40px', display:'flex', flexDirection:'column', gap:20 }}>
        <div className="input-wrap">
          <label className="input-label">Mobile Number</label>
          <div style={{ position:'relative' }}>
            <span style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', fontSize:15, color:'var(--text-mid)', fontWeight:600, zIndex:1, pointerEvents:'none' }}>+91</span>
            <input className="input-field" style={{ paddingLeft:50 }} type="tel" inputMode="numeric"
              placeholder="98765 43210" maxLength={10} value={phone}
              onChange={e=>setPhone(e.target.value.replace(/\D/g,''))}
              onKeyDown={e=>e.key==='Enter'&&go()} />
          </div>
        </div>

        <button className="btn btn-primary" onClick={go} disabled={loading||phone.length!==10}>
          {loading ? <span className="spinner" style={{width:20,height:20,borderWidth:2}}/> : null}
          {loading ? 'Please wait...' : 'Sign Up / Login →'}
        </button>

        <p style={{ textAlign:'center', fontSize:11, color:'var(--text-light)', lineHeight:1.8 }}>
          By continuing, you agree to our<br/>Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  )
}
