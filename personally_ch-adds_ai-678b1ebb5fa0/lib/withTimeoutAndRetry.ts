export async function withTimeoutAndRetry<T>(
    fn: () => Promise<T>,
    retries = 2,
    timeoutMs = 30000
  ): Promise<T> {
    let attempt = 0;
  
    while (attempt <= retries) {
      try {
        const result = await Promise.race([
          fn(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Request timed out')), timeoutMs)
          ),
        ]);
        return result;
      } catch (err) {
        attempt++;
        if (attempt > retries) throw err;
        console.warn(`Retrying GPT call... (${attempt}/${retries})`);
      }
    }
  
    throw new Error("All GPT retries failed");
  }
  