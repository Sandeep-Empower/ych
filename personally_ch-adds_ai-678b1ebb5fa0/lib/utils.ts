import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Sanitizes a string to create a URL-safe slug
 * @param text - The text to convert to a slug
 * @returns A URL-safe slug string
 */
export function sanitizeSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading and trailing hyphens
}

/**
 * Generates a favicon using the favicon generation API
 * @param text - The text/domain name for the favicon
 * @param color - The color for the favicon (optional)
 * @param logoUrl - The logo URL to extract icon from (optional)
 * @param style - The style for the favicon (optional)
 * @returns Promise<string | null> - The generated favicon URL or null if failed
 */
export async function generateFavicon(
  text: string,
  color?: string,
  logoUrl?: string,
  style?: string
): Promise<string | null> {
  try {
    const response = await fetch('/api/generate-favicon-ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        color,
        logoUrl,
        style,
      }),
    });

    if (!response.ok) {
      console.error('Failed to generate favicon:', response.statusText);
      return null;
    }

    const data = await response.json();
    return data.success ? data.faviconUrl : null;
  } catch (error) {
    console.error('Error generating favicon:', error);
    return null;
  }
}