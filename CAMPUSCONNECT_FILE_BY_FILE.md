# CampusConnect — File-by-File Guide

This guide describes the checked-out repository at `C:\Users\susmi\.codex\.chatgpt-projects\g-p-6ae1d09adcf481919f2d5be18e2b14bb\github-repo-check` (`main`, `e3f5e27`). The Downloads location named in the request was unavailable; compare the two copies before assuming they match. No application files are changed by this guide.

## How to read a code example

Paths and names below match the inspected source. Snippets are intentionally short and selective. A **component** is a React function that returns UI. **State** is a value React tracks; changing it schedules a render. An `async` function returns a Promise, and `await` pauses that function until an asynchronous operation settles.

## `index.html`

**Purpose:** HTML document Vite serves; gives React a root element and loads `src/main.jsx`.

Important parts: `<div id="root"></div>` is the mount point, and `<script type="module" src="/src/main.jsx"></script>` loads the ES module entry. The document also sets language, viewport, description, theme color and page title. If `root` were missing, `createRoot(document.getElementById("root"))` in `main.jsx` would receive no mount element.

**Analogy:** the empty root is a stage; React sets the scene on it. **Viva:** Is this page itself the React UI? No; it is the HTML shell that loads the React entry point. **Practice:** change the document title and reload.

## `src/main.jsx`

**Purpose:** starts the frontend and imports the global stylesheet.

```jsx
createRoot(document.getElementById("root")).render(
  <React.StrictMode><App /></React.StrictMode>
);
```

`createRoot` creates a React root at the HTML element. `render` mounts the `App` component. `StrictMode` helps surface some development issues; it is not an authentication or production security feature. Imports connect React, React DOM, `App.jsx`, and `styles.css`.

**Control flow:** Vite loads this module → imports resolve → React renders `App`. **Analogy:** the main switchboard powers the page. **Viva:** Where does rendering begin? **Practice:** trace the import from `main.jsx` to `App.jsx`.

## `src/App.jsx`

**Purpose:** holds sample event data, UI components, client state, API calls, form checks, and page composition.

### Data and small helpers

`EVENTS` is an array of six fixed event objects. Each has an ID, title, category, date, venue, fee, capacity, host, description, image, tag and accent. The array is not fetched from the server. `categories` and `clubs` are also fixed arrays; each club's `matches` function determines which sample events belong to that club. Helpers format currency/date/time, read browser storage safely, create a persistent `cc_device_id`, and parse HTTP responses.

```js
async function readApiResponse(response) {
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || `Request failed (${response.status}).`);
  return result;
}
```

The browser reads JSON, turns a non-success HTTP response into an error, and returns parsed data on success. The `catch` attached to JSON parsing avoids a second error if a response body is empty or malformed.

### `Countdown`

`Countdown({ target })` stores the current time in state and uses `useEffect` to start a one-second interval. Cleanup clears the interval when React removes the component. It computes days, hours, minutes and seconds until the fixed featured-event date and renders each unit.

### `RegistrationModal`

Props include the event, close callback, registration-success callback, previous registrations and `studentId`. It holds form values, per-field errors, request loading state, a confirmed `done` response, and the demo QR image data URL. The form currently collects full name, roll number, mobile, branch and year; the Section field was removed. The demo QR text explicitly says `NOT A PAYMENT`.

Client checks require a name of at least two characters, a roll number, a mobile matching `/^[6-9]\d{9}$/`, year and branch; it checks the already-loaded registration list for a same-event/same-roll duplicate. This check improves feedback but the server independently checks duplicates.

```js
const response = await fetch("/api/registrations", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ deviceId, eventId, eventTitle, eventDate,
    eventVenue, name, rollNumber, mobile, year, branch, fee })
});
const result = await readApiResponse(response);
onRegistered(result);
setDone(result);
```

The actual object includes those fields from the form and selected event. It does **not** include `section` or `className`. The success state is set after a successful HTTP response has been parsed. A failed request becomes a visible form-level message; `finally` clears the submitting state.

**Identity and My Events behavior:** `App` passes the typed login ID to `RegistrationModal`, so the roll-number field starts prefilled. My Events requests registrations using the browser's `deviceId` and filters the sample events by event ID; it does not hide a saved registration because the typed login ID differs from the roll number in the form. The login ID is still not verified authentication.

### `StudentLogin`

This component has an input state and an error string. Its submit handler prevents browser navigation, trims the input, requires 2–40 characters and calls `onLogin`. The parent saves the normalized value in `localStorage` as `cc_student_id`. There is no credential check. It is student-ID entry, not authentication.

### `EventCard` and `DetailsModal`

`EventCard` receives an event plus callbacks and renders event image/info, favourite button, details action and register action. The heart button calls `onFavorite(event.id)`. `DetailsModal` shows selected-event information and offers favourite/register/close actions. These components do not independently persist data; callbacks delegate decisions to `App`.

### `App`

`App` owns page-wide state: typed student ID, selected category, search, sort choice, favourites, server registrations, loading/error flags, refresh counter, device ID, page mode, active club, selected event, registration target and mobile-nav open state.

- Login/logout read and write `cc_student_id` in `localStorage`.
- A `useEffect` writes favourite IDs to `cc_favorites`.
- A second effect requests `GET /api/registrations?deviceId=...&rollNumber=...`, checks that the response is an array, then updates state. An `active` flag prevents stale effect callbacks from updating state after cleanup. Errors are shown in My Events with a Retry button.
- `useMemo` filters the fixed event list by category, search text, favourite, registration, club, and sorts by date or fee. In My Events mode, category is deliberately not applied, but the view still matches registrations by `studentId`.
- `toggleFavorite`, `openRegister`, `saveRegistration`, `goToEvents`, and `openClubEvents` update state or scroll to the event section.
- If no student ID is stored, the login page is shown; otherwise the main page is rendered.

