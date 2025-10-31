# RentMyRide Frontend

Vite + React (JavaScript) frontend for the car rental platform.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

The app will run on `http://localhost:3000`

## Features

- JWT-based authentication
- Role-based access control (User & Business)
- Protected routes
- Login page with role selection

## Project Structure

```
src/
  ├── components/
  │   └── ProtectedRoute.jsx    # Route protection component
  ├── context/
  │   └── AuthContext.jsx       # Authentication context
  ├── pages/
  │   ├── Login.jsx              # Login page
  │   ├── UserDashboard.jsx     # User dashboard
  │   └── BusinessDashboard.jsx # Business dashboard
  ├── App.jsx                    # Main app component with routes
  └── main.jsx                   # Entry point
```

## API Integration

The frontend expects a backend API at `http://localhost:5000/api/auth` with:

- `POST /api/auth/login` - Login endpoint
- `GET /api/auth/me` - Get current user profile

## Backend Requirements

Your backend should:
1. Accept POST requests to `/api/auth/login` with:
   ```json
   {
     "email": "user@example.com",
     "password": "password123",
     "role": "user" // or "business"
   }
   ```

2. Return response:
   ```json
   {
     "token": "jwt_token_here",
     "user": {
       "id": "user_id",
       "email": "user@example.com",
       "role": "user",
       "name": "User Name"
     }
   }
   ```

3. Accept GET requests to `/api/auth/me` with `Authorization: Bearer <token>` header

