"use client"

import { useSyncExternalStore } from "react"

const subscribe = () => () => {}

/**
 * An inline script that runs before first paint (from the server HTML).
 *
 * Emitted on the server render and the matching hydration render only:
 * React warns when a client render creates a `<script>` (it would never
 * run), and whatever the script set on the document has already happened.
 * Same approach as MUI's `InitColorSchemeScript`.
 */
export function InlineScript({ code }: { code: string }) {
  const isServerRender = useSyncExternalStore(
    subscribe,
    () => false,
    () => true
  )
  if (!isServerRender) return null
  return (
    <script
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: code }}
    />
  )
}
