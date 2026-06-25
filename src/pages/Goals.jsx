import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../api'
import { showToast } from '../components/Toast'
import BottomNav from '../components/BottomNav'

// Colored SVG-style icons matching Image 11
const GM = {
  'Immunity Support':   { icon: '🛡️', color: '#FFE5E5' },
  'Iron Support':       { icon: '💪', color: '#FFF3E0' },
  'Protein Support':    { icon: '⚡', color: '#FFF9C4' },
  'Weight Management':  { icon: '⚖️', color: '#F3E5F5' },
  'Diabetes Control':   { icon: '💧', color: '#E1F5FE' },
  'Heart Wellness':     { icon: '❤️', color: '#FCE4EC' },
  'Digestive Wellness': { icon: '🌀', color: '#E8F5E9' },
  'Detox':              { icon: '✨', color: '#FFFDE7' },
  'Kids Nutrition':     { icon: '😊', color: '#FFF8E1' },
  'Senior Wellness':    { icon: '👴', color: '#EFEBE9' },
  'Bone Health':        { icon: '🦴', color: '#F3E5F5' },
  'General Wellness':   { icon: '🌿', color: '#E8F5E9' },
}

export default function Goals() {
  const { family } = useAuth()
  const nav = useNavigate()
  const [goals,   setGoals]   = useState([])
  const [members, setMembers] = useState([])
  const [local,   setLocal]   = useState({})
  const [active,  setActive]  = useState(0)
  const [saving,  setSaving]  = useState(false)

  useEffect(() => {
    api.getGoals().then(d => setGoals(d.goals || []))
    if (family?._id) api.getFamily(family._id).then(d => {
      const m = d.family?.members || []
      setMembers(m)
      const init = {}
      // Trim any existing goals to max 3 per member
      m.forEach(x => { init[x.memberId] = (x.wellnessGoals || []).slice(0, 3) })
      setLocal(init)
    })
  }, [family])

  const toggle = (mid, gid) => {
    setLocal(p => {
      const c = p[mid] || []
      if (!c.includes(gid) && c.length >= 3) {
        showToast('Maximum 3 goals per member', 'error')
        return p
      }
      return { ...p, [mid]: c.includes(gid) ? c.filter(x => x !== gid) : [...c, gid] }
    })
  }

  const go = async () => {
    setSaving(true)
    try {
      for (const m of members)
        await api.updateMember(family._id, m.memberId, { wellnessGoals: local[m.memberId] || [] })
      const updated = members.map(m => ({ ...m, wellnessGoals: local[m.memberId] || [] }))
      const result  = await api.recommend({ members: updated.filter(m => m.wellnessGoals.length) })
      nav('/recommend', { state: { result: result.recommendation } })
    } catch(e) {
      showToast(e.message || 'Failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  const cur  = members[active]
  const curG = cur ? (local[cur.memberId] || []) : []
  const total = Object.values(local).flat().length

  return (
    <div className="page-shell fade-in">
      <div className="top-bar">
        <button className="back-btn" onClick={() => nav('/home')}>←</button>
        <div className="top-bar-title">Select Wellness Goals</div>
      </div>

      <div className="page-shell-scroll">
      <div style={{ padding: '12px 18px 4px' }}>
        <p style={{ fontSize: 13, color: 'var(--text-light)' }}>
          Choose up to <strong>3 goals</strong> per family member
        </p>
      </div>

      {/* Member selector tabs */}
      {members.length > 0 && (
        <div style={{ padding: '10px 18px 12px' }}>
          <div className="hscroll">
            {members.map((m, i) => {
              const cnt = local[m.memberId]?.length || 0
              const sel = i === active
              return (
                <button
                  key={m.memberId}
                  onClick={() => setActive(i)}
                  style={{
                    flexShrink: 0,
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '8px 16px', borderRadius: 50,
                    border: `1.5px solid ${sel ? 'var(--green)' : 'var(--border)'}`,
                    background: sel ? 'var(--green)' : '#fff',
                    color: sel ? '#fff' : 'var(--text)',
                    fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600,
                    cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s',
                  }}>
                  <span>{m.gender === 'Male' ? '👨' : '👩'}</span>
                  {m.name}
                  {cnt > 0 && (
                    <span style={{
                      background: sel ? 'rgba(255,255,255,0.3)' : 'var(--green)',
                      color: '#fff', borderRadius: 50, padding: '1px 7px', fontSize: 10, fontWeight: 700,
                    }}>{cnt}/3</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Goal grid — styled exactly like Image 11 */}
      <div style={{ padding: '4px 18px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {goals.map(g => {
          const meta     = GM[g.goalName] || { icon: '🌿', color: '#E8F5E9' }
          // wellnessGoals in DB stores goalName strings (set by Setup.jsx using g.id = goalName)
          const sel      = curG.includes(g.goalName)
          const disabled = !sel && curG.length >= 3
          return (
            <div
              key={g.goalId || g.goalName}
              onClick={() => cur && toggle(cur.memberId, g.goalName)}
              style={{
                position: 'relative',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                padding: '12px 8px 10px', gap: 6,
                background: sel ? 'var(--green-pale)' : '#fff',
                border: `1.5px solid ${sel ? 'var(--green)' : 'var(--border)'}`,
                borderRadius: 12,
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.35 : 1,
                transition: 'all 0.15s',
                minHeight: 80,
              }}>
              {/* Only show tick when selected */}
              {sel && (
                <div style={{
                  position: 'absolute', top: 6, right: 6,
                  width: 16, height: 16, borderRadius: '50%',
                  background: 'var(--green)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ color: '#fff', fontSize: 9, fontWeight: 900, lineHeight: 1 }}>✓</span>
                </div>
              )}

              {/* Coloured icon background */}
              <div style={{
                width: 34, height: 34, borderRadius: 10,
                background: sel ? 'rgba(45,106,53,0.12)' : meta.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 17, overflow: 'hidden',
              }}>
                {g.imageUrl
                  ? <img src={g.imageUrl} alt={g.goalName} style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:10 }} />
                  : meta.icon
                }
              </div>

              <div style={{
                fontSize: 11, fontWeight: 600,
                color: sel ? 'var(--green)' : 'var(--text)',
                textAlign: 'center', lineHeight: 1.3,
              }}>
                {g.goalName}
              </div>
            </div>
          )
        })}
      </div>

      </div>{/* end page-shell-scroll */}

      {/* Sticky footer CTA — above bottom nav */}
      {members.length > 0 && (
        <div className="sticky-footer" style={{ paddingBottom: 'calc(var(--nav-h) + 12px)' }}>
          <button className="btn btn-primary" onClick={go} disabled={saving || total === 0}>
            {saving && <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }}/>}
            {saving ? 'Getting your basket...' : 'Get My Wellness Basket →'}
          </button>
        </div>
      )}
      <BottomNav />
    </div>
  )
}
