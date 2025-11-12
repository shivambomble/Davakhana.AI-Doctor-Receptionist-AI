# Deployment Guide

## Local Development

### 1. Install Dependencies

```bash
# Backend dependencies
npm install

# Frontend dependencies
cd frontend && npm install
```

### 2. Setup Supabase

1. Create a Supabase project at https://supabase.com
2. Go to SQL Editor and run:
   - `supabase/schema.sql`
   - `supabase/rpc_functions.sql`
3. Get your credentials from Settings > API

### 3. Configure Environment

```bash
cp .env.example .env
# Edit .env with your credentials
```

### 4. Run Locally

```bash
# Terminal 1: Backend
npm run dev:backend

# Terminal 2: Frontend
npm run dev:frontend
```

Visit http://localhost:3000

## Production Deployment

### Option 1: Deploy to Railway

**Backend:**
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and init
railway login
railway init

# Add environment variables
railway variables set OPENROUTER_API_KEY=your_key
railway variables set SUPABASE_URL=your_url
railway variables set SUPABASE_SERVICE_KEY=your_key
railway variables set JWT_SECRET=your_secret

# Deploy
railway up
```

**Frontend:**
- Build: `cd frontend && npm run build`
- Deploy `frontend/dist` to Vercel/Netlify
- Set API proxy to Railway backend URL

### Option 2: Deploy to Render

**Backend:**
1. Create new Web Service
2. Connect GitHub repo
3. Build command: `npm install`
4. Start command: `npm start`
5. Add environment variables
6. Deploy

**Frontend:**
1. Create new Static Site
2. Build command: `cd frontend && npm install && npm run build`
3. Publish directory: `frontend/dist`
4. Add environment variable: `VITE_API_URL=your_backend_url`

### Option 3: Deploy to AWS

**Backend (Elastic Beanstalk):**
```bash
# Install EB CLI
pip install awsebcli

# Initialize
eb init -p node.js doctor-receptionist-api

# Create environment
eb create production

# Set environment variables
eb setenv OPENROUTER_API_KEY=xxx SUPABASE_URL=xxx ...

# Deploy
eb deploy
```

**Frontend (S3 + CloudFront):**
```bash
# Build
cd frontend && npm run build

# Upload to S3
aws s3 sync dist/ s3://your-bucket-name

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id XXX --paths "/*"
```

### Option 4: Docker Deployment

**Backend Dockerfile:**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY backend ./backend
COPY supabase ./supabase
EXPOSE 3001
CMD ["node", "backend/server.js"]
```

**Build and run:**
```bash
docker build -t doctor-receptionist-api .
docker run -p 3001:3001 --env-file .env doctor-receptionist-api
```

## Environment Variables for Production

```bash
# Required
OPENROUTER_API_KEY=sk-or-v1-xxxxx
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_KEY=eyJxxx...
JWT_SECRET=use-strong-random-value-here
NODE_ENV=production

# Optional
PORT=3001
```

## Post-Deployment Checklist

- [ ] Verify HTTPS is enabled
- [ ] Test all API endpoints
- [ ] Verify Supabase RLS policies are active
- [ ] Test appointment booking flow
- [ ] Check error logging
- [ ] Set up monitoring (e.g., Sentry)
- [ ] Configure rate limiting
- [ ] Test CORS configuration
- [ ] Verify environment variables are set
- [ ] Test LLM integration
- [ ] Review security headers
- [ ] Set up automated backups
- [ ] Configure CDN for frontend
- [ ] Test mobile responsiveness

## Monitoring & Logging

### Recommended Tools

**Application Monitoring:**
- Sentry for error tracking
- LogRocket for session replay
- DataDog for APM

**Infrastructure:**
- CloudWatch (AWS)
- Railway metrics
- Render metrics

**Database:**
- Supabase built-in monitoring
- Query performance tracking

### Health Checks

```bash
# Backend health
curl https://your-api.com/health

# Expected response:
# {"status":"ok","timestamp":"2025-11-12T..."}
```

## Scaling Considerations

**Backend:**
- Use load balancer for multiple instances
- Implement Redis for session storage
- Add caching layer (Redis/Memcached)
- Use connection pooling for Supabase

**Database:**
- Monitor Supabase connection limits
- Optimize slow queries
- Add database indexes
- Consider read replicas

**Frontend:**
- Use CDN for static assets
- Implement code splitting
- Enable gzip/brotli compression
- Add service worker for offline support

## Backup Strategy

**Database:**
```sql
-- Automated daily backups via Supabase
-- Manual backup:
pg_dump -h db.xxx.supabase.co -U postgres -d postgres > backup.sql
```

**Configuration:**
- Store environment variables in secure vault
- Version control all code
- Document deployment procedures

## Rollback Procedure

If deployment fails:

1. **Railway/Render:** Revert to previous deployment
2. **AWS EB:** `eb deploy --version previous-version`
3. **Docker:** `docker run previous-image-tag`
4. **Database:** Restore from backup if schema changed

## Cost Optimization

**Supabase:**
- Free tier: 500MB database, 2GB bandwidth
- Pro tier: $25/month for production

**OpenRouter:**
- Gemini 2.0 Flash: Free tier available
- Monitor usage to avoid overages

**Hosting:**
- Railway: ~$5-20/month
- Render: Free tier available
- AWS: Variable, use cost calculator

## Support & Maintenance

**Regular Tasks:**
- Update dependencies monthly
- Review error logs weekly
- Monitor API usage
- Backup database regularly
- Rotate API keys quarterly
- Review security policies

**Emergency Contacts:**
- Supabase support: support@supabase.io
- OpenRouter support: support@openrouter.ai
