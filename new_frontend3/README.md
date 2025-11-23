# RentMyRide - Car Rental Platform Frontend

A comprehensive React frontend for a car rental platform with separate interfaces for customers and business owners.

## Features

### Customer Features
- **Home Dashboard** - Quick access to all customer features
- **Search & Discovery** - Search for car rental businesses by city
- **Business Listings** - View businesses with ratings, prices, and owner information
- **Business Details** - View available cars, reviews, and business information
- **Booking System** - Request bookings with auto-filled customer details
- **Booking History** - Track all bookings (pending, active, completed)
- **Travel Log** - Record and upload photos from trips
- **Profile Management** - Update personal information and preferences
- **Chat** - WhatsApp-like messaging with business owners
- **Complaints** - File complaints within 5 days of transaction completion

### Owner Features
- **Dashboard** - Business growth charts, ratings, reviews, and request management
- **Notifications** - Important reminders and alerts
- **Calendar View** - Visual calendar showing booked dates
- **Car Management** - Add, edit, and manage vehicle listings
- **Vehicle Tracking** - Track vehicles using tracking device IDs
- **Document Management** - Upload and manage vehicle documents
- **Request Management** - Approve/reject booking requests
- **Customer Profiles** - View customer information and history
- **Chat** - Communicate with customers
- **Complaints** - File and manage complaints

## Tech Stack

- **React 18** - UI library
- **React Router 6** - Client-side routing
- **Vite** - Build tool and dev server
- **Axios** - HTTP client for API calls
- **Recharts** - Charts and graphs for dashboard
- **React Calendar** - Calendar component
- **React Icons** - Icon library
- **Date-fns** - Date manipulation

## Project Structure

```
src/
├── components/          # Reusable components
│   ├── Navbar.jsx
│   └── NotificationBar.jsx
├── contexts/           # React Context providers
│   └── AuthContext.jsx
├── layouts/            # Layout components
│   ├── CustomerLayout.jsx
│   └── OwnerLayout.jsx
├── pages/              # Page components
│   ├── customer/       # Customer pages
│   ├── owner/          # Owner pages
│   ├── ChatPage.jsx
│   ├── ComplaintPage.jsx
│   ├── LoginPage.jsx
│   └── TermsPage.jsx
├── utils/              # Utility functions
│   └── api.js          # API client configuration
├── App.jsx             # Main app component with routing
├── main.jsx            # Entry point
└── index.css           # Global styles
```

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file (if needed) for environment variables:
```
VITE_API_URL=http://localhost:5001/api
```

3. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## API Integration

The frontend expects a backend API running on `http://localhost:5001/api`. The API client is configured in `src/utils/api.js` and automatically:
- Adds authentication tokens to requests
- Handles 401 errors by redirecting to login
- Sets appropriate headers

### Expected API Endpoints

#### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

#### Customer Endpoints
- `GET /api/customer/profile` - Get customer profile
- `PUT /api/customer/profile` - Update profile
- `GET /api/customer/bookings` - Get bookings
- `GET /api/customer/travel-log` - Get travel log
- `POST /api/customer/travel-log/:id/photos` - Upload travel photos
- `GET /api/customer/chat/:businessId/messages` - Get chat messages
- `POST /api/customer/chat/:businessId/send` - Send message
- `GET /api/customer/complaints` - Get complaints
- `POST /api/customer/complaints` - File complaint

#### Owner Endpoints
- `GET /api/owner/profile` - Get owner profile
- `PUT /api/owner/profile` - Update profile
- `GET /api/owner/dashboard/stats` - Get dashboard statistics
- `GET /api/owner/dashboard/growth` - Get growth data
- `GET /api/owner/requests` - Get booking requests
- `POST /api/owner/requests/:id/approve` - Approve request
- `POST /api/owner/requests/:id/reject` - Reject request
- `GET /api/owner/calendar/bookings` - Get calendar bookings
- `GET /api/owner/cars` - Get cars list
- `POST /api/owner/cars` - Add car
- `PUT /api/owner/cars/:id` - Update car
- `DELETE /api/owner/cars/:id` - Delete car
- `GET /api/owner/vehicles/tracking` - Get vehicles with tracking
- `GET /api/owner/vehicles/track/:trackingId` - Track vehicle
- `GET /api/owner/vehicles/:id/documents` - Get documents
- `POST /api/owner/vehicles/:id/documents` - Upload document
- `GET /api/owner/chat/:customerId/messages` - Get chat messages
- `POST /api/owner/chat/:customerId/send` - Send message
- `GET /api/owner/complaints` - Get complaints
- `POST /api/owner/complaints` - File complaint
- `GET /api/owner/notifications` - Get notifications

#### Business Endpoints
- `GET /api/businesses/search?city=...` - Search businesses
- `GET /api/businesses/:id` - Get business details
- `GET /api/businesses/:id/cars` - Get business cars
- `GET /api/businesses/:id/reviews` - Get business reviews

#### Booking Endpoints
- `POST /api/bookings/request` - Create booking request
- `GET /api/bookings/:id` - Get booking details
- `POST /api/bookings/:id/payment` - Process payment

## Key Features Implementation

### Chat System
- Real-time-like messaging (polling every 2 seconds)
- Support for text, images, and videos
- Messages cannot be edited or deleted
- 15-day retention period (or until disputes resolved)
- WhatsApp-like UI design

### Complaint System
- Can only file complaints within 5 days of transaction completion
- Separate complaint types for customers and owners
- Status tracking: pending, investigating, resolved, dismissed
- Resolution notes visible to users

### Booking Workflow
1. Customer searches for businesses by city
2. Views business details and available cars
3. Selects a car and fills booking request
4. Owner receives notification and can approve/reject
5. Upon approval, customer proceeds to payment
6. Booking becomes active
7. After completion, customer can rate and review

### Authentication
- Role-based access (customer/owner)
- Protected routes based on user type
- Token-based authentication
- Automatic logout on 401 errors

## Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory, ready to be served by a static file server or integrated with your backend.

## Development Notes

- The frontend uses Vite's proxy configuration to forward `/api` requests to the backend
- All API calls are centralized in `src/utils/api.js`
- Authentication state is managed via React Context (`AuthContext`)
- Responsive design with mobile-friendly layouts
- Modern UI with clean, professional styling

## Next Steps

1. Connect to your backend API
2. Implement WebSocket for real-time chat (currently using polling)
3. Add image upload handling for car photos
4. Implement payment gateway integration
5. Add email notifications
6. Implement advanced search filters
7. Add map integration for vehicle tracking

## License

This project is part of an academic project.




