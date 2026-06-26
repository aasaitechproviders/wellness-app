import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import BottomNav from '../components/BottomNav'
import logo from '../assets/logo.png'

const SCORE_BREAKDOWN = [
  { label:'Nutrition Balance', icon:'📊', val:18, max:20 },
  { label:'Food Diversity', icon:'🥗', val:17, max:20 },
  { label:'Goal Adherence', icon:'🎯', val:18, max:20 },
  { label:'Family Participation', icon:'👨‍👩‍👧', val:12, max:15 },
  { label:'Fruit Consumption', icon:'🍎', val:9, max:10 },
  { label:'Vegetable Consumption', icon:'🥕', val:9, max:10 },
  { label:'Microgreen Consumption', icon:'🌱', val:8, max:10 },
]

const BADGES = [
  { icon:'🥦', bg:'#E8F5E9', label:'Vegetable\nChampion' },
  { icon:'💧', bg:'#FFEBEE', label:'Iron\nWarrior' },
  { icon:'⭐', bg:'#FFF9C4', label:'Consistency\nStar' },
  { icon:'🌈', bg:'#E1F5FE', label:'Rainbow\nEater' },
]

const RAINBOW = [
  { color:'#388E3C', emoji:'🥦', label:'Green', pct:92 },
  { color:'#E53935', emoji:'🍅', label:'Red', pct:88 },
  { color:'#F57C00', emoji:'🍊', label:'Orange', pct:63 },
  { color:'#7B1FA2', emoji:'🫐', label:'Purple', pct:46 },
  { color:'#9E9E9E', emoji:'🧄', label:'White', pct:79 },
]

const FAMILY_PARTICIPATION = [
  { name:'Priya (You)', pct:85 },
  { name:'Arun (Father)', pct:80 },
  { name:'Myra (Daughter)', pct:60 },
  { name:'Paati (Grandmother)', pct:100 },
]

const WEEKS = [1,2,3,4,5,6,7,8,9,10,11,12]

