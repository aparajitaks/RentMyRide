import React, { useState, useEffect } from 'react'
import api from './utils/api'
import LoginPage from './pages/LoginPage'
import TermsPage from './pages/TermsPage'
import CustomerLayout from './layouts/CustomerLayout'
import OwnerLayout from './layouts/OwnerLayout'
import CustomerHome from './pages/customer/CustomerHome'
import CustomerProfile from './pages/customer/CustomerProfile'
import SearchPage from './pages/customer/SearchPage'
import BusinessListPage from './pages/customer/BusinessListPage'
import BusinessDetailPage from './pages/customer/BusinessDetailPage'
import BookingRequestPage from './pages/customer/BookingRequestPage'
import BookingHistoryPage from './pages/customer/BookingHistoryPage'
import OwnerDashboard from './pages/owner/OwnerDashboard'
import OwnerProfile from './pages/owner/OwnerProfile'
import OwnerCalendar from './pages/owner/OwnerCalendar'
import OwnerCarsList from './pages/owner/OwnerCarsList'
import OwnerVehicleManagement from './pages/owner/OwnerVehicleManagement'
import ComplaintPage from './pages/ComplaintPage'
import './App.css'

// Navigation utility - using location directly (global, not window.location)
export const navigateTo = (path) => {
  location.hash = path
}

export const getCurrentPath = () => {
  const hash = location.hash.slice(1)
  return hash || '/login'
}

function AppRoutes({ user, loading, login, logout, updateUser }) {
  const [currentPath, setCurrentPath] = useState(getCurrentPath())
  const [params, setParams] = useState({})

  useEffect(() => {
    const updatePathAndParams = () => {
      const fullPath = getCurrentPath()
      const pathWithoutQuery = fullPath.split('?')[0]
      setCurrentPath(pathWithoutQuery)
      
      const parts = pathWithoutQuery.split('/').filter(p => p)
      
      // Extract params from path
      const newParams = {}
      
      // Handle /customer/business/:id
      const businessIndex = parts.indexOf('business')
      if (businessIndex !== -1 && parts[businessIndex + 1]) {
        newParams.id = parts[businessIndex + 1]
      }
      
      // Handle /customer/booking/:businessId/:carId
      const bookingIndex = parts.indexOf('booking')
      if (bookingIndex !== -1 && parts[bookingIndex + 1] && parts[bookingIndex + 2]) {
        newParams.businessId = parts[bookingIndex + 1]
        newParams.carId = parts[bookingIndex + 2]
      }
      
      setParams(newParams)
    }

    // Listen to hashchange events for navigation
    const handleHashChange = () => updatePathAndParams()

    addEventListener('hashchange', handleHashChange)
    updatePathAndParams()
    
    return () => {
      removeEventListener('hashchange', handleHashChange)
    }
  }, [])

  useEffect(() => {
    if (!loading) {
      if (!user && currentPath !== '/login' && currentPath !== '/terms') {
        navigateTo('/login')
      } else if (user && currentPath === '/login') {
        navigateTo(user.userType === 'customer' ? '/customer' : '/owner')
      } else if (user && (currentPath === '/' || !currentPath)) {
        navigateTo(user.userType === 'customer' ? '/customer' : '/owner')
      }
    }
  }, [user, loading, currentPath])

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  if (!user && currentPath !== '/login' && currentPath !== '/terms') {
    return null
  }

  // Render pages based on path
  if (currentPath === '/login') {
    return <LoginPage login={login} />
  }

  if (currentPath === '/terms') {
    return <TermsPage />
  }

  // Customer routes
  if (user && user.userType === 'customer') {
    let customerPage = null
    
    if (currentPath === '/customer' || currentPath === '/customer/') {
      customerPage = <CustomerHome user={user} />
    } else if (currentPath === '/customer/profile') {
      customerPage = <CustomerProfile user={user} updateUser={updateUser} />
    } else if (currentPath === '/customer/search') {
      customerPage = <SearchPage />
    } else if (currentPath.startsWith('/customer/businesses')) {
      customerPage = <BusinessListPage />
    } else if (currentPath.startsWith('/customer/business/') && params.id) {
      customerPage = <BusinessDetailPage businessId={params.id} />
    } else if (currentPath.startsWith('/customer/booking/') && params.businessId && params.carId) {
      customerPage = <BookingRequestPage businessId={params.businessId} carId={params.carId} user={user} />
    } else if (currentPath === '/customer/history') {
      customerPage = <BookingHistoryPage />
    } else if (currentPath === '/customer/complaints') {
      customerPage = <ComplaintPage user={user} />
    } else {
      customerPage = <CustomerHome user={user} />
    }

    return <CustomerLayout user={user} logout={logout}>{customerPage}</CustomerLayout>
  }

  // Owner routes
  if (user && user.userType === 'owner') {
    let ownerPage = null
    
    if (currentPath === '/owner' || currentPath === '/owner/') {
      ownerPage = <OwnerDashboard />
    } else if (currentPath === '/owner/profile') {
      ownerPage = <OwnerProfile user={user} updateUser={updateUser} />
    } else if (currentPath === '/owner/calendar') {
      ownerPage = <OwnerCalendar />
    } else if (currentPath === '/owner/cars') {
      ownerPage = <OwnerCarsList />
    } else if (currentPath === '/owner/vehicles') {
      ownerPage = <OwnerVehicleManagement />
    } else if (currentPath === '/owner/complaints') {
      ownerPage = <ComplaintPage user={user} />
    } else {
      ownerPage = <OwnerDashboard />
    }

    return <OwnerLayout user={user} logout={logout}>{ownerPage}</OwnerLayout>
  }

  return null
}

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (e) {
        localStorage.removeItem('user')
      }
    }
    setLoading(false)
  }, [])

  const login = async (email, password, userType) => {
    // Mock credentials for development
    const mockCredentials = {
      customer: {
        email: 'customer@example.com',
        password: 'password123'
      },
      owner: {
        email: 'owner@example.com',
        password: 'password123'
      }
    }

    // Try API first, fall back to mock if it fails
    try {
      const response = await api.post('/auth/login', { email, password, userType })
      const userData = response.data
      setUser(userData)
      localStorage.setItem('user', JSON.stringify(userData))
      localStorage.setItem('token', userData.token)
      return { success: true }
    } catch (error) {
      // Fall back to mock authentication for development
      const mockUser = mockCredentials[userType]
      if (mockUser && email === mockUser.email && password === mockUser.password) {
        const userData = {
          id: userType === 'customer' ? '1' : '2',
          email: email,
          name: userType === 'customer' ? 'John Customer' : 'Jane Owner',
          userType: userType,
          token: `mock-token-${userType}-${Date.now()}`
        }
        setUser(userData)
        localStorage.setItem('user', JSON.stringify(userData))
        localStorage.setItem('token', userData.token)
        return { success: true }
      }
      return { success: false, error: error.response?.data?.message || 'Invalid email or password' }
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('user')
    localStorage.removeItem('token')
  }

  const updateUser = (userData) => {
    setUser(userData)
    localStorage.setItem('user', JSON.stringify(userData))
  }

  return (
    <AppRoutes 
      user={user} 
      loading={loading} 
      login={login} 
      logout={logout} 
      updateUser={updateUser} 
    />
  )
}

export default App