**Analogy:** `App` is the coordinator; small components are specialized team members. **Viva:** Why use state instead of a plain variable? React re-renders when state changes. **Practice:** trace one favourite click to the localStorage effect.

## `src/styles.css`

**Purpose:** design tokens, layout, component styling and responsive behavior. The file contains the existing visual system for header, hero, cards, filters, countdown, clubs, forms, dialogs and success states. Media queries change layout below approximately 950px, 680px and 370px. The modal becomes bottom-aligned on narrow screens. The demo QR panel has its own style. CSS changes presentation; it does not validate or persist form data.

**Analogy:** the styling is the clothing and layout of the interface. **Viva:** Does CSS make an API call? No. **Practice:** locate a media query and explain which screen layout it changes.

## `server/app.js`

**Purpose:** builds the Express app, defines API paths, performs server validation, and formats errors.

`express.json({ limit: '100kb' })` parses incoming JSON and caps request size. `asyncRoute` forwards rejected promises to the error middleware. Routes: health, student identity, registrations GET, registrations POST. Required registration strings include `deviceId`, event fields, student fields and `rollNumber`; `fee` is optional but must be a finite non-negative number if provided. Mobile must be ten digits and start 6–9. Year and branch must match allowlists. Invalid input returns 400, created registration 201, duplicate 409. Error middleware returns a safe JSON error, logs only the server-side error message for 500s, and does not send stack traces to the browser.

**Analogy:** reception checks each form before handing it to storage. **Viva:** Why validate on both sides? Browser checks help the user; server checks protect the API from requests that bypass the UI. **Practice:** identify one server validation that cannot be trusted to frontend code alone.

## `server/index.js`

**Purpose:** exports the Express app for serverless use and starts a local listener when run directly. It defaults to `PORT` or 4000. Local script `npm run server` runs this file. `server/app.js` defines routes; it does not itself listen.

**Analogy:** app.js is the service counter; index.js opens the building. **Practice:** explain the difference between importing an app and calling `listen`.

## `server/store.js`

**Purpose:** hides storage details behind `checkStorage`, `getIdentity`, `createRegistration`, and `listRegistrations`.

At module load it selects `DATABASE_URL`, creates a PostgreSQL `Pool` if present, and in a Vercel environment throws if the URL is missing. Otherwise it sets `dbPath` to `CAMPUSCONNECT_DATA_DIR` or `server/data/db.json`. JSON reads create a new empty database if missing and validate its broad shape; writes serialize to a process-specific temporary file then rename it. Identity IDs use a counter in JSON storage. PostgreSQL uses parameterized `$1` values; identity uses `ON CONFLICT` and reads an existing identity if needed. Duplicate errors map to a shared helper.

The database is not read by this guide. The schema code shows a `students` table with generated demo IDs and a `registrations` table. The `class_name` column remains required in SQL for compatibility; the current insert sends an empty string after Section was removed, and API responses omit that field.

**Caution:** JSON file persistence is fine for local one-process demonstration but has no transaction/locking strategy for simultaneous writes. PostgreSQL is selected by configuration, but no PostgreSQL test can be inferred from source alone.

## `server/schema.sql`

**Purpose:** creates the PostgreSQL student-number sequence, `students`, `registrations`, uniqueness rules and a retrieval index. `device_id` is the student primary key. Registrations reference students. A unique registration rule prevents the same normalized roll number/event combination more than once. The mobile and fee columns have database checks. The schema must be applied to a database by an operator; it is not run automatically by the app.

**Viva:** What does a foreign key do? It requires a registration's device ID to refer to an existing student. **Practice:** find the two unique constraints/indexes and explain the duplicate they prevent.

## `api/[...path].js`

**Purpose:** Vercel Function entry point. It exports the same Express app, allowing API paths to reuse `server/app.js`. It contains no separate route implementation. Vercel routing must still be verified with a real deployment.

## `vite.config.js`

**Purpose:** enables the React plugin and proxies local `/api` requests to `http://127.0.0.1:4000`. This lets frontend code use relative paths such as `/api/registrations` in local development. The existing tracked configuration also binds Vite to `127.0.0.1`.

## `package.json` and `package-lock.json`

`package.json` describes the project and scripts: `dev`, `build`, `preview`, `server`, `dev:full`, and `test:api`. Runtime dependencies include React, React DOM, Express, `pg`, `qrcode`, and `lucide-react`; development dependencies include Vite, the React plugin and `concurrently`. The lock file records resolved package versions. `npm install` uses these files to recreate dependencies. The package list does not imply every listed feature was live-tested.

## `test/registration.test.js`

**Purpose:** uses Node's built-in `node:test`, `assert`, a temporary OS directory, and `fetch` to check JSON-mode API behavior. It tests health, stable identity retrieval, no Section/className request requirement or response property, valid registration, payment status, My Events, duplicate rejection, invalid mobile, a missing name, old-client payload compatibility, malformed JSON, and persistence after restarting the HTTP server. It skips if `DATABASE_URL` exists. The test cleans up only its own temporary test directory. A regression test being present is not the same as running it.

## `README.md`, `.gitignore`, and `vercel.json`

- `README.md` documents setup, routes, deployment setup, feature list and demo/privacy limits. It says local JSON is used and Vercel uses PostgreSQL.
- `.gitignore` excludes `node_modules/`, `dist/`, and the local JSON file.
- `vercel.json` sets `npm run build` and `dist` as output. It does not itself provision a database or set `DATABASE_URL`.

## Limits of this guide

This is source-based explanation. No browser registration, live Vercel deployment, or PostgreSQL connection was verified while writing it. The actual Downloads directory was not available in this environment, and private local data was not read.
