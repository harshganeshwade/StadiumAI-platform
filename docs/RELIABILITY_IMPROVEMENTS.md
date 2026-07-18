# StadiumAI — Platform Reliability & Resilience Plan

To elevate the reliability of the **StadiumAI operations platform** for the **FIFA World Cup 2026** without expanding the project's original functional scope, we can focus on hardening key interfaces, implementing graceful degradation strategies, and adding robust error controls.

This document details targeted, actionable reliability enhancements across 6 key categories, fully aligned with the existing requirements (PRD/TRD).

---

## 1. Multilingual Fallback Degradation (Chatbot Service)
* **Status Quo**: If the conversational LLM times out or its circuit breaker opens, `backend/src/services/chatbot.js` falls back to a hardcoded English text: *"I am experiencing high response times at the moment..."*
* **Reliability Enhancement**:
  - Dynamically select the circuit breaker fallback message based on the requester's `language` parameter (supporting English, Spanish, French, German, Portuguese, Arabic).
  - Integrate this fallback with `backend/src/services/locales.js` so that fallback translations are loaded dynamically and managed centrally.
  - **Result**: Fans speaking other languages receive a seamless experience even during system failures.

---

## 2. Dijkstra Route Planner Safeguards & Analytics Resilience
* **Status Quo**: The routing engine (`backend/src/services/recommendation.js`) calculates pathfinding weights using live crowd density values. It expects the graph structure to be intact and the crowd analytics service to return valid schemas.
* **Reliability Enhancements**:
  - **Telemetry Validation**: Validate incoming density objects prior to multiplier calculations. If percentage capacity or counts are corrupt (e.g. `NaN`, negative values), gracefully fallback to a safe density multiplier of `1.0` and log a warning.
  - **Unreachable Nodes Handler**: If a zone becomes isolated (e.g., due to section closures or data error), return a `degraded: true` flag and the path to the closest active concourse rather than throwing an unhandled runtime error.
  - **Result**: Guaranteed navigation responses even during live telemetry disruptions or graph disconnects.

---

## 3. Client-Side WebSocket Resilience & Action Queueing (Offline Mode)
* **Status Quo**: During peak events at MetLife Stadium, cellular connections frequently drop. The React clients (Fan App and Dashboard) connect via raw Socket.IO and do not handle disconnection visually or buffer actions.
* **Reliability Enhancements**:
  - **Visual Quality Banner**: Add a subtle connection status indicator (Online / Offline / Reconnecting) in the dashboard header and fan app banner.
  - **Action Queueing**: Buffer critical staff actions (such as acknowledging or resolving alerts) in memory when the connection is offline. Automatically flush the queue and sync with the backend once connection is restored.
  - **Catch-up Syncing**: On socket reconnection, query the REST API endpoint (`GET /api/alerts?since=<timestamp>`) to retrieve any incident updates or emergency alerts missed during the offline window.
  - **Result**: Seamless operations during network dropouts, preventing lost actions or missed emergency broadcasts.

---

## 4. Input Sanitization & Anti-Injection Guards
* **Status Quo**: Input fields accept strings, but there is no protection against long query text or code/script injection attacks.
* **Reliability Enhancements**:
  - **XSS Protection**: Strip HTML tags and script injections in the express validator middleware (`backend/src/middleware/validator.js`) before parsing. This prevents malicious text in a fan's help request from executing as code on the operator dashboard.
  - **Size Guard Limits**: Truncate or reject requests with abnormally large string sizes (e.g. chat messages over 500 characters, alert descriptions over 250 characters) to prevent database bloating and server-side regular expression denial of service (ReDoS).
  - **Result**: Protects staff consoles from malicious fan inputs and secures backend processing speed.

---

## 5. In-Memory Database Memory Management
* **Status Quo**: The mock database (`backend/src/db.js`) holds all users, active incidents, and chat messages in-memory. Under continuous operation or high simulation volumes, memory usage will grow indefinitely.
* **Reliability Enhancements**:
  - **Bounded Chat history**: Limit the in-memory chat message logs per session to a maximum of 50 items. Automatically eject the oldest logs when the limit is exceeded using a FIFO queue.
  - **Archived Alert Caps**: Cap the in-memory store of resolved alerts at 500 entries, purging older logs to prevent memory leaks during long-running load tests.
  - **Result**: Keeps memory consumption constant and stable, even during prolonged simulator runs.

---

## 6. Centralized Error Boundary & Health Monitoring APIs
* **Status Quo**: Backend lacks health diagnostics and relies on default Express uncaught error handling, which can expose internal stack traces.
* **Reliability Enhancements**:
  - **Health Check Endpoint**: Add `GET /api/health` that returns node uptime, memory footprint, and mock database record counts, enabling infrastructure orchestrators (like Kubernetes or cloud balancers) to perform health checks.
  - **Express Error Boundary**: Implement a centralized error-handling middleware that catches async routing errors, logs them securely, and returns standardized JSON error responses (preventing application crashes and hiding debug internals).
  - **Result**: Simpler node monitoring and clean, crash-proof API responses.
