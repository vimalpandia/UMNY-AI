# UMNY AI

> **Tagline:** Your Intelligence. Your Assistant. Your World.

![UMNY AI Logo](frontend/public/logo.svg)

**UMNY AI** is a production-ready, full-stack multi-model artificial intelligence platform. Designed as an independent assistant with its own distinct architecture, futuristic dark interface, and autonomous agent runtime, UMNY AI unifies the reasoning of Groq (Free LPU Developer API), Google Gemini, OpenAI GPT-4o, and Anthropic Claude alongside long-term user memory, document analysis, voice processing, and tool calling.

---

## 🌟 Key Features

### 1. Multi-Model Foundational Intelligence
- **Modular AI Provider Architecture**: Seamlessly route queries between Groq LPU (`llama-3.1-8b-instant`, `mixtral-8x7b-32768`), Google Gemini (`gemini-2.5-flash`, `gemini-2.5-pro`), OpenAI (`gpt-4o`, `gpt-4o-mini`), and Anthropic Claude (`claude-3-5-sonnet`, `claude-3-5-haiku`). Dynamic model discovery via `GET https://api.groq.com/openai/v1/models`.
- **Free Developer Tier Ready**: Built-in native integration for Groq's high-speed free developer tier API.
- **Real-Time Streaming**: High-throughput Server-Sent Events (SSE) streaming with cancellation and retry support.
- **Provider Redundancy**: Gracefully reports provider key availability with zero application crashes.

### 2. Long-Term Memory System
- **MongoDB Atlas Persistence**: Remembers user-approved facts, preferences, project guidelines, and technical parameters across chats.
- **Contextual Retrieval**: Dynamically injects only relevant memories into the AI context before generation.
- **Strict Privacy**: Every memory is isolated to the authenticated user account and never shared across accounts.
- **Full User Control**: Inspect, search, manually record, delete, or toggle memory on/off at any time.

### 3. Autonomous AI Agent & Tool Execution
- **Multi-Step Execution Pipeline**: Intent Detection → Task Planning → Tool Selection → Permission Validation → Tool Execution → Verification → Synthesis.
- **Modular Tools Included**:
  - 🌐 **Web Intelligence Search**: Live public web search via DuckDuckGo and semantic snippets without paid search subscription barriers.
  - 🧮 **Scientific Math Engine**: Mathematical equation and formula solver with strict AST/operator sanitization.
  - 📄 **Document & Data Parser**: Semantic keyword search and structural inspection of uploaded text.
  - 📝 **Executive Summarizer**: Dense highlight and bullet extraction.
- **Enterprise Safety Guardrails**:
  - Maximum tool iteration limit (5 steps).
  - 15-second per-tool timeout; 60-second total cycle timeout.
  - No arbitrary shell or system execution.
  - Interactive confirmation prompts for side-effect actions.

### 4. File Upload & Document Analysis
- **Supported Formats**: PDF, TXT, DOCX, CSV, PNG, JPEG, WEBP.
- **MIME & Magic Byte Verification**: Validates file types by content rather than file extensions alone.
- **15MB Safe Upload Limits**: Multipart processing via Multer with automatic directory creation.
- **Tabular & Text Processing**: Extracts text and tabular CSV schemas directly into conversation context.

### 5. Voice Assistant
- **Bilingual Interface**: Speech-to-Text and Text-to-Speech support for English (`en-US`) and Hindi (`hi-IN`).
- **Real-time Audio Visualizer**: Pulsing frequency wave animations during voice capture.
- **Audio Synthesis**: Clean readout of assistant responses with code block suppression for clear listening.

### 6. Admin Telemetry & User Management
- **Protected Administrator Console**: Role-based access control (`admin` role required).
- **Live Metrics**: Total users, total conversations, message counts, and token consumption.
- **Provider Breakdown**: Visual usage share across Google, OpenAI, and Anthropic.
- **System Health Monitor**: Live database connection status, Node runtime version, and memory load.

### 7. Modern UI / UX
- **Futuristic Aesthetics**: Deep charcoal (`#07090e`, `#0b0f17`) background with glowing purple, blue, and cyan accents.
- **Markdown & Code Highlighting**: Syntax highlighted code blocks with language badges and one-click copy.
- **Message Editing & Regeneration**: Edit user prompts and regenerate assistant responses.
- **Fully Responsive**: Optimized for desktop, tablet, and mobile with sliding drawers.

