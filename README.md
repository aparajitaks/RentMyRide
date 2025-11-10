# RentMyRide

Login Page:
Customers
Owners
Terms and Conditions page
Customer Section:
Home Page: (Need to determine content, possibly a nav bar/table)
Profile Page
Search Bar: (Will fetch data of listed businesses in the searched city from our database)
After searching and selecting a city: A list of businesses will appear, similar to Google, with price ranges, ratings, owner name, etc.
After selecting a business: The business page will open with:
Business details
Ratings and reviews
Chat section for that business ❓
Car cards with pricing and availability dates
After selecting a car: Proceed to the booking request page. We will autofill the customer's details from their profile. They will then fill in where they want to get the car and for how long they need it. A complete request will be sent to the business.
After approval (which may take time): The payment system will initiate.
Some more features:
People may rate the cars from their booking history.
A log of places they traveled.
They can also upload their travel pictures.
Owner Section:
After Login:
Notification Bar: Reminding them of important details (e.g., delayed documentation uploads, mostly related to our platform).
Home: With a line graph of their business growth, ratings, and reviews.
Right Panel: A list of requests: pending, actively rented, and done (customer has returned the car, payment and all have been completed).
Calendar Page: Where stickers of cars will be pasted on dates when the cars are booked.
List of cars: Which are free for now.
Their own profile: Reviews, ratings, grey areas, etc.
They can see customer profiles: Who have requested car rental. If customers have bad reviews by businesses.
Map Section: Where they will enter the tracking ID of their tracking device (if any) and can track the vehicle. ❓
Vehicle Section: Where they can manage all vehicle documentations and reminders.
Extra Features We Want to Add:
Complaint Box: On both customer and business profiles, where they can file complaints.
Examples: If a customer has caused damage, or may have been legally fined and didn't pay the price, or anything similar. Customers can file complaints against businesses who have tried to charge extra money or made false claims about cars or damage.
Complaint Resolution: Pending complaints; resolved complaints will be removed if found non-guilty.
Complaint Timeline: You can only file a complaint within 5 days of completing a business transaction.
Complaint Eligibility: This will only work for those who have a history of doing business.
Chat Section:
Mostly like WhatsApp.
We can also share photos and videos of cars.
Cannot delete or edit any kind of message.
Additionally, the chat will remain for 15 days, in case of need of resolving any issue.
If some case is going on between the owner and customer, the chats will remain until resolved.

We have to complete at least 50 % of our Project by mid sem ..

Work heavy stuffs : Chat section
: user - owner approval workflow

## Archive job and scheduler

We automatically archive old chat messages to `messages_archive` to keep the main table lean.

Manual run:

1. Ensure `DATABASE_URL_APP` (or your DB URL) is configured in `.env`.
2. Run:

   - `npm run archive:run`

Daily scheduler (runs at 02:00 UTC by default):

1. Ensure `TZ` is set if you want a specific timezone (default: `UTC`).
2. Run:

   - `npm run archive:schedule`

Notes:

- Scheduler uses `node-cron` and logs start/finish of each run.
- The archival window is messages with `updatedAt <= now() - 15 days`.
- You can change the schedule in `scripts/archive-scheduler.js` (cron expression).

## Environment variables

Create a `.env` file at repo root with at least:

```
DATABASE_URL_APP=postgres://...
TZ=UTC
```

The test suite expects the database to be reachable and schema to be prepared/migrated.

## Docker Usage

We support two deployment modes:

1. API-only (backend + Postgres)
2. Full stack (backend + Postgres + Nginx-served React frontend)

### API-only

Brings up Postgres and the Express API (API serves health + JSON, not static assets unless built multi-stage).

Run:

```
docker compose -f devops/docker-compose.yml up -d db api
```

Health check:

```
curl http://localhost:5001/api/health
```

### Full stack with Nginx frontend

Builds frontend separately using `devops/Dockerfile.frontend` and serves static files + proxies `/api/*` to the backend service.

Run:

```
docker compose -f devops/docker-compose.yml up -d db api frontend
```

Visit the app at:

```
http://localhost/
```

API still available (direct) at:

```
http://localhost:5001/api/health
```

### Multi-stage backend image

`devops/Dockerfile` builds both backend and frontend (placing built assets in `backend/public`) so you can also serve the SPA directly from Express if you prefer fewer containers.

To use that unified image only:

```
docker build -f devops/Dockerfile -t rentmyride-unified .
docker run -p 5001:5001 rentmyride-unified
```

Then open:

```
http://localhost:5001/
```

### Frontend-only image (Nginx)

`devops/Dockerfile.frontend` builds a production React bundle and serves it via Nginx with a SPA fallback and `/api/` proxy pointing to the `api` service.

### Common Environment Variables

Ensure `DATABASE_URL_APP` is set (Compose sets this automatically for the `api` container). For local non-Docker development create `.env`:

```
DATABASE_URL_APP=postgresql://app:app@localhost:5432/rentmyride
PORT=5001
```

### Cleaning Up

Stop all containers:

```
docker compose -f devops/docker-compose.yml down
```

Remove volumes (including database data) if needed:

```
docker compose -f devops/docker-compose.yml down -v
```

### Notes

- Frontend Nginx container depends on backend `api` and will proxy `/api/` paths.
- For production, consider adding caching headers or a CDN in front of the Nginx container.
- Health endpoints: `GET /api/health` (API) and `GET /healthz` (Nginx static) return JSON.

### Pre-push Verification

Run the automated script to validate DB + patches + tests before pushing changes:

```
chmod +x devops/prepush-verify.sh
./devops/prepush-verify.sh
```

It will:

1. Start Postgres via docker compose (db only)
2. Wait for health
3. Push Prisma schema
4. Apply raw SQL patches
5. Run DB test harness (`prisma/db-tests.js`)
6. Execute Jest test suite
7. Print summary and exit

Stop containers afterward (optional):

```
docker compose -f devops/docker-compose.yml down
```
