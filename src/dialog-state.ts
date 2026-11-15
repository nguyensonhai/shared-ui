"use client"

import { useSyncExternalStore } from "react"

/**
 * Open/closed state for a dialog that anything can open (the header, a
 * toast, the 3D space HUD), kept outside React and shared through a window
 * event named `event` (e.g. "solavi:skin-dialog").
 */
export function createDialogState(event: string) {
  let isOpen = false

  const emit = (next: boolean) => {
    isOpen = next
    window.dispatchEvent(new Event(event))
  }

  const subscribe = (onChange: () => void) => {
    window.addEventListener(event, onChange)
    return () => window.removeEventListener(event, onChange)
  }

  return {
    open: () => emit(true),
    close: () => emit(false),
    useOpen: () =>
      useSyncExternalStore(
        subscribe,
        () => isOpen,
        () => false
      ),
  }
}
