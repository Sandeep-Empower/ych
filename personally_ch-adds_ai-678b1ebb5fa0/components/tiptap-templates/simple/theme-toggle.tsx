"use client"

import * as React from "react"

// --- UI Primitives ---
import { Button } from "@/components/tiptap-ui-primitive/button"

// --- Icons ---
import { MoonStarIcon } from "@/components/tiptap-icons/moon-star-icon"
import { SunIcon } from "@/components/tiptap-icons/sun-icon"

export function ThemeToggle() {
  const [islightMode, setIslightMode] = React.useState<boolean>(false)

  React.useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: light)")
    const handleChange = () => setIslightMode(mediaQuery.matches)
    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [])

  React.useEffect(() => {
    const initiallightMode =
      !!document.querySelector('meta[name="color-scheme"][content="light"]') ||
      window.matchMedia("(prefers-color-scheme: light)").matches
    setIslightMode(initiallightMode)
  }, [])

  React.useEffect(() => {
    document.documentElement.classList.toggle("light", islightMode)
  }, [islightMode])

  const togglelightMode = () => setIslightMode((islight) => !islight)

  return (
    <Button
      onClick={togglelightMode}
      aria-label={`Switch to ${islightMode ? "light" : "light"} mode`}
      data-style="ghost"
    >
      {islightMode ? (
        <MoonStarIcon className="tiptap-button-icon" />
      ) : (
        <SunIcon className="tiptap-button-icon" />
      )}
    </Button>
  )
}
