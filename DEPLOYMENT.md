# RentMyRide Vercel Deployment Guide

## 🚀 Quick Deploy

### Prerequisites
- Vercel account
- PostgreSQL database (Neon recommended)
- Git repository

---

## 📦 Backend Deployment (Vercel)

### 1. Deploy Backend First

```bash
cd backend
vercel
```

### 2. Set Environment Variables in Vercel Dashboard

Go to your backend project settings and add:

```env
DATABASE_URL_APP=postgresql://user:password@host/database?sslmode=require
JWT_SECRET=your-secret-key-here
PORT=5001
NODE_ENV=production
```

### 3. Note Your Backend URL

After deployment, Vercel will provide a URL like:
```
https://rentmyride-backend-xxx.vercel.app
```

---

## 🎨 Frontend Deployment (Vercel)

### 1. Create Local .env File

```bash
cd frontend
cp .env.example .env.local
```

Edit `.env.local`:
```env
VITE_API_URL=http://localhost:5001
```

### 2. Deploy Frontend

```bash
cd frontend
vercel
```

### 3. Set Environment Variables in Vercel Dashboard

Go to your frontend project settings and add:

```env
VITE_API_URL=https://rentmyride-backend-xxx.vercel.app
```

**Important:** Use your actual backend URL from step 1.3

### 4. Redeploy Frontend

After setting environment variables, trigger a new deployment:
```bash
vercel --prod
```

---

## 🏠 Local Development Setup

### 1. Install Dependencies

```bash
# Root dependencies
npm install

# Backend dependencies
cd backend && npm install && cd ..

# Frontend dependencies
cd frontend && npm install && cd ..
```

### 2. Setup Environment Files

**Frontend** (`frontend/.env.local`):
```env
VITE_API_URL=http://localhost:5001
```

**Backend** (`backend/.env`):
```env
DATABASE_URL_APP=postgresql://user:password@host/database
JWT_SECRET=your-secret-key
PORT=5001
```

### 3. Setup Database

```bash
npx prisma db push --schema=prisma/app.schema.prisma
```

### 4. Start Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

- Backend: http://localhost:5001
- Frontend: http://localhost:3000

---

## 🔧 Troubleshooting

### Frontend Can't Connect to Backend

**Symptom:** 404 errors when calling API

**Solution:**
1. Check `VITE_API_URL` in frontend environment variables
2. Restart frontend dev server after changing `.env.local`
3. Verify backend is running and accessible

### Vercel Build Fails

**Backend:**
- Ensure `vercel.json` exists in backend folder
- Check that all dependencies are in `package.json`
- Verify Node.js version compatibility

**Frontend:**
- Ensure `vercel.json` exists in frontend folder
- Check build command: `npm run build`
- Verify Vite configuration

### Database Connection Issues

- Verify `DATABASE_URL_APP` is correct
- Check database allows connections from Vercel IPs
- For Neon: ensure SSL mode is enabled

---

## 📁 Project Structure

```
RentMyRide/
├── frontend/
│   ├── vercel.json          # Frontend Vercel config
│   ├── .env.example         # Environment template
│   └── src/utils/api.js     # API client (uses VITE_API_URL)
├── backend/
│   ├── vercel.json          # Backend Vercel config
│   └── src/server.js        # Express server
└── prisma/
    └── app.schema.prisma    # Database schema
```

---

## 🌐 Environment Variables Reference

### Frontend (Vite)
| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `http://localhost:5001` (local)<br>`https://api.vercel.app` (prod) |

### Backend (Node.js)
| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL_APP` | PostgreSQL connection | `postgresql://user:pass@host/db` |
| `JWT_SECRET` | JWT signing key | `your-secret-key-2025` |
| `PORT` | Server port | `5001` |
| `NODE_ENV` | Environment | `development` or `production` |

---

## ✅ Deployment Checklist

- [ ] Backend deployed to Vercel
- [ ] Backend environment variables set
- [ ] Backend URL noted
- [ ] Frontend environment variable updated with backend URL
- [ ] Frontend deployed to Vercel
- [ ] Test login/signup functionality
- [ ] Test API endpoints
- [ ] Verify database connectivity

---

## 🔗 Useful Commands

```bash
# Deploy to production
vercel --prod

# View deployment logs
vercel logs

# List deployments
vercel ls

# Remove deployment
vercel rm [deployment-url]
```
