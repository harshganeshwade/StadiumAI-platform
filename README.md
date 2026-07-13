# StadiumAI — FIFA World Cup 2026 Stadium Operations Platform

StadiumAI is a state-of-the-art, real-time stadium operations and fan engagement platform designed for the FIFA World Cup 2026 at MetLife Stadium. The system leverages artificial intelligence, computer vision, and IoT sensor networks to manage crowd flows, triage emergencies, and provide personalized assistant services.

## 🌐 Live Deployments
* **Operator/Staff Dashboard (Vercel):** [https://stadium-ai-dashboard.vercel.app/](https://stadium-ai-dashboard.vercel.app/)
* **Fan Portal Application (Vercel):** [https://stadium-ai-fan-app.vercel.app/](https://stadium-ai-fan-app.vercel.app/)
* **Operations Backend (Render):** [https://stadium-ai-backend.onrender.com](https://stadium-ai-backend.onrender.com)
* **GitHub Repository:** [https://github.com/harshganeshwade/StadiumAI-platform](https://github.com/harshganeshwade/StadiumAI-platform)

---

## 📖 1. Product Requirements Document (PRD)

### System Purpose & Core Value Proposition
Major tournaments like the FIFA World Cup 2026 present unprecedented crowd control, physical safety, and logistical challenges. StadiumAI acts as an operational central nervous system, connecting fans and stadium operators in real-time. By bridging edge sensor telemetry and generative AI, the platform automates crowd congestion alerts, streamlines emergency reporting, and ensures fans have a friction-free matchday experience.

### Core Users
1. **Fans:** Navigating seating, restrooms, concession lines, requesting AI help, and receiving immediate safety announcements.
2. **Operations Staff & Managers:** Tracking crowd densities in real-time, triaging alerts, assigning incident response staff, and monitoring overall stadium health.

---

## ⚙️ 2. Technical Requirements Document (TRD)

### System Architecture Diagram
```
[Fan Portal App (Vite)]   [Operator Dashboard (Vite)]
         │                          │
         └─────────────┬────────────┘
                       │ HTTPS / Socket.IO
                       ▼
                 [API Gateway] 
        (Express Routing, CORS, Rate Limiting)
                       │
         ┌─────────────┼─────────────┐
         ▼             ▼             ▼
   [Auth Service]  [Alert Engine]  [Chatbot LLM Service]
         │             │             │
         └─────────────┼─────────────┘
                       ▼
         [In-Memory Mock Database Store]
                       ▲
         ┌─────────────┴─────────────┐
         ▼                           ▼
  [Sensor Simulator]        [Alert Simulator]
```

### Key Technical Specs
* **Frontend Stack:** React, Vite, Framer Motion, Vanilla CSS, Tailwind, Lucide React icons.
* **Backend Stack:** Node.js, Express, Socket.IO (for real-time bidirectionality), JWT (JsonWebTokens), Bcrypt.js.
* **Hosting:** Vercel (Frontends) + Render (Backend Web Service).

---

## 🗄️ 3. Database Schema

The backend uses a thread-safe, mock operational memory database representing the schema constraints for Postgres/Redis storage.

### 1. Users Schema
```json
{
  "id": "string (UUID / Slug)",
  "name": "string",
  "email": "string (Unique)",
  "password": "string (Bcrypt hash)",
  "role": "fan | staff | admin",
  "preferred_language": "string (ISO 639-1)",
  "zone_id": "string",
  "seat": "string",
  "ticket_class": "string"
}
```

### 2. Alerts Schema
```json
{
  "alert_id": "string (UUID)",
  "type": "congestion | medical | security | fire | weather",
  "severity": "low | medium | high | critical",
  "zone_id": "string",
  "message": "string",
  "recommended_action": "string",
  "status": "open | acknowledged | resolved",
  "assigned_staff_id": "string | null",
  "timestamp": "ISO8601 string"
}
```

---

## 🔌 4. API Documentation

### Authentication Routes
* `POST /api/auth/register` — Register a new user.
* `POST /api/auth/login` — Login user, returning JWT token + user metadata.
* `POST /api/auth/reset-password` — Simulate password reset and verification.

### Crowd Analytics Routes
* `GET /api/crowd/density` — Retrieve real-time estimated capacity & density levels for all stadium gates.

### Incident/Alert Management Routes
* `GET /api/alerts` — Fetch all active and past alerts.
* `PATCH /api/alerts/:id` — Update alert status (`acknowledged` or `resolved`).

### Chatbot Routes
* `POST /api/chat` — Send a query to the AI Assistant.

---

## 🤖 5. Generative AI Implementation

### GenAI Locations & Integration
* **Multilingual AI Stadium Assistant (FR-01, FR-04):** Built directly into the **Fan App**. It acts as a concierge guiding fans with natural language.
* **Personalized Context Injection:** The backend constructs prompt context dynamically, injecting the fan's name, ticket tier, current zone, and seat position before executing.

### AI Engine Workflow & Fallback
```
   [User Message] -> [Inject Local Context (Seat, Zone, Language)]
                            │
                            ▼
              [Attempt GenAI Assistant Service]
                 /                         \
         (Success)                         (Failure / Timeout)
            ▼                                      ▼
  [Return Custom response]            [Fall back to canned QA handler]
```
If the LLM engine times out or encounters a connection issue, it automatically degrades gracefully to local heuristic FAQ answers ensuring zero downtime.

---

## 🛠️ 6. Feature List & User Guide

### For Fans
1. **Matchday Hub:** Live view of the score, live count of active fans, and real-time gate congestion charts.
2. **Interactive Navigation:** Stadium routing showing active density/congestion levels along the path.
3. **Explore Services:** Browse food courts, merchandise, and parking zones with automated order placement.
4. **Emergency Alerts Banner:** Instant notifications during stadium-wide high-severity congestion or weather alerts.

### For Operators/Dashboard
1. **Live Analytics KPIs:** Total Active Incidents, Solved Incidents, Average Response Time, and System Operational Status.
2. **Active Heatmap:** Visualize live crowd counts and density states per zone.
3. **Incident Triage:** Live feed of incoming alerts with quick action triggers for staff to acknowledge and resolve incidents.

---

## 🛡️ 7. Security Best Practices

* **No Secrets Committed:** Environment variables are strictly stored outside code. `.gitignore` prevents `.env`, build folders, and `.vercel` data from reaching GitHub.
* **Token Protection:** Authenticated actions require signed JSON Web Tokens (JWT) passed in the `Authorization` header.
* **Password Encryption:** User passwords are encrypted locally and in the database using `bcryptjs` with salt hashing.
* **CORS Origin Safety**: Restricts access and safely manages credentials across Vercel frontend domains.
* **Enforced HTTPS:** Fully served under SSL/TLS on Render and Vercel.

---

## 🚀 Future Scope
1. **ESP32 Edge Gateway Integration:** Direct telemetry from physical hardware via mTLS 1.3 protocol.
2. **Predictive Analytics:** Forecasting bottleneck zones 30 minutes in advance using historic flow rates.
3. **Autonomous Surveillance Alerts:** Interfacing direct computer vision analytics cameras with emergency dispatches.
