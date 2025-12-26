// /**
//  * Example usage of the updated favicon generation API
//  *
//  * This file demonstrates how to:
//  * 1. Generate a logo with optional favicon generation
//  * 2. Generate a standalone favicon
//  * 3. Generate a favicon from an existing logo URL
//  */

// // Example 1: Generate logo and favicon together
// export async function generateLogoAndFavicon(text: string, color?: string) {
//   try {
//     const response = await fetch("/api/generate-logo-ai", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         text,
//         color,
//         style: "vintage",
//         generateFavicon: true, // This will generate both logo and favicon
//       }),
//     });

//     if (!response.ok) {
//       throw new Error("Failed to generate logo and favicon");
//     }

//     const data = await response.json();
//     return {
//       logoUrl: data.logoUrl,
//       faviconUrl: data.faviconUrl, // Will be null if favicon generation failed
//       success: data.success,
//     };
//   } catch (error) {
//     console.error("Error generating logo and favicon:", error);
//     return { logoUrl: null, faviconUrl: null, success: false };
//   }
// }

// // Example 2: Generate standalone favicon
// export async function generateStandaloneFavicon(
//   text: string,
//   color?: string,
//   style?: string
// ) {
//   try {
//     const response = await fetch("/api/generate-favicon-ai", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         text,
//         color,
//         style,
//       }),
//     });

//     if (!response.ok) {
//       throw new Error("Failed to generate favicon");
//     }

//     const data = await response.json();
//     return {
//       faviconUrl: data.faviconUrl,
//       success: data.success,
//     };
//   } catch (error) {
//     console.error("Error generating favicon:", error);
//     return { faviconUrl: null, success: false };
//   }
// }

// // Example 3: Generate favicon from existing logo
// export async function generateFaviconFromLogo(
//   text: string,
//   logoUrl: string,
//   color?: string
// ) {
//   try {
//     const response = await fetch("/api/generate-favicon-ai", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         text,
//         logoUrl, // This tells the API to extract the icon from the logo
//         color,
//         style: "modern",
//       }),
//     });

//     if (!response.ok) {
//       throw new Error("Failed to generate favicon from logo");
//     }

//     const data = await response.json();
//     return {
//       faviconUrl: data.faviconUrl,
//       success: data.success,
//       sourceLogoUrl: data.logoUrl,
//     };
//   } catch (error) {
//     console.error("Error generating favicon from logo:", error);
//     return { faviconUrl: null, success: false, sourceLogoUrl: logoUrl };
//   }
// }

// // Example 4: Using the utility function
// import { generateFavicon } from "@/lib/utils";

// export async function usingUtilityFunction(text: string) {
//   // Generate favicon without logo reference
//   const faviconUrl1 = await generateFavicon(text, "blue", undefined, "modern");

//   // Generate favicon from existing logo
//   const logoUrl = "https://example.com/logo.png";
//   const faviconUrl2 = await generateFavicon(text, "red", logoUrl, "vintage");

//   return { faviconUrl1, faviconUrl2 };
// }
