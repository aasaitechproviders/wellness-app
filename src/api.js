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

  // Products (replaces old ingredients)
  getProducts:     (params) => req('GET', `/products${params ? '?' + new URLSearchParams(params) : ''}`),
  getProduct:      (id)     => req('GET', `/products/${id}`),
  // Alias — some components still call getIngredients
  getIngredients:  (params) => req('GET', `/products${params ? '?' + new URLSearchParams(params) : ''}`),
  getIngredient:   (id)     => req('GET', `/products/${id}`),

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
  // Setup data — new kp_* collections
  getActivityLevels:   () => req('GET', '/setup/activity-levels'),
  getPlanTypes:        () => req('GET', '/setup/plan-types'),
  getLifestyleCodes:   () => req('GET', '/setup/lifestyle-codes'),
  getHealthConditions: () => req('GET', '/setup/health-conditions'),
  getAllergies:         () => req('GET', '/setup/allergies'),
  getMetRanges:        () => req('GET', '/setup/met-ranges'),
  getBmiRules:         () => req('GET', '/setup/bmi-rules'),
  getWellnessGoals:    () => req('GET', '/wellness/goals'),
  getApartments: (city) => req('GET', `/delivery/apartments${city ? `?city=${city}` : ''}`),
  getSlots: (apartmentId) => req('GET', `/delivery/slots/${apartmentId}`),
  scheduleDelivery: (body) => req('POST', '/delivery/schedule', body),

  // Appointments
  checkClinicalReview: (body) => req('POST', '/appointments/check', body),
  requestAppointment: (body) => req('POST', '/appointments/request', body),
  getMyAppointments: () => req('GET', '/appointments/mine'),
  getAppointment: (id) => req('GET', `/appointments/${id}`),
  cancelAppointment: (id) => req('PUT', `/appointments/${id}/cancel`),
  getCallStatus: (id) => req('GET', `/appointments/${id}/call-status`),
  updateCallStatus: (id, callStatus) => req('PUT', `/appointments/${id}/call-status`, { callStatus }),

  // WebRTC signaling
  sendSignal: (body) => req('POST', '/rtc/signal', body),
  getSignals: (appointmentId) => req('GET', `/rtc/signal/${appointmentId}?from=admin`),

  // Notifications
  getNotifications:  ()     => req('GET', '/notifications'),
  markNotifRead:     (id)   => req('PUT', '/notifications/read', id ? { id } : {}),
}
