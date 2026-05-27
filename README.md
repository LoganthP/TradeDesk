<div align="center">

# 📈 TerminalAlpha

### AI-Powered Trading Terminal & Market Intelligence Platform

<img src="https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react"/>
<img src="https://img.shields.io/badge/TypeScript-Strict-blue?style=for-the-badge&logo=typescript"/>
<img src="https://img.shields.io/badge/Vite-Lightning-purple?style=for-the-badge&logo=vite"/>
<img src="https://img.shields.io/badge/Node.js-Backend-green?style=for-the-badge&logo=node.js"/>
<img src="https://img.shields.io/badge/WebSocket-Realtime-orange?style=for-the-badge"/>
<img src="https://img.shields.io/badge/Prisma-ORM-black?style=for-the-badge&logo=prisma"/>
<img src="https://img.shields.io/badge/AI-Powered-red?style=for-the-badge"/>

<br/>
<br/>

<img width="100%" src="https://capsule-render.vercel.app/api?type=waving&color=0F172A&height=260&section=header&text=TerminalAlpha&fontSize=52&fontColor=ffffff&animation=fadeIn&fontAlignY=38&desc=Advanced%20AI%20Trading%20Terminal%20Platform&descAlignY=58&descAlign=50"/>

</div>

---

# ✨ Overview

**TerminalAlpha** is a modern AI-enhanced trading terminal designed for traders, analysts, and fintech enthusiasts.

It combines:
- 📊 Advanced financial charting
- 🤖 AI-assisted trading insights
- ⚡ Real-time market simulation
- 💼 Portfolio & order management
- 🌐 WebSocket-powered live updates
- 🧠 Persistent intelligent workspaces

The platform delivers a sleek institutional-grade experience inspired by modern trading terminals.

---

# 🚀 Core Features

## 📊 Advanced Trading Dashboard
- Interactive market charts
- Technical indicators
- Responsive trading workspace
- Real-time updates

## 🤖 AI Trading Assistant
- Gemini AI integration
- OpenRouter AI support
- Context-aware market conversations
- Persistent chat history

## 💼 Portfolio Management
- Create and manage portfolios
- Simulated trading system
- Pending orders
- Market order execution

## 📈 Market Intelligence
- Watchlists
- Alerts system
- Trading panels
- Simulated market news

## ⚡ Real-Time Architecture
- WebSocket communication
- Live workspace synchronization
- Persistent chart settings

## 🌙 Premium UI/UX
- Modern fintech-inspired interface
- Responsive layouts
- Lazy-loaded modules
- Smooth animations

---

# 🧠 System Architecture

```mermaid
flowchart TD

    A[👤 Trader/User] --> B[⚛️ React + Vite Client]

    B --> C[📊 Trading Dashboard]
    B --> D[🤖 AI Assistant]
    B --> E[📈 Market Watchlists]
    B --> F[💼 Portfolio Manager]

    C --> G[📡 WebSocket Layer]
    D --> H[🧠 Gemini/OpenRouter APIs]

    G --> I[🖥️ Node.js + Express Server]

    I --> J[🔐 Authentication Engine]
    I --> K[📂 Trading APIs]
    I --> L[📦 Portfolio Services]

    K --> M[(Prisma ORM)]
    L --> M

    M --> N[(SQLite / PostgreSQL)]

    B --> O[(Zustand Persistent Stores)]

    O --> P[Chart Preferences]
    O --> Q[AI Chat History]
    O --> R[Workspace State]
```

---

# ⚡ System Workflow

```mermaid
sequenceDiagram

    participant User
    participant Client
    participant Server
    participant Database
    participant AI

    User->>Client: Login / Trading Action
    Client->>Server: API Request
    Server->>Database: Fetch / Update Data
    Database-->>Server: Response
    Server-->>Client: Market / Portfolio Data

    User->>Client: Ask AI Assistant
    Client->>AI: AI Request
    AI-->>Client: Trading Insight

    Server-->>Client: WebSocket Updates
```

---

# 🏗️ Tech Stack

| Technology | Purpose |
|---|---|
| React 19 | Frontend UI |
| TypeScript | Type Safety |
| Vite | Build Tool |
| Node.js | Backend Runtime |
| Express.js | API Layer |
| Prisma ORM | Database ORM |
| SQLite / PostgreSQL | Database |
| Zustand | State Management |
| WebSockets | Real-Time Updates |
| Gemini AI | AI Assistant |
| OpenRouter | AI Models |
| Tailwind / CSS | Styling |

---

# 📂 Project Structure

```bash
TerminalAlpha/
│
├── client/
│   ├── public/
│   │
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── layouts/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── stores/
│   │   ├── utils/
│   │   ├── routes/
│   │   └── styles/
│   │
│   ├── package.json
│   └── vite.config.ts
│
├── server/
│   ├── prisma/
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── services/
│   │   ├── websocket/
│   │   └── utils/
│   │
│   ├── package.json
│   └── tsconfig.json
│
├── README.md
└── package.json
```

