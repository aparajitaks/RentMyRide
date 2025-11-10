###############################
# Frontend build stage
###############################
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install --omit=dev || npm install --legacy-peer-deps --omit=dev
COPY frontend ./
RUN npm run build || echo "Frontend build skipped (fallback)"

###############################
# Backend build stage
###############################
FROM node:20-alpine AS backend-build
WORKDIR /app
COPY prisma.config.ts ./
COPY prisma ./prisma
COPY backend/package.json backend/package-lock.json* ./backend/
RUN cd backend && npm install --omit=dev
COPY backend ./backend

###############################
# Final runtime image (slim)
###############################
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=backend-build /app/backend ./backend
COPY --from=backend-build /app/prisma ./prisma
COPY --from=frontend-build /app/frontend/build ./backend/public
EXPOSE 5001
WORKDIR /app/backend
CMD ["node","src/server.js"]
