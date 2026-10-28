# CampusConnect — Full-stack SDC Lab Project

CampusConnect is a responsive React website backed by a Node.js + Express API. For a quick lab demo, the backend persists data in a JSON file (`server/data/db.json`) so you do not need to install/configure MySQL tonight. This is a lightweight demo data store, not a production database.

## Requirements
- Node.js (LTS recommended) and npm
- Internet for remote event images/fonts (optional; the app itself runs locally)

## Setup and run
1. Extract the ZIP and open the `campusconnect` folder in VS Code.
2. Open a terminal in that folder and run:

   ```bash
   npm install
   ```

3. Start the backend in terminal 1:

   ```bash
   npm run server
   ```

   Expected message: `CampusConnect API running at http://localhost:4000`

4. Start the frontend in terminal 2:

   ```bash
   npm run dev
   ```

5. Open the Vite URL shown in terminal (usually `http://localhost:5173`). Keep both terminals running.
6. To check the API, open `http://localhost:4000/api/health`. It should return JSON confirming the API is running.

You can also run both processes together with `npm run dev:full` after `npm install`.

## What is connected to the backend?
- `GET /api/health` — API status check
- `GET /api/student-identity?deviceId=...` — assigns a demo roll number and college ID on the server and reuses them for that browser
- `POST /api/registrations` — validates and saves registration data on the server; rejects duplicate registrations for the same demo student/event
- `GET /api/registrations?deviceId=...` — returns that browser's registrations for My Events
- Data persists in `server/data/db.json` between restarts.

## Main features
- Responsive homepage and event cards
- Live search, category filters, and sorting
- Event details, favourites, and countdown timer
- Registration form with client-side and server-side validation
- Read-only auto-generated roll number and college ID
- Registration confirmation and My Events view backed by the API
- Paid events are labelled demo/unpaid; no real payment is processed

## Important limitations to explain in the lab
- Event cards are sample data currently stored in `src/App.jsx`.
- The generated IDs (`SDC26-0001`, `CC26-0001`) are demo IDs, not official college IDs. Actual identity verification needs college records/authentication.
- The JSON file is used as a small local persistence layer to keep setup fast. A next upgrade is MySQL/SQLite.
- QR display or a static UPI QR is not proof of payment. Do not mark payments as successful without verification from a payment provider. This demo does not collect real payments.
- Do not collect real student personal data with this classroom demo.

## Syllabus mapping
- React components, props, state, effects: `src/App.jsx`
- Search/filter/sort, date objects, form validation: `src/App.jsx`
- Express server and API routes: `server/index.js`
- HTTP requests (`fetch`) from React to Express: `src/App.jsx`
- Server-side validation and persistence: `server/index.js`, `server/data/db.json`
- Responsive design: `src/styles.css`
