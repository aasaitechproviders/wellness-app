import { useState, useEffect } from 'react'

let showToastFn = null
export const showToast = (msg, type = 'default') => showToastFn?.(msg, type)

export default function Toast() {
  const [toast, setToast] = useState(null)

  useEffect(() => {
    showToastFn = (msg, type) => {
      setToast({ msg, type })
      setTimeout(() => setToast(null), 3000)
    }
    return () => { showToastFn = null }
  }, [])

  if (!toast) return null
  return <div className={`toast ${toast.type}`}>{toast.msg}</div>
}
