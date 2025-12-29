/**
 * Security utilities for input validation, sanitization, and authentication
 * CRITICAL: These functions MUST be used for security-sensitive operations
 */

import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

// ============================================================================
// DOMAIN VALIDATION
// ============================================================================

/**
 * Shell metacharacters that can be used for command injection
 */
const SHELL_METACHARACTERS = /[;&|`$(){}[\]<>!#*?~\n\r\\'"]/;

/**
 * Valid domain regex pattern
 */
const DOMAIN_REGEX = /^(?!-)[A-Za-z0-9-]{1,63}(?<!-)(\.[A-Za-z0-9-]{1,63})*\.[A-Za-z]{2,}$/;

/**
 * Validates and sanitizes a domain name for safe use in shell commands
 */
export function validateDomain(domain: string): {
    isValid: boolean;
    sanitized?: string;
    error?: string;
} {
    if (!domain || typeof domain !== "string") {
        return { isValid: false, error: "Domain is required" };
    }

    const cleaned = domain.toLowerCase().trim();

    if (!cleaned) {
        return { isValid: false, error: "Domain cannot be empty" };
    }

    if (cleaned.length > 253) {
        return { isValid: false, error: "Domain name too long (max 253 characters)" };
    }

    // CRITICAL: Check for shell metacharacters FIRST
    if (SHELL_METACHARACTERS.test(cleaned)) {
        return { isValid: false, error: "Domain contains invalid characters" };
    }

    if (!DOMAIN_REGEX.test(cleaned)) {
        return { isValid: false, error: "Invalid domain format. Example: example.com" };
    }

    // Only allow specific characters
    const safeChars = /^[a-z0-9.-]+$/;
    if (!safeChars.test(cleaned)) {
        return { isValid: false, error: "Domain contains disallowed characters" };
    }

    return { isValid: true, sanitized: cleaned };
}

/**
 * Checks if a string contains any shell metacharacters
 */
export function containsShellMetacharacters(input: string): boolean {
    return SHELL_METACHARACTERS.test(input);
}

// ============================================================================
// URL VALIDATION (for SSRF prevention)
// ============================================================================

/**
 * Allowed URL protocols
 */
const ALLOWED_PROTOCOLS = ["https:", "http:"];

/**
 * Blocked IP ranges for SSRF prevention
 */
const BLOCKED_IP_PATTERNS = [
    /^127\./,                          // Localhost
    /^10\./,                           // Private Class A
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./,  // Private Class B
    /^192\.168\./,                     // Private Class C
    /^169\.254\./,                     // Link-local
    /^0\./,                            // Current network
    /^100\.(6[4-9]|[7-9][0-9]|1[0-2][0-7])\./, // Carrier-grade NAT
    /^::1$/,                           // IPv6 localhost
    /^fc00:/,                          // IPv6 private
    /^fe80:/,                          // IPv6 link-local
];

/**
 * Blocked hostnames for SSRF prevention
 */
const BLOCKED_HOSTNAMES = [
    "localhost",
    "127.0.0.1",
    "0.0.0.0",
    "metadata.google.internal",      // GCP metadata
    "169.254.169.254",               // AWS/Azure/GCP metadata
    "metadata.google.com",
];

/**
 * Validates a URL for safe server-side fetching (SSRF prevention)
 */
export function validateUrlForFetch(url: string): {
    isValid: boolean;
    error?: string;
} {
    if (!url || typeof url !== "string") {
        return { isValid: false, error: "URL is required" };
    }

    try {
        const parsed = new URL(url);

        // Check protocol
        if (!ALLOWED_PROTOCOLS.includes(parsed.protocol)) {
            return { isValid: false, error: "Only HTTP/HTTPS URLs are allowed" };
        }

        // Check for blocked hostnames
        const hostname = parsed.hostname.toLowerCase();
        if (BLOCKED_HOSTNAMES.includes(hostname)) {
            return { isValid: false, error: "This URL is not allowed" };
        }

        // Check for blocked IP patterns
        for (const pattern of BLOCKED_IP_PATTERNS) {
            if (pattern.test(hostname)) {
                return { isValid: false, error: "This URL is not allowed" };
            }
        }

        // Block URLs with credentials
        if (parsed.username || parsed.password) {
            return { isValid: false, error: "URLs with credentials are not allowed" };
        }

        return { isValid: true };
    } catch {
        return { isValid: false, error: "Invalid URL format" };
    }
}

// ============================================================================
// AUTHENTICATION HELPERS
// ============================================================================

/**
 * JWT Secret - MUST be set in environment
 */
export function getJwtSecret(): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error("JWT_SECRET environment variable is not set");
    }
    return secret;
}

/**
 * Verifies JWT token and returns decoded payload
 */
export function verifyToken(token: string): { userId: string } | null {
    try {
        const decoded = jwt.verify(token, getJwtSecret()) as { userId: string };
        return decoded;
    } catch {
        return null;
    }
}

/**
 * Extracts and verifies JWT from request cookies
 * Returns userId if valid, null otherwise
 */
export function getAuthenticatedUserId(req: NextRequest): string | null {
    const token = req.cookies.get("token")?.value;
    if (!token) {
        return null;
    }

    const decoded = verifyToken(token);
    return decoded?.userId || null;
}

/**
 * Authentication middleware helper - returns error response if not authenticated
 */
export function requireAuth(req: NextRequest): { userId: string } | NextResponse {
    const userId = getAuthenticatedUserId(req);
    if (!userId) {
        return NextResponse.json(
            { error: "Unauthorized - Please log in" },
            { status: 401 }
        );
    }
    return { userId };
}

// ============================================================================
// RATE LIMITING (Simple in-memory implementation)
// ============================================================================

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Rate limit configuration
 */
interface RateLimitConfig {
    windowMs: number;      // Time window in milliseconds
    maxRequests: number;   // Max requests per window
}

/**
 * Default rate limit configurations
 */
export const RATE_LIMITS = {
    login: { windowMs: 15 * 60 * 1000, maxRequests: 5 },      // 5 attempts per 15 min
    otp: { windowMs: 60 * 1000, maxRequests: 3 },             // 3 OTP requests per minute
    api: { windowMs: 60 * 1000, maxRequests: 100 },           // 100 requests per minute
    register: { windowMs: 60 * 60 * 1000, maxRequests: 5 },   // 5 registrations per hour
};

/**
 * Checks rate limit for a given key
 */
export function checkRateLimit(
    key: string,
    config: RateLimitConfig
): { allowed: boolean; remaining: number; resetIn: number } {
    const now = Date.now();
    const entry = rateLimitStore.get(key);

    // Clean up expired entries periodically
    if (rateLimitStore.size > 10000) {
        for (const [k, v] of rateLimitStore.entries()) {
            if (v.resetTime < now) {
                rateLimitStore.delete(k);
            }
        }
    }

    if (!entry || entry.resetTime < now) {
        // New window
        rateLimitStore.set(key, {
            count: 1,
            resetTime: now + config.windowMs,
        });
        return {
            allowed: true,
            remaining: config.maxRequests - 1,
            resetIn: config.windowMs,
        };
    }

    if (entry.count >= config.maxRequests) {
        return {
            allowed: false,
            remaining: 0,
            resetIn: entry.resetTime - now,
        };
    }

    entry.count++;
    return {
        allowed: true,
        remaining: config.maxRequests - entry.count,
        resetIn: entry.resetTime - now,
    };
}

/**
 * Get client IP from request
 */
export function getClientIp(req: NextRequest): string {
    return (
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        req.headers.get("x-real-ip") ||
        "unknown"
    );
}

/**
 * Rate limit middleware helper
 */
export function rateLimitMiddleware(
    req: NextRequest,
    config: RateLimitConfig,
    keyPrefix: string = ""
): NextResponse | null {
    const ip = getClientIp(req);
    const key = `${keyPrefix}:${ip}`;
    const result = checkRateLimit(key, config);

    if (!result.allowed) {
        return NextResponse.json(
            {
                error: "Too many requests. Please try again later.",
                retryAfter: Math.ceil(result.resetIn / 1000),
            },
            {
                status: 429,
                headers: {
                    "Retry-After": String(Math.ceil(result.resetIn / 1000)),
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": String(Math.ceil(result.resetIn / 1000)),
                },
            }
        );
    }

    return null; // Allowed
}

// ============================================================================
// INPUT SANITIZATION
// ============================================================================

/**
 * Sanitizes HTML to prevent XSS
 * For server-side rendering, strips dangerous tags/attributes
 */
export function sanitizeHtml(input: string): string {
    if (!input || typeof input !== "string") {
        return "";
    }

    return input
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#x27;")
        .replace(/\//g, "&#x2F;");
}

/**
 * Validates email format
 */
export function validateEmail(email: string): boolean {
    if (!email || typeof email !== "string") {
        return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validates that a string is a valid UUID
 */
export function isValidUUID(str: string): boolean {
    if (!str || typeof str !== "string") {
        return false;
    }
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
}
