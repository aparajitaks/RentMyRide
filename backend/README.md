# RentMyRide Backend API

Backend API server for the RentMyRide car rental platform.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

3. Update the `.env` file with your database connection string and JWT secret.

4. Make sure your Prisma schema is up to date:
```bash
cd ..
npx prisma generate --schema=prisma/app.schema.prisma
```

5. Run database migrations (if needed):
```bash
cd ..
npx prisma migrate dev --schema=prisma/app.schema.prisma
```

## Running the Server

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will run on `http://localhost:5001` by default.

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user (requires auth)

### Customer Endpoints (requires authentication + CUSTOMER role)
- `GET /api/customer/profile` - Get customer profile
- `PUT /api/customer/profile` - Update customer profile
- `GET /api/customer/bookings` - Get customer bookings
- `GET /api/customer/travel-log` - Get travel logs

### Owner Endpoints (requires authentication + OWNER role)
- `GET /api/owner/profile` - Get owner profile
- `PUT /api/owner/profile` - Update owner profile
- `GET /api/owner/profile/stats` - Get profile statistics
- `GET /api/owner/dashboard/stats` - Get dashboard statistics
- `GET /api/owner/dashboard/growth` - Get growth data
- `GET /api/owner/requests` - Get booking requests
- `POST /api/owner/requests/:id/approve` - Approve booking request
- `POST /api/owner/requests/:id/reject` - Reject booking request
- `GET /api/owner/calendar/bookings` - Get calendar bookings
- `GET /api/owner/cars` - Get owner's cars
- `POST /api/owner/cars` - Create new car
- `PUT /api/owner/cars/:id` - Update car
- `DELETE /api/owner/cars/:id` - Delete car
- `GET /api/owner/reviews` - Get reviews
- `GET /api/owner/vehicles` - Get vehicles
- `GET /api/owner/vehicles/:id/documents` - Get vehicle documents
- `POST /api/owner/vehicles/:id/documents` - Upload vehicle document
- `GET /api/owner/vehicles/:id/reminders` - Get vehicle reminders
- `POST /api/owner/vehicles/:id/reminders` - Create vehicle reminder
- `GET /api/owner/notifications` - Get notifications

### Business Endpoints (public)
- `GET /api/businesses/search?city=...` - Search businesses by city
- `GET /api/businesses/:id` - Get business details
- `GET /api/businesses/:id/cars` - Get business cars
- `GET /api/businesses/:id/reviews` - Get business reviews

### Booking Endpoints (requires authentication)
- `POST /api/bookings/request` - Create booking request
- `GET /api/bookings/:id` - Get booking details
- `POST /api/bookings/:id/payment` - Process payment

### Car Endpoints (requires authentication)
- `GET /api/cars/:id` - Get car details

### Complaint Endpoints (requires authentication)
- `GET /api/customer/complaints` - Get customer complaints
- `POST /api/customer/complaints` - File customer complaint
- `GET /api/owner/complaints` - Get owner complaints
- `POST /api/owner/complaints` - File owner complaint

## Authentication

All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <token>
```

Tokens are obtained via the `/api/auth/login` endpoint and are valid for 7 days.

## Error Handling

The API returns standard HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

Error responses follow this format:
```json
{
  "message": "Error message here"
}
```

