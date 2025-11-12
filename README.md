# 🏥 Davakhana.AI - Intelligent Healthcare Receptionist

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)

**Production-ready AI-powered conversational system for healthcare appointment management**

[Features](#-features) • [Demo](#-demo) • [Quick Start](#-quick-start) • [Documentation](#-documentation) • [Architecture](#-architecture)

</div>

---

## 🌟 Features

### 🤖 Conversational AI
- **Natural Language Processing** - Understands patient requests in plain English
- **Voice Assistant** - Hands-free interaction with speech-to-text and text-to-speech
- **Multi-turn Conversations** - Context-aware dialogue management
- **Smart Intent Recognition** - Automatically detects booking, rescheduling, or cancellation requests

### 📅 Appointment Management
- **Real-time Slot Availability** - Check doctor schedules instantly
- **Automated Booking** - Book appointments with validation and confirmation
- **Reschedule & Cancel** - Flexible appointment modifications
- **Conflict Prevention** - Transaction-safe booking with database locks

### 🔒 Security & Compliance
- **PHI Protection** - HIPAA-aware design with encryption guidelines
- **Row-Level Security** - Supabase RLS policies for data isolation
- **Input Validation** - Comprehensive validation for all patient data
- **Secure Authentication** - JWT-based session management

### 🎨 Modern UI/UX
- **Beautiful Gradient Design** - Modern glass morphism interface
- **Responsive Layout** - Works seamlessly on desktop and mobile
- **Real-time Updates** - Instant feedback and status indicators
- **Accessibility** - Voice input for hands-free operation

### 🛠️ Technical Excellence
- **Structured LLM Responses** - JSON schema validation to prevent hallucination
- **Modular Architecture** - Clean separation of concerns
- **Database Transactions** - ACID-compliant booking operations
- **Comprehensive Testing** - Unit and integration test coverage

---

## 🎬 Demo

```bash
# Try the voice assistant
"I want to book an appointment with Dr. Sarah Johnson for next Monday at 2 PM"

# Check availability
"What slots are available for Dr. Michael Chen this week?"

# Reschedule
"I need to reschedule my appointment to Thursday at 10 AM"
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **Supabase Account** ([Sign up free](https://supabase.com))
- **Groq API Key** ([Get free key](https://console.groq.com/keys))

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/shivambomble/Davakhana.AI-Doctor-Receptionist-AI.git
cd Davakhana.AI-Doctor-Receptionist-AI
```

2. **Install dependencies**
```bash
# Backend dependencies
npm install

# Frontend dependencies
cd frontend && npm install && cd ..
```

3. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your credentials
```

4. **Setup database**
- Go to [Supabase Dashboard](https://supabase.com/dashboard)
- Open SQL Editor
- Run `supabase/schema.sql`
- Run `supabase/rpc_functions.sql`

5. **Start the application**
```bash
# Terminal 1: Backend
npm run dev:backend

# Terminal 2: Frontend
npm run dev:frontend
```

6. **Open your browser**
```
http://localhost:3000
```

---

## 📚 Documentation

- **[API Documentation](API.md)** - Complete API reference
- **[Deployment Guide](DEPLOYMENT.md)** - Production deployment instructions
- **[Security Guidelines](SECURITY.md)** - PHI handling and compliance
- **[Client Examples](examples/client-example.js)** - Integration examples

---

## 🏗️ Architecture

```
davakhana-ai/
├── backend/                    # Node.js + Fastify API Server
│   ├── server.js              # Main server and routes
│   ├── llm.js                 # Groq LLM integration
│   ├── booking-service.js     # Business logic & validation
│   ├── db.js                  # Supabase client & queries
│   └── config.js              # Configuration management
│
├── frontend/                   # React + Vite UI
│   ├── src/
│   │   ├── App.jsx            # Main chat interface
│   │   ├── components/        # Reusable components
│   │   ├── hooks/             # Custom React hooks
│   │   └── api.js             # API client
│   └── index.html
│
├── supabase/                   # Database & Functions
│   ├── schema.sql             # Database schema with RLS
│   └── rpc_functions.sql      # Stored procedures
│
├── tests/                      # Test suites
│   ├── llm.test.js
│   └── booking.test.js
│
└── examples/                   # Integration examples
    └── client-example.js
```

### Technology Stack

**Backend:**
- Node.js 18+ with Fastify
- Supabase (PostgreSQL + Auth + Storage)
- Groq API (Llama 3.3 70B)
- Zod for validation

**Frontend:**
- React 18 with Hooks
- Vite for build tooling
- Web Speech API for voice
- Modern CSS with gradients

**Database:**
- PostgreSQL via Supabase
- Row-Level Security (RLS)
- Stored Procedures (PL/pgSQL)
- Real-time subscriptions ready

---

## 🔧 Configuration

### Environment Variables

```env
# Groq API (LLM Provider)
GROQ_API_KEY=gsk_xxxxx

# Supabase (Database & Auth)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_KEY=eyJxxx...

# Server Configuration
PORT=3001
JWT_SECRET=your-secret-key
NODE_ENV=development
```

### Database Schema

**Core Tables:**
- `doctors` - Doctor profiles and specializations
- `patients` - Patient information (encrypted)
- `appointments` - Appointment records with status
- `doctor_schedules` - Weekly availability patterns
- `clinic_info` - Clinic details and hours

**Key Features:**
- Unique constraints on scheduled appointments only
- Automatic timestamp tracking
- Cascade deletes for data integrity
- Indexed queries for performance

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Test specific functionality
node tests/llm.test.js
node tests/booking.test.js

# Test API endpoints
curl http://localhost:3001/api/doctors
curl http://localhost:3001/api/clinic-info
```

---

## 🚢 Deployment

### Quick Deploy Options

**Railway** (Recommended)
```bash
railway login
railway init
railway up
```

**Render**
- Connect GitHub repository
- Auto-deploy on push

**Docker**
```bash
docker build -t davakhana-ai .
docker run -p 3001:3001 --env-file .env davakhana-ai
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

---

## 🔐 Security

### PHI Protection
- ✅ TLS/HTTPS encryption in transit
- ✅ Database encryption at rest
- ✅ Minimal logging (no PHI in logs)
- ✅ Row-level security policies
- ✅ Input validation and sanitization

### Best Practices
- Never commit `.env` files
- Rotate API keys regularly
- Use service role keys only in backend
- Implement rate limiting in production
- Regular security audits

See [SECURITY.md](SECURITY.md) for complete guidelines.

---

## 📊 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check |
| `GET` | `/api/doctors` | List all doctors |
| `GET` | `/api/clinic-info` | Get clinic details |
| `GET` | `/api/slots` | Get available time slots |
| `POST` | `/api/chat` | Conversational interface |
| `POST` | `/api/appointments` | Book appointment |
| `POST` | `/api/appointments/:id/reschedule` | Reschedule appointment |
| `POST` | `/api/appointments/:id/cancel` | Cancel appointment |
| `GET` | `/api/appointments` | Get patient appointments |

See [API.md](API.md) for detailed documentation.

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 👨‍💻 Author

**Shivam Bomble**

- GitHub: [@shivambomble](https://github.com/shivambomble)
- Email: shivamvbomble@gmail.com

---

## 🙏 Acknowledgments

- [Groq](https://groq.com) for lightning-fast LLM inference
- [Supabase](https://supabase.com) for the amazing backend platform
- [Fastify](https://fastify.io) for the high-performance web framework
- [React](https://react.dev) for the UI framework

---

## 📞 Support

For support, email shivamvbomble@gmail.com or open an issue on GitHub.

---

<div align="center">

**Made with ❤️ for better healthcare accessibility**

[⬆ Back to Top](#-davakhanai---intelligent-healthcare-receptionist)

</div>
