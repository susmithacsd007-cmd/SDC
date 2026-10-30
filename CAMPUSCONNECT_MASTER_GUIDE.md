# CampusConnect — Master Guide

> **Which copy this describes:** These notes are based on the checked-out repository at `C:\Users\susmi\.codex\.chatgpt-projects\g-p-6ae1d09adcf481919f2d5be18e2b14bb\github-repo-check`, branch `main`, commit `e3f5e27`. The separate path named in the pasted request, `C:\Users\susmi\Downloads\CampusConnect_SDC_FullStack`, was not available in this environment. Check that copy before assuming its files are identical.
>
> This is a source inspection guide, not a claim that the browser or live deployment was tested during its creation. The project contains an API test (`npm run test:api`); see the testing chapter for the distinction between code being present and a test actually being run.

## 1. What the project does

CampusConnect is a small campus event and club explorer. A student can enter a student ID or roll number, browse six sample events, search and filter the list, sort it, save favourites, open event details, view a countdown, register, and open a My Events view. Event and club content is hard-coded in `src/App.jsx`; this is a demonstration catalogue, not an event-management database.

The page is built in React. Vite serves the frontend during development and builds static files into `dist/`. React sends registration and My Events HTTP requests to Express. In local development, Vite forwards `/api` requests to Express on port 4000. Express delegates persistence to `server/store.js`. Without `DATABASE_URL`, the store uses `server/data/db.json`; with `DATABASE_URL`, it uses PostgreSQL. The Vercel API function forwards requests to the same Express application.

### Implemented versus not implemented

Implemented in the inspected source:

- Six sample events, event cards/details, search, category filters, sorting, club-to-event filtering, favourites, countdown.
- Student entry screen which accepts a typed ID and stores it in browser `localStorage`.
- Registration form validation in the browser and again in Express.
- Registration creation, duplicate rejection, and retrieval for My Events.
- A generated QR image for a paid event that is explicitly marked demo-only and non-payable. No payment is collected or verified.
- Local JSON persistence and optional PostgreSQL persistence.

Not implemented as a real production feature: verified student authentication, college-record lookup, event CRUD/admin tools, real payment, payment verification, or automatic migration of JSON records to PostgreSQL. Do not present these as working features in a viva.

### A speakable 60-second introduction

> “CampusConnect is a campus event discovery and registration demo. The frontend is a React single-page application built with Vite. It displays sample events and provides search, filters, sorting, favourites, details, and registration forms. When a student submits a form, React sends JSON using `fetch` to an Express API. The server validates the request and writes the registration through a storage module. Local development uses a JSON file, while a configured deployment can use PostgreSQL through `DATABASE_URL`. The project demonstrates a full-stack request flow, but its student entry screen is not authentication and the payment QR is only a non-payable demo image.”

### “How did you build this with Codex?”

> “I used Codex as a coding assistant to inspect and change the project, then I reviewed the current source and tests to understand how each part works. I can explain the files and the request flow. I distinguish automated checks from browser or deployment checks that were not run.”

Say only what you personally reviewed and what you actually ran.

## 2. Architecture at a glance

```text
Browser
  └─ index.html loads src/main.jsx
       └─ React App in src/App.jsx renders the page
            ├─ localStorage: typed student ID, device ID, favourites
            └─ fetch('/api/...') sends HTTP + JSON
                 ├─ Local: Vite /api proxy → Express server/index.js
                 └─ Vercel: api/[...path].js → same Express app
                                      └─ server/app.js routes + validation
                                           └─ server/store.js
                                                ├─ local: server/data/db.json
                                                └─ deployed: PostgreSQL (`DATABASE_URL`)
```

- **Browser:** runs the UI and stores a few convenience values. Browser storage is not a secure identity system.
- **React:** holds UI state and re-renders when state changes.
- **Vite:** development server, `/api` proxy and production bundler.
- **`fetch`:** browser HTTP client used for API calls; JSON is the request/response format.
- **Express:** receives HTTP requests, parses JSON, validates fields and returns status codes.
- **Store:** keeps HTTP handlers separate from storage-specific read/write/query code.
- **JSON file:** easy local persistence for one small demo; it is not a transactional multi-user database.
- **PostgreSQL:** optional persistent relational store selected by the server when `DATABASE_URL` is set.
- **Vercel:** configuration and a catch-all API function exist in the checkout. Their presence is not proof of a successful deployment.

## 3. Repository skeleton

```text
.
├─ api/[...path].js          Vercel function entry, exports Express app
├─ index.html                HTML shell and React mount element
├─ package.json              scripts and direct dependencies
├─ package-lock.json         locked dependency tree
├─ README.md                 setup, deployment notes and limitations
├─ vite.config.js            React plugin and local API proxy
├─ vercel.json               build command and static output directory
├─ src/
│  ├─ main.jsx               React entry point
│  ├─ App.jsx                sample data, components, state and UI behavior
│  └─ styles.css             page styles and responsive breakpoints
├─ server/
│  ├─ app.js                 Express middleware, routes, validation, errors
│  ├─ index.js               local HTTP server startup and app export
│  ├─ store.js               JSON/PostgreSQL persistence implementation
│  └─ schema.sql             PostgreSQL sequence, tables, constraints, index
└─ test/
   └─ registration.test.js   isolated JSON-mode API regression test
```

