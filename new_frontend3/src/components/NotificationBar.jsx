import React, { useState, useEffect } from 'react'
import api from '../utils/api'
import './NotificationBar.css'

function NotificationBar() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/owner/notifications')
      setNotifications(response.data)
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return null

  if (notifications.length === 0) return null

  return (
    <div className="notification-bar">
      <div className="notification-bar-content">
        <h3>Important Notifications</h3>
        <ul>
          {notifications.map(notif => (
            <li key={notif.id} className={notif.priority}>
              {notif.message}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default NotificationBar