---

# 📦 Deployment Architecture

```mermaid
flowchart TB

    subgraph USER_LAYER["👤 User Layer"]
        U1[💻 Desktop Browser]
        U2[📱 Mobile Browser]
        U3[📊 Trading Workspace]
    end

    subgraph FRONTEND["⚛️ Frontend Layer (Vercel / Netlify)"]
        F1[React + Vite Client]
        F2[Trading Dashboard]
        F3[AI Assistant UI]
        F4[Chart Engine]
        F5[Zustand Persistent Stores]
    end

    subgraph REALTIME["⚡ Real-Time Communication"]
        W1[WebSocket Gateway]
    end

    subgraph BACKEND["🖥️ Backend Layer (Railway / Render)"]
        B1[Node.js + Express API]
        B2[Authentication Service]
        B3[Trading Engine]
        B4[Portfolio Manager]
        B5[Market Simulation Service]
        B6[Alert & Watchlist Service]
    end

    subgraph DATABASE["🗄️ Database Layer"]
        D1[(PostgreSQL)]
        D2[(Redis Cache - Optional)]
    end

    subgraph AI["🤖 AI Layer"]
        A1[Gemini API]
        A2[OpenRouter Models]
    end

    subgraph STORAGE["☁️ Persistence & State"]
        S1[LocalStorage]
        S2[Session Persistence]
    end

    subgraph DEVOPS["🚀 DevOps & Monitoring"]
        M1[GitHub Actions]
        M2[Health Checks]
        M3[Logging & Monitoring]
    end

    %% USER FLOW
    U1 --> F1
    U2 --> F1
    U3 --> F2

    %% FRONTEND
    F1 --> F2
    F1 --> F3
    F1 --> F4
    F1 --> F5

    %% API COMMUNICATION
    F1 -->|HTTPS REST API| B1
    F1 -->|WebSocket| W1

    %% REALTIME
    W1 --> B1

    %% BACKEND SERVICES
    B1 --> B2
    B1 --> B3
    B1 --> B4
    B1 --> B5
    B1 --> B6

    %% DATABASE
    B2 --> D1
    B3 --> D1
    B4 --> D1
    B5 --> D1
    B6 --> D1

    %% REDIS CACHE
    B1 --> D2

    %% AI
    F3 --> A1
    F3 --> A2

    %% STORAGE
    F5 --> S1
    F5 --> S2

    %% DEVOPS
    M1 --> FRONTEND
    M1 --> BACKEND

    M2 --> B1
    M3 --> B1
```

---

# 🌐 Production Deployment Flow

```mermaid
sequenceDiagram

    participant User
    participant Frontend
    participant API
    participant WebSocket
    participant Database
    participant AI

    User->>Frontend: Open Trading Terminal

    Frontend->>API: Authenticate User
    API->>Database: Validate Credentials
    Database-->>API: User Data
    API-->>Frontend: JWT Token

    Frontend->>API: Request Portfolio
    API->>Database: Fetch Portfolio
    Database-->>API: Portfolio Data
    API-->>Frontend: Portfolio Response

    Frontend->>WebSocket: Connect Real-Time Channel
    WebSocket-->>Frontend: Market Updates

    User->>Frontend: Execute Trade
    Frontend->>API: Submit Order
    API->>Database: Save Order
    API-->>Frontend: Order Confirmation

    User->>Frontend: Ask AI Assistant
    Frontend->>AI: AI Trading Request
    AI-->>Frontend: Trading Insight
```

---

# ☁️ Recommended Hosting Architecture

| Layer | Recommended Platform |
|---|---|
| Frontend | Vercel / Netlify |
| Backend API | Railway / Render |
| Database | Neon PostgreSQL / Supabase |
| WebSockets | Railway Persistent Services |
| AI Providers | Gemini + OpenRouter |
| CI/CD | GitHub Actions |
| Monitoring | UptimeRobot + Railway Metrics |

---

# 🔐 Security Architecture

```mermaid
flowchart LR

    A[👤 User Login] --> B[🔐 JWT Authentication]

    B --> C[🛡️ Protected API Routes]

    C --> D[📦 Express Middleware]

    D --> E[(PostgreSQL)]

    C --> F[⚡ Rate Limiting]

    C --> G[🌐 CORS Protection]

    C --> H[🔒 Environment Variables]
```

---

# 🚀 CI/CD Pipeline

```mermaid
flowchart LR

    A[👨‍💻 Developer Push] --> B[GitHub Repository]

    B --> C[GitHub Actions]

    C --> D[Run Tests]
    C --> E[Build Client]
    C --> F[Build Server]

    E --> G[Vercel Deployment]
    F --> H[Railway Deployment]

    G --> I[🌐 Live Frontend]
    H --> J[🖥️ Live API]
```

