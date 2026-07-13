# StadiumAI — Agent-Ready Specification

**Source documents:** Product Requirements Document (PRD) + Technical Requirements Document (TRD)
**Purpose of this rewrite:** The originals define *what* to build but leave contracts, error paths, and IDs implicit. An AI coding agent will guess at those gaps inconsistently across files, causing integration bugs. This version makes every requirement traceable, every data shape explicit, and every failure mode defined, so the agent has one unambiguous source of truth.

\---

## 0\. How to Read This Document (for the agent)

* Every feature has a **Requirement ID** (`FR-xx`). Code, tests, and commit messages should reference these IDs.
* Every service has an explicit **input/output contract**. Do not invent field names — if a field is needed but undefined here, stop and flag it rather than guessing.
* Every external dependency (AI model, sensor, third-party API) has a **fallback behavior**. Never leave a failure path unhandled.
* Section 9 defines **acceptance criteria** in testable form — use these directly as test cases.

\---

## 1\. System Purpose (unchanged from PRD)

StadiumAI supports FIFA World Cup 2026 stadium operations with two user-facing surfaces:

1. **Fan app** — navigation, queueing info, AI assistant, notifications, engagement features.
2. **Staff/Operator dashboard** — live alerts, crowd analytics, incident response, resource deployment.

Both are served by a shared backend of microservices, an AI/ML layer, and an edge/IoT layer.

\---

## 2\. Architecture (clarified)

```
\[Fan Mobile App]  \[Staff Mobile App]  \[Operator Web Dashboard]
        │                  │                    │
        └──────────────────┴────────────────────┘
                           │
                     API Gateway  (authN, rate limiting, routing)
                           │
        ┌──────────────────┼──────────────────────┐
        │                  │                       │
 Auth Service      Notification Service      Operations Service
        │                  │                       │
        └──────────────────┴──────────┬────────────┘
                                       │
                          Event Streaming (Kafka)
                                       │
        ┌──────────────────┬──────────┴───────────┬─────────────┐
        │                  │                       │             │
  AI Assistant       Crowd Analytics       Recommendation AI   Alert Engine
  (LLM service)      (CV + predictive)     (personalization)  (rules + ML)
        │                  │                       │             │
        └──────────────────┴──────────┬────────────┴─────────────┘
                                       │
                     Data Lake + Operational DB (Postgres) + Cache (Redis)
                                       │
                          Edge Gateway (per-stadium)
                                       │
        ┌──────────────────┬──────────┴───────────┬─────────────┐
    CCTV/CV cams      Occupancy sensors      ESP32 controllers   Beacons/RFID
```

**Clarification the original diagram lacked:** the Edge layer talks to the cloud only through the **Edge Gateway**, never directly to individual microservices. This is required for the ESP32 mTLS strategy in Section 7 to work — services should never hold device certificates directly.

\---

## 3\. Canonical Data Contracts

These did not exist in the source documents. Define them once; every service must conform.

### 3.1 CrowdDensityEvent (published by Crowd Analytics → Kafka topic `crowd.density`)

```json
{
  "event\_id": "uuid",
  "zone\_id": "string",          // e.g. "gate-b", "sec-104"
  "timestamp": "ISO8601",
  "density\_level": "low | medium | high | critical",
  "estimated\_count": "integer",
  "confidence": "float 0-1",
  "source": "cv\_model | occupancy\_sensor | fused"
}
```

### 3.2 AlertEvent (published by Alert Engine → Kafka topic `alerts.raised`)

```json
{
  "alert\_id": "uuid",
  "type": "medical | congestion | unauthorized\_access | lost\_child | equipment | weather",
  "severity": "low | medium | high | critical",
  "zone\_id": "string",
  "timestamp": "ISO8601",
  "recommended\_action": "string",
  "status": "open | acknowledged | resolved",
  "assigned\_staff\_id": "string | null"
}
```

### 3.3 ChatbotRequest / ChatbotResponse (Fan/Staff ↔ AI Assistant, REST + streaming)

