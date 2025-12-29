// Shared OTP store for forgot password functionality
interface OTPData {
  otp: string;
  timestamp: number;
  email: string;
  attempts: number; // SECURITY: Track verification attempts
}

// SECURITY: Maximum allowed verification attempts before lockout
const MAX_OTP_ATTEMPTS = 3;

// Global store that persists across requests in the same Node.js process
declare global {
  var __otpStore: Map<string, OTPData> | undefined;
}

class OTPStore {
  private store: Map<string, OTPData>;

  constructor() {
    // Use global variable to persist across hot reloads in development
    if (global.__otpStore) {
      this.store = global.__otpStore;
    } else {
      this.store = new Map<string, OTPData>();
      global.__otpStore = this.store;
    }

    // Clean up expired OTPs every 5 minutes
    this.startCleanupInterval();
  }

  private startCleanupInterval(): void {
    setInterval(() => {
      this.cleanupExpired();
    }, 5 * 60 * 1000); // 5 minutes
  }

  private cleanupExpired(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [email, data] of this.store.entries()) {
      if (now - data.timestamp > 10 * 60 * 1000) { // 10 minutes
        this.store.delete(email);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`Cleaned up ${cleanedCount} expired OTP(s)`);
    }
  }

  set(email: string, otp: string): void {
    const normalizedEmail = email.toLowerCase().trim();
    const data: OTPData = {
      otp,
      timestamp: Date.now(),
      email: normalizedEmail,
      attempts: 0 // SECURITY: Reset attempts when new OTP is generated
    };

    this.store.set(normalizedEmail, data);
    console.log(`OTP stored for ${email} at ${new Date(data.timestamp).toISOString()}`);
    console.log(`Current store size: ${this.store.size}`);
  }

  get(email: string): string | undefined {
    const normalizedEmail = email.toLowerCase().trim();
    const data = this.store.get(normalizedEmail);

    if (!data) {
      console.log(`No OTP data found for ${normalizedEmail}`);
      return undefined;
    }

    // Check if OTP is expired (10 minutes)
    const isExpired = Date.now() - data.timestamp > 10 * 60 * 1000;
    if (isExpired) {
      console.log(`OTP expired for ${normalizedEmail}`);
      this.store.delete(normalizedEmail);
      return undefined;
    }

    return data.otp;
  }

  // SECURITY: Verify OTP with attempt limiting
  verify(email: string, inputOtp: string): { valid: boolean; error?: string } {
    const normalizedEmail = email.toLowerCase().trim();
    const data = this.store.get(normalizedEmail);

    if (!data) {
      return { valid: false, error: 'No OTP found for this email. Please request a new OTP.' };
    }

    // Check if OTP is expired (10 minutes)
    const isExpired = Date.now() - data.timestamp > 10 * 60 * 1000;
    if (isExpired) {
      this.store.delete(normalizedEmail);
      return { valid: false, error: 'OTP has expired. Please request a new OTP.' };
    }

    // SECURITY: Check if max attempts exceeded
    if (data.attempts >= MAX_OTP_ATTEMPTS) {
      this.store.delete(normalizedEmail);
      return { valid: false, error: 'Too many failed attempts. Please request a new OTP.' };
    }

    // Compare OTPs
    const receivedOtp = String(inputOtp).trim();
    const storedOtp = String(data.otp).trim();

    if (receivedOtp === storedOtp) {
      this.store.delete(normalizedEmail);
      console.log(`OTP verified successfully for ${normalizedEmail}`);
      return { valid: true };
    }

    // Increment attempt counter
    data.attempts++;
    const remainingAttempts = MAX_OTP_ATTEMPTS - data.attempts;

    if (remainingAttempts <= 0) {
      this.store.delete(normalizedEmail);
      return { valid: false, error: 'Too many failed attempts. Please request a new OTP.' };
    }

    console.log(`Invalid OTP for ${normalizedEmail}. Attempts: ${data.attempts}/${MAX_OTP_ATTEMPTS}`);
    return { valid: false, error: `Invalid OTP. ${remainingAttempts} attempt(s) remaining.` };
  }

  delete(email: string): boolean {
    const normalizedEmail = email.toLowerCase().trim();
    const deleted = this.store.delete(normalizedEmail);
    console.log(`Deleted OTP for ${normalizedEmail}: ${deleted}`);
    return deleted;
  }

  entries(): [string, OTPData][] {
    return Array.from(this.store.entries());
  }

  clear(): void {
    this.store.clear();
    console.log('Cleared all OTPs');
  }

  // Get current store size for debugging
  size(): number {
    return this.store.size;
  }
}

export const otpStore = new OTPStore();
