# Security Guidelines

## Protected Health Information (PHI) Handling

This application handles sensitive patient data. Follow these guidelines:

### 1. Data Encryption

**In Transit:**
- Always use HTTPS/TLS in production
- Configure Supabase to enforce SSL connections
- Use secure WebSocket connections for real-time features

**At Rest:**
- Enable Supabase database encryption
- Use encrypted backups
- Store API keys in secure vaults (not in code)

### 2. Authentication & Authorization

**Row-Level Security (RLS):**
- All Supabase tables have RLS enabled
- Patients can only access their own data
- Backend uses service role key for administrative operations
- Never expose service role key to frontend

**API Security:**
- Implement rate limiting in production
- Add authentication middleware for sensitive endpoints
- Validate all user inputs
- Use CORS appropriately

### 3. Logging & Monitoring

**DO NOT LOG:**
- Patient names, emails, phone numbers
- Conversation content
- Medical information
- Appointment details

**DO LOG:**
- Authentication attempts
- API errors (without PHI)
- System performance metrics
- Security events

### 4. Data Minimization

- Only collect necessary patient information
- Implement data retention policies
- Provide patient data export/deletion capabilities
- Regular audit of stored data

### 5. Environment Variables

**Required Security Practices:**
```bash
# Never commit .env files
# Use different keys for dev/staging/production
# Rotate keys regularly
# Use secrets management in production (AWS Secrets Manager, etc.)
```

**Environment Variables:**
- `OPENROUTER_API_KEY` - Keep private, rotate regularly
- `SUPABASE_SERVICE_KEY` - Never expose to frontend
- `JWT_SECRET` - Use strong random value, rotate periodically
- `SUPABASE_ANON_KEY` - Safe for frontend, but still protect

### 6. Input Validation

All user inputs are validated:
- Email format validation
- Phone number format validation
- Date/time range validation
- SQL injection prevention (via Supabase parameterized queries)
- XSS prevention (React auto-escapes)

### 7. HIPAA Compliance Considerations

For HIPAA compliance, additional measures needed:
- Business Associate Agreement (BAA) with Supabase
- Audit logging of all PHI access
- Encryption of all PHI
- Access controls and user authentication
- Regular security assessments
- Incident response plan
- Staff training on PHI handling

### 8. Production Checklist

Before deploying to production:

- [ ] Enable HTTPS/TLS
- [ ] Configure Supabase RLS policies
- [ ] Implement rate limiting
- [ ] Add authentication to API endpoints
- [ ] Enable database encryption
- [ ] Set up monitoring and alerting
- [ ] Configure backup strategy
- [ ] Review and minimize logging
- [ ] Implement session management
- [ ] Add CSRF protection
- [ ] Configure security headers
- [ ] Perform security audit
- [ ] Set up incident response plan
- [ ] Document data retention policy

### 9. Incident Response

If a security incident occurs:

1. Immediately isolate affected systems
2. Assess scope of breach
3. Notify affected patients (if PHI exposed)
4. Document incident details
5. Implement fixes
6. Review and update security measures
7. Report to relevant authorities (if required)

### 10. Regular Security Tasks

**Weekly:**
- Review access logs
- Check for suspicious activity

**Monthly:**
- Update dependencies
- Review RLS policies
- Audit user permissions

**Quarterly:**
- Security assessment
- Penetration testing
- Update security documentation

## Reporting Security Issues

If you discover a security vulnerability:
1. Do NOT open a public issue
2. Email security@yourcompany.com
3. Include detailed description
4. Allow time for fix before disclosure
