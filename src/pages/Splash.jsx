import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Splash() {
  const { family, loading } = useAuth()
  const nav = useNavigate()

  useEffect(() => {
    if (loading) return
    const timer = setTimeout(() => {
      if (!family) nav('/login', { replace: true })
      else if (!family.profileComplete) nav('/setup', { replace: true })
      else nav('/home', { replace: true })
    }, 1800)
    return () => clearTimeout(timer)
  }, [loading, family])

  return (
    <div className="page-no-nav fade-in" style={{
      minHeight: '100dvh',
      background: 'linear-gradient(160deg, #1E4D26 0%, #2D6A35 50%, #4A9456 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 0,
    }}>
      {/* Logo area */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{
          width: 100, height: 100,
          background: 'rgba(255,255,255,0.15)',
          borderRadius: 28,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 52,
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          backdropFilter: 'blur(8px)',
        }}>🌿</div>

        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: 36, fontWeight: 700,
            color: '#fff', letterSpacing: 1,
            lineHeight: 1.1,
          }}>KRISHA</div>
          <div style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: 13, fontWeight: 400,
            color: 'rgba(255,255,255,0.7)',
            letterSpacing: 6, textTransform: 'uppercase',
          }}>PURE</div>
        </div>

        <p style={{
          color: 'rgba(255,255,255,0.8)',
          fontSize: 15, fontStyle: 'italic',
          marginTop: 4,
        }}>Eat Pure. Live Well.</p>
      </div>

      {/* Bottom tagline */}
      <div style={{
        position: 'absolute', bottom: 60,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
      }}>
        <div style={{ display: 'flex', gap: 20 }}>
          {['🥦 Fresh', '🌱 Pure', '🌿 Natural'].map(t => (
            <div key={t} style={{
              color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 500,
            }}>{t}</div>
          ))}
        </div>
        <div style={{
          width: 40, height: 3, borderRadius: 2,
          background: 'rgba(255,255,255,0.4)', marginTop: 16,
          animation: 'pulse 1.2s ease-in-out infinite',
        }} />
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.4; transform: scaleX(1); }
          50% { opacity: 1; transform: scaleX(1.5); }
        }
      `}</style>
    </div>
  )
}
