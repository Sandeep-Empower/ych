"use client";
import React, { useState } from "react";

interface ContactFormProps {
  siteData: SiteData;
}

export default function ContactForm({ siteData }: ContactFormProps) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    siteId: siteData.id,
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const validateField = (name: string, value: string) => {
    let errorMessage = "";

    switch (name) {
      case "name":
        if (!value.trim()) {
          errorMessage = "Name is required.";
        } else if (value.length > 50) {
          errorMessage = "Name must be less than 50 characters.";
        }
        break;
      case "email":
        if (!value.trim()) {
          errorMessage = "Email is required.";
        } else if (!/\S+@\S+\.\S+/.test(value)) {
          errorMessage = "Please enter a valid email address.";
        } else if (value.length > 100) {
          errorMessage = "Email must be less than 100 characters.";
        }
        break;
      case "subject":
        if (!value.trim()) {
          errorMessage = "Subject is required.";
        } else if (value.length > 100) {
          errorMessage = "Subject must be less than 100 characters.";
        }
        break;
      case "message":
        if (!value.trim()) {
          errorMessage = "Message is required.";
        } else if (value.length < 10) {
          errorMessage = "Message must be at least 10 characters long.";
        } else if (value.length > 500) {
          errorMessage = "Message must be less than 500 characters.";
        }
        break;
    }

    setFieldErrors((prev) => ({ ...prev, [name]: errorMessage }));
    return errorMessage === "";
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });

    // Clear the field error when user starts typing
    if (fieldErrors[name as keyof typeof fieldErrors]) {
      setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(null);
    setError(null);

    // Validate all fields
    const nameValid = validateField("name", form.name);
    const emailValid = validateField("email", form.email);
    const subjectValid = validateField("subject", form.subject);
    const messageValid = validateField("message", form.message);

    if (!nameValid || !emailValid || !subjectValid || !messageValid) {
      setLoading(false);
      return;
    }

    try {
      const apiUrl = process.env.API_URL || "http://localhost:3000";
      const res = await fetch(`/api/contact/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setSuccess("Your message has been sent!");
        setForm({
          name: "",
          email: "",
          subject: "",
          message: "",
          siteId: siteData.id,
        });
        setFieldErrors({
          name: "",
          email: "",
          subject: "",
          message: "",
        });
      } else {
        const data = await res.json();
        setError(data.error || "Failed to send message.");
      }
    } catch (err) {
      console.log("Error submitting contact form:", err);
      setError("Failed to send message.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Name <span className="text-red-700">*</span>
        </label>
        <input
          type="text"
          id="name"
          name="name"
          placeholder="Your Name"
          className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          value={form.name}
          onChange={handleChange}
        />
        {fieldErrors.name && (
          <div className="text-red-600 text-sm mt-1">{fieldErrors.name}</div>
        )}
      </div>

      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Email <span className="text-red-700">*</span>
        </label>
        <input
          type="email"
          id="email"
          name="email"
          placeholder="Your Email"
          className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          value={form.email}
          onChange={handleChange}
        />
        {fieldErrors.email && (
          <div className="text-red-600 text-sm mt-1">{fieldErrors.email}</div>
        )}
      </div>

      <div>
        <label
          htmlFor="subject"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Subject <span className="text-red-700">*</span>
        </label>
        <input
          type="text"
          id="subject"
          name="subject"
          placeholder="Your Subject"
          className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          value={form.subject}
          onChange={handleChange}
        />
        {fieldErrors.subject && (
          <div className="text-red-600 text-sm mt-1">{fieldErrors.subject}</div>
        )}
      </div>

      <div>
        <label
          htmlFor="message"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Message <span className="text-red-700">*</span>
        </label>
        <textarea
          id="message"
          name="message"
          placeholder="Your Message"
          className="w-full rounded-lg border border-gray-200 px-4 py-2 min-h-[100px] focus:outline-none focus:ring-2 focus:ring-primary"
          value={form.message}
          onChange={handleChange}
        />
        {fieldErrors.message && (
          <div className="text-red-600 text-sm mt-1">{fieldErrors.message}</div>
        )}
      </div>

      <button
        type="submit"
        className="bg-primary hover:bg-primary-600 text-white font-medium px-6 py-2 rounded-lg shadow"
        disabled={loading}
      >
        {loading ? "Sending..." : "Send Message"}
      </button>
      {success && <div className="text-green-600">{success}</div>}
      {error && <div className="text-red-600">{error}</div>}
    </form>
  );
}
