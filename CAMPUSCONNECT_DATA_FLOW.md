# CampusConnect — Data Flow Guide

Source inspected: checked-out repository `C:\Users\susmi\.codex\.chatgpt-projects\g-p-6ae1d09adcf481919f2d5be18e2b14bb\github-repo-check`, `main` at `e3f5e27`. The Downloads path from the pasted request was not available. No application code or data was changed for this guide.

## The request vocabulary

- **State** is a React value that can change and cause a rerender.
- **HTTP request** is a browser-to-server message with a method, URL, headers and sometimes a body.
- **JSON** is the text format used for API data.
- **Status code** tells the caller the outcome: this app uses 200 for successful reads, 201 for created registration, 400 for invalid input, and 409 for duplicate registration.
- **Persistence** means data remains available after the page or server restarts.

## 1. Opening the home page

1. Browser requests `/` from Vite (development) or the configured static host.
2. `index.html` provides `<div id="root">` and loads `src/main.jsx`.
3. `main.jsx` calls React DOM `createRoot(...).render(<App />)`.
4. `App` reads `cc_student_id` from localStorage. If it is empty, `StudentLogin` is rendered; otherwise the event experience is rendered.
5. `EVENTS` is an in-code array, so the cards do not wait for an event API.
6. An effect requests the current user's registrations from `/api/registrations` and renders loading/error/data state.

## 2. Searching, filtering, sorting, and clubs

Typing in the search input runs its `onChange` handler and calls `setSearch`. Category and sort controls call their corresponding state setters. `useMemo` recomputes a list from the `EVENTS` array. Search checks the title, category, venue, host and description. The club cards call `openClubEvents`, which resets other filters and sets `activeClub`. There is no API call for these operations; they are browser-side filtering of sample event data.

## 3. Adding a favourite

Click favourite → `EventCard` calls `onFavorite(event.id)` → `toggleFavorite` adds/removes the ID in React state → the event card renders the heart state/count → an effect serializes IDs to `localStorage` key `cc_favorites`. This is per-browser convenience storage, not backend data.

## 4. Student ID entry

1. `StudentLogin` reads the text input.
2. On submit, it trims and checks length 2–40.
3. `onLogin` uppercases and stores it under `cc_student_id` in localStorage.
4. `App` renders the main page and uses this ID as the My Events filter/query value.

This does not call `/api/student-identity`. The API endpoint separately generates/returns demo IDs for a `deviceId`, but no current React fetch invokes it. Neither path verifies the student against college records. The stored ID is user-entered, and is not a password or secure identity proof.

## 5. Submitting an event registration

```text
User fills form and clicks Confirm
  → RegistrationModal submit handler prevents normal page submit
  → browser checks name, roll number, mobile, year, branch and duplicates
  → sets submitting=true, disables button and shows “Saving registration…”
  → POST /api/registrations with JSON
  → local: Vite /api proxy to Express on port 4000
     hosted: Vercel Function api/[...path].js exports same Express app
  → express.json parses body; app.js validates values
  → store.js creates identity as needed and saves registration
  → Express returns 201 + registration JSON
  → browser parses response, updates App registration state and displays receipt
```

The request contains `deviceId`, `eventId`, `eventTitle`, `eventDate`, `eventVenue`, `name`, `rollNumber`, `mobile`, `year`, `branch`, and `fee`. It does not contain `section` or `className`. Backend schema still has `class_name`; PostgreSQL insert writes an empty compatibility value and the API response excludes it. There is no Section-to-className form mapping in the current source.

The success view is set only after `fetch` returns an OK response and JSON is parsed. On a network error or non-success response, the catch block sets a visible error; `finally` clears the loading state. A paid-event registration remains `Demo only — not paid` on the server.

### Form ID and My Events

The parent now passes the entered `studentId` to `RegistrationModal`, which prefills the roll-number field. My Events requests registrations for the browser's `deviceId` without an additional roll-number filter, and the UI matches saved registrations by event ID. This prevents an ID mismatch from hiding a successfully saved registration. The login ID is still user-entered and is not verified authentication.

## 6. Invalid form input

Client validation checks before making the POST. If a field fails, `errors` state is updated and the matching message renders near the field; the backend is not called. The backend repeats validation because users can call the API without using React. A bad mobile must match ten digits beginning 6, 7, 8, or 9. Server validation returns 400 with JSON `{ "error": "..." }`.

## 7. Duplicate registration

The client first checks its current `registrations` array for the same event and roll number. If it finds one, it displays an error before the request. The server/store checks again. JSON storage scans existing records; PostgreSQL has a unique constraint/index for normalized roll number plus event. Express maps duplicate errors to 409. The UI displays the server's `error` text for a non-OK API response.

## 8. My Events retrieval

When `deviceId` or the refresh counter changes, an effect makes:

```text
GET /api/registrations?deviceId=<encoded-device-id>
```

The browser expects an array. In My Events mode, `filteredEvents` includes local sample events whose IDs occur in the server response. The code disables category filters in this view, though search can still narrow the list. Loading is shown while waiting; an error message and Retry button appear on failure.

On successful POST, `saveRegistration` prepends the returned response to the current registration state, so the event can appear without a full page reload. On page refresh, the effect fetches registrations again from the backend by browser device ID. Favourites and typed login ID are restored from localStorage; registrations are not considered successful merely because localStorage says so.

### Privacy caveat

The API accepts user-provided `deviceId` and `rollNumber`; neither is a secret. Student entry is not authentication. Do not treat this API as safe for real private student data. The backend narrows registration queries using identifiers, but the identifier model does not prove who the caller is.

## 9. Backend or database failure

- A browser network failure is caught in the form and described as inability to reach the backend. My Events shows an error and Retry control.
- A validation response is a 400; the form displays the JSON error.
- Duplicate is 409 and displays a duplicate-registration message.
- Unexpected server errors are logged server-side without exposing stack traces; Express returns a generic 500 JSON error.
- A database connectivity failure causes the API request to fail; the frontend must not show its success receipt because success state follows only an OK response.

The error handling above follows the inspected source. It does not mean every failure mode was exercised in a browser or against a real PostgreSQL service.

## 10. Refresh, restart and storage

- **Refresh page:** React state resets; favourites and entered login ID are reloaded from localStorage; registrations are fetched from API.
- **Restart local backend:** JSON file is read again and registrations persist, provided it is not deleted and the app uses the same data directory.
- **Use `CAMPUSCONNECT_DATA_DIR`:** local test can redirect storage to a separate directory. The test file uses this to avoid the normal local database.
- **Vercel:** the store requires `DATABASE_URL`; local JSON is not an appropriate durable serverless store. PostgreSQL data survives function invocations through the provider, but that behavior needs an actual configured database test.

## Sequence diagram

```mermaid
sequenceDiagram
  actor Student
  participant UI as React RegistrationModal
  participant Vite as Vite /api proxy
  participant API as Express app.js
  participant Store as store.js
  participant DB as JSON or PostgreSQL
  Student->>UI: Fill fields and submit
  UI->>UI: Validate locally; show loading
  UI->>Vite: POST /api/registrations (JSON)
  Vite->>API: Forward /api request (local only)
  API->>API: Parse and validate request
  API->>Store: createRegistration(body)
  Store->>DB: Check duplicate and persist
  DB-->>Store: Saved record
  Store-->>API: Registration object
  API-->>UI: 201 JSON response
  UI->>UI: Update registrations and show success
```

For a Vercel request, the Vercel function entry replaces the local Vite proxy in the middle of this diagram.
