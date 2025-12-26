import { NextRequest, NextResponse } from "next/server";


export async function POST(req: NextRequest) {
  try {
    const {
      text,
      color = "#3B82F6",
      logoUrl,
      style = "modern",
    } = await req.json();


    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const letter = text.charAt(0).toUpperCase();
    const size = 32;

    // Create SVG favicon with circular background and letter
    const svgFavicon = `
      <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="1" dy="1" stdDeviation="1" flood-color="rgba(0,0,0,0.3)"/>
          </filter>
        </defs>
        <circle cx="${size / 2}" cy="${size / 2}" r="${
      size / 2 - 1
    }" fill="${color}" stroke="rgba(0,0,0,0.1)" stroke-width="1"/>
        <text x="${size / 2}" y="${
      size / 2
    }" text-anchor="middle" dominant-baseline="central" 
              font-family="'Inter', 'SF Pro Display', 'Segoe UI', 'Roboto', 'Helvetica Neue', sans-serif" 
              font-size="18" font-weight="700" font-style="normal"
              fill="white" filter="url(#shadow)">${letter}</text>
      </svg>
    `.trim();

    // Convert SVG to base64 data URL for immediate use
    const base64Svg = Buffer.from(svgFavicon).toString("base64");
    const faviconUrl = `data:image/svg+xml;base64,${base64Svg}`;

    return NextResponse.json({
      success: true,
      faviconUrl,
      letter: text.charAt(0).toUpperCase(),
      color,
      logoUrl: logoUrl || null,
      svg: svgFavicon, // Include raw SVG for client-side use
    });
  } catch (error) {
    console.error("❌ Favicon generation error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate favicon",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
