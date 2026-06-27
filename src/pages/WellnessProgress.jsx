import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import BottomNav from '../components/BottomNav'
import logo from '../assets/logo.png'

const BREAKDOWN = [
  { label:'Nutrition Balance',     emoji:'📊', val:18, max:20 },
  { label:'Food Diversity',        emoji:'🥗', val:17, max:20 },
  { label:'Goal Adherence',        emoji:'🎯', val:18, max:20 },
  { label:'Family Participation',  emoji:'👨‍👩‍👧', val:12, max:15 },
  { label:'Fruit Consumption',     emoji:'🍎', val:9,  max:10 },
  { label:'Vegetable Consumption', emoji:'🥕', val:9,  max:10 },
  { label:'Microgreen Consumption',emoji:'🌱', val:8,  max:10 },
]
const BADGES = [
  { emoji:'🥦', bg:'#E8F5E9', label:'Vegetable\nChampion' },
  { emoji:'💧', bg:'#FFEBEE', label:'Iron\nWarrior' },
  { emoji:'⭐', bg:'#FFF9C4', label:'Consistency\nStar' },
  { emoji:'🌈', bg:'#E1F5FE', label:'Rainbow\nEater' },
]
const RAINBOW = [
  { color:'#388E3C',emoji:'🥦',label:'Green', pct:92 },
  { color:'#E53935',emoji:'🍅',label:'Red',   pct:88 },
  { color:'#F57C00',emoji:'🍊',label:'Orange',pct:63 },
  { color:'#7B1FA2',emoji:'🫐',label:'Purple',pct:46 },
  { color:'#757575',emoji:'🧄',label:'White', pct:79 },
]
const FAMILY_PART = [
  { name:'Priya (You)',      pct:85 },
  { name:'Arun (Father)',    pct:80 },
  { name:'Myra (Daughter)',  pct:60 },
  { name:'Paati (Grandmother)',pct:100 },
]
const CHART = [
  { label:'Nutrition', may:74, jun:82 },
  { label:'Activity',  may:68, jun:88 },
  { label:'Sleep',     may:72, jun:80 },
  { label:'Hydration', may:85, jun:100},
  { label:'Overall Score',may:72,jun:82 },
]

function Ring({ score=82, size=90 }) {
  const r=38, cx=50, cy=50, circ=2*Math.PI*r, off=circ*(1-score/100)
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#E0E0E0" strokeWidth={9}/>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--green)" strokeWidth={9}
        strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}/>
      {/* Leaf in center */}
      <text x={cx} y={cy+4} textAnchor="middle" fontSize={18}>🌿</text>
    </svg>
  )
}

const pct = (v,m) => `${Math.round(v/m*100)}%`

