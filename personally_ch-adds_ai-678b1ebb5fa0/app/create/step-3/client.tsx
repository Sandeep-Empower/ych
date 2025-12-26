"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import arrowRightIcon from "../../assets/images/icons/right-arrow.svg";
import { Card } from "@/components/ui/card";
import { ChevronUp, ChevronDown } from "lucide-react";
import TiptapEditor from "@/app/components/TiptapEditor";
import SiteStepper from "@/app/components/ui/SiteStepper";
import { useToast } from "@/app/components/ui/SimpleToaster";

// const TiptapEditor = dynamic(() => import('@/components/TiptapEditor'), { ssr: false });

type PageKey = "about" | "privacy" | "advertise" | "terms";
const pageList = [
  // { key: 'home' as PageKey, label: 'Home Page', placeholder: 'Enter home page content' },
  {
    key: "about" as PageKey,
    label: "About Us Page",
    placeholder: "Enter about us content",
  },
  {
    key: "privacy" as PageKey,
    label: "Privacy & Cookies Page",
    placeholder: "Enter privacy & cookies content",
  },
  {
    key: "advertise" as PageKey,
    label: "For Advertisers Page",
    placeholder: "Enter for advertisers content",
  },
  // { key: 'contact' as PageKey, label: 'Contact Us Page', placeholder: 'Enter contact us content' },
  {
    key: "terms" as PageKey,
    label: "Terms and Conditions Page",
    placeholder: "Enter terms and conditions content",
  },
];

