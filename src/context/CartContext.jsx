import { createContext, useContext, useState, useEffect } from 'react'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem('kp_cart')
      return saved ? JSON.parse(saved) : []
    } catch { return [] }
  })

  // Persist to localStorage on every change
  useEffect(() => {
    try { localStorage.setItem('kp_cart', JSON.stringify(cartItems)) } catch {}
  }, [cartItems])

  const addToCart = (basket) => {
    setCartItems(prev => {
      // If already in cart, don't duplicate — just return as-is
      if (prev.find(b => b._id?.toString() === basket._id?.toString())) return prev
      return [...prev, basket]
    })
  }

  const removeFromCart = (basketId) => {
    setCartItems(prev => prev.filter(b => b._id?.toString() !== basketId?.toString()))
  }

  const updateCartItem = (basketId, updates) => {
    setCartItems(prev => prev.map(b =>
      b._id?.toString() === basketId?.toString() ? { ...b, ...updates } : b
    ))
  }

  const clearCart = () => setCartItems([])

  const isInCart = (basketId) =>
    cartItems.some(b => b._id?.toString() === basketId?.toString())

  const cartTotal = cartItems.reduce((sum, b) => sum + (b.price || 0), 0)
  const cartCount = cartItems.length

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, updateCartItem, clearCart, isInCart, cartTotal, cartCount }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)
