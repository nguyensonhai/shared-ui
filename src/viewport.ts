"use client"

import { useSyncExternalStore } from "react"

function subscribeResize(onChange: () => void) {
  window.addEventListener("resize", onChange)
  return () => window.removeEventListener("resize", onChange)
}

/** Viewport width, live; 1440 while prerendering. */
export const useViewportWidth = () =>
  useSyncExternalStore(
    subscribeResize,
    () => window.innerWidth,
    () => 1440
  )