---

## 🛠 Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite 6, Tailwind CSS 3, Lucide React, React Markdown, Remark GFM, Rehype Highlight |
| **Backend** | Node.js (v18+), Express.js, Server-Sent Events (SSE), Socket.IO, Multer, Helmet, CORS |
| **Database** | MongoDB Atlas, Mongoose 8 ODM |
| **Authentication** | JWT (JSON Web Tokens), bcryptjs password hashing, role-based authorization |
| **AI Providers** | `@google/generative-ai`, `openai`, `@anthropic-ai/sdk` |
| **Parsers** | `pdf-parse`, `mammoth` (DOCX), `csv-parser`, `cheerio` |
| **Deployment** | Render, GitHub, Docker/Node container |

---

## 📁 Repository Structure

```
UMNY/
├── backend/
│   ├── src/
│   │   ├── config/             # Database connection, env variables, constants
│   │   ├── controllers/        # Auth, AI, Conversation, Memory, File, Admin controllers
│   │   ├── middleware/         # JWT Auth, RBAC, Rate limiter, File upload, Error handler
│   │   ├── models/             # Mongoose schemas (User, Conversation, Message, Memory, etc.)
│   │   ├── routes/             # Express API routes
│   │   ├── services/
│   │   │   ├── ai/             # Multi-model providers (Gemini, OpenAI, Anthropic, AIService)
│   │   │   ├── memory/         # Long-term memory engine & prompt context builder
│   │   │   ├── agents/         # Autonomous agent runtime & tool implementations
│   │   │   └── files/          # PDF, DOCX, CSV, TXT safe extractors
│   │   ├── utils/              # JWT helpers, token encoders
│   │   ├── validators/         # Input validation schemas (express-validator)
│   │   ├── app.js              # Express app configuration & middleware
│   │   └── server.js           # Server lifecycle & graceful shutdown
│   ├── tests/                  # Automated Jest & Supertest test suites
│   ├── .env.example            # Backend environment variables template
│   └── package.json
├── frontend/
│   ├── public/                 # Favicon, UMNY AI SVG logo
│   ├── src/
│   │   ├── components/         # ChatArea, Sidebar, Header, Modals (Memory, Agent, Settings)
│   │   ├── context/            # AuthContext, ChatContext, ThemeContext, AgentContext
│   │   ├── services/           # Axios API client, auth, chat, memory, file services
│   │   ├── pages/              # ChatPage, LoginPage, RegisterPage
│   │   ├── App.jsx             # Protected routing
│   │   ├── main.jsx            # React root
│   │   └── index.css           # Tailwind base styles, scrollbars, glowing accents
│   ├── index.html
│   ├── vite.config.js          # Vite config with API proxy
│   ├── tailwind.config.js      # Custom theme colors and glow animations
│   └── package.json
├── render.yaml                 # Blueprint for single-click Render deployment
├── .gitignore                  # Git ignore rules for node_modules, .env, build outputs
├── README.md                   # Complete architectural and operational guide
└── package.json                # Root package with monorepo orchestration scripts
```

---

## 🚀 Quick Start & Local Setup

### Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **npm**: v9.0.0 or higher
- **MongoDB**: MongoDB Atlas connection string or local MongoDB instance

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/your-username/umny-ai.git
cd umny-ai

# Install root, backend, and frontend packages with a single command:
npm run install:all
```

### 2. Configure Environment Variables

Create a `.env` file inside the `backend/` folder (or copy from `.env.example`):

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/umny_ai?retryWrites=true&w=majority
JWT_SECRET=super_secret_jwt_key_at_least_32_characters_long
JWT_EXPIRES_IN=7d

# Initial Administrator Seed Credentials
INITIAL_ADMIN_EMAIL=admin@umny.ai
INITIAL_ADMIN_PASSWORD=Admin@123456

# AI Provider API Keys (add your keys here)
GEMINI_API_KEY=your_gemini_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
GROQ_API_KEY=your_groq_api_key_here
GROQ_BASE_URL=https://api.groq.com/openai/v1
GROQ_MODEL=llama-3.1-8b-instant
```

