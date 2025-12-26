// Shared OTP store for forgot password functionality
interface OTPData {
  otp: string;
  timestamp: number;
  email: string;
}

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
      email: normalizedEmail
    };

    this.store.set(normalizedEmail, data);
    console.log(`OTP stored for ${email}: ${otp} at ${new Date(data.timestamp).toISOString()}`);
    console.log(`Current store size: ${this.store.size}`);
  }

  get(email: string): string | undefined {
    const normalizedEmail = email.toLowerCase().trim();
    const data = this.store.get(normalizedEmail);

    if (!data) {
      console.log(`No OTP data found for ${normalizedEmail}`);
      console.log(`Current store contents:`, Array.from(this.store.keys()));
      return undefined;
    }

    // Check if OTP is expired (10 minutes)
    const isExpired = Date.now() - data.timestamp > 10 * 60 * 1000;
    if (isExpired) {
      console.log(`OTP expired for ${normalizedEmail}`);
      this.store.delete(normalizedEmail);
      return undefined;
    }

    console.log(`Retrieved OTP for ${normalizedEmail}: ${data.otp}`);
    return data.otp;
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
