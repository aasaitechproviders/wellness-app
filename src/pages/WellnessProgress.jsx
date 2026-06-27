import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import BottomNav from '../components/BottomNav'
import logo from '../assets/logo.png'

/* ── Static mock data (replace with real API when available) ── */
const BREAKDOWN = [
  {label:'Nutrition Balance',     emoji:'📊',val:18,max:20},
  {label:'Food Diversity',        emoji:'🥗',val:17,max:20},
  {label:'Goal Adherence',        emoji:'🎯',val:18,max:20},
  {label:'Family Participation',  emoji:'👨‍👩‍👧',val:12,max:15},
  {label:'Fruit Consumption',     emoji:'🍎',val:9, max:10},
  {label:'Vegetable Consumption', emoji:'🥕',val:9, max:10},
  {label:'Microgreen Consumption',emoji:'🌱',val:8, max:10},
]
const BADGES = [
  {emoji:'🥦',bg:'#E8F5E9',label:'Vegetable Champion'},
  {emoji:'💧',bg:'#FFEBEE',label:'Iron Warrior'},
  {emoji:'⭐',bg:'#FFF9C4',label:'Consistency Star'},
  {emoji:'🌈',bg:'#E1F5FE',label:'Rainbow Eater'},
]
const RAINBOW = [
  {color:'#388E3C',emoji:'🥦',label:'Green', pct:92},
  {color:'#E53935',emoji:'🍅',label:'Red',   pct:88},
  {color:'#F57C00',emoji:'🍊',label:'Orange',pct:63},
  {color:'#7B1FA2',emoji:'🫐',label:'Purple',pct:46},
  {color:'#757575',emoji:'🧄',label:'White', pct:79},
]
const FAMILY_PART = [
  {name:'Priya (You)',        pct:85},
  {name:'Arun (Father)',      pct:80},
  {name:'Myra (Daughter)',    pct:60},
  {name:'Paati (Grandmother)',pct:100},
]
const CHART_DATA = [
  {label:'Nutrition',may:74,jun:82},
  {label:'Activity', may:68,jun:88},
  {label:'Sleep',    may:72,jun:80},
  {label:'Hydration',may:85,jun:100},
  {label:'Overall',  may:72,jun:82},
]

/* ── Score ring SVG ── */
function Ring({ score=82, size=90 }) {
  const r=38, circ=2*Math.PI*r, off=circ*(1-score/100)
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{flexShrink:0}}>
      <circle cx={50} cy={50} r={r} fill="none" stroke="#E8E8E8" strokeWidth={9}/>
      <circle cx={50} cy={50} r={r} fill="none" stroke="var(--green)" strokeWidth={9}
        strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round"
        transform="rotate(-90 50 50)"/>
      <text x={50} y={55} textAnchor="middle" fontSize={20} fontWeight={700} fill="var(--green-dark)">🌿</text>
    </svg>
  )
}

/* ── Progress bar row ── */
const PRow = ({emoji,label,val,max}) => (
  <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}>
    <span style={{fontSize:16,flexShrink:0}}>{emoji}</span>
    <div style={{flex:1,minWidth:0}}>
      <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
        <span style={{fontSize:12,color:'var(--text-mid)'}}>{label}</span>
        <span style={{fontSize:12,fontWeight:700,color:'var(--text)'}}>{val}/{max}</span>
      </div>
      <div style={{height:5,background:'var(--border)',borderRadius:3,overflow:'hidden'}}>
        <div style={{height:'100%',background:'var(--green)',borderRadius:3,width:`${Math.round(val/max*100)}%`}}/>
      </div>
    </div>
  </div>
)

/* ── Section card ── */
const Card = ({children,style})=><div style={{background:'var(--white)',borderRadius:14,border:'1px solid var(--border)',padding:'14px 16px',boxShadow:'0 1px 4px rgba(0,0,0,0.05)',...style}}>{children}</div>
const STitle = ({children})=><div style={{fontSize:14,fontWeight:700,marginBottom:10,color:'var(--text)'}}>{children}</div>

