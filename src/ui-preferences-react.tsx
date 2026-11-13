"use client"

// React side of the UI preferences store: hooks and the provider that
// writes the preferences as CSS variables on <html>, so the theme, the root
// font-size and the layout chrome rescale without rebuilding the MUI theme.

import { useEffect, useSyncExternalStore } from "react"

import {
  getServerUiPreferences,
  preferenceVars,
  resolveDensity,
  type UiPreferencesStore,
} from "./ui-preferences"
import { useViewportWidth } from "./viewport"

/** The saved preferences of `store`, live. */
export const useUiPreferencesOf = (store: UiPreferencesStore) =>
  useSyncExternalStore(store.subscribe, store.get, getServerUiPreferences)

/** Hooks and provider bound to one app's store. */
export function createUiPreferencesHooks(store: UiPreferencesStore) {
  const useUiPreferences = () => useUiPreferencesOf(store)

  /** The density in effect now (`auto` resolved against the viewport). */
  function useResolvedDensity() {
    const { density } = useUiPreferences()
    return resolveDensity(density, useViewportWidth())
  }

  function UiPreferencesProvider({ children }: { children: React.ReactNode }) {
    const prefs = useUiPreferences()
    const density = useResolvedDensity()

    useEffect(() => {
      const root = document.documentElement
      for (const [key, value] of Object.entries(
        preferenceVars(prefs, density)
      )) {
        root.style.setProperty(key, value)
      }
    }, [prefs, density])

    return children
  }

  return { useUiPreferences, useResolvedDensity, UiPreferencesProvider }
}
