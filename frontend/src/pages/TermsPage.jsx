import React from 'react'
import { navigateTo } from '../App'
import './TermsPage.css'

function TermsPage() {
  const handleLinkClick = (e, path) => {
    e.preventDefault()
    navigateTo(path)
  }
  return (
    <div className="terms-page">
      <div className="terms-container">
        <h1>Terms and Conditions</h1>
        
        <div className="terms-content">
          <section>
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing and using RentMyRide, you accept and agree to be bound by the terms
              and provision of this agreement.
            </p>
          </section>

          <section>
            <h2>2. User Responsibilities</h2>
            <p>
              Users are responsible for maintaining the confidentiality of their account credentials
              and for all activities that occur under their account.
            </p>
          </section>

          <section>
            <h2>3. Rental Agreement</h2>
            <p>
              All car rentals are subject to a separate rental agreement between the customer and
              the car owner. RentMyRide acts as a platform facilitator only.
            </p>
          </section>

          <section>
            <h2>4. Payment Terms</h2>
            <p>
              Payment will be processed only after the owner approves the booking request.
              All payments are final unless otherwise specified in the rental agreement.
            </p>
          </section>

          <section>
            <h2>5. Vehicle Condition</h2>
            <p>
              Customers are responsible for returning the vehicle in the same condition as received.
              Any damage or excessive wear will be charged to the customer.
            </p>
          </section>

          <section>
            <h2>6. Complaints and Disputes</h2>
            <p>
              Complaints must be filed within 5 days of completing a business transaction.
              RentMyRide will investigate and resolve disputes in accordance with our policies.
            </p>
          </section>

          <section>
            <h2>7. Data Privacy</h2>
            <p>
              We collect and process personal data in accordance with our Privacy Policy.
              Chat messages are retained for 15 days or until disputes are resolved.
            </p>
          </section>

          <section>
            <h2>8. Limitation of Liability</h2>
            <p>
              RentMyRide is not liable for any damages, losses, or injuries resulting from the use
              of vehicles rented through our platform.
            </p>
          </section>
        </div>

        <div className="terms-actions">
          <a href="/login" onClick={(e) => handleLinkClick(e, '/login')} className="back-button">Back to Login</a>
        </div>
      </div>
    </div>
  )
}

export default TermsPage




