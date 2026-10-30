# CampusConnect — One-Day Learning Roadmap

This plan uses the current checked-out copy at `C:\Users\susmi\.codex\.chatgpt-projects\g-p-6ae1d09adcf481919f2d5be18e2b14bb\github-repo-check`, branch `main`, commit `e3f5e27`. The Downloads path named in the request was unavailable. No application source, configuration, dependency or data was changed to create this guide. Do not use real personal data in practice.

## The essential 20% that explains most of the project

Be able to draw and explain this without notes:

```text
React form → fetch('/api/registrations') → Vite proxy (local)
→ Express parse + validate → store.js → JSON or PostgreSQL
→ HTTP status + JSON response → React success or error UI
```

Then remember four accurate limits: events are sample data in React; typed student ID is not authentication; paid-event QR is not payable; Vercel/PostgreSQL must be tested separately from a local build.

## Study sequence

### 1. Read the HTML shell and entry point

- **Understand:** HTML root element, JavaScript module, React render.
- **Why:** Explains how the browser gets from `/` to visible React UI.
- **Files:** `index.html`, `src/main.jsx`.
- **Key names:** `#root`, `createRoot`, `render`, `App`.
- **Practice:** Point out the root in HTML and explain which module mounts into it.
- **Self-test:** If the root element ID changes, what must also change in `main.jsx`?

### 2. Understand components and JSX

- **Understand:** JSX, component functions, props, callbacks and list keys.
- **Why:** Most of the interface is organized in `src/App.jsx`.
- **File:** `src/App.jsx`.
- **Key names:** `App`, `EventCard`, `DetailsModal`, `RegistrationModal`, `StudentLogin`, `Countdown`.
- **Practice:** Trace a favourite callback from a button into `App`.
- **Self-test:** Why does a component receive a callback prop?

### 3. Learn state and events

- **Understand:** `useState`, `onClick`, `onChange`, conditional rendering.
- **Why:** Search, filters, modal visibility, validation and loading all depend on state.
- **File:** `src/App.jsx`.
- **Key names:** `search`, `activeCategory`, `sort`, `favorites`, `errors`, `submitting`, `view`.
- **Practice:** Explain the path from typing one search character to the changed list.
- **Self-test:** Why is `setSearch` preferable to assigning a plain variable?

### 4. Follow local browser storage

- **Understand:** `localStorage` survives refresh in one browser profile but is not a secure database.
- **Why:** Favourites, typed ID and device ID are restored this way.
- **File:** `src/App.jsx`.
- **Key names:** `cc_student_id`, `cc_device_id`, `cc_favorites`, `readStorage`, `getDeviceId`.
- **Practice:** Classify each key as identity proof, UI preference, or request-scoping identifier.
- **Self-test:** Does saving a typed roll number in localStorage verify that it belongs to the user?

### 5. Learn derived lists and timers

- **Understand:** `.filter()`, `.sort()`, `useMemo`, `useEffect`, interval cleanup.
- **Why:** They power search, categories, club filters, sort, countdown.
- **File:** `src/App.jsx`.
- **Key names:** `filteredEvents`, `clubs[].matches`, `Countdown`, `setInterval`, cleanup callback.
- **Practice:** Find which predicates are bypassed in My Events mode.
- **Self-test:** Why does the countdown clear its timer when it unmounts?

### 6. Explain the registration payload

- **Understand:** controlled inputs, client validation, JSON serialization, async/await, Promise, try/catch.
- **Why:** This is the central full-stack feature.
- **File:** `src/App.jsx`.
- **Key names:** `form`, `submit`, `readApiResponse`, `fetch`, `onRegistered`, `done`.
- **Practice:** Write the request fields on paper: deviceId, event fields, name, rollNumber, mobile, year, branch, fee.
- **Self-test:** At which point does the UI decide to display success?

### 7. Understand Express request processing

- **Understand:** middleware, route, query parameter, request body, HTTP method, status code.
- **Why:** The API is the boundary that checks untrusted input.
- **Files:** `server/app.js`, `server/index.js`.
- **Key names:** `express.json`, `asyncRoute`, `/api/health`, `/api/student-identity`, `/api/registrations`.
- **Practice:** For each route, state method, input and success/error status.
- **Self-test:** Why is backend validation still needed if React validates first?

### 8. Understand persistence and database rules

- **Understand:** JSON parsing, file writes, SQL parameters, primary/foreign keys, uniqueness, environment selection.
- **Why:** It explains refresh/restart behavior and duplicates.
- **Files:** `server/store.js`, `server/schema.sql`.
- **Key names:** `DATABASE_URL`, `CAMPUSCONNECT_DATA_DIR`, `readDb`, `writeDb`, `Pool`, `$1`, unique registration index.
- **Practice:** Explain which store is chosen when `DATABASE_URL` is absent.
- **Self-test:** Why is a temporary test directory safer than running a test against real local registrations?

### 9. Understand failure paths

- **Understand:** validation error vs network failure vs server/database failure vs duplicate conflict.
- **Why:** Examiners often ask what happens when something goes wrong.
- **Files:** `src/App.jsx`, `server/app.js`.
- **Key names:** `errors.form`, `registrationsError`, Retry button, 400, 409, 500.
- **Practice:** Describe what happens if the backend terminal is stopped during submit.
- **Self-test:** Would the page show a successful receipt on a failed response? Trace the code.

### 10. Distinguish local, build, hosted and database verification

- **Understand:** dev server, proxy, production build, preview, serverless function, environment variables.
- **Why:** A working build does not prove the hosted API works.
- **Files:** `package.json`, `vite.config.js`, `vercel.json`, `api/[...path].js`, `README.md`.
- **Key names:** `dev:full`, `server`, `build`, `preview`, `dist`, `DATABASE_URL`.
- **Practice:** Explain why a preview tab alone may not mean Express is running.
- **Self-test:** What evidence is required before saying deployment succeeded?

## One-day revision schedule

1. **First 45 minutes:** read the Master Guide and draw the architecture.
2. **Next 60 minutes:** follow the `POST /api/registrations` path in the Data Flow Guide.
3. **Next 60 minutes:** inspect the matching files using the File-by-File Guide; explain each aloud.
4. **Next 45 minutes:** answer the 65 Viva questions without reading the deeper explanations first.
5. **Next 30 minutes:** practise safe local startup and health check only if the correct project copy and port are clear. Do not delete or reset database data.
6. **Final 20 minutes:** rehearse the 60-second intro and limitations honestly.

## Honest demo checklist

- Start both frontend and backend from the same project checkout using the documented command; open the URL printed by Vite.
- Confirm `http://127.0.0.1:4000/api/health` returns the health JSON before attempting registration.
- Use fictional student details. Do not present the typed ID as verified identity.
- Explain that a paid-event QR is non-payable and that the stored payment status remains unpaid/demo-only.
- Do not claim PostgreSQL or Vercel passed unless you test the configured deployment.
- If the login student ID and form roll number differ, My Events filtering can be inconsistent in the inspected source. Disclose this if asked; do not hide it.