`node_modules/`, `dist/`, and `server/data/db.json` are ignored by `.gitignore`. The local database contents were not opened for this guide. `server/data/db.json` is intentionally not tracked as ordinary source data.

## 4. Important design choices

### Why React and Vite?

React components describe reusable UI pieces; state records values that change after user actions or network requests. Vite gives a quick local development server and creates the production `dist/` bundle. JSX is JavaScript syntax for describing UI; Vite's React plugin transforms it for the browser.

### Why Express and an API?

The browser should not write the server's files or database directly. It sends a request to an API. Express is the server-side boundary: it checks input, invokes storage functions, and chooses the response status. For example, success uses `201`, invalid form data uses `400`, and a duplicate uses `409`.

### Why JSON locally and PostgreSQL when configured?

JSON keeps local setup simple and survives a server restart. It is suitable for a small, single-process lab demonstration. PostgreSQL is a better fit for persistent hosted data and concurrent clients. The source selects PostgreSQL when `DATABASE_URL` is present; the README says Vercel requires that setting because serverless local files are not durable. JSON data is not automatically imported into PostgreSQL.

## 5. Student identity and privacy: say this accurately

`StudentLogin` accepts any trimmed string from 2 to 40 characters and stores it as `cc_student_id` in browser `localStorage`. This is a demo entry screen, **not authentication**: there is no password, verification code, college lookup, or server-side session. A user can type another person's ID.

The backend has `GET /api/student-identity?deviceId=...`, which creates or retrieves demo IDs associated with a device ID. However, the current `src/App.jsx` does not call this endpoint. The registration form accepts a roll number and submits it; do not say that the UI is verifying the entered ID or using the server-created demo identity unless that implementation changes.

The device ID is generated in the browser and stored as `cc_device_id`. It is a convenience key, not a secret credential. The API has no authentication layer. Never demonstrate with real student personal information or expose local JSON contents.

## 6. Paid-event QR

For an event with a positive fee, the browser uses `qrcode` to generate a QR image from a text string containing the event name, amount and `NOT A PAYMENT`. The UI says the code is not connected to UPI or an account. The server sets a positive-fee registration's status to `Demo only — not paid`. This is only a UI/data demonstration; it is neither a payment request nor proof of payment.

## 7. Development, build, tests and deployment

From the repository folder:

```bash
npm install
npm run dev:full
```

`dev:full` uses `concurrently` to start `npm run server` and `npm run dev`. Open the Vite **Local** URL it prints. The backend defaults to port 4000, and the Vite proxy maps `/api` there. If port 4000 is occupied, the backend cannot start; stop the old CampusConnect server in its own terminal before restarting. Do not open a Vite preview page and assume that alone starts Express.

Other scripts:

```bash
npm run server       # Express only, port 4000 by default
npm run dev          # Vite only, normally port 5173
npm run build        # production frontend bundle in dist/
npm run preview      # preview built frontend; not a backend process
npm run test:api     # Node built-in test runner
```

The included API test creates a temporary JSON data directory, exercises registration behavior and removes that temporary test directory in its cleanup hook. It skips when `DATABASE_URL` is set so a local test does not accidentally write into a configured database. Its presence is not evidence that it was run in this guide-writing task.

The Vercel configuration asks Vercel to run `npm run build` and publish `dist`. `api/[...path].js` exports the Express app. The storage module refuses Vercel startup without server-side `DATABASE_URL`. The SQL schema must be run manually in the chosen PostgreSQL project. No live deployment was tested while preparing this guide.

### Three different levels of evidence

1. **Build passes:** frontend source compiled into `dist`; it does not prove the API works.
2. **API integration test passes:** requests against a locally started Express app passed the assertions in the test; it does not prove real browser behavior or PostgreSQL.
3. **Live deployment passes:** the deployed URL and configured hosted database were actually tested; no such claim is made here.

## 8. What to learn first

1. Follow the registration path in `CAMPUSCONNECT_DATA_FLOW.md`.
2. Study the main source files in `CAMPUSCONNECT_FILE_BY_FILE.md`.
3. Use `CAMPUSCONNECT_VIVA_QUESTIONS.md` to practise short answers.
4. Follow the exercises in `CAMPUSCONNECT_LEARNING_ROADMAP.md`.

The best viva strategy is to describe the real flow and limitations honestly: React form → `fetch` → Express validation → storage → response → UI. Do not claim authentication, real payment, MySQL, or a verified deployment.
