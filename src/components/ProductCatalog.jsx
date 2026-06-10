// ProductCatalog — bottom sheet / full screen to browse all ingredients
// Used inside BasketDetail to let users add anything beyond their plan

import { useState, useEffect, useRef } from 'react'
import { api } from '../api'
import WellnessBadge from './WellnessBadge'

const EMJ = {
  Vegetable:'🥦','Leafy Vegetables':'🥬', Fruits:'🍎', default:'🥗',
}
const CATS = ['All','Vegetable','Leafy Vegetables','Fruits']

const PRICE_100G = {
  Spinach:8,Beetroot:6,Broccoli:18,Carrot:7,Cucumber:5,Tomato:6,Capsicum:14,
  Amla:10,Guava:8,Pomegranate:20,'Drumstick Leaves':12,Amaranth:10,
  'Sunflower Microgreens':35,'Curry leaves':20,'Mint leaves':15,
  'Coriander leaves':12,'Bitter gourd':10,'Methi leaves':12,
  Apple:20,Papaya:8,Mango:12,Banana:5,'Green peas':10,'Cluster beans':8,
  'French beans':12,'Bitter Gourd':10,'Raw papaya':8,'Drumstick':8,
  default:10,
}
export function calcItemPrice(name, grams) {
  const p = PRICE_100G[name] || PRICE_100G.default
  return Math.max(5, Math.round((p * grams) / 100))
}

const BASE_W = {
  Spinach:250,Beetroot:300,'Drumstick Leaves':100,Amaranth:200,Amla:200,
  'Sunflower Microgreens':50,Broccoli:200,Carrot:300,Cucumber:300,
  Tomato:250,Capsicum:200,'Bitter gourd':200,'Curry leaves':50,
  'Mint leaves':100,Guava:250,Pomegranate:250,Apple:200,Banana:200,
  'Green peas':200,'Cluster beans':200,'Methi leaves':100,default:200,
}
export function baseWeight(name) { return BASE_W[name] || BASE_W.default }

export default function ProductCatalog({ visible, onClose, onAdd, addedNames = [] }) {
  const [ings, setIngs]   = useState([])
  const [all, setAll]     = useState([])
  const [cat, setCat]     = useState('All')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const ref = useRef(null)

  useEffect(() => {
    if (!visible) return
    if (all.length) { setLoading(false); return }
    // Load all pages
    loadAll()
  }, [visible])

  const loadAll = async () => {
    try {
      const d = await api.getIngredients({ limit: 141, page: 1 })
      setAll(d.ingredients || [])
      setIngs(d.ingredients || [])
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => {
    let list = all
    if (cat !== 'All')  list = list.filter(x => x.category === cat)
    if (search.trim())  list = list.filter(x => x.name.toLowerCase().includes(search.toLowerCase()))
    setIngs(list)
  }, [cat, search, all])

  if (!visible) return null

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:200 }} />

      {/* Sheet */}
      <div ref={ref} style={{
        position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)',
        width:'100%', maxWidth:'430px',
        height:'80dvh', background:'#fff',
        borderRadius:'24px 24px 0 0', zIndex:201,
        display:'flex', flexDirection:'column',
        animation:'sheetUp 0.3s ease',
      }}>
        {/* Handle */}
        <div style={{ display:'flex', justifyContent:'center', paddingTop:12, flexShrink:0 }}>
          <div style={{ width:40, height:4, borderRadius:2, background:'#DDD' }} />
        </div>

        {/* Header */}
        <div style={{ padding:'10px 18px 0', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
            <div>
              <div style={{ fontFamily:'Playfair Display,serif', fontSize:17, fontWeight:700 }}>Browse Ingredients</div>
              <div style={{ fontSize:12, color:'var(--text-light)', marginTop:2 }}>Add any produce to your basket</div>
            </div>
            <button onClick={onClose} style={{ width:32, height:32, borderRadius:'50%', background:'var(--cream)', border:'1px solid var(--border)', cursor:'pointer', fontSize:16 }}>✕</button>
          </div>

          {/* Search */}
          <input
            style={{ width:'100%', padding:'11px 14px', border:'1.5px solid var(--border)', borderRadius:10, fontFamily:'DM Sans,sans-serif', fontSize:14, outline:'none', marginBottom:10, background:'var(--cream)' }}
            placeholder="🔍  Search ingredients..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />

          {/* Category tabs */}
          <div style={{ display:'flex', gap:6, overflowX:'auto', paddingBottom:10 }}>
            {CATS.map(c => (
              <button key={c} onClick={() => setCat(c)} style={{
                flexShrink:0, padding:'6px 14px', borderRadius:50,
                border:`1.5px solid ${cat===c?'var(--green)':'var(--border)'}`,
                background: cat===c ? 'var(--green)' : '#fff',
                color: cat===c ? '#fff' : 'var(--text)',
                fontFamily:'DM Sans,sans-serif', fontSize:12, fontWeight:600, cursor:'pointer',
              }}>{c}</button>
            ))}
          </div>
        </div>

        {/* List */}
        <div style={{ flex:1, overflowY:'auto', padding:'0 18px 24px' }}>
          {loading ? (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:120 }}>
              <div className="spinner" style={{ width:32, height:32 }} />
            </div>
          ) : ings.length === 0 ? (
            <div style={{ textAlign:'center', padding:'32px 0', color:'var(--text-light)' }}>No ingredients found</div>
          ) : ings.map(ing => {
            const w    = baseWeight(ing.name)
            const price = calcItemPrice(ing.name, w)
            const added = addedNames.includes(ing.name)
            const emoji = EMJ[ing.category] || EMJ.default

            return (
              <div key={ing._id} style={{
                display:'flex', alignItems:'center', gap:12,
                padding:'12px 0', borderBottom:'1px solid var(--border)',
              }}>
                {/* Icon */}
                <div style={{ width:50, height:50, background:'var(--green-pale)', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, flexShrink:0 }}>
                  {emoji}
                </div>

                {/* Info */}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:700, fontSize:14 }}>{ing.name}</div>
                  <div style={{ fontSize:11, color:'var(--text-light)', marginTop:1, marginBottom:4 }}>
                    {w}g · ₹{price}
                    {ing.glycemic?.gi && <span style={{ marginLeft:6, background:'#F1F8E9', color:'#33691E', padding:'1px 6px', borderRadius:50, fontSize:10, fontWeight:600 }}>GI {ing.glycemic.gi}</span>}
                    {ing.nutrition?.calories && <span style={{ marginLeft:4, color:'var(--text-light)' }}>· {ing.nutrition.calories} kcal</span>}
                  </div>
                  <WellnessBadge ingredient={ing} max={2} size="sm" />
                </div>

                {/* Add button */}
                <button onClick={() => !added && onAdd(ing)} style={{
                  flexShrink:0,
                  width:34, height:34, borderRadius:'50%',
                  border: added ? '1.5px solid var(--green-muted)' : '1.5px solid var(--green)',
                  background: added ? 'var(--green-pale)' : 'var(--green)',
                  color: added ? 'var(--green)' : '#fff',
                  fontSize:18, cursor: added ? 'default' : 'pointer',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontWeight:700, transition:'all 0.15s',
                }}>
                  {added ? '✓' : '+'}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      <style>{`@keyframes sheetUp{from{transform:translateX(-50%) translateY(100%)}to{transform:translateX(-50%) translateY(0)}}`}</style>
    </>
  )
}
