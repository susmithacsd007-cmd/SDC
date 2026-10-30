# CampusConnect — Viva Questions and Answers

Answers reflect the checked-out source (`github-repo-check`, branch `main`, commit `e3f5e27`). The Downloads path in the pasted request was not present here. No browser or live PostgreSQL test is claimed by this document. Each first answer is short enough to speak; the explanation gives a follow-up.

## 1. Project introduction and design decisions

### 1. What is CampusConnect?
**Short:** It is a campus event discovery and registration demo.
**More:** Students browse sample events, search/filter them, save favourites, and submit a registration through an API.

### 2. What problem does it address?
**Short:** It puts event discovery and a registration flow in one interface.
**More:** The catalogue is currently sample data in the frontend, so it demonstrates the workflow rather than administering a live campus calendar.

### 3. Who is the target user?
**Short:** A student exploring campus activities.
**More:** The student ID screen accepts typed text and is not proof of identity.

### 4. What are the main technologies?
**Short:** React and Vite on the frontend; Node.js and Express on the backend; JSON locally and optional PostgreSQL when configured.
**More:** `fetch` carries HTTP requests, and Vite proxies `/api` during local development.

### 5. Why separate frontend and backend?
**Short:** The browser handles display; the server validates and persists registrations.
**More:** A browser-only result could be changed by a user and would not be shared or persisted by the server.

### 6. Did you write every line yourself?
**Short:** “I used Codex as a coding assistant, and I reviewed the current code and tests to understand the implementation.”
**More:** Describe only the code you can explain and distinguish assistance from your own review and testing.

## 2. HTML, CSS, JavaScript and React

### 7. What is the role of `index.html`?
**Short:** It supplies the page shell and React mount element.
**More:** It contains `#root` and loads `src/main.jsx` as a module.

### 8. What is JSX?
**Short:** JSX is JavaScript syntax for describing UI elements.
**More:** Vite's React tooling transforms it so the browser can run the application.

### 9. What is a React component?
**Short:** A component is a function that returns UI.
**More:** This project has components such as `EventCard`, `DetailsModal`, and `RegistrationModal`.

### 10. What is state?
**Short:** State is a value React tracks and uses to rerender the UI when changed.
**More:** Search text, favourites and modal visibility use state.

### 11. How is state different from a normal variable?
**Short:** Updating a normal variable does not tell React to rerender; a state setter does.
**More:** `setSearch` causes the event list to be recalculated and drawn again.

### 12. What does `useEffect` do here?
**Short:** It runs side effects such as timers, localStorage writes, and API loading.
**More:** The countdown effect starts an interval and returns cleanup; the registration effect fetches My Events.

### 13. What does `useMemo` do here?
**Short:** It memoizes the filtered/sorted event list until its dependencies change.
**More:** It does not fetch or persist data; it reduces unnecessary recomputation.

### 14. What is a controlled input?
**Short:** Its displayed value is held in React state and changed by an event handler.
**More:** Search and registration fields use `value` and `onChange`.

### 15. Difference between `onClick` and `onChange`?
**Short:** `onClick` handles activation; `onChange` handles a changed input value.
**More:** A favourite button uses click; a search box uses change.

### 16. How are favourites stored?
**Short:** The IDs are in React state and are written to browser `localStorage`.
**More:** They are not sent to Express and are not shared across browsers.

### 17. How does event search work?
**Short:** It filters the in-code `EVENTS` array by text fields.
**More:** It checks title, category, venue, host and description in `App.jsx`.

### 18. Is the event list stored in PostgreSQL?
**Short:** No, the current event catalogue is an array in `src/App.jsx`.
**More:** The backend currently persists identities and registrations, not editable event records.

## 3. Components, state and events

### 19. What happens when a favourite heart is clicked?
**Short:** The card calls a callback, `App` updates the favourite IDs, and React rerenders.
**More:** A later effect saves those IDs in localStorage.

### 20. How do club cards show events?
**Short:** They set `activeClub`; the memoized event list applies that club's match function.
**More:** The filtering uses sample events and is entirely frontend-side.