export default function Step3() {
  const router = useRouter();
  const [expanded, setExpanded] = useState<PageKey>("about");
  const [pages, setPages] = useState<Record<PageKey, string>>({
    about: ``,
    privacy: ``,
    advertise: ``,
    terms: ``,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const searchParams = useSearchParams();
  const [siteId, setSiteId] = useState("");
  const [siteData, setSiteData] = useState("");
  const [validationError, setValidationError] = useState("");
  const [isValidating, setIsValidating] = useState(true);
  const showToast = useToast();
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    const site_id = searchParams?.get("siteId");
    if (site_id) {
      setSiteId(site_id as string);
    }
  }, [searchParams]);

  useEffect(() => {
    const validateSiteId = async () => {
      if (!siteId) {
        router.push("/create/step-1");
        return;
      }
      try {
        const res = await fetch("/api/site/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ siteId }),
        });
        const data = await res.json();
        if (res.ok) {
          setSiteData(data);
          setPages({
            about: `<h2><strong>About Us</strong></h2><p><a target="_blank" rel="noopener noreferrer nofollow" href="mailto:${data.company.email}">${data.company.email}</a></p><p>Welcome to <a target="_blank" rel="noopener noreferrer nofollow" href="https://${data.domain}">${data.site_name}</a> - your go-to platform for discovering and sharing engaging, high-quality content. Our mission is to curate and create content on the most interesting subjects, and deliver it to people genuinely seeking, making it easier than ever to search and learn from exciting solutions to explore.</p><h3><strong>What We Do</strong></h3><p><a target="_blank" rel="noopener noreferrer nofollow" href="https://${data.domain}">${data.site_name}</a> is built for curious minds. By relentlessly discovering, making, and sharing fresh content, we seek to make the search and content journey simple, easier, and insightful for our users.</p><h3><strong>Why Choose Us?</strong></h3><ul><li><p><strong>Curated Quality</strong> - We filter out the noise and bring you only the best content from reputable sources.</p></li><li><p><strong>Diverse Topics</strong> - Whether you're interested in tech, business, lifestyle or entertainment, we have something for everyone.</p></li><li><p><strong>Cutting-Edge Approach</strong> - Our platform is designed for ultimate user experience, allowing easy navigation and personalized recommendations.</p></li></ul><h3><strong>Get Involved</strong></h3><p>We encourage content creators, publishers, and readers to engage with our platform. If you have something valuable to share, sign up and we'd love to hear your voice!</p>`,
            privacy: `<h2><strong>Privacy &amp; Cookies</strong></h2><h3><strong>Who we are</strong></h3><p>${data.company.name}<br>${data.company.address}<br><a target="_blank" rel="noopener noreferrer nofollow" href="mailto:${data.company.email}">${data.company.email}</a></p><p>Our website address is: <a target="_blank" rel="noopener noreferrer nofollow" href="https://${data.domain}">https://${data.domain}</a></p><h3><strong>Comments</strong></h3><p>When visitors leave comments on the site we collect the data shown in the comments form, and also the visitor's IP address and browser user agent string to help spam detection.</p><p>An anonymized string created from your email address (also called a hash) may be provided to the Gravatar service to see if you are using it. The Gravatar service privacy policy is available here: <a target="_blank" rel="noopener noreferrer nofollow" href="https://automattic.com/privacy/">https://automattic.com/privacy/</a>. After approval of your comment, your profile picture is visible to the public in the context of your comment.</p><h3><strong>Cookies</strong></h3><p>If you leave a comment on our site you may opt-in to saving your name, email address and website in cookies. These are for your convenience so that you do not have to fill in your details again when you leave another comment. These cookies will last for one year.</p><p>If you visit our login page, we will set a temporary cookie to determine if your browser accepts cookies. This cookie contains no personal data and is discarded when you close your browser.</p><p>When you log in, we will also set up several cookies to save your login information and your screen display choices. Login cookies last for two days, and screen options cookies last for a year. If you select “Remember Me”, your login will persist for two weeks. If you log out of your account, the login cookies will be removed.</p><p>If you edit or publish an article, an additional cookie will be saved in your browser. This cookie includes no personal data and simply indicates the post ID of the article you just edited. It expires after 1 day.</p><h3><strong>Embedded content from other websites</strong></h3><p>Articles on this site may include embedded content (e.g. videos, images, articles, etc.). Embedded content from other websites behaves in the exact same way as if the visitor has visited the other website.</p><p>These websites may collect data about you, use cookies, embed additional third-party tracking, and monitor your interaction with that embedded content, including tracking your interaction with the embedded content if you have an account and are logged in to that website.</p><h3><strong>Who we share your data with</strong></h3><p>If you request a password reset, your IP address will be included in the reset email.</p><h3><strong>How long we retain your data</strong></h3><p>If you leave a comment, the comment and its metadata are retained indefinitely. This is so we can recognize and approve any follow-up comments automatically instead of holding them in a moderation queue.</p><p>For users that register on our website (if any), we also store the personal information they provide in their user profile. All users can see, edit, or delete their personal information at any time (except they cannot change their username). Website administrators can also see and edit that information.</p><h3><strong>What rights you have over your data</strong></h3><p>If you have an account on this site, or have left comments, you can request to receive an exported file of the personal data we hold about you, including any data you have provided to us. You can also request that we erase any personal data we hold about you. This does not include any data we are obliged to keep for administrative, legal, or security purposes.</p><h3><strong>Where we send your data</strong></h3><p>Visitor comments may be checked through an automated spam detection service.</p>`,
            advertise: `<h2><strong>Advertise With Us</strong></h2><p><strong>Expand Your Reach with a Highly Engaged Audience</strong></p><p>Partner with us to connect with a passionate and engaged audience eager to discover new opportunities, products, and services. Our platform delivers high-quality content, expert insights, and valuable information that keeps our readers coming back for more.</p><h3><strong>Why Advertise with Us?</strong></h3><ul><li><p><strong>Targeted Exposure</strong> - Reach an audience actively searching for relevant information, products, and experiences.</p></li><li><p><strong>Engaged Readership</strong> - Our audience is highly interested and responsive, ensuring your brand gets noticed.</p></li><li><p><strong>Flexible Advertising Options</strong> - From sponsored content to display ads, email campaigns, and more, we customize solutions to meet your goals.</p></li><li><p><strong>Authentic Storytelling</strong> - We create compelling content that naturally integrates your brand's message in a way that resonates with our audience.</p></li></ul><h3><strong>Advertising Opportunities</strong></h3><ul><li><p><strong>Sponsored Content &amp; Features</strong> - Showcase your brand through in-depth articles, product reviews, and expert insights.</p></li><li><p><strong>Banner Advertising</strong> - Gain high visibility placements with display ads strategically positioned for maximum impact.</p></li><li><p><strong>Email Marketing</strong> - Promote your brand directly to our subscriber base with engaging and targeted email campaigns.</p></li><li><p><strong>Custom Collaborations</strong> - Have a unique campaign idea? Let's create something tailored to your marketing goals.</p></li></ul><h3><strong>Let's Work Together</strong></h3><p>Whether you're looking to increase brand awareness, drive conversions, or promote special initiatives, reach out to us to help. Let's collaborate on a campaign that will yield real results.</p><p><strong>Get in Touch</strong></p><p>For advertising inquiries, pricing, and custom partnership opportunities, reach out to us today.</p><p><strong>Let's create something great together! ✓</strong></p><p>Traffic to this site is generated through ${data.company.name}'s proprietary technology which allows us to place native ads with targeted keywords on multiple platforms such as Outbrain, Taboola, Meta, GDN, and others, which then lead to our various sites where search ads are served.</p>`,
            terms: `<h2><strong>Terms</strong></h2><p>TERMS AND CONDITIONS</p><p>Last updated February 12, 2025</p><h3><strong>AGREEMENT TO OUR LEGAL TERMS</strong></h3><p>We are ${data.company.name} ("Company," "we," "us," or "our").<br><br>We operate the website <a target="_blank" rel="noopener noreferrer nofollow" href="https://${data.domain}">https://${data.domain}</a> (the "Site"), as well as any other related products and services that refer or link to these legal terms (the "Legal Terms") (collectively, the "Services").<br><br>You can contact us by email at <a target="_blank" rel="noopener noreferrer nofollow" href="mailto:${data.company.email}">${data.company.email}</a> or by mail at c/o H&amp;J &amp; Co Chartered Accountants, Lewis House, Great Chesterford Court, Great Chesterford, Essex CB10 1PF, England.</p><p>These Legal Terms constitute a legally binding agreement made between you, whether personally or on behalf of an entity ("you"), and TheMediaFlow Ltd, concerning your access to and use of the Services. By accessing the Services, you agree that you have read, understood, and accepted these Legal Terms. IF YOU DO NOT AGREE WITH THESE LEGAL TERMS, YOU ARE PROHIBITED FROM USING THE SERVICES AND MUST DISCONTINUE USE IMMEDIATELY.</p><p>Supplemental terms and conditions may be posted on the Services from time to time and are expressly incorporated herein by reference. We reserve the right to modify these Legal Terms at any time. Updates will be reflected by the "last updated" date. Continued use of the Services means you accept the changes.</p><p>The Services are intended for users at least 18 years old. Persons under 18 do not have permission to use or register for the Services.</p><p>We recommend printing or saving a copy of these legal terms for your records.</p><h3><strong>1. OUR SERVICES</strong></h3><p>The information provided when using the Services is not intended for distribution or use in jurisdictions where such use would be contrary to law. Users accessing the Services from other locations do so at their own risk and are responsible for compliance with local laws.</p><p>The Services are not tailored to comply with industry-specific regulations (HIPAA, FISMA, etc.). If your interactions require compliance with such laws, you may not use the Services.</p><h3><strong>2. INTELLECTUAL PROPERTY RIGHTS</strong></h3><p>Unless otherwise indicated, the Services are our proprietary property and all source code, databases, functionality, software, website designs, audio, video, text, photographs, and graphics on the Services are owned or controlled by us or licensed to us, and are protected by copyright and trademark laws.</p>`,
          });
        } else {
          setValidationError(data.error || "Invalid site ID");
          router.push("/create/step-1");
          return;
        }
        setIsValidating(false);
      } catch (error) {
        setValidationError("Failed to validate site");
        router.push("/create/step-1");
      }
    };

    if (siteId) {
      validateSiteId();
    }
  }, [siteId, router]);

  const handleChange = (key: PageKey, value: string) => {
    setPages((prev) => ({ ...prev, [key]: value }));
  };

  const handleAccordion = (key: PageKey) => {
    setExpanded(expanded === key ? ("" as PageKey) : key);
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      // Replace with actual siteId
      const res = await fetch("/api/pages/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteId, pages }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        showToast({ message: "Content saved successfully!", color: "success" });
        // Publish Site
        setPublishing(true);
        const resPublish = await fetch("/api/site/publish", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ siteId }),
        });
        const dataPublish = await resPublish.json();
        if (dataPublish.success) {
          showToast({ message: "Website is published!", color: "success" });
          setPublishing(false);
          router.push(`/create/success?siteId=${siteId}`);
        } else {
          showToast({ message: "Failed to publish site.", color: "error" });
          setPublishing(false);
          setError("Failed to publish site.");
        }
      } else {
        showToast({ message: "Failed to save content.", color: "error" });
        setError("Failed to save content.");
      }
    } catch (err) {
      showToast({ message: "Failed to save content.", color: "error" });
      setError("Failed to save content.");
    } finally {
      setSaving(false);
    }
  };

  // Show loading state while validating
  if (isValidating) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Validating site...</p>
        </div>
      </div>
    );
  }

  if (publishing) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p>Publishing site...</p>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        </div>
      </div>
    );
  }

  // Show error if validation failed
  if (validationError) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-red-700 mb-4">{validationError}</p>
          <Button onClick={() => router.push("/create/step-1")}>
            Return to Step 1
          </Button>
        </div>
      </div>
    );
  }

  const percentage = Math.round(((3 - 1) / (4 - 1)) * 100);

  return (
    <div>
      {/* Stepper */}
      <SiteStepper currentStep={3} />

      <div className="page-editor-container">
        {pageList.map((page) => (
          <Card
            key={page.key}
            className="bg-white mx-auto p-0 gap-0 mb-6 overflow-hidden"
          >
            <Button
              type="button"
              className="w-full flex justify-between items-center p-6 bg-white h-auto hover:bg-white"
              onClick={() => handleAccordion(page.key)}
            >
              <span className="font-semibold text-lg">{page.label}</span>
              <span>
                {expanded === page.key ? (
                  <ChevronUp className="!w-6 !h-6" />
                ) : (
                  <ChevronDown className="!w-6 !h-6" />
                )}
              </span>
            </Button>
            {expanded === page.key && (
              <div className="bg-white border-t p-6">
                <TiptapEditor
                  value={pages[page.key]}
                  onChange={(data: string) => handleChange(page.key, data)}
                />
              </div>
            )}
          </Card>
        ))}
      </div>
      {error && <div className="text-red-700 mb-4">{error}</div>}
      {success && (
        <div className="text-green-600 mb-4">Content saved successfully!</div>
      )}
      {/* <div className="flex justify-between">
          <button className="border border-blue-500 text-blue-500 px-4 py-2 rounded" onClick={() => router.back()}>Back</button>
          <div className="flex gap-2">
            <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Next Step →'}
            </button>
          </div>
        </div> */}
      <div className="ction-footer mt-6 flex justify-end">
        <div className="flex justify-end gap-4">
          <Button
            variant="outline"
            className="bg-white"
            onClick={() => router.back()}
          >
            Back
          </Button>
          <Button
            className="text-white flex items-center gap-2"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              "Saving..."
            ) : (
              <>
                Save and Publish
                <Image src={arrowRightIcon} alt="Upload Icon" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
