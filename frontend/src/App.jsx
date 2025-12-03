import React, { useState, useEffect } from 'react'
import api from './utils/api'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
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
import OwnerAddCar from './pages/owner/OwnerAddCar'
import OwnerEditCar from './pages/owner/OwnerEditCar'
import OwnerCarsList from './pages/owner/OwnerCarsList'
import OwnerVehicleManagement from './pages/owner/OwnerVehicleManagement'
import ComplaintPage from './pages/ComplaintPage'
import './App.css'


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

      
      const newParams = {}

      
      const businessIndex = parts.indexOf('business')
      if (businessIndex !== -1 && parts[businessIndex + 1]) {
        newParams.id = parts[businessIndex + 1]
      }

      
      const bookingIndex = parts.indexOf('booking')
      if (bookingIndex !== -1 && parts[bookingIndex + 1] && parts[bookingIndex + 2]) {
        newParams.businessId = parts[bookingIndex + 1]
        newParams.carId = parts[bookingIndex + 2]
      }

      
      const carsIndex = parts.indexOf('cars')
      if (carsIndex !== -1 && parts[carsIndex + 1] && parts[carsIndex + 2] === 'edit') {
        newParams.carId = parts[carsIndex + 1]
      }

      setParams(newParams)
    }

    
    const handleHashChange = () => updatePathAndParams()

    addEventListener('hashchange', handleHashChange)
    updatePathAndParams()

    return () => {
      removeEventListener('hashchange', handleHashChange)
    }
  }, [])

  useEffect(() => {
    if (!loading) {
      if (!user && currentPath !== '/login' && currentPath !== '/signup' && currentPath !== '/terms') {
        navigateTo('/login')
      } else if (user && (currentPath === '/login' || currentPath === '/signup')) {
        navigateTo(user.userType === 'customer' ? '/customer' : '/owner')
      } else if (user && (currentPath === '/' || !currentPath)) {
        navigateTo(user.userType === 'customer' ? '/customer' : '/owner')
      } else if (user && user.userType !== 'customer' && user.userType !== 'owner') {
        
        logout()
        navigateTo('/login')
      }
    }
  }, [user, loading, currentPath])

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  if (!user && currentPath !== '/login' && currentPath !== '/signup' && currentPath !== '/terms') {
    return <LoginPage login={login} />
  }

  
  if (currentPath === '/login') {
    return <LoginPage login={login} />
  }

  if (currentPath === '/signup') {
    return <SignupPage />
  }

  if (currentPath === '/terms') {
    return <TermsPage />
  }

  
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
    } else if (currentPath === '/owner/cars/new') {
      ownerPage = <OwnerAddCar />
    } else if (currentPath.startsWith('/owner/cars/') && currentPath.endsWith('/edit') && params.carId) {
      ownerPage = <OwnerEditCar carId={params.carId} />
    } else if (currentPath === '/owner/vehicles') {
      ownerPage = <OwnerVehicleManagement />
    } else if (currentPath === '/owner/complaints') {
      ownerPage = <ComplaintPage user={user} />
    } else {
      ownerPage = <OwnerDashboard />
    }

    return <OwnerLayout user={user} logout={logout}>{ownerPage}</OwnerLayout>
  }

  return (
    <div className="error-container" style={{ padding: '50px', textAlign: 'center' }}>
      <h2>Something went wrong</h2>
      <p>We couldn't determine your account type. Please try logging in again.</p>
      <button
        onClick={() => {
          logout()
          navigateTo('/login')
        }}
        style={{
          padding: '10px 20px',
          backgroundColor: '#ff4444',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          marginTop: '20px'
        }}
      >
        Logout & Reset
      </button>
    </div>
  )
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


