# Doctor Receptionist AI

Production-ready conversational AI system for clinic appointment management.

## Features
- Natural language appointment booking/rescheduling/cancellation
- Doctor schedule checking and slot availability
- Patient information collection and validation
- Common queries (hours, fees, address)
- Structured LLM responses with action schemas
- Supabase backend with RLS policies
- OpenRouter integration (Gemini 2.0 Flash)

## Architecture
```
├── backend/          # Node.js API server (Fastify)
├── frontend/         # React chat UI
├── supabase/         # DB schema, migrations, RPC functions
└── tests/            # Integration tests
```

## Prerequisites
- Node.js 18+
- Supabase account (free tier works)
- OpenRouter API key (free tier available)

## Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Configure environment variables:**
```bash
cp .env.example .env
# Edit .env with your credentials
```

3. **Setup Supabase:**
```bash
# Run migrations in Supabase SQL Editor
# See supabase/schema.sql
```

4. **Start backend:**
```bash
npm run dev:backend
```

5. **Start frontend:**
```bash
npm run dev:frontend
```

## Environment Variables

```
OPENROUTER_API_KEY=your_key_here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key
JWT_SECRET=your_jwt_secret
PORT=3001
```

## Security Notes
- **PHI Protection**: Use TLS in production, enable Supabase encryption at rest
- **Minimal Logging**: Never log patient details or conversation content
- **RLS Policies**: Enforce row-level security on all tables
- **API Keys**: Store in environment variables, never commit to git

## API Endpoints

- `POST /api/chat` - Send message, get AI response
- `GET /api/slots?doctor_id=X&date=YYYY-MM-DD` - Get available slots
- `POST /api/appointments` - Book appointment
- `GET /api/doctors` - List doctors

## Testing
```bash
npm test
```
