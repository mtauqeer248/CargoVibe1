# 🚚 CargoVibe – Truck Parking Request Manager

A fullstack monorepo for managing truck parking requests at logistics facilities.

```
cargovibe/
├── backend/     Express + TypeScript API (Azure Functions–compatible)
├── mobile/      Expo React Native app (iOS · Android · Web)
└── README.md
```

---

## Quick Start

### 1. Backend

```bash
cd backend
npm install
npm run dev           # → http://localhost:7071
```

The server starts with 3 seeded demo requests.

### 2. Mobile App

```bash
cd mobile
npm install
npm run web           # Browser at http://localhost:8081
npm run android       # Android emulator
npm run ios           # iOS simulator (macOS only)
```

> **Native device**: set `EXPO_PUBLIC_API_URL=http://<your-LAN-IP>:7071` in `mobile/.env`
>
> Example: `EXPO_PUBLIC_API_URL=http://192.168.1.42:7071`

---

## Backend API

Base URL: `http://localhost:7071`

| Method   | Path                             | Description                        |
|----------|----------------------------------|------------------------------------|
| `GET`    | `/parking-requests`              | List all requests (newest first)   |
| `GET`    | `/parking-requests/:id`          | Retrieve a single request          |
| `POST`   | `/parking-requests`              | Create a new request               |
| `PATCH`  | `/parking-requests/:id/status`   | Update status + optional spot/note |
| `DELETE` | `/parking-requests/:id`          | Delete (non-final states only)     |
| `POST`   | `/ai/chat`                       | AI assistant (natural language)    |
| `GET`    | `/health`                        | Health check                       |

### Status Transition Model

```
pending ──► approved ──► checked_in ──► checked_out  (final)
        └──► rejected                                  (final)
```

Final states (`rejected`, `checked_out`) are immutable and cannot be deleted.

### Example: Create a Request

```bash
curl -X POST http://localhost:7071/parking-requests \
  -H "Content-Type: application/json" \
  -d '{
    "driverName": "Hans Müller",
    "licensePlate": "B-LK 1234",
    "truckType": "semi",
    "requestedFrom": "2026-06-10T08:00:00Z",
    "requestedUntil": "2026-06-10T14:00:00Z"
  }'
```

### Example: Approve with Parking Spot

```bash
curl -X PATCH http://localhost:7071/parking-requests/<id>/status \
  -H "Content-Type: application/json" \
  -d '{ "status": "approved", "parkingSpotId": "SPOT-A3" }'
```

### Example: AI Assistant

```bash
curl -X POST http://localhost:7071/ai/chat \
  -H "Content-Type: application/json" \
  -d '{ "message": "How many pending requests are there?" }'
```

---

## Running Tests

```bash
cd backend
npm test              # Unit + integration tests (Jest)
npm test -- --coverage
```

**Current coverage:** 36 tests · 100% on routes · ~82% overall

---

## Architecture Decisions

### Why Express instead of native Azure Functions?

Azure Functions can be hosted locally via the `func` CLI, but it requires the
Azure Functions Core Tools to be globally installed — which is not cross-platform
friendly out of the box. Instead, the backend uses **Express** with the same
handler signatures and structure as Azure Functions HTTP triggers, making it
trivially portable: drop each router function into an Azure Function trigger
with minimal adapter code. Port `7071` mirrors the Azure Functions local default.

### Why in-memory storage?

The brief asks for a **local** app. Introducing a database (SQLite, Postgres)
adds setup friction that doesn't demonstrate more about the API design or
business logic. The repository pattern (`ParkingRequestRepository`) cleanly
abstracts the storage layer — swapping to a real DB only requires replacing
the `Map` with DB queries inside the repository class.

### State machine as first-class concept

The transition model lives in a single source of truth (`STATUS_TRANSITIONS`)
shared by both backend and mobile. This prevents "impossible state" bugs and
makes the rules self-documenting.

### AI Integration

The `POST /ai/chat` endpoint injects a live snapshot of all parking requests
as context into each Claude API call. This lets operators query in natural
language ("any tankers arriving before noon?") and receive structured
`suggestedAction` responses the app can execute automatically — a conversational
co-pilot on top of the structured data.

---

## What I'd add with more time

- **Persistence**: SQLite via `better-sqlite3` or a real Azure Table Storage adapter
- **Auth**: JWT middleware so only authorised staff can approve/reject
- **Push notifications**: Expo Notifications when a request is approved
- **Optimistic updates**: Instant UI feedback before the API confirms
- **Pagination**: cursor-based for the list endpoint
- **E2E tests**: Detox for native, Playwright for web