### 21. How does the countdown work?
**Short:** It updates the current time every second and compares it with the featured event date.
**More:** Its effect clears the interval when unmounted.

### 22. What is a prop?
**Short:** A prop is a value or callback passed from a parent component to a child.
**More:** Event cards get an `event` and handlers from `App`.

### 23. Why use `key` when mapping event cards?
**Short:** React uses keys to identify list items across renders.
**More:** Here the event ID is a stable key.

### 24. How does My Events work?
**Short:** The page fetches registrations and filters the sample events to matching registration records.
**More:** It uses the saved typed student ID/roll number; a mismatch between login ID and entered form roll can hide a registration.

### 25. What does the Retry button do?
**Short:** It increments a refresh state value, which reruns the My Events effect.
**More:** It does not change or delete server data.

## 4. Node.js and Express

### 26. What is Node.js used for?
**Short:** It runs the JavaScript backend outside the browser.
**More:** `npm run server` runs `server/index.js` with Node.

### 27. What does Express do?
**Short:** Express routes HTTP requests and sends responses.
**More:** `server/app.js` contains middleware, route handlers, validation and error handling.

### 28. What is middleware?
**Short:** Middleware runs during request handling before or after a route.
**More:** `express.json` parses JSON bodies; the final error middleware returns safe errors.

### 29. What is `asyncRoute` for?
**Short:** It catches rejected async handlers and forwards errors to Express error middleware.
**More:** This avoids unhandled rejections from awaited storage calls.

### 30. What starts the local server?
**Short:** `server/index.js` calls `app.listen` when run directly.
**More:** The script is `node server/index.js`; the default port is 4000 unless `PORT` is set.

### 31. What is the difference between `app.js` and `index.js`?
**Short:** `app.js` configures routes; `index.js` exports it and starts the local listener.
**More:** The Vercel function imports the app without needing a separate local listener.

## 5. APIs, HTTP and JSON

### 32. What does `GET /api/health` do?
**Short:** It checks storage availability and returns the service status.
**More:** A storage failure prevents the normal health JSON response.

### 33. What does `GET /api/student-identity` need?
**Short:** A `deviceId` query parameter from 1 to 100 characters.
**More:** It creates or retrieves demo IDs. The current React source does not call this route.

### 34. What does `POST /api/registrations` do?
**Short:** It validates a JSON registration, persists it and returns the saved record.
**More:** Required fields include device/event details and student name, mobile, roll number, year and branch.

### 35. Why use HTTP status 201?
**Short:** It means the server successfully created a resource.
**More:** The frontend treats a non-OK response as an error and only shows its success screen after a successful response.

### 36. What is a request body?
**Short:** It is data sent with a request, typically for POST or PUT.
**More:** The frontend serializes registration fields using `JSON.stringify` and sets JSON content type.

### 37. Why encode query parameters?
**Short:** Encoding makes values safe to include in a URL.
**More:** `encodeURIComponent` is used for the device and student IDs in the My Events request.

### 38. What does the Vite proxy do?
**Short:** It forwards local `/api` requests to Express on port 4000.
**More:** The frontend can keep a relative `/api/...` URL in local development.

### 39. Is the browser using Axios?
**Short:** No, it uses the built-in `fetch` API.
**More:** `fetch` returns a Promise; `readApiResponse` parses JSON and checks `response.ok`.

## 6. Validation and errors

### 40. Why validate on both frontend and backend?
**Short:** Frontend validation is convenient; server validation is authoritative for API input.
**More:** A caller can bypass the React form and call Express directly.

### 41. What mobile format is accepted?
**Short:** Ten digits beginning with 6, 7, 8 or 9.
**More:** The server uses `^[6-9]\d{9}$` after trimming.

### 42. What happens with missing fields?
**Short:** Express returns 400 with a JSON error naming required fields.
**More:** Client-side required-field messages can appear before the request is sent.

### 43. How are duplicates handled?
**Short:** The API returns 409 when the same roll number is already registered for the same event.
**More:** The store checks JSON entries; PostgreSQL also has a uniqueness constraint/index.

### 44. What happens on malformed JSON?
**Short:** Express's JSON parser error middleware returns a safe 400 response.
**More:** It does not send stack traces to the browser.

