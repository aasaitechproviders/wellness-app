import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../api'
import { showToast } from '../components/Toast'
import WellnessBadge from '../components/WellnessBadge'

const EMJ = {
  Spinach:'🥬',Beetroot:'🫐',Broccoli:'🥦',Carrot:'🥕',Cucumber:'🥒',
  Tomato:'🍅',Capsicum:'🫑',Amla:'🟢',Guava:'🍐',Pomegranate:'🍎',
  'Drumstick Leaves':'🌿','Curry leaves':'🌿','Mint leaves':'🌿',
  Apple:'🍎',Banana:'🍌','Green peas':'🫛',
  Vegetable:'🥦','Leafy Vegetables':'🥬',Fruits:'🍎',default:'🥗',
}

export default function Recommend() {
  const { state }  = useLocation()
  const { family } = useAuth()
  const nav        = useNavigate()
  const [result,  setResult]  = useState(state?.result || null)
  const [catalog, setCatalog] = useState({})  // name → ingredient
  const [loading, setLoading] = useState(!state?.result)

  useEffect(() => {
    // Load catalog for badges
    api.getIngredients({ limit:141, page:1 }).then(d => {
      const m = {}; (d.ingredients||[]).forEach(x => { m[x.name] = x }); setCatalog(m)
    }).catch(() => {})

    if (!result && family?._id) {
      api.getFamily(family._id).then(d => {
        const m = (d.family?.members||[]).filter(x => x.wellnessGoals?.length)
        if (m.length) return api.recommend({ members:m })
        return null
      }).then(d => { if (d) setResult(d.recommendation) })
        .catch(e => showToast(e.message, 'error'))
        .finally(() => setLoading(false))
    }
  }, [])

  if (loading) return (
    <div className="page-full center" style={{ minHeight:'100dvh', flexDirection:'column', gap:14 }}>
      <div className="spinner" style={{ width:44, height:44 }}/>
      <p>Building your wellness basket...</p>
    </div>
  )

  if (!result) return (
    <div className="page-full center" style={{ minHeight:'100dvh', flexDirection:'column', gap:14, padding:24, textAlign:'center' }}>
      <div style={{ fontSize:52 }}>🎯</div>
      <h2>No Goals Set</h2><p>Set wellness goals first</p>
      <button className="btn btn-primary" onClick={() => nav('/goals')} style={{ width:180 }}>Set Goals →</button>
    </div>
  )

  return (
    <div className="page-full fade-in" style={{ minHeight:'100dvh', background:'var(--cream)', paddingBottom:90 }}>
      <div className="top-bar">
        <button className="back-btn" onClick={() => nav(-1)}>←</button>
        <div className="top-bar-title">Recommended for You</div>
      </div>

      <div style={{ padding:'10px 18px 4px' }}>
        <p style={{ fontSize:13, color:'var(--text-light)' }}>Based on your goals</p>
      </div>

      <div style={{ padding:'8px 18px', display:'flex', flexDirection:'column', gap:14 }}>

        {/* Goals covered chips */}
        {result.goalsCovered?.length > 0 && (
          <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
            {result.goalsCovered.map(g => (
              <span key={g.goalId} style={{ background:'var(--green)', color:'#fff', padding:'4px 12px', borderRadius:50, fontSize:11, fontWeight:600 }}>
                ✓ {g.goalName}
              </span>
            ))}
          </div>
        )}

        {/* Basket cards */}
        {result.baskets?.map(b => (
          <div key={b._id} style={{ background:'#fff', borderRadius:16, border:'1px solid var(--border)', overflow:'hidden' }}>
            {/* Visual */}
            <div style={{ width:'100%', height:110, background:'linear-gradient(135deg,#EBF5EC,#B8DDB8)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:54 }}>🧺</div>

            <div style={{ padding:'14px 16px' }}>
              <div style={{ fontSize:10, color:'var(--green)', fontWeight:700, letterSpacing:0.5, marginBottom:3, textTransform:'uppercase' }}>
                {b.wellnessGoal || 'Wellness Basket'}
              </div>
              <div style={{ fontFamily:'Playfair Display,serif', fontSize:17, fontWeight:700, marginBottom:3 }}>{b.basketName}</div>
              <div style={{ fontSize:12, color:'var(--text-light)', marginBottom:10 }}>{b.description}</div>

              {/* Target nutrient badges */}
              {b.targetNutrients?.length > 0 && (
                <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginBottom:10 }}>
                  {b.targetNutrients.map(n => (
                    <span key={n} style={{ background:'var(--green-pale)', color:'var(--green)', padding:'3px 9px', borderRadius:50, fontSize:11, fontWeight:600 }}>✓ {n}</span>
                  ))}
                </div>
              )}

              <div style={{ fontSize:11, color:'var(--text-light)', marginBottom:5 }}>Includes</div>

              {/* Ingredient pills with badges */}
              <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:12 }}>
                {b.ingredientNames?.slice(0, 5).map(name => {
                  const ing = catalog[name]
                  return (
                    <div key={name} style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ fontSize:14 }}>{EMJ[name] || '🥗'}</span>
                      <span style={{ fontSize:13, fontWeight:500, flex:1 }}>{name}</span>
                      {ing && <WellnessBadge ingredient={ing} max={1} size="sm" />}
                    </div>
                  )
                })}
                {b.ingredientNames?.length > 5 && (
                  <div style={{ fontSize:12, color:'var(--text-light)', paddingLeft:22 }}>
                    + {b.ingredientNames.length - 5} more items
                  </div>
                )}
              </div>

              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div style={{ fontFamily:'Playfair Display,serif', fontSize:22, fontWeight:700, color:'var(--green)' }}>₹{b.price}</div>
                <button className="btn btn-primary btn-sm" style={{ width:'auto', padding:'10px 20px', borderRadius:50 }}
                  onClick={() => nav('/plans', { state:{ basket:b } })}>
                  Add to Cart →
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Top ingredients with badges */}
        {result.ingredients?.length > 0 && (
          <>
            <div style={{ fontFamily:'Playfair Display,serif', fontSize:16, fontWeight:600, marginTop:4 }}>Top Picks For You</div>
            <div style={{ background:'#fff', borderRadius:16, border:'1px solid var(--border)', padding:'0 16px' }}>
              {result.ingredients.slice(0, 8).map((ing, i) => {
                const catIng = catalog[ing.name] || ing
                return (
                  <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:12, padding:'12px 0', borderBottom: i < 7 ? '1px solid var(--border)' : 'none' }}>
                    <div style={{ width:44, height:44, background:'var(--green-pale)', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>
                      {EMJ[ing.name] || '🥗'}
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:600, fontSize:14, marginBottom:3 }}>{ing.name}</div>
                      <WellnessBadge ingredient={catIng} max={2} size="sm" />
                    </div>
                    <div style={{ textAlign:'right', flexShrink:0 }}>
                      <div style={{ fontWeight:700, color:'var(--green)', fontSize:13 }}>{ing.wellnessScore}</div>
                      <div style={{ fontSize:10, color:'var(--text-light)' }}>wellness score</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      <div style={{ position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)', width:'100%', maxWidth:430, padding:'12px 18px 26px', background:'#fff', borderTop:'1px solid var(--border)' }}>
        <button className="btn btn-primary" onClick={() => nav('/plans', { state:{ result } })}>
          Choose Subscription Plan →
        </button>
      </div>
    </div>
  )
}