---

# 🔐 Environment Variables

## 🌐 Client

```env
VITE_API_URL="https://your-api.example.com/api"
VITE_WS_URL="wss://your-api.example.com"
VITE_GEMINI_API_KEY=""
VITE_OPENROUTER_API_KEY=""
```

---

## 🖥️ Server

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="use-a-long-random-production-secret"
JWT_EXPIRES_IN="7d"
PORT=3001
NODE_ENV="production"
CORS_ORIGIN="https://your-client.example.com"
```

---
# 🚀 Server Setup Guide

## 📁 Required Folder Structure

```bash
server/
│
├── prisma/
│   └── schema.prisma
│
├── src/
│
├── .env
│
├── package.json
│
└── dev.db
```

---

### ⚙️ Step 1 — Create `.env`

Inside the `server` folder create:

```bash
.env
```

Add:

```env
DATABASE_URL="file:./dev.db"

JWT_SECRET="supersecretkey123"
```

---

### 🛠️ Step 2 — Generate Prisma Client

```bash
npx prisma generate
```

---

### 🗄️ Step 3 — Create & Sync Database

```bash
npx prisma db push
```

---

### 📦 Step 4 — Install Dependencies

```bash
npm install
```
---

# ▶️ Step 5 — Start Server

```bash
npm run dev
```

---

# ✅ Expected Output

```bash
🚀 Paper Trading Server is running on port 3001
👉 CORS Origin allowed: http://localhost:5173
```

---

# 🔄 Full Startup Commands

```bash
npx prisma generate

npx prisma db push

npm install

npm run dev
```

---

## ❗ If bcrypt Error Occurs

Install bcrypt packages:

```bash
npm install bcryptjs

npm install -D @types/bcryptjs
```

---

## 🌐 Frontend API URL

Inside `client/.env`:

```env
VITE_API_URL="http://localhost:3001/api"
```

---

## 🧪 Verify Backend

Open:

```bash
http://localhost:3001
```

If you see:

```bash
Cannot GET /
```
the backend is running correctly.

---

# 🛠️ Installation

## Clone Repository

```bash
git clone https://github.com/LoganthP/TerminalAlpha.git
```

---

## Install Client

```bash
cd client
npm install
```

---

## Install Server

```bash
cd ../server
npm install
```

---

# ▶️ Run Development Environment

## Start Client

```bash
cd client
npm run dev
```

---

## Start Server

```bash
cd server
npm run dev
```

---

# 🚀 Production Build

## Build Client

```bash
cd client
npm run build
```

---

## Build Server

```bash
cd server
npm run build
npm run start
```

---

# 📊 Trading Features

| Feature | Status |
|---|---|
| Portfolio Management | ✅ |
| Market Orders | ✅ |
| Pending Orders | ✅ |
| AI Assistant | ✅ |
| Chart Persistence | ✅ |
| WebSocket Updates | ✅ |
| Watchlists | ✅ |
| Alerts | ✅ |
| Responsive UI | ✅ |
| Lazy Loading | ✅ |

---

# 🤖 AI Integration

## Supported AI Providers

- Gemini API
- OpenRouter Models

### AI Features
- Trading conversations
- Market explanations
- Strategy discussions
- Persistent AI history

---

# 🔥 Performance Optimizations

- ⚡ Route-level lazy loading
- ⚡ Vite manual chunk splitting
- ⚡ Zustand persistence
- ⚡ Optimized production builds
- ⚡ WebSocket live updates

---

# 📈 Production Readiness

## ✅ Validated

- TypeScript strict mode enabled
- Production builds passing
- Secure environment handling
- Persistent state architecture
- Lazy-loaded routing
- Optimized bundle splitting

## ⚠️ Follow-Up Work

- Replace simulated data with real providers
- Improve ESLint compliance
- Add provider-specific deployment configs
- Institutional-grade QA testing

---

# 🧪 Deployment Checklist

```bash
cd client
npm run build

cd ../server
npm run build
```

---

# ✅ Smoke Tests

- Authentication flow
- Dashboard rendering
- Trading operations
- Portfolio reset
- AI assistant responses
- Responsive layouts
- WebSocket updates

---

# 🌟 Future Roadmap

- 📡 Real market data integration
- 🏦 Brokerage connectivity
- 📊 Institutional analytics
- 🤖 Advanced AI trading agents
- ☁️ Cloud workspace sync
- 📱 Mobile application
- 🔔 Real push notifications

---

# 🤝 Contributing

Contributions are welcome!

```bash
Fork → Clone → Create Branch → Commit → Push → Pull Request
```

---

# 📜 License

This project is licensed under the MIT License.