function ScoreRing({ score=82, size=100 }) {
  const r=40, cx=50, cy=50, circ=2*Math.PI*r
  const fill=circ*(1-score/100)
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#E0E0E0" strokeWidth={8} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--green)" strokeWidth={8}
        strokeDasharray={circ} strokeDashoffset={fill} strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`} />
      <text x={cx} y={cy-4} textAnchor="middle" fontSize={20} fontWeight="700" fill="var(--green-dark)">{score}</text>
      <text x={cx} y={cy+10} textAnchor="middle" fontSize={9} fill="#888">/100</text>
    </svg>
  )
}

export default function WellnessProgress() {
  const { family } = useAuth()
  const nav = useNavigate()
  const name = family?.members?.[0]?.name?.split(' ')?.[0] || family?.familyName?.split(' ')?.[0] || 'Priya'
  const hour = new Date().getHours()
  const greeting = hour<12?'Good Morning':hour<17?'Good Afternoon':'Good Evening'

  return (
    <div className="page-shell fade-in">
      {/* Header */}
      <div style={{ background:'var(--white)',padding:'14px 18px 12px',display:'flex',alignItems:'center',gap:10,borderBottom:'1px solid var(--border)',flexShrink:0 }}>
        <button className="back-btn" onClick={()=>nav('/home')}>←</button>
        <img src={logo} alt="KP" style={{ width:28,height:28,objectFit:'contain',borderRadius:8 }} />
        <div style={{ fontFamily:'var(--font-head)',fontSize:14,fontWeight:700,color:'var(--green-dark)',flex:1 }}>KRISHA PURE</div>
        <div style={{ display:'flex',alignItems:'center',gap:10 }}>
          <div style={{ position:'relative' }}><span style={{ fontSize:20 }}>🔔</span><span style={{ position:'absolute',top:-3,right:-3,background:'var(--red)',color:'#fff',fontSize:8,fontWeight:700,width:14,height:14,borderRadius:7,display:'flex',alignItems:'center',justifyContent:'center' }}>2</span></div>
          <div style={{ width:32,height:32,borderRadius:50,background:'var(--green)',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700 }}>PK</div>
        </div>
      </div>

      <div className="page-shell-scroll with-nav" style={{ padding:'0 0 16px' }}>
        {/* Greeting */}
        <div style={{ padding:'16px 18px 0' }}>
          <div style={{ fontSize:14,color:'var(--text-mid)' }}>{greeting}, {name}! 👋</div>
          <div style={{ fontFamily:'var(--font-head)',fontSize:20,fontWeight:700,lineHeight:1.3 }}>Here's your family wellness progress</div>
        </div>

        {/* Two-column layout */}
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,padding:'14px 18px' }}>

          {/* LEFT COLUMN */}
          <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
            {/* Wellness Score big card */}
            <div className="card" style={{ background:'var(--white)' }}>
              <div style={{ fontSize:10,fontWeight:700,letterSpacing:0.8,textTransform:'uppercase',color:'var(--text-light)',marginBottom:4 }}>KRISHA WELLNESS SCORE™</div>
              <div style={{ display:'flex',alignItems:'center',gap:12 }}>
                <div>
                  <div style={{ fontFamily:'var(--font-head)',fontSize:36,fontWeight:700,lineHeight:1 }}>82<span style={{ fontSize:16,fontWeight:500,color:'var(--text-light)' }}>/100</span></div>
                  <div style={{ display:'flex',gap:2,marginTop:4 }}>{'★★★★☆'.split('').map((s,i)=><span key={i} style={{ fontSize:14,color:s==='★'?'#FFD700':'#E0E0E0' }}>{s}</span>)}</div>
                  <div style={{ fontSize:13,fontWeight:700,color:'var(--green)',marginTop:4 }}>Excellent Progress</div>
                  <div style={{ fontSize:11,color:'var(--text-light)' }}>Keep it up! You're doing great.</div>
                </div>
                <ScoreRing score={82} size={80} />
              </div>
            </div>

            {/* Active program */}
            <div style={{ background:'#FFF0F5',borderRadius:14,padding:'12px',border:'1px solid #FFCDD2' }}>
              <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:8 }}>
                <div style={{ width:32,height:32,borderRadius:'50%',background:'linear-gradient(135deg,#E91E63,#FF5722)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14 }}>💧</div>
                <div>
                  <div style={{ fontSize:12,fontWeight:700 }}>Iron Support Program</div>
                  <div style={{ fontSize:10,color:'var(--text-light)' }}>3 of 12 weeks completed</div>
                </div>
              </div>
              <div className="progress-bar" style={{ marginBottom:4 }}>
                <div className="progress-fill" style={{ width:'25%' }} />
              </div>
              <div style={{ fontSize:10,fontWeight:700,color:'var(--green)',textAlign:'right' }}>25%</div>
              <div style={{ display:'flex',alignItems:'center',gap:6,marginTop:8,padding:'8px 10px',background:'rgba(255,255,255,0.7)',borderRadius:10,cursor:'pointer' }}>
                <span style={{ fontSize:12 }}>📅</span>
                <span style={{ fontSize:11,fontWeight:600 }}>Next Delivery: Tomorrow, 8 AM - 10 AM</span>
                <span style={{ marginLeft:'auto',fontSize:14,color:'var(--text-light)' }}>›</span>
              </div>
            </div>

            {/* Today's Highlights */}
            <div className="card">
              <div style={{ fontSize:13,fontWeight:700,marginBottom:10 }}>Today's Highlights</div>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:8 }}>
                {[{icon:'🔥',label:'Streak',val:'27',sub:'Days',note:'Keep it going!'},{icon:'🥗',label:'Diet Variety',val:'24',sub:'Categories',note:'On Track ✅'},{icon:'🌿',label:'Activity Score',val:'88',sub:'/100',note:'Excellent'},{icon:'🎯',label:'Goal Adherence',val:'89%',sub:'',note:'On Track ✅'}].map((h,i)=>(
                  <div key={i} style={{ background:'#FAFAFA',borderRadius:10,padding:'10px 8px' }}>
                    <div style={{ fontSize:18,marginBottom:3 }}>{h.icon}</div>
                    <div style={{ fontSize:10,color:'var(--text-light)',fontWeight:600 }}>{h.label}</div>
                    <div style={{ fontSize:20,fontWeight:700,lineHeight:1.2 }}>{h.val}<span style={{ fontSize:11,fontWeight:400,color:'var(--text-light)' }}>{h.sub}</span></div>
                    <div style={{ fontSize:10,color:'var(--green)',fontWeight:600,marginTop:2 }}>{h.note}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Nutrition Rainbow */}
            <div className="card">
              <div style={{ fontSize:13,fontWeight:700,marginBottom:10 }}>Nutrition Rainbow – This Week</div>
              <div style={{ display:'flex',gap:4,justifyContent:'space-between' }}>
                {RAINBOW.map(r=>(
                  <div key={r.label} className="rainbow-dot">
                    <div className="rainbow-circle" style={{ background:r.color+'22' }}>{r.emoji}</div>
                    <div style={{ fontSize:9,fontWeight:700,color:r.color }}>{r.label}</div>
                    <div style={{ fontSize:9,color:'var(--text-light)' }}>{r.pct}%</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Wellness tip */}
            <div style={{ background:'var(--green-pale)',borderRadius:14,padding:'12px',display:'flex',alignItems:'center',gap:10,cursor:'pointer' }}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:12,fontWeight:700,color:'var(--green)',marginBottom:4 }}>Wellness Tip of the Day</div>
                <div style={{ fontSize:11,color:'var(--text-mid)',lineHeight:1.5 }}>Include microgreens rich in iron, calcium and antioxidants. Great choice! 🌿</div>
              </div>
              <div style={{ fontSize:32 }}>›</div>
            </div>

            {/* Badges */}
            <div className="card">
              <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12 }}>
                <div style={{ fontSize:13,fontWeight:700 }}>Badges Earned</div>
                <span style={{ fontSize:12,fontWeight:600,color:'var(--green)',cursor:'pointer' }}>View All</span>
              </div>
              <div style={{ display:'flex',gap:8,justifyContent:'space-between' }}>
                {BADGES.map(b=>(
                  <div key={b.label} className="badge-tile">
                    <div className="badge-icon" style={{ background:b.bg }}>{b.icon}</div>
                    <div style={{ fontSize:9,fontWeight:600,color:'var(--text-mid)',textAlign:'center',whiteSpace:'pre-line',lineHeight:1.3 }}>{b.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Monthly report */}
            <div className="card">
              <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10 }}>
                <div style={{ fontSize:13,fontWeight:700 }}>Monthly Wellness Report</div>
                <select className="kp-select" style={{ width:'auto',fontSize:11,padding:'4px 24px 4px 8px' }}>
                  <option>June 2024</option><option>May 2024</option>
                </select>
              </div>
              <div style={{ fontSize:12,fontWeight:700,color:'var(--green)',marginBottom:8 }}>June Highlights</div>
              {[['🥦','42','Different Vegetables Consumed'],['🍎','18','Different Fruits Consumed'],['🌱','6','Microgreens Grown'],['💧','100%','Hydration Consistency'],['🏆','82','Wellness Score This Month']].map(([ic,val,lb])=>(
                <div key={lb} style={{ display:'flex',alignItems:'center',gap:8,marginBottom:6 }}>
                  <span style={{ fontSize:14 }}>{ic}</span>
                  <span style={{ fontSize:15,fontWeight:700,color:'var(--green)',minWidth:40 }}>{val}</span>
                  <span style={{ fontSize:11,color:'var(--text-mid)' }}>{lb}</span>
                </div>
              ))}
              <button className="btn btn-primary" style={{ marginTop:10,fontSize:13 }}>⬇ Download Report</button>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
            {/* My Progress card */}
            <div className="card">
              <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10 }}>
                <div style={{ fontSize:13,fontWeight:700 }}>My Progress</div>
                <span style={{ fontSize:14 }}>ℹ️</span>
              </div>
              <div style={{ fontSize:9,fontWeight:700,letterSpacing:0.6,textTransform:'uppercase',color:'var(--text-light)',marginBottom:4 }}>KRISHA WELLNESS SCORE™</div>
              <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:10 }}>
                <div>
                  <div style={{ fontSize:28,fontWeight:700,fontFamily:'var(--font-head)',lineHeight:1 }}>82<span style={{ fontSize:13,color:'var(--text-light)',fontWeight:400 }}>/100</span></div>
                  <div style={{ fontSize:11,fontWeight:700,color:'var(--green)' }}>Excellent Progress</div>
                </div>
                <ScoreRing score={82} size={60} />
              </div>
              <button style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:6,width:'100%',padding:'8px',borderRadius:10,border:'1.5px solid var(--border)',background:'var(--white)',fontSize:12,fontWeight:700,cursor:'pointer' }}>
                Score Breakdown ›
              </button>
            </div>

            {/* Score breakdown */}
            <div className="card">
              <div style={{ fontSize:13,fontWeight:700,marginBottom:4 }}>Score Breakdown</div>
              <div style={{ fontSize:11,color:'var(--text-light)',marginBottom:12 }}>This score is calculated based on your wellness journey</div>
              {SCORE_BREAKDOWN.map(s=>(
                <div key={s.label} className="score-row">
                  <span style={{ fontSize:14,flexShrink:0 }}>{s.icon}</span>
                  <span className="score-row-label">{s.label}</span>
                  <div style={{ flex:2 }}>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width:`${(s.val/s.max)*100}%` }} />
                    </div>
                  </div>
                  <span className="score-row-val">{s.val}/{s.max}</span>
                </div>
              ))}
            </div>

            {/* Program weeks */}
            <div style={{ background:'#FFF0F5',borderRadius:14,padding:'12px',border:'1px solid #FFCDD2' }}>
              <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:8 }}>
                <div style={{ width:28,height:28,borderRadius:'50%',background:'linear-gradient(135deg,#E91E63,#FF5722)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12 }}>💧</div>
                <div>
                  <div style={{ fontSize:12,fontWeight:700 }}>Iron Support Program</div>
                  <div style={{ fontSize:10,color:'var(--text-light)' }}>3 of 12 weeks completed</div>
                </div>
              </div>
              <div className="progress-bar" style={{ marginBottom:6 }}>
                <div className="progress-fill" style={{ width:'25%' }} />
              </div>
              <div style={{ display:'flex',gap:4,flexWrap:'wrap',marginBottom:6 }}>
                {WEEKS.map(w=>(
                  <div key={w} style={{ width:22,height:22,borderRadius:'50%',background:w<=3?'var(--green)':'var(--border)',color:w<=3?'#fff':'var(--text-light)',fontSize:9,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center' }}>{w}</div>
                ))}
              </div>
              <div style={{ fontSize:10,color:'var(--text-light)' }}>Program End Date: 20 Aug 2024</div>
            </div>

            {/* Family Participation */}
            <div className="card">
              <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12 }}>
                <div style={{ fontSize:13,fontWeight:700 }}>Family Participation</div>
                <span style={{ fontSize:12,fontWeight:600,color:'var(--green)',cursor:'pointer' }}>View all ›</span>
              </div>
              {FAMILY_PARTICIPATION.map((m,i)=>(
                <div key={m.name} style={{ marginBottom:10 }}>
                  <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:3 }}>
                    <span style={{ fontSize:12,color:'var(--text-mid)' }}>{m.name}</span>
                    <span style={{ fontSize:12,fontWeight:700 }}>{m.pct}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width:`${m.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Bar chart */}
            <div className="card">
              <div style={{ display:'flex',gap:16,alignItems:'flex-end',justifyContent:'center',height:90 }}>
                {[{label:'Nutrition',may:74,jun:82},{label:'Activity',may:68,jun:88},{label:'Sleep',may:72,jun:80},{label:'Hydration',may:85,jun:100},{label:'Overall',may:72,jun:82}].map(d=>(
                  <div key={d.label} style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:4,flex:1 }}>
                    <div style={{ display:'flex',gap:3,alignItems:'flex-end',height:60 }}>
                      <div style={{ width:10,background:'#C8E6C9',borderRadius:'3px 3px 0 0',height:`${(d.may/100)*60}px` }} />
                      <div style={{ width:10,background:'var(--green)',borderRadius:'3px 3px 0 0',height:`${(d.jun/100)*60}px` }} />
                    </div>
                    <div style={{ fontSize:8,color:'var(--text-light)',textAlign:'center' }}>{d.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ display:'flex',gap:12,justifyContent:'center',marginTop:8 }}>
                <div style={{ display:'flex',alignItems:'center',gap:4 }}><div style={{ width:10,height:10,background:'#C8E6C9',borderRadius:2 }}/><span style={{ fontSize:10,color:'var(--text-light)' }}>May</span></div>
                <div style={{ display:'flex',alignItems:'center',gap:4 }}><div style={{ width:10,height:10,background:'var(--green)',borderRadius:2 }}/><span style={{ fontSize:10,color:'var(--text-light)' }}>June</span></div>
              </div>
            </div>

            <button className="btn btn-ghost" style={{ fontSize:13 }}>📤 Share Report</button>
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
