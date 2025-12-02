# RentMyRide - Setup Instructions for Evaluators

## 🚀 Quick Start Guide (Recommended)

### Automatic Setup (One Command)

```bash
./setup.sh
```

This script will:
- Create `.env` files with the test database credentials
- Install all dependencies (root, backend, frontend)
- Set up the database schema

Then just start the servers as shown at the end of the script output.

---

## 📝 Manual Setup (Alternative)

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL database (or use the provided Neon.tech database)

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd RentMyRide
   ```

2. **Set up environment variables**
   
   **Option A - Use the provided test database (recommended for evaluation):**
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` and add:
   ```
   DATABASE_URL_APP="postgresql://neondb_owner:npg_iqFxJjvm62eV@ep-polished-bird-a4gytl44.us-east-1.aws.neon.tech/neondb?sslmode=require"
   JWT_SECRET="rentmyride-secret-key-2025"
   PORT=5001
   ```
   
   **Option B - Use your own PostgreSQL database:**
   - Edit `.env` and replace `DATABASE_URL_APP` with your database connection string

3. **Install dependencies**
   ```bash
   npm install
   cd backend && npm install && cd ..
   cd new_frontend3 && npm install && cd ..
   ```

4. **Set up the database**
   ```bash
   npx prisma db push --schema=prisma/app.schema.prisma
   ```

5. **Start the application**
   
   Open 2 terminal windows:
   
   **Terminal 1 - Backend:**
   ```bash
   cd backend
   npm start
   ```
   
   **Terminal 2 - Frontend:**
   ```bash
   cd new_frontend3
   npm run dev
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5001

## Test Credentials

If the database is seeded, you can use these credentials:
- Customer: (add test credentials if available)
- Owner: (add test credentials if available)

## Troubleshooting

- If you get a database connection error, ensure the DATABASE_URL_APP is correct in your `.env` file
- If ports 3000 or 5001 are busy, you can change them in the respective config files

## Project Structure
- `backend/` - Express.js REST API
- `new_frontend3/` - React frontend with Vite
- `prisma/` - Database schema and migrations
- `docs/` - Additional documentation

## For Questions
Contact: [Your Email/Contact Information]
