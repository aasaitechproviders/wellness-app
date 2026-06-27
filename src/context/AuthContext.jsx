import { createContext, useContext, useState, useEffect } from 'react'
import { api } from '../api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [family,  setFamily]  = useState(null)
  const [loading, setLoading] = useState(true)

  // On app start — restore session with full family data via api.me()
  useEffect(() => {
    const token = localStorage.getItem('kp_token')
    if (token) {
      api.me()
        .then(d => setFamily(d.family))
        .catch(() => {
          localStorage.removeItem('kp_token')
          setFamily(null)
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (phone) => {
    const data = await api.login(phone)
    localStorage.setItem('kp_token', data.token)
    // v2.0.0: login now returns full family document directly — no second round trip needed
    setFamily(data.family)
    return data
  }

  const updateFamily = (updated) => {
    if (updated) setFamily(updated)
  }

  const logout = () => {
    localStorage.removeItem('kp_token')
    localStorage.removeItem('kp_cart')
    localStorage.removeItem('kp_phone')
    setFamily(null)
  }

  return (
    <AuthContext.Provider value={{ family, loading, login, logout, updateFamily }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
