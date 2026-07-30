import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../api'
import { showToast } from '../components/Toast'
import BottomNav from '../components/BottomNav'

const WS_URL  = 'ws://13.207.147.69:3001'
const ICE_SERVERS = [
  { urls: 'stun:13.207.147.69:3478' },
  {
    urls:       'turn:13.207.147.69:3478',
    username:   'krishapure',
    credential: 'kp_turn_2026',
  },
]

const SLOTS = [
  '9:00 AM','10:00 AM','11:00 AM','12:00 PM','1:00 PM','2:00 PM',
  '3:00 PM','4:00 PM','5:00 PM','6:00 PM','7:00 PM','8:00 PM',
]

function next14() {
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i + 1); return d
  })
}

/* ═══════════════════════════════════════════════════════════════
   IncomingCallOverlay — WebSocket-based signaling
   ═══════════════════════════════════════════════════════════════ */
function IncomingCallOverlay({ appointment, onEnd }) {
  const [status, setStatus]     = useState('ringing')
  const [duration, setDuration] = useState(0)
  const localAudio  = useRef(null)
  const remoteAudio = useRef(null)
  const pcRef       = useRef(null)
  const wsRef       = useRef(null)
  const timerRef    = useRef(null)
  const streamRef   = useRef(null)
  const iceBufRef   = useRef([])   // buffer ICE candidates until remote desc is set
  const aptId       = appointment._id

  const cleanup = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (wsRef.current)    { wsRef.current.close(); wsRef.current = null }
    if (pcRef.current)    { pcRef.current.close(); pcRef.current = null }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    iceBufRef.current = []
  }, [])

  const wsSend = (obj) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(obj))
    }
  }

  const endCall = useCallback(async () => {
    wsSend({ type: 'end-call', appointmentId: aptId })
    cleanup()
    setStatus('ended')
    try { await api.updateCallStatus(aptId, 'ended') } catch {}
    setTimeout(() => onEnd?.(), 1500)
  }, [aptId, cleanup, onEnd])

  const acceptCall = async () => {
    try {
      setStatus('connecting')
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      streamRef.current = stream
      if (localAudio.current) { localAudio.current.srcObject = stream; localAudio.current.muted = true }

      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS })
      pcRef.current = pc

      stream.getTracks().forEach(t => pc.addTrack(t, stream))

      pc.ontrack = (e) => {
        if (remoteAudio.current) remoteAudio.current.srcObject = e.streams[0]
      }

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          wsSend({ type: 'ice-candidate', appointmentId: aptId, data: JSON.stringify(e.candidate) })
        }
      }

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'connected') {
          setStatus('in_call')
          timerRef.current = setInterval(() => setDuration(d => d + 1), 1000)
        }
        if (['disconnected','failed','closed'].includes(pc.connectionState)) endCall()
      }

      // Connect WebSocket and join as customer
      const ws = new WebSocket(WS_URL)
      wsRef.current = ws

      ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'join', appointmentId: aptId, role: 'customer' }))
        api.updateCallStatus(aptId, 'accepted').catch(() => {})
      }

      ws.onmessage = async (e) => {
        const msg = JSON.parse(e.data)

        if (msg.type === 'offer') {
          await pc.setRemoteDescription(JSON.parse(msg.data))
          // Flush buffered ICE candidates
          for (const c of iceBufRef.current) {
            try { await pc.addIceCandidate(c) } catch {}
          }
          iceBufRef.current = []
          const answer = await pc.createAnswer()
          await pc.setLocalDescription(answer)
          wsSend({ type: 'answer', appointmentId: aptId, data: JSON.stringify(answer) })
        }

        if (msg.type === 'ice-candidate') {
          const candidate = JSON.parse(msg.data)
          if (pc.remoteDescription) {
            try { await pc.addIceCandidate(candidate) } catch {}
          } else {
            iceBufRef.current.push(candidate)
          }
        }

        if (msg.type === 'end-call' || msg.type === 'peer-disconnected') {
          endCall()
        }
      }

      ws.onerror = () => showToast('Connection error', 'error')

    } catch (e) {
      showToast('Could not access microphone', 'error')
      setStatus('ringing')
    }
  }

  const declineCall = async () => {
    cleanup()
    try { await api.updateCallStatus(aptId, 'declined') } catch {}
    onEnd?.()
  }

  useEffect(() => { return cleanup }, [cleanup])

  const fmtTime = (s) => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`

  return (
    <div style={{ position:'fixed',inset:0,zIndex:9999,background:'linear-gradient(135deg,#1A3D20 0%,#2D6A35 50%,#1A3D20 100%)',
      display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:20,padding:24 }}>
      <audio ref={localAudio} autoPlay muted />
      <audio ref={remoteAudio} autoPlay />

      <div style={{ width:90,height:90,borderRadius:'50%',background:'rgba(255,255,255,0.15)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:40 }}>
        🩺
      </div>
      <div style={{ color:'#fff',textAlign:'center' }}>
        <div style={{ fontSize:20,fontWeight:700,marginBottom:4 }}>{appointment.assignedTo || 'Nutritionist'}</div>
        <div style={{ fontSize:13,opacity:0.7 }}>Krisha Pure Nutritionist</div>
      </div>

      <div style={{ color:'#fff',fontSize:16,fontWeight:600,textAlign:'center' }}>
        {status === 'ringing'    && '📞 Incoming Call…'}
        {status === 'connecting' && '🔄 Connecting…'}
        {status === 'in_call'    && `🟢 In Call — ${fmtTime(duration)}`}
        {status === 'ended'      && '✅ Call Ended'}
      </div>

      {status === 'ringing' && (
        <div style={{ width:120,height:120,borderRadius:'50%',border:'3px solid rgba(255,255,255,0.3)',
          animation:'pulse 1.5s ease-in-out infinite',position:'absolute' }} />
      )}

      <div style={{ display:'flex',gap:32,marginTop:20 }}>
        {status === 'ringing' && (
          <>
            <button onClick={declineCall}
              style={{ width:64,height:64,borderRadius:'50%',background:'#E53935',border:'none',cursor:'pointer',
                display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:4,
                boxShadow:'0 4px 20px rgba(229,57,53,0.4)' }}>
              <span style={{ fontSize:24,color:'#fff' }}>✕</span>
              <span style={{ fontSize:9,color:'#fff',fontWeight:700 }}>Decline</span>
            </button>
            <button onClick={acceptCall}
              style={{ width:64,height:64,borderRadius:'50%',background:'#4CAF50',border:'none',cursor:'pointer',
                display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:4,
                boxShadow:'0 4px 20px rgba(76,175,80,0.4)',animation:'pulse 1.5s ease-in-out infinite' }}>
              <span style={{ fontSize:24,color:'#fff' }}>📞</span>
              <span style={{ fontSize:9,color:'#fff',fontWeight:700 }}>Accept</span>
            </button>
          </>
        )}
        {(status === 'in_call' || status === 'connecting') && (
          <button onClick={endCall}
            style={{ width:64,height:64,borderRadius:'50%',background:'#E53935',border:'none',cursor:'pointer',
              display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:4,
              boxShadow:'0 4px 20px rgba(229,57,53,0.4)' }}>
            <span style={{ fontSize:24,color:'#fff' }}>✕</span>
            <span style={{ fontSize:9,color:'#fff',fontWeight:700 }}>End</span>
          </button>
        )}
      </div>

      <style>{`@keyframes pulse { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.1);opacity:0.7} }`}</style>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   Main Appointment page
   ═══════════════════════════════════════════════════════════════ */
export default function Appointment() {
  const { family } = useAuth()
  const nav = useNavigate()
  const { state } = useLocation()

  const [appointments, setAppointments] = useState([])
  const [loading, setLoading]           = useState(true)
  const [submitting, setSubmitting]     = useState(false)
  const [incomingCall, setIncomingCall] = useState(null)

  const [selDay, setSelDay]   = useState(null)
  const [selSlot, setSelSlot] = useState(null)
  const days = next14()

  const triggerConditions = state?.conditions || []
  const triggerMemberId   = state?.memberId   || null
  const triggerMemberName = state?.memberName  || ''
  const showBooking       = state?.book || false

  const loadAppointments = async () => {
    try {
      const d = await api.getMyAppointments()
      setAppointments(d.appointments || [])
    } catch {}
    setLoading(false)
  }

  useEffect(() => { loadAppointments() }, [])

  // Poll call status for assigned appointments — triggers incoming call overlay
  useEffect(() => {
    const assigned = appointments.filter(a => a.status === 'assigned')
    if (!assigned.length) return
    const poll = setInterval(async () => {
      for (const apt of assigned) {
        try {
          const d = await api.getCallStatus(apt._id)
          if (d.callStatus === 'ringing') {
            setIncomingCall(apt)
            clearInterval(poll)
            return
          }
        } catch {}
      }
    }, 3000)
    return () => clearInterval(poll)
  }, [appointments])

  const requestAppointment = async () => {
    if (!selDay)  return showToast('Select a date', 'error')
    if (!selSlot) return showToast('Select a time slot', 'error')
    const memberId   = triggerMemberId || family?.members?.[0]?.memberId
    const memberName = triggerMemberName || family?.members?.[0]?.name || ''
    setSubmitting(true)
    try {
      await api.requestAppointment({
        memberId, memberName,
        healthConditions: triggerConditions,
        requestedDate: selDay.toISOString(),
        requestedSlot: selSlot,
      })
      showToast('Appointment requested ✓', 'success')
      setSelDay(null); setSelSlot(null)
      loadAppointments()
    } catch (e) { showToast(e.message, 'error') }
    finally { setSubmitting(false) }
  }

  const cancelApt = async (id) => {
    if (!window.confirm('Cancel this appointment?')) return
    try {
      await api.cancelAppointment(id)
      showToast('Cancelled', 'success')
      loadAppointments()
    } catch (e) { showToast(e.message, 'error') }
  }

  if (incomingCall) {
    return <IncomingCallOverlay appointment={incomingCall} onEnd={() => { setIncomingCall(null); loadAppointments() }} />
  }

  const STATUS_UI = {
    requested: { label:'Requested', color:'#E65100', bg:'#FFF3E0', icon:'🕐' },
    assigned:  { label:'Assigned',  color:'#1565C0', bg:'#E3F2FD', icon:'👩‍⚕️' },
    completed: { label:'Completed', color:'#2D6A35', bg:'#E8F5E9', icon:'✅' },
    cancelled: { label:'Cancelled', color:'#757575', bg:'#F5F5F5', icon:'✕' },
  }

  const needsBooking = showBooking || (!loading && triggerConditions.length > 0 &&
    !appointments.some(a => ['requested','assigned'].includes(a.status) && a.memberId === triggerMemberId))

  return (
    <div className="page-shell fade-in">
      <div className="top-bar">
        <button className="back-btn" onClick={() => nav(-1)}>←</button>
        <div className="top-bar-title">Nutritionist Consultation</div>
      </div>

      <div className="page-shell-scroll with-nav" style={{ padding:'16px 18px' }}>

        {/* Info banner — only when conditions triggered */}
        {triggerConditions.length > 0 && (
          <div style={{ background:'linear-gradient(135deg,#E8F5E9,#C8E6C9)',borderRadius:14,padding:'16px 18px',marginBottom:16,border:'1.5px solid #A5D6A7' }}>
            <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:8 }}>
              <span style={{ fontSize:24 }}>🩺</span>
              <div style={{ fontWeight:700,fontSize:15,color:'#1A3D20' }}>Why a Consultation?</div>
            </div>
            <div style={{ fontSize:13,color:'#2E7D32',lineHeight:1.6 }}>
              Your health profile includes conditions that need a nutritionist's review before we create your personalized wellness basket.
            </div>
          </div>
        )}

        {triggerConditions.length > 0 && (
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:11,fontWeight:700,color:'var(--text-light)',textTransform:'uppercase',letterSpacing:0.5,marginBottom:6 }}>
              Conditions Requiring Review
            </div>
            <div style={{ display:'flex',flexWrap:'wrap',gap:6 }}>
              {triggerConditions.map(c => (
                <span key={c} style={{ padding:'5px 12px',borderRadius:20,background:'#FFF3E0',border:'1.5px solid #E65100',color:'#E65100',fontSize:12,fontWeight:600 }}>
                  ⚠ {c}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Booking form */}
        {needsBooking && (
          <div style={{ background:'#fff',borderRadius:14,border:'1.5px solid var(--border)',padding:'16px',marginBottom:16 }}>
            <div style={{ fontWeight:700,fontSize:14,marginBottom:14,color:'var(--text)' }}>📅 Book Your Appointment</div>
            <div style={{ fontSize:11,fontWeight:700,color:'var(--text-mid)',textTransform:'uppercase',letterSpacing:0.5,marginBottom:8 }}>Select Date</div>
            <div style={{ display:'flex',gap:8,overflowX:'auto',paddingBottom:8,marginBottom:14 }}>
              {days.map(d => {
                const sel = selDay?.toDateString() === d.toDateString()
                return (
                  <button key={d.toISOString()} onClick={() => setSelDay(d)}
                    style={{ minWidth:64,padding:'10px 8px',borderRadius:12,border:`2px solid ${sel?'var(--green)':'var(--border)'}`,
                      background:sel?'var(--green)':'#fff',color:sel?'#fff':'var(--text)',cursor:'pointer',flexShrink:0,
                      display:'flex',flexDirection:'column',alignItems:'center',gap:2 }}>
                    <div style={{ fontSize:10,fontWeight:600,opacity:0.7 }}>{d.toLocaleDateString('en',{weekday:'short'})}</div>
                    <div style={{ fontSize:18,fontWeight:700 }}>{d.getDate()}</div>
                    <div style={{ fontSize:9,fontWeight:500,opacity:0.6 }}>{d.toLocaleDateString('en',{month:'short'})}</div>
                  </button>
                )
              })}
            </div>
            <div style={{ fontSize:11,fontWeight:700,color:'var(--text-mid)',textTransform:'uppercase',letterSpacing:0.5,marginBottom:8 }}>Select Time</div>
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginBottom:16 }}>
              {SLOTS.map(s => {
                const sel = selSlot === s
                return (
                  <button key={s} onClick={() => setSelSlot(s)}
                    style={{ padding:'10px 6px',borderRadius:10,border:`1.5px solid ${sel?'var(--green)':'var(--border)'}`,
                      background:sel?'var(--green-pale)':'#fff',color:sel?'var(--green)':'var(--text-mid)',fontSize:12,fontWeight:600,cursor:'pointer' }}>
                    {sel && '✓ '}{s}
                  </button>
                )
              })}
            </div>
            <button className="btn btn-primary" onClick={requestAppointment} disabled={submitting} style={{ width:'100%' }}>
              {submitting ? <span className="spinner" style={{ width:18,height:18,borderWidth:2 }} /> : '📞 Request Appointment'}
            </button>
          </div>
        )}

        {/* Appointments list */}
        <div style={{ fontSize:15,fontWeight:700,marginBottom:10 }}>Your Appointments</div>
        {loading ? (
          <div style={{ textAlign:'center',padding:32 }}><div className="spinner" /></div>
        ) : appointments.length === 0 ? (
          <div style={{ textAlign:'center',padding:'32px 16px',color:'var(--text-light)' }}>
            <div style={{ fontSize:36,marginBottom:8 }}>📋</div>
            <p style={{ fontSize:13 }}>No appointments yet</p>
          </div>
        ) : (
          appointments.map(apt => {
            const ui = STATUS_UI[apt.status] || STATUS_UI.requested
            return (
              <div key={apt._id} style={{ background:'#fff',borderRadius:14,border:'1.5px solid var(--border)',padding:'14px 16px',marginBottom:10 }}>
                <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8 }}>
                  <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                    <span style={{ fontSize:18 }}>{ui.icon}</span>
                    <div>
                      <div style={{ fontWeight:700,fontSize:13 }}>{apt.memberName || 'Member'}</div>
                      <div style={{ fontSize:11,color:'var(--text-light)' }}>
                        {new Date(apt.requestedDate).toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short'})} · {apt.requestedSlot}
                      </div>
                    </div>
                  </div>
                  <span style={{ padding:'4px 10px',borderRadius:20,background:ui.bg,color:ui.color,fontSize:11,fontWeight:700 }}>
                    {ui.label}
                  </span>
                </div>

                {apt.assignedTo && (
                  <div style={{ fontSize:12,color:'var(--text-mid)',marginBottom:6 }}>
                    👩‍⚕️ Assigned to: <b>{apt.assignedTo}</b>
                  </div>
                )}

                {(apt.healthConditions||[]).length > 0 && (
                  <div style={{ display:'flex',flexWrap:'wrap',gap:4,marginBottom:8 }}>
                    {apt.healthConditions.map(c => (
                      <span key={c} style={{ padding:'2px 8px',borderRadius:12,background:'#FFF3E0',color:'#E65100',fontSize:10,fontWeight:600 }}>{c}</span>
                    ))}
                  </div>
                )}

                {apt.status === 'completed' && apt.totalCalories && (
                  <div style={{ background:'var(--green-pale)',borderRadius:10,padding:'10px 14px',marginBottom:8 }}>
                    <div style={{ fontSize:11,fontWeight:700,color:'var(--green)',textTransform:'uppercase',letterSpacing:0.5,marginBottom:6 }}>
                      Nutritionist Recommendation
                    </div>
                    <div style={{ fontSize:13,color:'var(--text)' }}>
                      🔥 <b>{apt.totalCalories} kcal/day</b>
                      {apt.proteinTarget && <span> · 💪 {apt.proteinTarget}g protein</span>}
                    </div>
                    {apt.nutritionistNotes && (
                      <div style={{ fontSize:12,color:'var(--text-mid)',marginTop:6,fontStyle:'italic' }}>"{apt.nutritionistNotes}"</div>
                    )}
                  </div>
                )}

                {['requested','assigned'].includes(apt.status) && (
                  <button onClick={() => cancelApt(apt._id)}
                    style={{ padding:'6px 14px',borderRadius:8,border:'1px solid #FFCDD2',background:'#FFF5F5',
                      color:'var(--red)',fontSize:11,fontWeight:600,cursor:'pointer',marginTop:4 }}>
                    Cancel Appointment
                  </button>
                )}
              </div>
            )
          })
        )}
      </div>
      <BottomNav />
    </div>
  )
}
