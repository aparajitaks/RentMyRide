# Backend Setup Guide

## Quick Start

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` and add your:
   - `DATABASE_URL_APP` - PostgreSQL connection string
   - `JWT_SECRET` - Secret key for JWT tokens (use a strong random string in production)
   - `PORT` - Server port (default: 5001)

3. **Generate Prisma Client:**
   ```bash
   cd ..
   npx prisma generate --schema=prisma/app.schema.prisma
   ```

4. **Run database migrations (if needed):**
   ```bash
   npx prisma migrate dev --schema=prisma/app.schema.prisma
   ```
   This will create the new `Complaint` and `Reminder` tables.

5. **Start the server:**
   ```bash
   cd backend
   npm run dev
   ```

The server will be running on `http://localhost:5001`

## Testing the API

You can test the health endpoint:
```bash
curl http://localhost:5001/health
```

## Database Schema Updates

The backend includes two new models that were added to the Prisma schema:
- **Complaint** - For customer and owner complaints
- **Reminder** - For vehicle maintenance reminders

Make sure to run migrations to create these tables in your database.

## Notes

- The backend uses ES modules (`type: "module"` in package.json)
- Authentication uses JWT tokens (7-day expiration)
- File uploads are stored in the `uploads/` directory (configure cloud storage for production)
- The Prisma client is imported from `../../../prisma-client-app/index.js`

## Production Considerations

1. Use a strong `JWT_SECRET` in production
2. Set up proper file storage (AWS S3, Cloudinary, etc.) instead of local `uploads/` directory
3. Enable HTTPS
4. Set up proper CORS configuration
5. Add rate limiting
6. Set up logging and monitoring
7. Use environment-specific database connections

