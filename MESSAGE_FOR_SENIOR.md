# Security Incident Report - Summary for Senior

**Date:** December 26, 2025
**Status:** CRITICAL - Server Compromised

---

## What I Found

### 1. Active Attack (Root Cause of 100% CPU)
- Server was **hacked via Command Injection vulnerability**
- Attacker downloaded **Mirai botnet malware** from `94.154.35.154`
- Attempted **reverse shell connection** to `193.142.147.209:12323`
- Malicious processes consuming all CPU resources

### 2. Critical Vulnerabilities (5)
- **Command Injection** in `lib/local.ts` and `lib/cloudflare.ts`
  - User input passed directly to shell commands without sanitization
- **No Authentication** on critical API endpoints
  - `/api/articles/delete` - Anyone can delete any article
  - `/api/articles/save` - Anyone can add articles to any site
  - `/api/profile` - Anyone can read/modify any user's profile
- **Hardcoded JWT Secrets** in 11 files
  - Fallback value `'your-secret-key'` allows token forgery

### 3. High Severity Issues (12)
- IDOR (Insecure Direct Object Reference) vulnerabilities
- SSRF (Server-Side Request Forgery) in logo/favicon upload
- No rate limiting on login/OTP endpoints
- Weak OTP implementation

### 4. Medium/Low Issues (10)
- XSS via `dangerouslySetInnerHTML` in 6 locations
- Missing security headers (CSP, HSTS)
- Middleware bypasses API routes
- Passwords stored in localStorage

---

## What Needs To Be Done

### Immediate (Today)
1. **Stop the server**
   - `pm2 stop all`
2. **Kill malware processes**
   - `pkill -f "uhavenobotsxd"`
3. **Block attacker IPs**
   - `94.154.35.154` (malware server)
   - `193.142.147.209` (C2 server)
4. **Clean malware files**
   - Remove `/tmp/*.sh`, `/tmp/*uhavenobotsxd*`, `/tmp/f`
5. **Rotate all secrets**
   - JWT_SECRET, API keys, database passwords

### This Week
1. **Fix Command Injection**
   - Add domain validation function
   - Use `spawn()` instead of `exec()` with array arguments
2. **Add Authentication**
   - Protect all API endpoints with JWT verification
3. **Remove Hardcoded Secrets**
   - Remove all `|| 'your-secret-key'` fallbacks
   - Require environment variables
4. **Fix IDOR Issues**
   - Verify user ownership before allowing access

### This Month
1. Add rate limiting
2. Add security headers (CSP, HSTS)
3. Sanitize HTML content (prevent XSS)
4. Fix SSRF with URL whitelist
5. External security audit

---

## Key Files Affected

| File | Issue |
|------|-------|
| `lib/local.ts:101` | Command Injection |
| `lib/cloudflare.ts:152,167` | Command Injection |
| `api/articles/delete/route.tsx` | No Auth |
| `api/articles/save/route.ts` | No Auth |
| `api/profile/route.ts` | No Auth + IDOR |
| `api/auth/login/route.ts:120` | Hardcoded Secret |

---

## Reports Generated

1. `SECURITY_INCIDENT_REPORT.md` - Detailed incident analysis
2. `COMPREHENSIVE_SECURITY_AUDIT_REPORT.md` - Full 27+ vulnerability audit

---

**Bottom Line:** Server was compromised through a command injection vulnerability. Attacker exploited missing input validation in domain field to execute malware. Multiple other critical security gaps exist. Immediate action required.