export default function WellnessProgress() {
  const { family } = useAuth()
  const nav = useNavigate()
  const name = family?.members?.[0]?.name?.split(' ')?.[0] || family?.familyName?.split(' ')?.[0] || 'Priya'
  const h = new Date().getHours()
  const greet = h<12?'Good Morning':h<17?'Good Afternoon':'Good Evening'

  return (
    <div className="page fade-in">
      {/* Header */}
      <div style={{ background:'var(--white)',padding:'13px 18px 11px',display:'flex',alignItems:'center',justifyContent:'space-between',borderBottom:'1px solid var(--border)',flexShrink:0 }}>
        <div style={{ display:'flex',alignItems:'center',gap:10 }}>
          <button onClick={()=>nav('/home')} style={{ width:32,height:32,borderRadius:'50%',background:'var(--green-pale)',border:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:15 }}>←</button>
          <img src={logo} alt="KP" style={{ width:28,height:28,objectFit:'contain',borderRadius:8 }} />
          <span style={{ fontFamily:'var(--font-serif)',fontSize:14,fontWeight:700,color:'var(--green-dark)' }}>KRISHA PURE</span>
        </div>
        <div style={{ display:'flex',alignItems:'center',gap:10 }}>
          <div style={{ position:'relative' }}>
            <span style={{ fontSize:20 }}>🔔</span>
            <span style={{ position:'absolute',top:-4,right:-4,background:'var(--red)',color:'#fff',fontSize:8,fontWeight:700,width:14,height:14,borderRadius:7,display:'flex',alignItems:'center',justifyContent:'center' }}>2</span>
          </div>
          <div style={{ width:32,height:32,borderRadius:'50%',background:'var(--green)',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700 }}>PK</div>
        </div>
      </div>

      <div className="scroll pad-nav">
        {/* Greeting */}
        <div style={{ padding:'14px 16px 10px' }}>
          <div style={{ fontSize:14,color:'var(--text-mid)' }}>{greet}, {name}! 👋</div>
          <div style={{ fontFamily:'var(--font-serif)',fontSize:20,fontWeight:700,lineHeight:1.3 }}>Here's your family wellness progress</div>
        </div>

        {/* Two-column layout */}
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,padding:'0 16px 16px' }}>

          {/* ── LEFT column ── */}
          <div style={{ display:'flex',flexDirection:'column',gap:10 }}>

            {/* Wellness Score card */}
            <div className="card">
              <div style={{ fontSize:9,fontWeight:700,letterSpacing:0.8,textTransform:'uppercase',color:'var(--text-light)',marginBottom:6 }}>KRISHA WELLNESS SCORE™</div>
              <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                <div>
                  <div style={{ fontFamily:'var(--font-serif)',fontSize:34,fontWeight:700,lineHeight:1 }}>82<span style={{ fontSize:14,color:'var(--text-light)',fontWeight:400 }}>/100</span></div>
                  <div style={{ display:'flex',gap:1,margin:'4px 0' }}>
                    {'★★★★☆'.split('').map((s,i)=><span key={i} style={{ fontSize:12,color:s==='★'?'#FFD700':'#E0E0E0' }}>{s}</span>)}
                  </div>
                  <div style={{ fontSize:12,fontWeight:700,color:'var(--green)' }}>Excellent Progress</div>
                  <div style={{ fontSize:10,color:'var(--text-light)',marginTop:1 }}>Keep it up! You're doing great.</div>
                </div>
                <div style={{ flexShrink:0 }}><Ring score={82} size={74} /></div>
              </div>
            </div>

            {/* Iron Support Program */}
            <div style={{ background:'#FFF0F5',borderRadius:14,padding:'12px',border:'1px solid #FFCDD2' }}>
              <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:8 }}>
                <div style={{ width:30,height:30,borderRadius:'50%',background:'linear-gradient(135deg,#E91E63,#FF5722)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13 }}>💧</div>
                <div>
                  <div style={{ fontSize:12,fontWeight:700 }}>Iron Support Program</div>
                  <div style={{ fontSize:10,color:'var(--text-light)' }}>3 of 12 weeks completed</div>
                </div>
              </div>
              <div className="pbar" style={{ marginBottom:3 }}><div className="pfill" style={{ width:'25%' }}/></div>
              <div style={{ fontSize:10,fontWeight:700,color:'var(--green)',textAlign:'right' }}>25%</div>
              <div style={{ display:'flex',alignItems:'center',gap:6,marginTop:8,padding:'7px 10px',background:'rgba(255,255,255,0.75)',borderRadius:8,cursor:'pointer' }}>
                <span style={{ fontSize:11 }}>📅</span>
                <span style={{ fontSize:11,fontWeight:600 }}>Next Delivery: Tomorrow, 8 AM - 10 AM</span>
                <span style={{ marginLeft:'auto',fontSize:12 }}>›</span>
              </div>
            </div>

            {/* Today's Highlights */}
            <div className="card">
              <div style={{ fontSize:13,fontWeight:700,marginBottom:10 }}>Today's Highlights</div>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:8 }}>
                {[{e:'🔥',l:'Streak',v:'27',s:'Days',n:'Keep it going!'},{e:'🥗',l:'Diet Variety',v:'24',s:'Categories',n:'On Track ✅'},{e:'🌿',l:'Activity Score',v:'88',s:'/100',n:'Excellent'},{e:'🎯',l:'Goal Adherence',v:'89%',s:'',n:'On Track ✅'}].map(h=>(
                  <div key={h.l} style={{ background:'#FAFAFA',borderRadius:10,padding:'10px 8px' }}>
                    <div style={{ fontSize:16,marginBottom:3 }}>{h.e}</div>
                    <div style={{ fontSize:10,color:'var(--text-light)',fontWeight:600 }}>{h.l}</div>
                    <div style={{ fontSize:18,fontWeight:700,lineHeight:1.2 }}>{h.v}<span style={{ fontSize:10,fontWeight:400,color:'var(--text-light)' }}>{h.s}</span></div>
                    <div style={{ fontSize:10,color:'var(--green)',fontWeight:600,marginTop:2 }}>{h.n}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Nutrition Rainbow */}
            <div className="card">
              <div style={{ fontSize:12,fontWeight:700,marginBottom:10 }}>Nutrition Rainbow – This Week</div>
              <div style={{ display:'flex',justifyContent:'space-between' }}>
                {RAINBOW.map(r=>(
                  <div key={r.label} style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:3,flex:1 }}>
                    <div style={{ width:34,height:34,borderRadius:'50%',background:r.color+'22',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16 }}>{r.emoji}</div>
                    <div style={{ fontSize:9,fontWeight:700,color:r.color }}>{r.label}</div>
                    <div style={{ fontSize:9,color:'var(--text-light)' }}>{r.pct}%</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Wellness tip */}
            <div style={{ background:'var(--green-pale)',borderRadius:12,padding:'12px',display:'flex',alignItems:'center',gap:10,border:'1px solid #C8E6C9',cursor:'pointer' }}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:11,fontWeight:700,color:'var(--green)',marginBottom:3 }}>Wellness Tip of the Day</div>
                <div style={{ fontSize:11,color:'var(--text-mid)',lineHeight:1.5 }}>Include microgreens rich in iron, calcium and antioxidants. Great choice! 🌿</div>
              </div>
              <div style={{ fontSize:28,flexShrink:0 }}>›</div>
            </div>

            {/* Badges */}
            <div className="card">
              <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10 }}>
                <div style={{ fontSize:12,fontWeight:700 }}>Badges Earned</div>
                <span style={{ fontSize:11,fontWeight:600,color:'var(--green)',cursor:'pointer' }}>View All</span>
              </div>
              <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:6 }}>
                {BADGES.map(b=>(
                  <div key={b.label} style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:4 }}>
                    <div style={{ width:46,height:46,borderRadius:'50%',background:b.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22 }}>{b.emoji}</div>
                    <div style={{ fontSize:9,fontWeight:600,color:'var(--text-mid)',textAlign:'center',whiteSpace:'pre-line',lineHeight:1.3 }}>{b.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Monthly Report */}
            <div className="card">
              <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10 }}>
                <div style={{ fontSize:12,fontWeight:700 }}>Monthly Wellness Report</div>
                <select style={{ fontSize:10,border:'1px solid var(--border)',borderRadius:6,padding:'3px 18px 3px 6px',background:'var(--white)',appearance:'none',backgroundImage:"url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",backgroundRepeat:'no-repeat',backgroundPosition:'right 5px center' }}>
                  <option>June 2024</option><option>May 2024</option>
                </select>
              </div>
              <div style={{ fontSize:11,fontWeight:700,color:'var(--green)',marginBottom:8 }}>June Highlights</div>
              {[['🥦','42','Different Vegetables Consumed'],['🍎','18','Different Fruits Consumed'],['🌱','6','Microgreens Grown'],['💧','100%','Hydration Consistency'],['🏆','82','Wellness Score This Month']].map(([ic,val,lb])=>(
                <div key={lb} style={{ display:'flex',alignItems:'center',gap:8,marginBottom:7 }}>
                  <span style={{ fontSize:13 }}>{ic}</span>
                  <span style={{ fontSize:14,fontWeight:700,color:'var(--green)',minWidth:38 }}>{val}</span>
                  <span style={{ fontSize:10,color:'var(--text-mid)',lineHeight:1.4 }}>{lb}</span>
                </div>
              ))}
              <button className="btn btn-primary" style={{ marginTop:10,fontSize:12,padding:'10px' }}>⬇ Download Report</button>
            </div>
          </div>

          {/* ── RIGHT column ── */}
          <div style={{ display:'flex',flexDirection:'column',gap:10 }}>

            {/* My Progress mini card */}
            <div className="card">
              <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8 }}>
                <span style={{ fontSize:13,fontWeight:700 }}>My Progress</span>
                <span style={{ fontSize:13,color:'var(--text-light)' }}>ℹ️</span>
              </div>
              <div style={{ fontSize:9,fontWeight:700,letterSpacing:0.6,textTransform:'uppercase',color:'var(--text-light)',marginBottom:4 }}>KRISHA WELLNESS SCORE™</div>
              <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:10 }}>
                <div>
                  <div style={{ fontFamily:'var(--font-serif)',fontSize:26,fontWeight:700,lineHeight:1 }}>82<span style={{ fontSize:12,color:'var(--text-light)',fontWeight:400 }}>/100</span></div>
                  <div style={{ fontSize:11,fontWeight:700,color:'var(--green)',marginTop:2 }}>Excellent Progress</div>
                </div>
                <div style={{ marginLeft:'auto' }}><Ring score={82} size={56} /></div>
              </div>
              <button style={{ width:'100%',padding:'8px',borderRadius:10,border:'1.5px solid var(--border)',background:'var(--white)',fontSize:11,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:6 }}>
                Score Breakdown  ›
              </button>
            </div>

            {/* Score Breakdown */}
            <div className="card">
              <div style={{ fontSize:12,fontWeight:700,marginBottom:3 }}>Score Breakdown</div>
              <div style={{ fontSize:10,color:'var(--text-light)',marginBottom:10,lineHeight:1.4 }}>This score is calculated based on your wellness journey</div>
              {BREAKDOWN.map(s=>(
                <div key={s.label} style={{ display:'flex',alignItems:'center',gap:7,marginBottom:9 }}>
                  <span style={{ fontSize:13,flexShrink:0 }}>{s.emoji}</span>
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ fontSize:10,color:'var(--text-mid)',marginBottom:3 }}>{s.label}</div>
                    <div className="pbar"><div className="pfill" style={{ width:pct(s.val,s.max) }}/></div>
                  </div>
                  <span style={{ fontSize:10,fontWeight:700,color:'var(--text)',flexShrink:0,minWidth:28,textAlign:'right' }}>{s.val}/{s.max}</span>
                </div>
              ))}
            </div>

            {/* Program weeks */}
            <div style={{ background:'#FFF0F5',borderRadius:14,padding:'12px',border:'1px solid #FFCDD2' }}>
              <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:8 }}>
                <div style={{ width:28,height:28,borderRadius:'50%',background:'linear-gradient(135deg,#E91E63,#FF5722)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12 }}>💧</div>
                <div>
                  <div style={{ fontSize:11,fontWeight:700 }}>Iron Support Program</div>
                  <div style={{ fontSize:10,color:'var(--text-light)' }}>3 of 12 weeks completed</div>
                </div>
              </div>
              <div className="pbar" style={{ marginBottom:7 }}><div className="pfill" style={{ width:'25%' }}/></div>
              <div style={{ display:'flex',gap:4,flexWrap:'wrap',marginBottom:6 }}>
                {Array.from({length:12},(_,i)=>(
                  <div key={i} style={{ width:20,height:20,borderRadius:'50%',background:i<3?'var(--green)':'var(--border)',color:i<3?'#fff':'var(--text-light)',fontSize:9,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center' }}>{i+1}</div>
                ))}
              </div>
              <div style={{ fontSize:10,color:'var(--text-light)' }}>Program End Date: 20 Aug 2024</div>
            </div>

            {/* Family Participation */}
            <div className="card">
              <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12 }}>
                <span style={{ fontSize:12,fontWeight:700 }}>Family Participation</span>
                <span style={{ fontSize:11,fontWeight:600,color:'var(--green)',cursor:'pointer' }}>View all  ›</span>
              </div>
              {FAMILY_PART.map((m,i)=>(
                <div key={m.name} style={{ marginBottom:i<FAMILY_PART.length-1?10:0 }}>
                  <div style={{ display:'flex',justifyContent:'space-between',marginBottom:3 }}>
                    <span style={{ fontSize:11,color:'var(--text-mid)' }}>{m.name}</span>
                    <span style={{ fontSize:11,fontWeight:700 }}>{m.pct}%</span>
                  </div>
                  <div className="pbar"><div className="pfill" style={{ width:`${m.pct}%` }}/></div>
                </div>
              ))}
            </div>

            {/* Bar chart */}
            <div className="card">
              <div style={{ display:'flex',gap:8,alignItems:'flex-end',justifyContent:'space-around',height:80,marginBottom:8 }}>
                {CHART.map(d=>(
                  <div key={d.label} style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:2,flex:1 }}>
                    <div style={{ display:'flex',gap:2,alignItems:'flex-end' }}>
                      <div style={{ width:8,background:'#C8E6C9',borderRadius:'2px 2px 0 0',height:`${Math.round((d.may/100)*64)}px` }}/>
                      <div style={{ width:8,background:'var(--green)',borderRadius:'2px 2px 0 0',height:`${Math.round((d.jun/100)*64)}px` }}/>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display:'flex',justifyContent:'space-around' }}>
                {CHART.map(d=><div key={d.label} style={{ flex:1,textAlign:'center',fontSize:8,color:'var(--text-light)',lineHeight:1.3 }}>{d.label}</div>)}
              </div>
              <div style={{ display:'flex',gap:10,justifyContent:'center',marginTop:8 }}>
                <div style={{ display:'flex',alignItems:'center',gap:3 }}><div style={{ width:8,height:8,background:'#C8E6C9',borderRadius:2 }}/><span style={{ fontSize:9,color:'var(--text-light)' }}>May</span></div>
                <div style={{ display:'flex',alignItems:'center',gap:3 }}><div style={{ width:8,height:8,background:'var(--green)',borderRadius:2 }}/><span style={{ fontSize:9,color:'var(--text-light)' }}>June</span></div>
              </div>
            </div>

            <button className="btn btn-ghost" style={{ fontSize:12,padding:'10px' }}>📤 Share Report</button>
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
