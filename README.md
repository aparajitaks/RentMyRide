# 🚗 **RentMyRide – Car Rental Platform**

## Quick Setup

```bash
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
npx prisma db push --schema=prisma/app.schema.prisma
```

**Setup environment variables:**

Frontend (`frontend/.env.local`):
```bash
cp frontend/.env.example frontend/.env.local
# Edit .env.local to set VITE_API_URL=http://localhost:5001
```

**Start the application:**

- Backend: `cd backend && npm start` (port 5001)
- Frontend: `cd frontend && npm run dev` (port 3000)

---

## 🚀 Deployment

For Vercel deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md)

Quick deploy:
- Deploy backend first, note the URL
- Set `VITE_API_URL` in frontend Vercel environment variables
- Deploy frontend

---

## 📋 **For Evaluators (Quick Evaluation Setup)**

The `.env` files are configured with working credentials. Simply copy and paste the following into your `.env` files in the root and backend directories:

### **Root `./.env`**
```env
DATABASE_URL="postgresql://neondb_owner:npg_iqFxJjvm62eV@ep-polished-bird-a4gytl44.us-east-1.aws.neon.tech/neondb?sslmode=require"
DATABASE_URL_APP="postgresql://neondb_owner:npg_iqFxJjvm62eV@ep-polished-bird-a4gytl44.us-east-1.aws.neon.tech/neondb?sslmode=require"
```

### **Backend `./backend/.env`**
```env
DATABASE_URL_APP="postgresql://neondb_owner:npg_iqFxJjvm62eV@ep-polished-bird-a4gytl44.us-east-1.aws.neon.tech/neondb?sslmode=require"
JWT_SECRET="rentmyride-secret-key-2025"
PORT=5001
```

After setting up the `.env` files, run the quick setup commands above and start both services. The application will be fully functional.

---

# **Project Requirements and Features**

# **1. Authentication Module**

### **Login Pages**

- Customer Login
- Owner Login
- Terms & Conditions Page (View-only)

# **2. Customer Module**

## **2.1 Home Page**

- Navigation bar
- Quick access to profile, search, bookings
- Featured cities or offers (Optional)

## **2.2 Profile Page**

- Personal details
- Uploaded documents
- Past bookings & travel logs
- Picture uploads for memories
- Rating history (cars they rated)

## **2.3 Search Workflow**

### ➤ **Step 1: Search Bar**

- Search by city → fetch businesses from DB

### ➤ **Step 2: Businesses List Page**

Google-like business list showing:

- Name of rental business
- Rating
- Price range
- Owner name
- Basic details
- Thumbnail image

### ➤ **Step 3: Business Page**

- Business information
- Ratings & Reviews
- Car listing cards
- Pricing & availability
- Optional: Chat section with the business

### ➤ **Step 4: Car Selection Page**

- Car details
- Pricing per day
- Availability calendar

### ➤ **Step 5: Booking Request**

Auto-filled fields from customer profile:

- Customer details
- Pickup location
- Start & end dates
- Additional info
  → Sends booking request to owner

### ➤ **Step 6: After Approval**

- Payment flow begins (integration pending)

## **2.4 Additional Customer Features**

- Rate cars from booking history
- Travel log of places visited
- Upload travel pictures
- Complaint Box (customer → business)

---

# **3. Owner Module**

## **3.1 After Login**

### **Dashboard**

- Notification bar
- Reminders (pending documents, platform notifications)

### **Graphs**

- Line graph showing business growth
- Ratings overview
- Review summary

### **Right Panel**

- Requests grouped as:

  - Pending
  - Active rentals
  - Completed

### **Calendar Page**

- Booked cars displayed using stickers on specific dates

### **List of Available Cars**

- Free cars displayed with status filters

### **Owner Profile**

- Reviews
- Ratings
- Grey areas (warning flags, pending complaints)

### **Customer Profile Viewer**

- Owners can see customer history
- View customer ratings from previous owners

## **3.2 Vehicle Management**

- Upload & manage documents
- Document expiry reminders
- Vehicle status (active / inactive)

## **3.3 Tracking (Optional Feature)**

- Map view
- Enter tracking ID from GPS device
- Show car’s live or last-known location

## **3.4 Complaint Box (Owner → Customer)**

- File complaints
- View complaint status

---

# **4. Complaint Resolution System**

### **Features**

- Complaint Box on both sides
- Types of complaints:

  - Damage
  - Legal fine not paid
  - False charges
  - Overcharging by owner

### **Logic**

- Only users with completed business history can file complaints
- Complaints can be filed only within **5 days**
- Complaints categorized as:

  - Pending
  - Under Review
  - Resolved

- If found non-guilty → complaint removed
- If dispute ongoing → chat history remains longer

---

# **5. Chat Module (Heavy Feature)**

🔧 **Most complex part of mid-sem work**

### **Chat Functionality**

- Customer ↔ Owner chat (like WhatsApp)
- Share photos/videos
- No option to delete or edit messages
- Messages auto-deleted after **15 days**
- If a case/complaint is active → exempt from deletion

### **Archival Job**

- Messages older than **15 days** → moved to `messages_archive`
- Keeps main message table small

---

# **6. Archival Job & Scheduler (Already Implemented)**

### **Manual Archival**

```
npm run archive:run
```

### **Cron Scheduler**

Runs daily at 02:00 UTC:

```
npm run archive:schedule
```

### **Important Settings**

`.env`

```
DATABASE_URL_APP=postgres://...
TZ=UTC
```

---

# **7. Docker Setup**

## **7.1 API-Only Setup**

```
docker compose -f devops/docker-compose.yml up -d db api
```

API Health:

```
http://localhost:5001/api/health
```

## **7.2 Full Stack Setup**

```
docker compose -f devops/docker-compose.yml up -d db api frontend
```

Frontend:

```
http://localhost/
```

## **7.3 Unified Backend+Frontend Image**

```
docker build -f devops/Dockerfile -t rentmyride-unified .
docker run -p 5001:5001 rentmyride-unified
```

## **7.4 Cleanup**

```
docker compose -f devops/docker-compose.yml down
docker compose -f devops/docker-compose.yml down -v   # remove DB data
```

---

# **8. Pre-Push Verification**

```
chmod +x devops/prepush-verify.sh
./devops/prepush-verify.sh
```

Runs:
✓ DB spin-up
✓ Prisma schema push
✓ SQL patches
✓ DB tests
✓ Jest tests
✓ Summary