### 3. Build & Run Locally

#### Development Mode (Concurrent Frontend & Backend):
```bash
npm run dev
```
- Frontend will be accessible at: `http://localhost:5173`
- Backend API will be running at: `http://localhost:5000`

#### Production Build & Run:
```bash
# 1. Build frontend
npm run build

# 2. Run backend (which serves both API and built frontend)
npm start
```
- Access the complete platform at: `http://localhost:5000`

---

## 🧪 Automated Testing

UMNY AI includes a comprehensive Jest test suite covering authentication, database operations, conversation persistence, memory retrieval, agent tool execution, and provider routing:

```bash
# Run all backend test suites
npm test
```

---

## ☁️ Deployment on Render

This repository includes a pre-configured `render.yaml` blueprint for one-click deployment on [Render](https://render.com).

### Render Deployment Steps:
1. Push your repository to GitHub.
2. In your Render Dashboard, click **New +** → **Blueprint**.
3. Select your GitHub repository.
4. Render will read `render.yaml` and configure the web service automatically.
5. In the Render service settings, configure your environment variables:
   - `MONGODB_URI`: Your MongoDB Atlas cluster connection string.
   - `GROQ_API_KEY`: Groq API key from https://console.groq.com/keys (Recommended free provider).
   - `GROQ_BASE_URL`: `https://api.groq.com/openai/v1`
   - `GROQ_MODEL`: `llama-3.1-8b-instant` (or any active model from Groq)
   - `GEMINI_API_KEY`: Google Gemini API key (optional).
   - `OPENAI_API_KEY`: OpenAI API key (optional).
   - `ANTHROPIC_API_KEY`: Anthropic Claude API key (optional).
   - `INITIAL_ADMIN_PASSWORD`: Secure password for initial admin seed account.
6. Trigger manual deploy. Once built, your UMNY AI platform will be live with full SSL and zero CORS issues!

---

## 📡 Backend API Reference

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Service health check & platform info | No |
| `POST` | `/api/auth/register` | Register new user account | No |
| `POST` | `/api/auth/login` | Sign in & receive JWT token | No |
| `GET` | `/api/auth/me` | Fetch active user session profile | Yes |
| `PUT` | `/api/users/profile` | Update user name & preferences | Yes |
| `GET` | `/api/models` | List supported AI models | No |
| `POST` | `/api/ai/chat/stream` | Stream AI generation via SSE | Yes |
| `GET` | `/api/conversations` | List user conversation threads | Yes |
| `POST` | `/api/conversations` | Create a new conversation | Yes |
| `DELETE` | `/api/conversations/:id`| Delete conversation & message history | Yes |
| `GET` | `/api/messages/:id` | Fetch messages for conversation | Yes |
| `GET` | `/api/memories` | List user long-term memories | Yes |
| `POST` | `/api/memories` | Store new user-approved memory | Yes |
| `DELETE`| `/api/memories/:id` | Delete stored memory | Yes |
| `GET` | `/api/agents/tools` | List autonomous agent tools | Yes |
| `POST` | `/api/files/upload` | Upload & extract text (PDF/DOCX/CSV) | Yes |
| `GET` | `/api/voice/status` | Check voice STT/TTS engine status | Yes |
| `GET` | `/api/usage/my-stats` | Get personal token usage statistics | Yes |
| `GET` | `/api/admin/stats` | View enterprise platform metrics | Yes (Admin) |
| `GET` | `/api/admin/users` | Manage registered accounts | Yes (Admin) |
| `PUT` | `/api/admin/users/:id/role`| Update user role | Yes (Admin) |

---

## 🔒 Security Architecture

- **Token Security**: Stateless JWTs with signature verification and automatic expiration.
- **Password Protection**: Passwords salted and hashed with `bcryptjs` (salt rounds: 10). Passwords are never returned in JSON.
- **Resource Ownership**: All conversation, message, file, and memory queries enforce ownership checks (`{ _id: id, userId }`).
- **HTTP Hardening**: Helmet security headers, configurable CORS origin, rate limiters on auth (30/15m) and AI generation (60/1m).
- **Safe Agent Execution**: Strict parameter sanitization with no shell execution; 15s execution timeouts.

---

## 📄 License
This project is licensed under the MIT License.

