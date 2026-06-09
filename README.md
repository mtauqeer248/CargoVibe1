# CargoVibe 🚚

A fullstack application for managing truck parking requests.

Built with **Azure Functions v4** (TypeScript) and **Expo** (React Native + Web).

---

## Project Structure

```
cargovibe/
├── backend/     Azure Functions API (TypeScript)
└── mobile/      Expo mobile app (iOS · Android · Web)
```

---

## Getting Started

### Prerequisites

- Node.js v18+ — `brew install node`
- Expo Go app on your phone (optional)

### 1. Backend

```bash
cd backend
npm install
npm run dev
```

Runs at `http://localhost:7071/api`

### 2. Mobile

```bash
cd mobile
npm install
npm run web       # opens in browser at http://localhost:8081
npm start         # scan QR code with Expo Go on your phone
```

> **On a real device:** create `mobile/.env` and add:
> `EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:7071/api`

---

## API Endpoints

Base URL: `http://localhost:7071/api`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/parking-requests` | List all requests |
| `GET` | `/parking-requests/:id` | Get a single request |
| `POST` | `/parking-requests` | Create a new request |
| `PATCH` | `/parking-requests/:id/status` | Update status |
| `DELETE` | `/parking-requests/:id` | Delete a request |
| `POST` | `/ai/chat` | AI assistant |
| `GET` | `/health` | Health check |

### Status Transitions

```
pending ──► approved ──► checked_in ──► checked_out  (final)
        └──► rejected                                  (final)
```

Final states cannot be modified or deleted.

---

## Running Tests

```bash
cd backend
npm test
```

34 tests — repository unit tests and Azure Function handler tests.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Azure Functions v4, TypeScript, Express (local adapter) |
| Mobile | Expo, React Native, TypeScript |
| AI | Claude API (Anthropic) |
| Tests | Jest |

---

## AI Assistant

The app includes an AI-powered chat assistant. Tap the **✦ AI** button on the list screen to ask questions like:

- *"How many pending requests are there?"*
- *"Are there any tankers arriving today?"*
- *"Summarise the current status"*

Requires an Anthropic API key. Add it to `backend/.env`:

```
ANTHROPIC_API_KEY=your-key-here
```

---

## Architecture Notes

See [DECISIONS.md](./DECISIONS.md) for a full explanation of every technical decision made.
