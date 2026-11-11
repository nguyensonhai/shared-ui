// UI preferences (text size, font, density, corner radius, reduced motion),
// shared by Solavi and Montide. Persisted per browser in localStorage and
// applied as CSS variables on <html>: each app makes its own store with
// `createUiPreferencesStore("solavi")`, then applies `preferenceVars` in a
// provider and `store.script` before first paint.

export type Density = "auto" | "compact" | "cozy" | "comfortable"
export type ResolvedDensity = Exclude<Density, "auto">
export type RadiusScale = "sharp" | "default" | "rounded"
export type FontFamilyId = "manrope" | "jakarta" | "inter"

export type UiPreferences = {
  fontScale: number
  density: Density
  radiusScale: RadiusScale
  reduceMotion: boolean
  fontFamily: FontFamilyId
}

export const densities: Density[] = ["auto", "compact", "cozy", "comfortable"]
export const radiusScales: RadiusScale[] = ["sharp", "default", "rounded"]

/** Font catalog. Each family is loaded by next/font in the root layout. */
export const fontOptions: {
  id: FontFamilyId
  label: string
  family: string
}[] = [
  {
    id: "manrope",
    label: "Manrope",
    family: "var(--font-manrope), sans-serif",
  },
  {
    id: "jakarta",
    label: "Plus Jakarta Sans",
    family: "var(--font-jakarta), sans-serif",
  },
  {
    id: "inter",
    label: "Inter",
    family: "var(--font-inter), sans-serif",
  },
]

export const fontFamilyCss = (id: FontFamilyId) =>
  (fontOptions.find((f) => f.id === id) ?? fontOptions[0]).family

/** Text-size steps offered by the slider (5% increments, 70%–120%). */
export const fontScaleMarks = [
  0.7, 0.75, 0.8, 0.85, 0.9, 0.95, 1, 1.05, 1.1, 1.15, 1.2,
] as const

export const defaultUiPreferences: UiPreferences = {
  fontScale: 1,
  density: "auto",
  radiusScale: "default",
  reduceMotion: false,
  fontFamily: "manrope",
}

/** Below this width `auto` density resolves to compact (same as core). */
export const AUTO_DENSITY_BREAKPOINT = 1536

export const resolveDensity = (
  density: Density,
  viewportWidth: number
): ResolvedDensity =>
  density !== "auto"
    ? density
    : viewportWidth < AUTO_DENSITY_BREAKPOINT
      ? "compact"
      : "cozy"

export const densityToNumber = (d: ResolvedDensity) =>
  d === "compact" ? 0.85 : d === "comfortable" ? 1.15 : 1

export const radiusToNumber = (r: RadiusScale) =>
  r === "sharp" ? 0.5 : r === "rounded" ? 1.5 : 1

// ---- store ---------------------------------------------------------------

function sanitize(value: unknown): UiPreferences {
  const v = (value ?? {}) as Partial<UiPreferences>
  return {
    fontScale: fontScaleMarks.includes(v.fontScale as never)
      ? (v.fontScale as number)
      : defaultUiPreferences.fontScale,
    density: densities.includes(v.density as Density)
      ? (v.density as Density)
      : defaultUiPreferences.density,
    radiusScale: radiusScales.includes(v.radiusScale as RadiusScale)
      ? (v.radiusScale as RadiusScale)
      : defaultUiPreferences.radiusScale,
    reduceMotion: v.reduceMotion === true,
    fontFamily: fontOptions.some((f) => f.id === v.fontFamily)
      ? (v.fontFamily as FontFamilyId)
      : defaultUiPreferences.fontFamily,
  }
}

export const getServerUiPreferences = () => defaultUiPreferences

/** CSS variables for a set of preferences (density already resolved). */
export function preferenceVars(
  prefs: UiPreferences,
  density: ResolvedDensity
): Record<string, string> {
  return {
    "--ui-font-scale": String(prefs.fontScale),
    "--ui-density-scale": String(densityToNumber(density)),
    "--ui-radius-scale": String(radiusToNumber(prefs.radiusScale)),
    "--ui-font-family": fontFamilyCss(prefs.fontFamily),
  }
}

export type UiPreferencesStore = {
  get: () => UiPreferences
  set: (next: UiPreferences) => void
  subscribe: (onChange: () => void) => () => void
  /**
   * Inline <script> body that applies the saved preferences before first
   * paint, so a prerendered page never flashes at the default size. Kept
   * dependency-free; mirrors `preferenceVars`.
   */
  script: string
}

/**
 * The store of one app. `app` names its localStorage key
 * (`${app}-ui-preferences`), so each site keeps its own choices.
 */
export function createUiPreferencesStore(app: string): UiPreferencesStore {
  const storageKey = `${app}-ui-preferences`
  const changeEvent = `${app}-ui-preferences-change`
  let cache: { raw: string | null; value: UiPreferences } | null = null

  const get = (): UiPreferences => {
    let raw: string | null = null
    try {
      raw = localStorage.getItem(storageKey)
    } catch {
      // Storage blocked: defaults.
    }
    if (cache?.raw !== raw) {
      let parsed: unknown = null
      try {
        parsed = raw ? JSON.parse(raw) : null
      } catch {
        parsed = null
      }
      cache = { raw, value: raw ? sanitize(parsed) : defaultUiPreferences }
    }
    return cache.value
  }

  const set = (next: UiPreferences) => {
    const value = sanitize(next)
    try {
      localStorage.setItem(storageKey, JSON.stringify(value))
    } catch {
      cache = { raw: JSON.stringify(value), value }
    }
    window.dispatchEvent(new Event(changeEvent))
  }

  const subscribe = (onChange: () => void) => {
    const onStorage = (e: StorageEvent) => e.key === storageKey && onChange()
    window.addEventListener(changeEvent, onChange)
    window.addEventListener("storage", onStorage)
    return () => {
      window.removeEventListener(changeEvent, onChange)
      window.removeEventListener("storage", onStorage)
    }
  }

  const script = `(function(){try{
var p=JSON.parse(localStorage.getItem(${JSON.stringify(storageKey)})||"{}"),s=document.documentElement.style;
var fonts=${JSON.stringify(Object.fromEntries(fontOptions.map((f) => [f.id, f.family])))};
var d=p.density;if(d!=="compact"&&d!=="cozy"&&d!=="comfortable")d=innerWidth<${AUTO_DENSITY_BREAKPOINT}?"compact":"cozy";
if(typeof p.fontScale==="number")s.setProperty("--ui-font-scale",String(p.fontScale));
s.setProperty("--ui-density-scale",d==="compact"?"0.85":d==="comfortable"?"1.15":"1");
if(p.radiusScale)s.setProperty("--ui-radius-scale",p.radiusScale==="sharp"?"0.5":p.radiusScale==="rounded"?"1.5":"1");
if(fonts[p.fontFamily])s.setProperty("--ui-font-family",fonts[p.fontFamily]);
if(p.reduceMotion===true)document.documentElement.setAttribute("data-reduce-motion","true");
}catch(e){}})()`

  return { get, set, subscribe, script }
}
