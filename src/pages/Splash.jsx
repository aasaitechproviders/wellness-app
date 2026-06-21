import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import logo from '../assets/logo.jpeg'

export default function Splash() {
  const { family, loading } = useAuth()
  const nav = useNavigate()

  useEffect(() => {
    if (loading) return
    const timer = setTimeout(() => {
      if (!family) nav('/login', { replace: true })
      else if (!family.profileComplete) nav('/setup', { replace: true })
      else nav('/home', { replace: true })
    }, 2000)
    return () => clearTimeout(timer)
  }, [loading, family])

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'linear-gradient(160deg, #1A3D20 0%, #2D6A35 55%, #3D7A45 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
        <img
          src={logo}
          alt="Krisha Pure"
          style={{
            width: 160, height: 160,
            objectFit: 'contain',
            borderRadius: 28,
            animation: 'logoIn 0.8s cubic-bezier(0.34,1.56,0.64,1)',
          }}
        />
        {/* Tagline */}
        <p style={{
          color: 'rgba(255,255,255,0.88)',
          fontSize: 15, fontStyle: 'italic',
          textAlign: 'center', lineHeight: 1.6,
          fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif',
          letterSpacing: 0.3,
        }}>
          Turning Wellness Goals into<br/>Daily Nutrition
        </p>
      </div>

      {/* Bottom icons */}
      <div style={{ position: 'absolute', bottom: 56, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        <div style={{ display: 'flex', gap: 36 }}>
          {[['🥗','Fresh'],['💚','Pure'],['🌾','Natural']].map(([e,l]) => (
            <div key={l} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 26 }}>{e}</div>
              <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11, fontWeight: 600, marginTop: 5, fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif', letterSpacing: 0.5 }}>{l}</div>
            </div>
          ))}
        </div>
        <div style={{ width: 40, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.4)', animation: 'pulse 1.2s ease-in-out infinite' }} />
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:0.3;transform:scaleX(1)} 50%{opacity:1;transform:scaleX(1.6)} }
        @keyframes logoIn { from{opacity:0;transform:scale(0.7)} to{opacity:1;transform:scale(1)} }
      `}</style>
    </div>
  )
}