```json
// Request
{
  "session\_id": "uuid",
  "user\_id": "string",
  "role": "fan | staff",
  "message": "string",
  "language": "ISO 639-1 code",
  "context": { "seat": "string|null", "zone\_id": "string|null" }
}
// Response
{
  "session\_id": "uuid",
  "reply": "string",
  "intent": "string",
  "actions": \[ { "type": "navigate | show\_map | escalate", "payload": "object" } ],
  "confidence": "float 0-1"
}
```

### 3.4 Config/env values every service must read (not enumerated in TRD)

* `KAFKA\_BROKERS`, `REDIS\_URL`, `POSTGRES\_URL`
* `AI\_MODEL\_TIMEOUT\_MS` (default 2000, matches FR performance target)
* `MAX\_CONCURRENT\_USERS` (default 120000, from scalability requirement)
* `JWT\_ISSUER`, `OAUTH\_CLIENT\_ID`

\---

## 4\. Functional Requirements — traceable table

|ID|Requirement|Owning Service|Depends On|Fallback if dependency fails|
|-|-|-|-|-|
|FR-01|AI chatbot assistance (text + voice, multilingual)|AI Assistant|LLM API, Translation Engine|Return canned FAQ answer + "connect to human staff" action|
|FR-02|Generate live operational alerts|Alert Engine|Crowd Analytics, CV models|Raise alert from raw sensor threshold rules (no ML)|
|FR-03|Track crowd density|Crowd Analytics|CCTV, occupancy sensors|Degrade to sensor-only estimate, flag `confidence: low`|
|FR-04|Multilingual communication|Translation Engine|External translation API|Fall back to English + client-side i18n strings|
|FR-05|Recommend optimal navigation|Recommendation AI|Crowd Analytics, Mapping API|Static shortest-path routing (no live congestion data)|
|FR-06|Personalized recommendations (food, merch, parking)|Recommendation AI|User profile store|Show non-personalized popular items|
|FR-07|Emergency notifications|Notification Service|Push/SMS/Email providers|Retry with exponential backoff; escalate to PA system integration|
|FR-08|Operational analytics dashboard|Operations Service|Data Lake|Show last-cached snapshot with "stale data" indicator|
|FR-09|Ticketing system integration|Auth/Operations|Ticketing platform API|Block seat-guidance features only; core app stays usable|
|FR-10|Administrator controls (RBAC)|Auth Service|Postgres|Fail closed — deny access, never fail open|

**Rule for the agent:** every new endpoint or component must map to one of these IDs. If it doesn't, it's out of scope — stop and ask rather than adding unspecified functionality.

\---

## 5\. AI Models — explicit contracts (TRD only gave "Purpose")

|Model|Input|Output|Latency budget|On failure|
|-|-|-|-|-|
|Conversational LLM|`ChatbotRequest` (3.3)|`ChatbotResponse` (3.3)|< 2s (FR-01)|Canned response, log for retrain|
|Crowd Prediction|Sensor + CV stream, 5-min window|`CrowdDensityEvent` (3.1)|< 1s|Use last known value, decay confidence over time|
|Recommendation Engine|user\_id, location, time, purchase history|ranked list of `{item\_id, score}`|< 500ms|Return static popularity-ranked list|
|Computer Vision (crowd count/anomaly)|CCTV frame or stream|count, anomaly flag, bounding boxes|< 1s per frame batch|Fall back to occupancy sensors only|
|Predictive Analytics (staffing/maintenance)|historical ops data|forecast object with confidence interval|batch, not real-time critical|Use previous period's numbers|

**Explicit rule not in the TRD:** every AI model call must have a timeout (`AI\_MODEL\_TIMEOUT\_MS`) and must never block the request thread past that timeout — always return the fallback instead of hanging. This directly serves the "AI hallucinations" and "sensor failures" risks the PRD names but never operationalizes.

\---

## 6\. Non-Functional Requirements (quantified — PRD/TRD versions were vague or duplicated)

