import React, { useState, useEffect } from 'react'
import api from '../../utils/api'
import './OwnerVehicleManagement.css'

function OwnerVehicleManagement() {
  const [vehicles, setVehicles] = useState([])
  const [selectedVehicle, setSelectedVehicle] = useState(null)
  const [documents, setDocuments] = useState([])
  const [reminders, setReminders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchVehicles()
  }, [])

  useEffect(() => {
    if (selectedVehicle) {
      fetchVehicleDetails()
    }
  }, [selectedVehicle])

  const fetchVehicles = async () => {
    try {
      const response = await api.get('/owner/vehicles')
      setVehicles(response.data)
      if (response.data.length > 0 && !selectedVehicle) {
        setSelectedVehicle(response.data[0].id)
      }
    } catch (error) {
      console.error('Failed to fetch vehicles:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchVehicleDetails = async () => {
    try {
      const [docsRes, remindersRes] = await Promise.all([
        api.get(`/owner/vehicles/${selectedVehicle}/documents`),
        api.get(`/owner/vehicles/${selectedVehicle}/reminders`)
      ])
      setDocuments(docsRes.data)
      setReminders(remindersRes.data)
    } catch (error) {
      console.error('Failed to fetch vehicle details:', error)
    }
  }

  const handleDocumentUpload = async (e, documentType) => {
    const file = e.target.files[0]
    if (!file) return

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', documentType)
      await api.post(`/owner/vehicles/${selectedVehicle}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      fetchVehicleDetails()
    } catch (error) {
      alert('Failed to upload document')
    }
  }

  const handleAddReminder = async (reminderData) => {
    try {
      await api.post(`/owner/vehicles/${selectedVehicle}/reminders`, reminderData)
      fetchVehicleDetails()
    } catch (error) {
      alert('Failed to add reminder')
    }
  }

  if (loading) {
    return <div className="loading">Loading vehicles...</div>
  }

  return (
    <div className="owner-vehicle-management">
      <div className="management-container">
        <h1>Vehicle Management</h1>

        <div className="management-content">
          <div className="vehicles-sidebar">
            <h2>Your Vehicles</h2>
            {vehicles.length === 0 ? (
              <p className="no-vehicles">No vehicles added yet</p>
            ) : (
              <div className="vehicles-list">
                {vehicles.map(vehicle => (
                  <div
                    key={vehicle.id}
                    className={`vehicle-item ${selectedVehicle === vehicle.id ? 'selected' : ''}`}
                    onClick={() => setSelectedVehicle(vehicle.id)}
                  >
                    <strong>{vehicle.make} {vehicle.model}</strong>
                    <p>{vehicle.year} • {vehicle.licensePlate}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedVehicle && (
            <div className="vehicle-details">
              <h2>Documents & Reminders</h2>

              <div className="documents-section">
                <h3>Documents</h3>
                <div className="documents-grid">
                  {['Registration', 'Insurance', 'License', 'Inspection'].map(docType => (
                    <div key={docType} className="document-card">
                      <h4>{docType}</h4>
                      {documents.find(d => d.type === docType) ? (
                        <div className="document-info">
                          <p>Uploaded: {new Date(documents.find(d => d.type === docType).uploadedAt).toLocaleDateString()}</p>
                          <a
                            href={documents.find(d => d.type === docType).url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="view-document"
                          >
                            View Document
                          </a>
                        </div>
                      ) : (
                        <label className="upload-document">
                          Upload {docType}
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => handleDocumentUpload(e, docType)}
                            style={{ display: 'none' }}
                          />
                        </label>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="reminders-section">
                <h3>Reminders</h3>
                {reminders.length === 0 ? (
                  <p className="no-reminders">No reminders set</p>
                ) : (
                  <div className="reminders-list">
                    {reminders.map(reminder => (
                      <div key={reminder.id} className="reminder-item">
                        <div className="reminder-info">
                          <strong>{reminder.title}</strong>
                          <p>{reminder.description}</p>
                          <p className="reminder-date">
                            Due: {new Date(reminder.dueDate).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`reminder-status ${reminder.completed ? 'completed' : 'pending'}`}>
                          {reminder.completed ? 'Completed' : 'Pending'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default OwnerVehicleManagement




