import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { showToast } from '../components/Toast'
import logo from '../assets/logo.jpeg'

export default function Login() {
  const [phone, setPhone]       = useState('')
  const [whatsapp, setWhatsapp] = useState(true)
  const [loading, setLoading]   = useState(false)
  const { login } = useAuth()
  const nav = useNavigate()

  const go = async () => {
    if (phone.length !== 10) return showToast('Enter a valid 10-digit number', 'error')
    setLoading(true)
    try {
      const d = await login(phone)
      localStorage.setItem('kp_phone', phone)
      localStorage.setItem('kp_whatsapp', whatsapp ? '1' : '0')
      nav(d.profileComplete ? '/home' : '/setup', { replace: true })
    } catch(e) {
      showToast(e.message || 'Login failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: '#fff' }}>
      {/* Green hero */}
      <div style={{
        background: 'linear-gradient(160deg,#1A3D20 0%,#2D6A35 60%,#3D7A45 100%)',
        padding: '52px 32px 60px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
      }}>
        {/* Real logo */}
        <img
          src={logo}
          alt="Krisha Pure"
          style={{ width: 130, height: 130, objectFit: 'contain', borderRadius: 22 }}
        />
        {/* Updated tagline */}
        <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: 15, fontStyle: 'italic', textAlign: 'center', lineHeight: 1.6, marginTop: 4 }}>
          Turning Wellness Goals into Daily Nutrition
        </p>
        {/* Updated icons */}
        <div style={{ display: 'flex', gap: 32, marginTop: 4 }}>
          {[['🥗','Fresh'],['💚','Pure'],['🌾','Natural']].map(([e,l]) => (
            <div key={l} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 26 }}>{e}</div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 600, marginTop: 5 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* White form panel */}
      <div style={{
        flex: 1, borderRadius: '28px 28px 0 0', marginTop: -24,
        background: '#fff', padding: '32px 22px 40px',
        display: 'flex', flexDirection: 'column', gap: 18,
      }}>
        {/* Welcome heading */}
        <div style={{ textAlign: 'center', marginBottom: 4 }}>
          <div style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>
            Welcome to Krisha Pure
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-light)', marginTop: 5 }}>
            Enter your mobile number to get started
          </div>
        </div>

        {/* Phone input */}
        <div className="input-wrap">
          <label className="input-label">Mobile Number</label>
          <div style={{ position: 'relative' }}>
            <span style={{
              position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
              fontSize: 14, color: 'var(--text-mid)', fontWeight: 700, zIndex: 1, pointerEvents: 'none',
            }}>+91</span>
            <input
              className="input-field"
              style={{ paddingLeft: 50, fontSize: 16, letterSpacing: 1 }}
              type="tel" inputMode="numeric"
              placeholder="98765 43210"
              maxLength={10} value={phone}
              onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
              onKeyDown={e => e.key === 'Enter' && go()}
            />
          </div>
        </div>

        {/* WhatsApp opt-in */}
        <div
          onClick={() => setWhatsapp(w => !w)}
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            background: '#F0FDF4', border: `1.5px solid ${whatsapp ? '#22C55E' : '#E2EAE3'}`,
            borderRadius: 12, padding: '12px 14px', cursor: 'pointer', transition: 'all 0.15s',
          }}>
          <div style={{
            width: 22, height: 22, borderRadius: 6,
            border: `2px solid ${whatsapp ? '#25D366' : '#ccc'}`,
            background: whatsapp ? '#25D366' : '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, transition: 'all 0.15s',
          }}>
            {whatsapp && <span style={{ color: '#fff', fontSize: 13, fontWeight: 900, lineHeight: 1 }}>✓</span>}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 18 }}>💬</span>
              <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>Get WhatsApp updates</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 2 }}>
              Order alerts, delivery updates & wellness tips
            </div>
          </div>
        </div>

        <button className="btn btn-primary" onClick={go} disabled={loading || phone.length !== 10}>
          {loading
            ? <><span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }}/> Please wait...</>
            : 'Sign Up / Login →'}
        </button>

        <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-light)', lineHeight: 1.8 }}>
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  )
}
