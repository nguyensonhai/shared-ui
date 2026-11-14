// The slice of the apps' design tokens that the shared components use.
// Same values as `src/theme/tokens.ts` in Raykit and Solavi.

export const FONT_SIZE = {
  CAPTION_LG: "0.6875rem",
  BODY_SM: "0.75rem",
  BODY: "0.8125rem",
  BODY_LG: "0.875rem",
  TITLE_SM: "1rem",
} as const

export const RADIUS = { SM: 8, MD: 12 } as const

/** Radius that follows the corner-radius preference. */
export const r = (px: number): string =>
  `calc(${px}px * var(--ui-radius-scale, 1))`

/** `{name}` placeholders, as the apps' i18n `format`. */
export const fill = (message: string, values: Record<string, string>) =>
  message.replace(/\{(\w+)\}/g, (m, key: string) =>
    key in values ? values[key] : m
  )
