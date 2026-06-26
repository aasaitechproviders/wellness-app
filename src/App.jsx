import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Toast from './components/Toast'

import Splash          from './pages/Splash'
import Login           from './pages/Login'
import Setup           from './pages/Setup'
import Home            from './pages/Home'
import Goals           from './pages/Goals'
import Recommend       from './pages/Recommend'
import BasketDetail    from './pages/BasketDetail'
import Plans           from './pages/Plans'
import ReviewOrder     from './pages/ReviewOrder'
import Schedule        from './pages/Schedule'
import Confirmed       from './pages/Confirmed'
import { Orders, OrderDetail } from './pages/Orders'
import Profile         from './pages/Profile'
import Cart            from './pages/Cart'
import WellnessProgress from './pages/WellnessProgress'

function Guard({ children }) {
  const { family, loading } = useAuth()
  if (loading) return null
  if (!family) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <div className="app-shell">
      <Toast />
      <Routes>
        <Route path="/"                   element={<Splash />} />
        <Route path="/login"              element={<Login />} />
        <Route path="/setup"              element={<Guard><Setup /></Guard>} />
        <Route path="/home"               element={<Guard><Home /></Guard>} />
        <Route path="/goals"              element={<Guard><Goals /></Guard>} />
        <Route path="/recommend"          element={<Guard><Recommend /></Guard>} />
        <Route path="/basket/:id"         element={<Guard><BasketDetail /></Guard>} />
        <Route path="/basket-detail"      element={<Guard><BasketDetail /></Guard>} />
        <Route path="/plans"              element={<Guard><Plans /></Guard>} />
        <Route path="/review-order"       element={<Guard><ReviewOrder /></Guard>} />
        <Route path="/schedule"           element={<Guard><Schedule /></Guard>} />
        <Route path="/confirmed"          element={<Guard><Confirmed /></Guard>} />
        <Route path="/orders"             element={<Guard><Orders /></Guard>} />
        <Route path="/orders/:id"         element={<Guard><OrderDetail /></Guard>} />
        <Route path="/profile"            element={<Guard><Profile /></Guard>} />
        <Route path="/cart"               element={<Guard><Cart /></Guard>} />
        <Route path="/wellness-progress"  element={<Guard><WellnessProgress /></Guard>} />
        <Route path="*"                   element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}