export default function WellnessProgress() {
  const {family} = useAuth()
  const nav = useNavigate()
  const name = family?.members?.[0]?.name?.split(' ')?.[0] || family?.familyName?.split('-')?.[0] || 'Priya'
  const h = new Date().getHours()
  const greet = h<12?'Good Morning':h<17?'Good Afternoon':'Good Evening'

  return (
    <div className="page-shell fade-in">
      {/* ── Header ── */}
      <div style={{background:'var(--white)',padding:'13px 18px 11px',display:'flex',alignItems:'center',justifyContent:'space-between',borderBottom:'1px solid var(--border)',flexShrink:0}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <button onClick={()=>nav(-1)} style={{width:34,height:34,borderRadius:'50%',background:'var(--green-pale)',border:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,cursor:'pointer'}}>←</button>
          <img src={logo} alt="KP" style={{width:28,height:28,objectFit:'contain',borderRadius:8}}/>
          <span style={{fontFamily:'var(--font-serif)',fontSize:14,fontWeight:700,color:'var(--green-dark)'}}>KRISHA PURE</span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{position:'relative',cursor:'pointer'}}>
            <span style={{fontSize:22}}>🔔</span>
            <span style={{position:'absolute',top:-4,right:-4,background:'var(--red)',color:'#fff',fontSize:8,fontWeight:700,width:15,height:15,borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center'}}>2</span>
          </div>
          <div style={{width:34,height:34,borderRadius:'50%',background:'var(--green)',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,cursor:'pointer'}} onClick={()=>nav('/profile')}>
            PK
          </div>
        </div>
      </div>

      {/* ── Single column scrollable content ── */}
      <div className="page-shell-scroll with-nav" style={{padding:'0'}}>

        {/* Greeting */}
        <div style={{padding:'16px 18px 12px',background:'var(--cream)'}}>
          <div style={{fontSize:14,color:'var(--text-mid)',marginBottom:3}}>{greet}, {name}! 👋</div>
          <div style={{fontFamily:'var(--font-serif)',fontSize:20,fontWeight:700,lineHeight:1.3}}>Here's your family wellness progress</div>
        </div>

        <div style={{display:'flex',flexDirection:'column',gap:12,padding:'0 16px 16px'}}>

          {/* ── Wellness Score ── */}
          <Card>
            <div style={{fontSize:10,fontWeight:700,letterSpacing:0.8,textTransform:'uppercase',color:'var(--text-light)',marginBottom:8}}>KRISHA WELLNESS SCORE™</div>
            <div style={{display:'flex',alignItems:'center',gap:16}}>
              <div style={{flex:1}}>
                <div style={{fontFamily:'var(--font-serif)',fontSize:42,fontWeight:700,lineHeight:1,color:'var(--text)'}}>
                  82<span style={{fontSize:18,fontWeight:400,color:'var(--text-light)'}}>/100</span>
                </div>
                <div style={{display:'flex',gap:2,margin:'6px 0'}}>
                  {'★★★★☆'.split('').map((s,i)=><span key={i} style={{fontSize:16,color:s==='★'?'#FFD700':'#E0E0E0'}}>{s}</span>)}
                </div>
                <div style={{fontSize:14,fontWeight:700,color:'var(--green)'}}>Excellent Progress</div>
                <div style={{fontSize:12,color:'var(--text-light)',marginTop:2}}>Keep it up! You're doing great.</div>
              </div>
              <Ring score={82} size={90}/>
            </div>
          </Card>

          {/* ── Score Breakdown ── */}
          <Card>
            <STitle>Score Breakdown</STitle>
            <div style={{fontSize:12,color:'var(--text-light)',marginBottom:12}}>This score is calculated based on your wellness journey</div>
            {BREAKDOWN.map(s=><PRow key={s.label} {...s}/>)}
          </Card>

          {/* ── Iron Support Program ── */}
          <div style={{background:'#FFF0F5',borderRadius:14,padding:'14px',border:'1px solid #FFCDD2'}}>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}>
              <div style={{width:36,height:36,borderRadius:'50%',background:'linear-gradient(135deg,#E91E63,#FF5722)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0}}>💧</div>
              <div>
                <div style={{fontSize:14,fontWeight:700}}>Iron Support Program</div>
                <div style={{fontSize:12,color:'var(--text-light)'}}>3 of 12 weeks completed</div>
              </div>
              <div style={{marginLeft:'auto',fontSize:13,fontWeight:700,color:'var(--green)'}}>25%</div>
            </div>
            <div style={{height:6,background:'rgba(0,0,0,0.08)',borderRadius:3,overflow:'hidden',marginBottom:10}}>
              <div style={{height:'100%',background:'var(--green)',borderRadius:3,width:'25%'}}/>
            </div>
            {/* Week dots */}
            <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:10}}>
              {Array.from({length:12},(_,i)=>(
                <div key={i} style={{width:28,height:28,borderRadius:'50%',background:i<3?'var(--green)':'rgba(0,0,0,0.1)',color:i<3?'#fff':'var(--text-light)',fontSize:11,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center'}}>{i+1}</div>
              ))}
            </div>
            <div style={{fontSize:11,color:'var(--text-light)',marginBottom:10}}>Program End Date: 20 Aug 2024</div>
            <div style={{display:'flex',alignItems:'center',gap:8,padding:'8px 10px',background:'rgba(255,255,255,0.75)',borderRadius:10,cursor:'pointer'}}>
              <span style={{fontSize:13}}>📅</span>
              <span style={{fontSize:12,fontWeight:600}}>Next Delivery: Tomorrow, 8 AM - 10 AM</span>
              <span style={{marginLeft:'auto',fontSize:14}}>›</span>
            </div>
          </div>

          {/* ── Today's Highlights ── */}
          <Card>
            <STitle>Today's Highlights</STitle>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              {[{e:'🔥',l:'Streak',    v:'27',s:'Days',       n:'Keep it going!'},
                {e:'🥗',l:'Diet Variety',v:'24',s:'Categories',n:'On Track ✅'},
                {e:'🌿',l:'Activity Score',v:'88',s:'/100',  n:'Excellent'},
                {e:'🎯',l:'Goal Adherence',v:'89%',s:'',     n:'On Track ✅'}
              ].map(h=>(
                <div key={h.l} style={{background:'#FAFAFA',borderRadius:10,padding:'12px 10px'}}>
                  <div style={{fontSize:20,marginBottom:4}}>{h.e}</div>
                  <div style={{fontSize:10,color:'var(--text-light)',fontWeight:600,marginBottom:2}}>{h.l}</div>
                  <div style={{fontSize:22,fontWeight:700,lineHeight:1.1}}>{h.v}<span style={{fontSize:11,fontWeight:400,color:'var(--text-light)'}}>{h.s}</span></div>
                  <div style={{fontSize:11,color:'var(--green)',fontWeight:600,marginTop:3}}>{h.n}</div>
                </div>
              ))}
            </div>
          </Card>

          {/* ── Family Participation ── */}
          <Card>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
              <STitle>Family Participation</STitle>
              <span style={{fontSize:12,fontWeight:600,color:'var(--green)',cursor:'pointer'}}>View all ›</span>
            </div>
            {FAMILY_PART.map(m=>(
              <div key={m.name} style={{marginBottom:10}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                  <span style={{fontSize:13,color:'var(--text-mid)'}}>{m.name}</span>
                  <span style={{fontSize:13,fontWeight:700}}>{m.pct}%</span>
                </div>
                <div style={{height:6,background:'var(--border)',borderRadius:3,overflow:'hidden'}}>
                  <div style={{height:'100%',background:'var(--green)',borderRadius:3,width:`${m.pct}%`}}/>
                </div>
              </div>
            ))}
          </Card>

          {/* ── Nutrition Rainbow ── */}
          <Card>
            <STitle>Nutrition Rainbow – This Week</STitle>
            <div style={{display:'flex',justifyContent:'space-between'}}>
              {RAINBOW.map(r=>(
                <div key={r.label} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4,flex:1}}>
                  <div style={{width:44,height:44,borderRadius:'50%',background:r.color+'22',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20}}>{r.emoji}</div>
                  <div style={{fontSize:11,fontWeight:700,color:r.color}}>{r.label}</div>
                  <div style={{fontSize:11,color:'var(--text-light)'}}>{r.pct}%</div>
                </div>
              ))}
            </div>
          </Card>

          {/* ── Wellness Tip ── */}
          <div style={{background:'var(--green-pale)',borderRadius:14,padding:'14px 16px',display:'flex',alignItems:'center',gap:12,border:'1px solid #C8E6C9',cursor:'pointer'}}>
            <div style={{flex:1}}>
              <div style={{fontSize:13,fontWeight:700,color:'var(--green)',marginBottom:4}}>Wellness Tip of the Day</div>
              <div style={{fontSize:12,color:'var(--text-mid)',lineHeight:1.6}}>Include microgreens rich in iron, calcium and antioxidants. Great choice! 🌿</div>
            </div>
            <span style={{fontSize:20,color:'var(--text-light)',flexShrink:0}}>›</span>
          </div>

          {/* ── Badges ── */}
          <Card>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
              <STitle>Badges Earned</STitle>
              <span style={{fontSize:12,fontWeight:600,color:'var(--green)',cursor:'pointer'}}>View All</span>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10}}>
              {BADGES.map(b=>(
                <div key={b.label} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:6}}>
                  <div style={{width:54,height:54,borderRadius:'50%',background:b.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:24}}>{b.emoji}</div>
                  <div style={{fontSize:10,fontWeight:600,color:'var(--text-mid)',textAlign:'center',lineHeight:1.3}}>{b.label}</div>
                </div>
              ))}
            </div>
          </Card>

          {/* ── Monthly Report ── */}
          <Card>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
              <STitle>Monthly Wellness Report</STitle>
              <select style={{fontSize:11,border:'1px solid var(--border)',borderRadius:8,padding:'4px 20px 4px 8px',background:'var(--white)',appearance:'none',backgroundImage:"url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",backgroundRepeat:'no-repeat',backgroundPosition:'right 5px center',cursor:'pointer'}}>
                <option>June 2024</option><option>May 2024</option>
              </select>
            </div>
            <div style={{fontSize:13,fontWeight:700,color:'var(--green)',marginBottom:10}}>June Highlights</div>

            {/* Two columns: stats + chart */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
              <div>
                {[['🥦','42','Different Vegetables'],['🍎','18','Different Fruits'],['🌱','6','Microgreens Grown'],['💧','100%','Hydration Consistency'],['🏆','82','Wellness Score']].map(([ic,val,lb])=>(
                  <div key={lb} style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                    <span style={{fontSize:14,flexShrink:0}}>{ic}</span>
                    <span style={{fontSize:15,fontWeight:700,color:'var(--green)',minWidth:36,flexShrink:0}}>{val}</span>
                    <span style={{fontSize:11,color:'var(--text-mid)',lineHeight:1.3}}>{lb}</span>
                  </div>
                ))}
              </div>
              {/* Bar chart */}
              <div>
                <div style={{display:'flex',gap:6,alignItems:'flex-end',height:80,justifyContent:'space-around',marginBottom:6}}>
                  {CHART_DATA.map(d=>(
                    <div key={d.label} style={{display:'flex',gap:3,alignItems:'flex-end'}}>
                      <div style={{width:10,background:'#C8E6C9',borderRadius:'2px 2px 0 0',height:`${Math.round((d.may/100)*72)}px`}}/>
                      <div style={{width:10,background:'var(--green)',borderRadius:'2px 2px 0 0',height:`${Math.round((d.jun/100)*72)}px`}}/>
                    </div>
                  ))}
                </div>
                <div style={{display:'flex',gap:6,alignItems:'flex-end',justifyContent:'space-around',marginBottom:8}}>
                  {CHART_DATA.map(d=><div key={d.label} style={{fontSize:7,color:'var(--text-light)',textAlign:'center',width:20}}>{d.label.split(' ')[0]}</div>)}
                </div>
                <div style={{display:'flex',gap:8,justifyContent:'center'}}>
                  <div style={{display:'flex',alignItems:'center',gap:3}}><div style={{width:8,height:8,background:'#C8E6C9',borderRadius:2}}/><span style={{fontSize:9,color:'var(--text-light)'}}>May</span></div>
                  <div style={{display:'flex',alignItems:'center',gap:3}}><div style={{width:8,height:8,background:'var(--green)',borderRadius:2}}/><span style={{fontSize:9,color:'var(--text-light)'}}>June</span></div>
                </div>
              </div>
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginTop:14}}>
              <button className="btn btn-primary" style={{fontSize:12,padding:'11px'}}>⬇ Download Report</button>
              <button className="btn btn-ghost" style={{fontSize:12,padding:'11px'}}>📤 Share Report</button>
            </div>
          </Card>

        </div>
      </div>
      <BottomNav/>
    </div>
  )
}