### 45. How does the UI handle an unavailable API?
**Short:** It catches the failed request, shows an error, and clears the submitting/loading state.
**More:** It does not set the registration success screen on failure.

### 46. How is a server error different from a validation error?
**Short:** Validation means the input is invalid; a server error means the API could not complete the request.
**More:** Validation returns 400; unexpected server errors return a generic 500 message while logging detail server-side.

## 7. Storage and databases

### 47. Where are local registrations saved?
**Short:** In `server/data/db.json` unless `CAMPUSCONNECT_DATA_DIR` redirects the JSON store.
**More:** JSON is read for requests and saved to a temporary file then renamed.

### 48. What happens if the JSON file is missing?
**Short:** The store creates an empty database file with student and registration collections.
**More:** It does not import data from any other source.

### 49. How does the app choose PostgreSQL?
**Short:** The store creates a PostgreSQL pool if `DATABASE_URL` exists.
**More:** On Vercel it throws during initialization if that variable is missing.

### 50. What is parameterized SQL?
**Short:** Values are passed separately from SQL text using placeholders such as `$1`.
**More:** This prevents data values from being interpreted as SQL syntax.

### 51. Is `class_name` still in the SQL table?
**Short:** Yes, the schema retains it as a required compatibility column, while the current API contract has no Section field.
**More:** The store writes an empty value and does not return `section` or `className` in API responses.

### 52. Does JSON data automatically move to PostgreSQL?
**Short:** No.
**More:** The README explicitly requires manual database setup and says local JSON records are not migrated automatically.

### 53. What is the limitation of JSON persistence?
**Short:** It is simple for a local demo but has weak support for concurrent writes and serverless instances.
**More:** A hosted durable database is needed for reliable multi-instance persistence.

## 8. Testing and debugging

### 54. What does `npm run build` prove?
**Short:** It proves Vite can compile the frontend into `dist`.
**More:** It does not prove API, database, browser interaction or deployment works.

### 55. What does the API test cover?
**Short:** Health, identity repeat retrieval, registration validation/success/duplicate, My Events, malformed JSON and JSON persistence.
**More:** It uses an isolated temporary data directory and skips when `DATABASE_URL` is set.

### 56. How should you avoid testing against real records?
**Short:** Use fictional values and a temporary isolated JSON directory or a disposable database.
**More:** Never reset the real `server/data/db.json` to make a test pass.

### 57. Was PostgreSQL tested?
**Short:** Do not claim that unless a separate configured test database was actually used.
**More:** The source supports PostgreSQL, and the test intentionally skips if `DATABASE_URL` is present.

## 9. Deployment and environment

### 58. What does `vercel.json` configure?
**Short:** It sets the build command and `dist` output directory.
**More:** It does not provision PostgreSQL or supply `DATABASE_URL`.

### 59. What does `api/[...path].js` do?
**Short:** It exports the Express app as a Vercel function entry point.
**More:** The same API routes are handled by `server/app.js`.

### 60. Where must `DATABASE_URL` be configured?
**Short:** As a server-side Vercel environment variable, without a `VITE_` prefix.
**More:** Do not paste its value into source, screenshots, or the browser bundle.

### 61. Is the project deployed because Vercel files exist?
**Short:** No.
**More:** A live URL and successful tests against the deployed API/database are needed as evidence.

## 10. Limitations and future scope

### 62. Is the student entry screen authentication?
**Short:** No; it stores an arbitrary typed ID locally.
**More:** It has no password or identity verification and must not protect private data.

### 63. Does the QR code take money?
**Short:** No; it is labeled demo-only and not payable.
**More:** There is no payment provider or payment verification.

### 64. What would you improve next?
**Short:** First connect events to an admin-managed backend and add real student authentication only if the assignment requires it.
**More:** Changes should be driven by requirements; payment processing and a larger dashboard are outside this demo.

### 65. What is a safe answer about current limitations?
**Short:** “The event catalogue is sample data, student ID is not verified, and payment is a demo placeholder.”
**More:** Add whether browser, PostgreSQL and deployment checks were actually performed rather than implying they passed.
