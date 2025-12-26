import type { Metadata } from "next";
import "./globals.css";
import { getSiteData } from "@/lib/site";
import ConditionalHeader from "@/components/ConditionalHeader";
import Footer from "@/components/Footer";
// import CookieConsentLoader from "@/components/CookieConsentLoader";
import { Poppins } from "next/font/google";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700"],
  variable: "--font-poppins",
});

function generateColorScale(baseColor: string) {
  const tinycolor = require("tinycolor2");
  const base = tinycolor(baseColor);
  const baseLightness = base.toHsl().l * 100;

  let lightenSteps;
  if (baseLightness > 80) {
    lightenSteps = [20, 50, 12, 10, 8];
  } else if (baseLightness > 65) {
    lightenSteps = [22, 18, 15, 11, 8];
  } else if (baseLightness > 50) {
    lightenSteps = [30, 25, 12, 8, 4];
  } else {
    lightenSteps = [70, 40, 35, 25, 15];
  }

  const toRgbString = (color: any) => {
    const rgb = color.toRgb();
    return `${rgb.r}, ${rgb.g}, ${rgb.b}`;
  };

  return {
    DEFAULT: toRgbString(base),
    50: toRgbString(base.clone().lighten(lightenSteps[0])),
    100: toRgbString(base.clone().lighten(lightenSteps[1])),
    200: toRgbString(base.clone().lighten(lightenSteps[2])),
    300: toRgbString(base.clone().lighten(lightenSteps[3])),
    400: toRgbString(base.clone().lighten(lightenSteps[4])),
    500: toRgbString(base),
    600: toRgbString(base.clone().darken(10)),
    700: toRgbString(base.clone().darken(20)),
    800: toRgbString(base.clone().darken(30)),
    900: toRgbString(base.clone().darken(40)),
  };
}

export async function generateMetadata(): Promise<Metadata> {
  const siteData = await getSiteData();

  if (!siteData) {
    return {
      title: "Site Not Found",
      description: "The requested site could not be found.",
    };
  }

  const favicon = siteData.site_meta.find(
    (meta) => meta.meta_key === "favicon_url"
  )?.meta_value;
  const tagline = siteData.site_meta.find(
    (meta) => meta.meta_key === "tagline"
  )?.meta_value;

  return {
    title: {
      template: `%s - ${siteData.site_name}`,
      default: siteData.site_name,
    },
    description: tagline,
    icons: favicon
      ? {
          icon: favicon,
        }
      : undefined,
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const siteData = await getSiteData();

  if (!siteData) {
    return (
      <html lang="en" className={poppins.variable}>
        <body className="min-h-screen flex flex-col">
          <main className="flex-grow">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen flex items-center justify-center flex-col">
              <h1 className="text-4xl font-bold text-gray-900">
                Site Not Found
              </h1>
              <p className="mt-2 text-gray-600 text-lg">
                The requested site could not be found.
              </p>
            </div>
          </main>
        </body>
      </html>
    );
  }

  const accentColor = siteData.site_meta.find(
    (meta) => meta.meta_key === "accent_color"
  )?.meta_value;

  const isInMobiEnabled = siteData.site_meta.some(
    (meta) => meta.meta_key === "inmobi_enabled" && meta.meta_value === "true"
  );

  let cssVariables: Record<string, string> = {};

  if (accentColor && /^#[0-9A-Fa-f]{6}$/.test(accentColor)) {
    const colorScale = generateColorScale(accentColor);
    cssVariables = Object.entries(colorScale).reduce((acc, [key, value]) => {
      acc[`--primary-${key}`] = value;
      return acc;
    }, {} as Record<string, string>);

    const tinycolor = require("tinycolor2");
    const rgb = tinycolor(accentColor).toRgb();
    const accentColorRgb = `${rgb.r}, ${rgb.g}, ${rgb.b}`;
    cssVariables["--primary"] = accentColorRgb;
  }

  return (
    <html lang="en" className={poppins.variable} style={cssVariables}>
      <body className="min-h-screen flex flex-col">
        <ConditionalHeader siteData={siteData} />
        <main className="flex-grow">{children}</main>
        <Footer siteData={siteData} />
        {/* {isInMobiEnabled && <CookieConsentLoader />} */}
      </body>
    </html>
  );
}
