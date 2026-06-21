import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../api'
import { showToast } from '../components/Toast'
import BottomNav from '../components/BottomNav'
import logo from '../assets/logo.jpeg'

const GOAL_ICONS = {
  'Immunity Support':'🛡️','Iron Support':'💪','Protein Support':'⚡',
  'Weight Management':'⚖️','Diabetes Control':'💧','Heart Wellness':'❤️',
  'Digestive Wellness':'🌀','Detox':'✨','Kids Nutrition':'😊','Senior Wellness':'👴',
  'Bone Health':'🦴','General Wellness':'🌿',
}

export default function Profile() {
  const { family, updateFamily, logout } = useAuth()
  const nav = useNavigate()
  const [fullFamily, setFullFamily]   = useState(null)
  const [loading, setLoading]         = useState(true)
  const [addingMember, setAddingMember] = useState(false)
  const [newMember, setNewMember]     = useState({ name: '', age: '', gender: 'Female' })
  const avatarRef = useRef(null)

  const load = () => {
    if (!family?._id) return
    api.getFamily(family._id).then(d => setFullFamily(d.family)).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [family])

  const handleLogout = () => {
    if (window.confirm('Log out?')) { logout(); nav('/login', { replace: true }) }
  }

  const handleAddMember = async () => {
    if (!newMember.name) return showToast('Name is required', 'error')
    const age = parseInt(newMember.age)
    if (newMember.age && (isNaN(age) || age < 1 || age > 110)) return showToast('Enter a valid age (1–110)', 'error')
    try {
      await api.addMember(family._id, {
        name: newMember.name,
        age: age || null,
        gender: newMember.gender,
        wellnessGoals: [],
      })
      showToast(`${newMember.name} added!`, 'success')
      setNewMember({ name: '', age: '', gender: 'Female' })
      setAddingMember(false)
      load()
    } catch(e) { showToast(e.message, 'error') }
  }

  // Member photo — stored in localStorage as base64 (frontend-only)
  const getMemberPhoto = (memberId) => {
    try { return localStorage.getItem(`kp_photo_${memberId}`) || null } catch { return null }
  }
  const handleMemberPhotoChange = (memberId, e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) return showToast('Photo must be under 2MB', 'error')
    const reader = new FileReader()
    reader.onload = ev => {
      localStorage.setItem(`kp_photo_${memberId}`, ev.target.result)
      showToast('Photo updated!', 'success')
      setFullFamily(f => ({ ...f })) // trigger re-render
    }
    reader.readAsDataURL(file)
  }

  const f = fullFamily || family

  return (
    <div className="page fade-in">
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#1A3D20 0%,#2D6A35 100%)', padding: '24px 20px 28px', textAlign: 'center' }}>
        <img src={logo} alt="KP" style={{ width: 52, height: 52, borderRadius: 14, objectFit: 'contain', marginBottom: 10 }} />
        <div style={{ color: '#fff', fontFamily: 'Playfair Display,serif', fontSize: 19, fontWeight: 700 }}>
          {f?.familyName || 'Your Family'}
        </div>
        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 4 }}>+91 {f?.phone}</div>
        {f?.city && <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, marginTop: 2 }}>📍 {f.city}</div>}
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : (
        <div style={{ padding: '16px 20px' }}>

          {/* Address card */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>Your Profile</div>
              <button onClick={() => nav('/setup')} style={{ background: 'none', border: 'none', color: 'var(--green)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Edit</button>
            </div>
            {f?.apartmentName && <InfoRow icon="🏠" label="Apartment" value={`${f.apartmentName}, Flat ${f.flatNo}${f.towerNo ? `, ${f.towerNo}` : ''}`} />}
            {f?.address       && <InfoRow icon="📍" label="Address"   value={`${f.address}, ${f.city}`} />}
            {f?.dietPreference && <InfoRow icon="🥗" label="Diet"     value={f.dietPreference} />}
          </div>

          {/* Family Members */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontFamily: 'Playfair Display,serif', fontSize: 17, fontWeight: 600 }}>Family Members</div>
            <button
              onClick={() => setAddingMember(a => !a)}
              style={{ background: 'var(--green)', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 50, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              + Add Member
            </button>
          </div>

          {/* Add Member inline form */}
          {addingMember && (
            <div className="member-card" style={{ marginBottom: 12, background: 'var(--green-pale)', border: '1.5px solid var(--green-muted)' }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--green)', marginBottom: 12 }}>New Member</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div className="input-group">
                  <label className="input-label">Name *</label>
                  <input className="input-field" placeholder="e.g. Priya" value={newMember.name} onChange={e => setNewMember(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div className="input-group">
                    <label className="input-label">Age (1–110)</label>
                    <input className="input-field" type="number" inputMode="numeric" placeholder="34" min={1} max={110} value={newMember.age} onChange={e => setNewMember(p => ({ ...p, age: e.target.value }))} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Gender</label>
                    <select className="input-field" value={newMember.gender} onChange={e => setNewMember(p => ({ ...p, gender: e.target.value }))}>
                      <option>Female</option><option>Male</option><option>Child</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={handleAddMember}>Add</button>
                  <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => setAddingMember(false)}>Cancel</button>
                </div>
              </div>
            </div>
          )}

          {/* Member cards */}
          {(f?.members || []).length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '24px', marginBottom: 14 }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>👤</div>
              <p style={{ marginBottom: 12, fontSize: 13, color: 'var(--text-light)' }}>No members added yet</p>
              <button className="btn btn-secondary btn-sm" onClick={() => setAddingMember(true)} style={{ width: 'auto', padding: '10px 20px' }}>+ Add First Member</button>
            </div>
          ) : (
            (f?.members || []).map(m => {
              const photo = getMemberPhoto(m.memberId)
              const displayAge = m.age && m.age <= 110 ? m.age : null // guard against bad data
              return (
                <div key={m.memberId} className="member-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: m.wellnessGoals?.length ? 10 : 0 }}>
                    {/* Member photo with upload */}
                    <label htmlFor={`photo_${m.memberId}`} style={{ cursor: 'pointer', flexShrink: 0 }}>
                      <div style={{ width: 46, height: 46, borderRadius: '50%', background: 'var(--green-pale)', border: '2px solid var(--green-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, overflow: 'hidden', position: 'relative' }}>
                        {photo
                          ? <img src={photo} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <span>{m.gender === 'Male' ? '👨' : m.gender === 'Child' ? '👶' : '👩'}</span>
                        }
                        {/* Camera overlay */}
                        <div style={{ position: 'absolute', bottom: 0, right: 0, width: 16, height: 16, background: 'var(--green)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9 }}>📷</div>
                      </div>
                      <input
                        id={`photo_${m.memberId}`} type="file" accept="image/*"
                        style={{ display: 'none' }}
                        onChange={e => handleMemberPhotoChange(m.memberId, e)}
                      />
                    </label>

                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{m.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 2 }}>
                        {[displayAge ? `${displayAge} yrs` : null, m.gender].filter(Boolean).join(' · ')}
                      </div>
                    </div>
                    <button onClick={() => nav('/goals')} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 50, padding: '5px 10px', fontSize: 11, color: 'var(--green)', fontWeight: 600, cursor: 'pointer' }}>Goals</button>
                  </div>
                  {m.wellnessGoals?.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {m.wellnessGoals.map(g => (
                        <span key={g} style={{ background: 'var(--green-pale)', color: 'var(--green)', padding: '3px 10px', borderRadius: 50, fontSize: 11, fontWeight: 600 }}>
                          {GOAL_ICONS[g] || '🌿'} {g}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )
            })
          )}

          {/* Quick links */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
            {[
              { icon: '🎯', label: 'Manage Wellness Goals', action: () => nav('/goals') },
              { icon: '📦', label: 'My Orders',             action: () => nav('/orders') },
              { icon: '🛒', label: 'Browse Baskets',        action: () => nav('/goals') },
            ].map(item => (
              <div key={item.label} onClick={item.action} style={{ background: 'var(--white)', borderRadius: 'var(--radius-sm)', padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: 20 }}>{item.icon}</span>
                <span style={{ fontWeight: 500, fontSize: 14, flex: 1 }}>{item.label}</span>
                <span style={{ color: 'var(--text-light)', fontSize: 20 }}>›</span>
              </div>
            ))}
          </div>

          <button className="btn btn-ghost" onClick={handleLogout} style={{ marginTop: 16, borderColor: '#DC2626', color: '#DC2626' }}>
            Log Out
          </button>
        </div>
      )}
      <BottomNav />
    </div>
  )
}

function InfoRow({ icon, label, value }) {
  return (
    <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
      <span style={{ fontSize: 16 }}>{icon}</span>
      <div>
        <div style={{ fontSize: 11, color: 'var(--text-light)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.3 }}>{label}</div>
        <div style={{ fontSize: 13, color: 'var(--text)', marginTop: 1 }}>{value}</div>
      </div>
    </div>
  )
}
