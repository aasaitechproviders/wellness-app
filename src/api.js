const BASE = 'https://hf7d5uklwbvj2syjjromiyrkxy0mlcqp.lambda-url.ap-southeast-2.on.aws'

const getToken = () => localStorage.getItem('kp_token')

const req = async (method, path, body) => {
  const headers = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json()
  if (!data.success) throw new Error(data.message || 'Request failed')
  return data
}

export const api = {
  // Auth
  login: (phone) => req('POST', '/auth/login', { phone }),
  me: () => req('GET', '/auth/me'),

  // Family
  registerFamily: (body) => req('POST', '/family/register', body),
  getFamily: (id) => req('GET', `/family/${id}`),
  updateFamily: (id, body) => req('PUT', `/family/${id}`, body),
  addMember: (id, body) => req('POST', `/family/${id}/members`, body),
  updateMember: (id, memberId, body) => req('PUT', `/family/${id}/members/${memberId}`, body),
  deleteMember: (id, memberId) => req('DELETE', `/family/${id}/members/${memberId}`),

  // Wellness
  getGoals: () => req('GET', '/wellness/goals'),
  getBaskets: (params) => req('GET', `/wellness/baskets${params ? '?' + new URLSearchParams(params) : ''}`),
  getBasket: (id) => req('GET', `/wellness/baskets/${id}`),
  recommend: (body) => req('POST', '/wellness/recommend', body),

  // Ingredients
  getIngredients: (params) => req('GET', `/ingredients?${new URLSearchParams(params)}`),

  // Subscriptions
  getPlans: () => req('GET', '/subscriptions/plans'),
  subscribe: (body) => req('POST', '/subscriptions', body),
  getSubscriptions: (familyId) => req('GET', `/subscriptions/family/${familyId}`),
  cancelSubscription: (id) => req('PUT', `/subscriptions/${id}/cancel`),

  // Orders
  placeOrder: (body) => req('POST', '/orders', body),
  getOrders: (familyId) => req('GET', `/orders/family/${familyId}`),
  getOrder: (id) => req('GET', `/orders/${id}`),
  cancelOrder: (id) => req('PUT', `/orders/${id}/cancel`),

  // Delivery
  getCities: () => req('GET', '/delivery/cities'),
  getHealthChallenges: () => req('GET', '/delivery/health-challenges'),
  getApartments: (city) => req('GET', `/delivery/apartments${city ? `?city=${city}` : ''}`),
  getSlots: (apartmentId) => req('GET', `/delivery/slots/${apartmentId}`),
  scheduleDelivery: (body) => req('POST', '/delivery/schedule', body),
}
