import { useState, useEffect } from 'react'
let _add = null
export function showToast(msg, type='info') { _add?.({ msg, type, id: Date.now() }) }
export default function Toast() {
  const [list, setList] = useState([])
  useEffect(() => { _add = (t) => { setList(p => [...p, t]); setTimeout(() => setList(p => p.filter(x => x.id !== t.id)), 3000) }; return () => { _add = null } }, [])
  if (!list.length) return null
  return (
    <div className="toast-wrap">
      {list.map(t => (
        <div key={t.id} className={`toast ${t.type}`}>
          {t.type==='success'?'✓':t.type==='error'?'✕':'ℹ'} {t.msg}
        </div>
      ))}
    </div>
  )
}
