# Technical Requirements Document (TRD) — StadiumAI

## 1. System Architecture Diagram

```
      [Fan Portal App (Vite)]          [Operator Dashboard (Vite)]
                  │                               │
                  └──────────────┬────────────────┘
                                 │ Socket.IO / HTTPS
                                 ▼
                           [API Gateway]
              (Express, Helmet, Rate Limiter, CORS)
                                 │
             ┌───────────────────┼───────────────────┐
             ▼                   ▼                   ▼
       [Auth Service]     [Alert Engine]       [Chatbot Service]
             │                   │                   │
             └───────────────────┼───────────────────┘
                                 ▼
                  [In-Memory Mock Database Store]
                                 ▲
             ┌───────────────────┴───────────────────┐
             ▼                                       ▼
     [Sensor Simulator]                      [Alert Simulator]
```

---

## 2. API Specifications & Data Schemas

### 2.1 User Profile Schema
```json
{
  "id": "uuid",
  "name": "string",
  "email": "string",
  "password": "string (bcrypt hash)",
  "role": "fan | staff | admin",
  "preferred_language": "string (ISO 639-1)",
  "zone_id": "string",
  "seat": "string",
  "ticket_class": "string"
}
```

### 2.2 Alert Schema (Spec 3.2)
```json
{
  "alert_id": "uuid",
  "type": "congestion | medical | unauthorized_access | lost_child | equipment | weather",
  "severity": "low | medium | high | critical",
  "zone_id": "string",
  "timestamp": "ISO8601",
  "recommended_action": "string",
  "status": "open | acknowledged | resolved",
  "assigned_staff_id": "string | null"
}
```

---

## 3. Generative AI Model Specifications & Latency Budgets
- **Conversational LLM:** Input: `ChatbotRequest` | Output: `ChatbotResponse`. Latency budget: <2s. Fallback: Local canned FAQ handlers when timeouts hit `AI_MODEL_TIMEOUT_MS` (2000ms).
- **Proximity Recommendation Engine:** Dijkstra shortest path navigation engine incorporating real-time density multipliers. Latency budget: <500ms. Fallback: Static shortest path routing (without density weights).

---

## 4. Security & Cryptographic Safeguards
1. **Secrets Isolation:** No API keys or environment secrets committed to repository. Env variables strictly loaded from outside source.
2. **Auth Controls:** Signed JWT Bearer tokens verified via Express middlewares.
3. **Connection Security:** Express headers secured via `helmet` security suite.
4. **IoT / ESP32 Edge Device Safeguards:**
   - **Flash Encryption:** Telemetry encrypted at rest via hardware keys.
   - **Secure Boot:** Boot signature validation preventing custom firmware uploads.
   - **mTLS 1.3 Transmission:** Certificate-based client authentication terminates at Edge Gateway.
   - **Replay Protection:** Request nonces with timestamp validation within 30 seconds window.