|Requirement|Target|Verified by|
|-|-|-|
|API response time|< 300ms avg, < 800ms p99|Load test, Section 9.3|
|AI chatbot response|< 2s|Load test with model timeout enforced|
|Alert generation|< 1s from sensor event to `AlertEvent` published|Integration test|
|Dashboard refresh|≤ 2s|Integration test|
|Availability|99.95%|Uptime monitoring, synthetic checks|
|Concurrent users|120,000+|Load test|
|Data at rest|AES-256|Static config audit|
|Data in transit|TLS 1.3|Static config audit|
|Accessibility|WCAG 2.2 AA|Automated a11y test suite|

\---

## 7\. Edge / ESP32 Security — condensed into a checklist the agent can implement against

1. Devices boot only signed firmware (Secure Boot).
2. Firmware and local data encrypted at rest (Flash Encryption, AES-256).
3. Keys never leave hardware (eFuse storage) — do not add any code path that reads/exports keys.
4. All device↔server traffic uses mTLS 1.3, terminated at the Edge Gateway, not at individual microservices.
5. OTA updates must be signed; reject unsigned or downgrade-version updates.
6. Sensor payloads carry HMAC-SHA256; reject on mismatch.
7. Requests include nonce + timestamp; reject replays outside a 30-second window.
8. On anomaly detection, gateway isolates the device (drops its topic subscription) rather than crashing the pipeline.

\---

## 8\. Error Handling \& Degradation Policy (missing from both source docs — added explicitly)

General rule: **no single dependency failure should take down the fan-facing app or the safety-critical alert path.**

* Any AI/ML call: enforce timeout → fallback (see Sections 4–5) → log → do not retry synchronously more than once.
* Any Kafka publish failure: buffer locally at the producing service, retry with backoff, alert on-call after 3 failures.
* Any third-party API (payments, SMS, weather, mapping): circuit-breaker pattern — after N consecutive failures, stop calling for a cooldown period and use cached/fallback data.
* Database unavailable: read from Redis cache if present; writes queue and replay on recovery; never silently drop safety alerts (FR-02, FR-07) — these must persist locally at the edge if the cloud path is down.
* Auth failures: always fail closed (deny), never fail open.

\---

## 9\. Acceptance Criteria (testable, replacing PRD's "Success Metrics" prose)

### 9.1 Functional

* \[ ] FR-01: Given a chat message in any of the supported languages, the assistant responds in the same language within 2s, or returns the fallback response.
* \[ ] FR-02: Given a `CrowdDensityEvent` with `density\_level: critical`, an `AlertEvent` of type `congestion` is published within 1s.
* \[ ] FR-05: Given a fan's current zone and target seat, the navigation response returns a route reflecting live congestion data, or a static route with a `degraded: true` flag.

### 9.2 Non-functional

* \[ ] System sustains 120,000 concurrent simulated users with p99 API latency < 800ms.
* \[ ] Killing the AI Assistant pod does not affect Alert Engine uptime (service isolation test).
* \[ ] Disconnecting one ESP32 device does not affect other devices on the same gateway.

### 9.3 Security

* \[ ] Penetration test finds zero critical vulnerabilities before production sign-off.
* \[ ] 100% of edge-to-cloud traffic sampled in staging is confirmed mTLS-encrypted.

\---

## 10\. Explicitly Out of Scope for v1 (from PRD "Future Enhancements" — do not implement unless re-prioritized)

AI-powered autonomous surveillance, digital twin simulation, AR indoor navigation, predictive maintenance, emotion analysis, smart parking optimization, wearable integration.

\---

## 11\. Open Items (flag to a human — do not guess)

* Exact list of supported languages for FR-04 is not specified in either source document.
* Ticketing platform vendor/API spec (FR-09) is not named.
* RBAC role definitions for Auth Service (FR-10) are not enumerated — need role/permission matrix before implementation.
* Mapping API provider not specified (Section 7 integration list).

