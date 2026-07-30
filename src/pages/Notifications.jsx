import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import BottomNav from '../components/BottomNav'

const TYPE_META = {
  order_placed:           { icon: '🛒', color: '#2D6A35', bg: '#E8F5E9', label: 'Order Placed' },
  order_status:           { icon: '📦', color: '#1565C0', bg: '#E3F2FD', label: 'Order Update' },
  appointment_requested:  { icon: '📅', color: '#E65100', bg: '#FFF3E0', label: 'Appointment' },
  appointment_assigned:   { icon: '👩‍⚕️', color: '#6A1B9A', bg: '#F3E5F5', label: 'Nutritionist Assigned' },
  announcement:           { icon: '📢', color: '#7B5E2A', bg: '#FFF8E1', label: 'Announcement' },
  general:                { icon: '🔔', color: '#455A64', bg: '#ECEFF1', label: 'Notification' },
}

function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date)) / 1000)
  if (s < 60)   return 'just now'
  if (s < 3600) return `${Math.floor(s/60)}m ago`
  if (s < 86400) return `${Math.floor(s/3600)}h ago`
  return `${Math.floor(s/86400)}d ago`
}

export default function Notifications() {
  const nav = useNavigate()
  const [notifs, setNotifs]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    try {
      const d = await api.getNotifications()
      setNotifs(d.notifications || [])
      // Mark all as read
      await api.markNotifRead()
    } catch {}
    setLoading(false)
  }

  const unread = notifs.filter(n => !n.isRead).length

  return (
    <div className="page-shell fade-in">
      <div className="top-bar">
        <button className="back-btn" onClick={() => nav(-1)}>←</button>
        <div className="top-bar-title">Notifications</div>
        {unread > 0 && (
          <span style={{ padding:'2px 10px',borderRadius:20,background:'var(--green)',color:'#fff',fontSize:11,fontWeight:700 }}>
            {unread} new
          </span>
        )}
      </div>

      <div className="page-shell-scroll with-nav" style={{ padding:'12px 16px', paddingBottom:90 }}>
        {loading ? (
          <div style={{ textAlign:'center',padding:40 }}><div className="spinner" /></div>
        ) : notifs.length === 0 ? (
          <div style={{ textAlign:'center',padding:'60px 16px',color:'var(--text-light)' }}>
            <div style={{ fontSize:48,marginBottom:12 }}>🔔</div>
            <div style={{ fontWeight:700,fontSize:15,marginBottom:6 }}>No notifications yet</div>
            <div style={{ fontSize:13 }}>We'll notify you about orders, appointments and updates</div>
          </div>
        ) : (
          notifs.map(n => {
            const meta = TYPE_META[n.type] || TYPE_META.general
            return (
              <div key={n._id} style={{
                background: n.isRead ? '#fff' : meta.bg,
                borderRadius: 14,
                border: `1.5px solid ${n.isRead ? 'var(--border)' : meta.color+'33'}`,
                padding: '14px 16px',
                marginBottom: 10,
                display: 'flex',
                gap: 12,
                alignItems: 'flex-start',
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: meta.bg, border: `1.5px solid ${meta.color}33`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, flexShrink: 0,
                }}>
                  {meta.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',gap:8,marginBottom:4 }}>
                    <div style={{ fontWeight:700,fontSize:13,color:meta.color }}>{n.title}</div>
                    <div style={{ fontSize:10,color:'var(--text-light)',flexShrink:0 }}>{timeAgo(n.createdAt)}</div>
                  </div>
                  <div style={{ fontSize:13,color:'var(--text-mid)',lineHeight:1.5 }}>{n.body}</div>
                  {!n.isRead && (
                    <div style={{ width:6,height:6,borderRadius:'50%',background:meta.color,marginTop:6 }} />
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
      <BottomNav />
    </div>
  )
}
