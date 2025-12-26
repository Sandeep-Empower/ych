import React from "react";
import Sidebar from "@/components/Sidebar";
import { getSiteData } from "@/lib/site";
import { geocode } from "@/lib/geocode";
import ContactForm from "@/components/ContactForm";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Contact Us",
  };
}

export default async function Contact() {
  const siteData = await getSiteData();

  if (!siteData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <h1 className="text-2xl font-bold">Site Not Found</h1>
      </div>
    );
  }

  const company = siteData.company.name;
  const address = siteData.company.address;
  // Geocode the address to get coordinates
  let lat = 52.0695,
    lon = 0.202; // fallback coordinates
  if (address) {
    const coords = await geocode(address); // { lat: number, lon: number }
    if (coords) {
      lat = coords.lat;
      lon = coords.lon;
    }
  }

  // Build OpenStreetMap embed URL dynamically
  const bbox = `${lon - 0.005},${lat - 0.002},${lon + 0.005},${lat + 0.002}`;
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lon}`;

  return (
    <>
      <div className="bg-primary-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 flex flex-col items-center justify-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Contact Us</h2>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Main Card */}
          <div className="md:col-span-2">
            <div className="prose prose-sm md:prose-base max-w-none">
              <p className="mb-4 text-gray-700 font-semibold">
                Use the form below or write to us at:
              </p>
              <p className="mb-8">
                <strong className="mb-2 block">{company}</strong>
                {address}
              </p>
              <div className="mb-6 rounded-lg overflow-hidden">
                {/* <iframe
                  src={mapUrl}
                  style={{ border: 0 }}
                  className="w-full h-56 md:h-80"
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Map"
                ></iframe> */}
              </div>
              <ContactForm siteData={siteData} />
            </div>
          </div>
          {/* Sidebar */}
          <Sidebar />
        </div>
      </div>
    </>
  );
}
