import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Sparkles, X } from "lucide-react";

const COLORS = [
  { name: "White", hex: "#FFFFFF" },
  { name: "Blue", hex: "#6FA8DC" },
  { name: "Purple", hex: "#A855F7" },
  { name: "Pink", hex: "#EC4899" },
  { name: "Red", hex: "#EF4444" },
  { name: "Orange", hex: "#F97316" },
  { name: "Yellow", hex: "#FACC15" },
  { name: "Green", hex: "#84CC16" },
  { name: "Teal", hex: "#06B6D4" },
];

export default function LogoGeneratorModal({
  open,
  onClose,
  onInsert,
  domain,
  siteName,
}: {
  open: boolean;
  onClose: () => void;
  onInsert: (logo: string, favicon: string) => void;
  domain: string;
  siteName: string;
}) {
  const [slogan, setSlogan] = useState("");
  const [colors, setColors] = useState<string[]>([COLORS[0].hex]);
  const [loading, setLoading] = useState(false);
  const [logos, setLogos] = useState<string[]>([]);
  const [favicons, setFavicons] = useState<string[]>([]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [selectedLogo, setSelectedLogo] = useState<number | null>(null);
  const [selectedFavicon, setSelectedFavicon] = useState<number | null>(null);

  const handleColorToggle = (colorHex: string) => {
    setColors((prev) =>
      prev.includes(colorHex)
        ? prev.filter((c) => c !== colorHex)
        : [...prev, colorHex]
    );
  };

  const validateLogoModalForm = () => {
    const error: { [key: string]: string } = {};
    if (
      (!domain || domain.trim() === "") &&
      (!siteName || siteName.trim() === "")
    ) {
      error.domain = "Domain or Site Name is required";
    }
    if (!colors.length) {
      error.colors = "At least one color is required";
    }
    return error;
  };

  const handleGenerate = async () => {
    setLoading(true);
    setErrors({});
    setLogos([]);
    setFavicons([]);

    // Scroll to generated logos
    document.getElementById("logo-generator-modal-content")?.scrollTo({
      top: document.getElementById("generated-logos")?.offsetTop || 0,
      behavior: "smooth",
    });

    const validation = validateLogoModalForm();
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      setLoading(false);
      return;
    }

    try {
      const text = siteName || domain;
      console.log("🚀 Starting AI logo generation for domain:", text);

      // Generate logos using AI for each selected color
      const logoPromises = colors.map(async (color) => {
        try {
          const colorName = COLORS.find((c) => c.hex === color)?.name || "Blue";
          const requestBody = {
            text: text,
            slogan,
            color: colorName,
            style: "vintage",
          };

          console.log("🚀 Sending logo generation request:", requestBody);

          const response = await fetch("/api/generate-logo-ai", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
          });

          const data = await response.json();
          console.log("📦 Logo API response:", data);

          if (data.success) {
            console.log("✅ Logo generated successfully:", data.logoUrl);
            return data.logoUrl;
          } else {
            console.error(
              "❌ Logo generation failed:",
              data.error,
              data.details
            );
            return null;
          }
        } catch (error) {
          console.error("❌ Logo generation error:", error);
          return null;
        }
      });

      // Generate favicons using AI for each selected color
      const faviconPromises = colors.map(async (color) => {
        try {
          const requestBody = {
            text: text,
            color,
          };

          console.log("🚀 Sending favicon generation request:", requestBody);

          const response = await fetch("/api/generate-favicon-ai", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
          });

          const data = await response.json();
          console.log("📦 Favicon API response:", data);

          if (data.success) {
            console.log("✅ Favicon generated successfully:", data.faviconUrl);
            return data.faviconUrl;
          } else {
            console.error(
              "❌ Favicon generation failed:",
              data.error,
              data.details
            );
            return null;
          }
        } catch (error) {
          console.error("❌ Favicon generation error:", error);
          return null;
        }
      });

      // Wait for all generations to complete
      const [logoResults, faviconResults] = await Promise.all([
        Promise.all(logoPromises),
        Promise.all(faviconPromises),
      ]);

      // Filter out null results and set the URLs
      const validLogos = logoResults.filter((url) => url !== null);
      const validFavicons = faviconResults.filter((url) => url !== null);

      console.log("🎨 Generated logos:", validLogos);
      console.log("🎨 Generated favicons:", validFavicons);

      setLogos(validLogos);
      setFavicons(validFavicons);
      setSelectedLogo(null);
      setSelectedFavicon(null);

      if (validLogos.length === 0 && validFavicons.length === 0) {
        setErrors({
          error: "Failed to generate any logos or favicons. Please try again.",
        });
      }
    } catch (err) {
      console.error("❌ Generation process error:", err);
      setErrors({
        error: "Failed to generate logos. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          onClose();
        }
      }}
    >
      <DialogContent
        className="!max-w-3xl w-full bg-white max-h-[90%] flex flex-col p-0 sm:max-w-3xl  overflow-hidden pb-20"
        showCloseButton={false} // We're using our custom close button
      >
        <DialogHeader className="p-8 relative">
          <DialogTitle className="text-xl font-bold">
            Generate Logo and Favicon Using AI
          </DialogTitle>
          <DialogClose
            className="absolute top-4 right-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </DialogHeader>
        <div className="overflow-auto px-8" id="logo-generator-modal-content">
          {/* Domain Display */}
          <div className="mb-6">
            <Label className="mb-2">
              Logo Text{" "}
              <span className="text-gray-400">
                (Use Site Name for better results )
              </span>
            </Label>
            <div
              className={`p-3 border rounded-md ${
                (!domain || domain.trim() === "") &&
                (!siteName || siteName.trim() === "")
                  ? "border-red-300 bg-red-50"
                  : "border-gray-300 bg-gray-50"
              }`}
            >
              {(domain && domain.trim() !== "") ||
              (siteName && siteName.trim() !== "") ? (
                <span className="text-gray-700 font-medium">
                  {siteName || domain}
                </span>
              ) : (
                <span className="text-red-700">
                  No domain or site name provided
                </span>
              )}
            </div>
            {errors.domain && (
              <p className="text-red-700 text-sm mt-1">{errors.domain}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="md:col-span-2">
              <Label htmlFor="slogan" className="mb-2">
                Slogan <span className="text-gray-400">(optional)</span>
              </Label>
              <Input
                id="slogan"
                value={slogan}
                onChange={(e) => setSlogan(e.target.value)}
                placeholder="Enter slogan"
              />
              {errors.slogan && (
                <p className="text-red-700 text-sm mt-1">{errors.slogan}</p>
              )}
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="colors" className="mb-2">
                Pick Some Colors
              </Label>
              <div className="grid grid-cols-3 gap-4 mt-1">
                {COLORS.map((color, index) => (
                  <div key={color.hex} className="flex flex-col items-center">
                    <button
                      type="button"
                      className={`w-full relative h-16 border-2 border-white rounded-lg shadow-md transition-all duration-200 hover:scale-105 ${
                        colors.includes(color.hex)
                          ? "border-primary ring-2 ring-cyan-600"
                          : "border-gray-300"
                      }`}
                      style={{ background: color.hex }}
                      onClick={() => handleColorToggle(color.hex)}
                      aria-label={`${color.name} gradient`}
                    >
                      <span
                        className={`mt-1 font-medium absolute left-2 bottom-2 text-sm ${
                          color.name === "White" ? "text-black" : "text-white"
                        }`}
                      >
                        {color.name}
                      </span>
                    </button>
                  </div>
                ))}
              </div>
              {errors.colors && (
                <p className="text-red-700 text-sm mt-1">{errors.colors}</p>
              )}
            </div>

            <div className="md:col-span-2 flex justify-between gap-4 fixed bottom-0 left-0 right-0 bg-white px-6 py-6 border-t border-gray-200">
              <Button
                className={`text-white ${
                  (!domain || domain.trim() === "") &&
                  (!siteName || siteName.trim() === "") &&
                  !loading
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
                disabled={
                  loading ||
                  ((!domain || domain.trim() === "") &&
                    (!siteName || siteName.trim() === ""))
                }
                onClick={handleGenerate}
                type="button"
                title={
                  (!domain || domain.trim() === "") &&
                  (!siteName || siteName.trim() === "")
                    ? "Please provide a domain or site name first"
                    : ""
                }
              >
                <Sparkles className="!w-4 !h-4 text-white" />
                {loading ? "Generating..." : "Generate"}
              </Button>
              <Button
                className=" text-white bg-gray-800 hover:bg-gray-900"
                disabled={
                  loading || selectedLogo === null || selectedFavicon === null
                }
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onInsert(
                    logos[selectedLogo || 0],
                    favicons[selectedFavicon || 0]
                  );
                  onClose();
                }}
                type="button"
              >
                Insert
              </Button>
            </div>
          </div>

          {errors.error && (
            <div className="text-red-700 text-center mb-4">{errors.error}</div>
          )}

          <div className="grid grid-cols-1 gap-6 mb-8" id="generated-logos">
            {loading ? (
              [...Array(1)].map((_, i) => (
                <div key={i} className="grid grid-cols-2 gap-4">
                  <Card className="h-32 flex flex-col items-center justify-center border border-dashed border-gray-300 shadow-sm animate-pulse">
                    <span className="text-gray-300">Loading Logo</span>
                  </Card>
                  <Card className="h-32 flex flex-col items-center justify-center border border-dashed border-gray-300 shadow-sm animate-pulse">
                    <span className="text-gray-300">Loading Favicon</span>
                  </Card>
                </div>
              ))
            ) : logos.length > 0 || favicons.length > 0 ? (
              [...Array(Math.max(logos.length, favicons.length, 1))].map(
                (_, i) => (
                  <div key={i} className="grid grid-cols-2 gap-4">
                    {/* Logo */}
                    <Card
                      className={`h-32 flex flex-col items-center justify-center border-2 transition-all cursor-pointer relative ${
                        selectedLogo === i
                          ? "border-blue-500 bg-blue-50 shadow-md"
                          : "border-dashed border-gray-300 shadow-sm hover:border-gray-400"
                      }`}
                      onClick={() => setSelectedLogo(i)}
                    >
                      <span className="text-xs text-gray-500 w-full text-center font-medium absolute left-0 bottom-2 z-10">
                        Logo {i + 1}
                      </span>
                      {logos[i] ? (
                        <div className="relative">
                          <img
                            src={logos[i]}
                            alt={`Generated Logo ${i + 1}`}
                            className="h-20 object-contain"
                          />
                          {selectedLogo === i && (
                            <div className="absolute -top-2 -right-2 bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center">
                              <svg
                                className="w-4 h-4"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">No logo generated</span>
                      )}
                    </Card>
                    {/* Favicon */}
                    <Card
                      className={`h-32 flex flex-col items-center justify-center border-2 transition-all cursor-pointer relative ${
                        selectedFavicon === i
                          ? "border-blue-500 bg-blue-50 shadow-md"
                          : "border-dashed border-gray-300 shadow-sm hover:border-gray-400"
                      }`}
                      onClick={() => setSelectedFavicon(i)}
                    >
                      <span className="text-xs text-gray-500 font-medium absolute left-0 bottom-2 z-10 w-full text-center">
                        Favicon {i + 1}
                      </span>
                      {favicons[i] ? (
                        <div className="relative">
                          <img
                            src={favicons[i]}
                            alt={`Generated Favicon ${i + 1}`}
                            className="h-12 w-12 object-contain"
                          />
                          {selectedFavicon === i && (
                            <div className="absolute -top-2 -right-2 bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center">
                              <svg
                                className="w-4 h-4"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">
                          No favicon generated
                        </span>
                      )}
                    </Card>
                  </div>
                )
              )
            ) : (
              <></>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
