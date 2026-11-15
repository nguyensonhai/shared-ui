"use client"

import { useCallback, useState } from "react"
import { flushSync } from "react-dom"
import Link from "next/link"
import { CheckIcon, EllipsisIcon, GlobeIcon, MoonIcon, SunIcon } from "lucide-react"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import IconButton from "@mui/material/IconButton"
import ListItemIcon from "@mui/material/ListItemIcon"
import ListItemText from "@mui/material/ListItemText"
import ListSubheader from "@mui/material/ListSubheader"
import Menu from "@mui/material/Menu"
import MenuItem from "@mui/material/MenuItem"
import Stack from "@mui/material/Stack"
import { useColorScheme } from "@mui/material/styles"
import Tooltip from "@mui/material/Tooltip"
import Typography from "@mui/material/Typography"

import { d, FONT_SIZE, r } from "./internal/tokens"
import { runViewTransition } from "./motion"

/* ------------------------------------------------------------------ */
/* Theme                                                               */
/* ------------------------------------------------------------------ */

/**
 * Light/dark switch with a circular reveal anchored at `origin` (the
 * clicked button, or the screen center): going dark, the old light page
 * shrinks back into the origin; going light, the new light page grows out
 * of it. Falls back to an instant switch without View Transitions. The app's
 * CSS styles `.theme-transition` / `.theme-transition-dark`.
 */
export function useThemeSwitch() {
  const { mode, systemMode, setMode } = useColorScheme()
  const isDark = (mode === "system" ? systemMode : mode) === "dark"

  const toggle = useCallback(
    (origin?: { x: number; y: number }) => {
      const next = isDark ? "light" : "dark"
      const toDark = next === "dark"
      const root = document.documentElement
      const apply = () => {
        flushSync(() => setMode(next))
        // MUI applies the class from an effect; set it now so the new
        // snapshot is taken with the new theme.
        root.classList.remove(isDark ? "dark" : "light")
        root.classList.add(next)
      }
      // Puts the old snapshot above the new one while it collapses.
      root.classList.toggle("theme-transition-dark", toDark)
      const transition = runViewTransition(apply, "theme-transition")
      if (!transition) {
        root.classList.remove("theme-transition-dark")
        return
      }
      transition.finished.finally(() =>
        root.classList.remove("theme-transition-dark")
      )

      const x = origin?.x ?? innerWidth / 2
      const y = origin?.y ?? innerHeight / 2
      const radius = Math.hypot(
        Math.max(x, innerWidth - x),
        Math.max(y, innerHeight - y)
      )
      const small = `circle(0px at ${x}px ${y}px)`
      const full = `circle(${radius}px at ${x}px ${y}px)`
      transition.ready
        .then(() => {
          const animation = root.animate(
            { clipPath: toDark ? [full, small] : [small, full] },
            {
              duration: 500,
              easing: "cubic-bezier(0.4, 0, 0.2, 1)",
              // Hold the end frame until teardown so the collapsed
              // snapshot doesn't flash back for a frame.
              fill: "forwards",
              pseudoElement: toDark
                ? "::view-transition-old(root)"
                : "::view-transition-new(root)",
            }
          )
          transition.finished.finally(() => animation.cancel())
        })
        .catch(() => {})
    },
    [isDark, setMode]
  )

  return { isDark, toggle }
}

/**
 * Moon/sun button that flips between light and dark. `onToggle` runs after
 * every flip (the apps count quick flips for an easter egg).
 */
export function ThemeToggle({
  label,
  onToggle,
}: {
  label: string
  onToggle?: () => void
}) {
  const { toggle } = useThemeSwitch()
  return (
    <IconButton
      aria-label={label}
      onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect()
        toggle({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 })
        onToggle?.()
      }}
      sx={{
        "& svg": {
          transition: "transform 420ms cubic-bezier(0.22, 1, 0.36, 1)",
        },
        "&:hover svg": { transform: "rotate(-24deg)" },
      }}
    >
      {/* Both icons render; CSS shows the right one, so SSR and client agree. */}
      <MoonIcon size={20} className="icon-light" />
      <SunIcon size={20} className="icon-dark" />
    </IconButton>
  )
}

/* ------------------------------------------------------------------ */
/* Language                                                            */
/* ------------------------------------------------------------------ */

export type LanguageMenuProps<L extends string> = {
  /** "Language", in the current language. */
  label: string
  locale: L
  locales: readonly L[]
  /** Each language's own name ("Tiếng Việt", "日本語"…). */
  names: Record<L, string>
  /** The code on the button ("EN", "VI"…). */
  short: (locale: L) => string
  onChange: (locale: L) => void
}

/** Globe + short locale code; the menu lists the languages with a check. */
export function LanguageMenu<L extends string>({
  label,
  locale,
  locales,
  names,
  short,
  onChange,
}: LanguageMenuProps<L>) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)

  const change = (next: L) => {
    setAnchor(null)
    if (next !== locale) onChange(next)
  }

  return (
    <>
      <Button
        color="inherit"
        startIcon={<GlobeIcon size={20} />}
        aria-label={label}
        aria-haspopup="menu"
        onClick={(e) => setAnchor(e.currentTarget)}
        sx={{ fontWeight: 700 }}
      >
        {short(locale)}
      </Button>
      <Menu
        anchorEl={anchor}
        open={!!anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{ list: { dense: true, sx: { minWidth: 180 } } }}
      >
        <ListSubheader sx={{ lineHeight: "32px" }}>{label}</ListSubheader>
        {locales.map((l) => (
          <MenuItem
            key={l}
            lang={l}
            selected={l === locale}
            onClick={() => change(l)}
          >
            <ListItemText>{names[l]}</ListItemText>
            {l === locale ? (
              <ListItemIcon sx={{ minWidth: 0, color: "primary.main" }}>
                <CheckIcon size={16} />
              </ListItemIcon>
            ) : null}
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}

/* ------------------------------------------------------------------ */
/* Tools                                                               */
/* ------------------------------------------------------------------ */

/** One header tool: an icon button from `sm` up, a menu row below it. */
export type HeaderTool = {
  id: string
  label: string
  /** Drawn at 20px in the header and 18px in the phone menu. */
  icon: (size: number) => React.ReactNode
  /** A link (the guide), or… */
  href?: string
  /** …an action (opens a dialog). */
  onClick?: () => void
}

export type HeaderToolsProps<L extends string> = {
  tools: HeaderTool[]
  /** Label of the phone "⋯" menu button. */
  menuLabel: string
  theme: { label: string; onToggle?: () => void }
  language: LanguageMenuProps<L>
  /** Square tool size; 36px scaled by the density preference by default. */
  size?: string
  /** Hover fill; the theme's action hover by default. */
  hover?: string
}

/**
 * The right-hand header tools: the app's own tools (guide, skins, UI
 * preferences…), then theme and language, all in one box size. On phones the
 * app's tools fold into one "⋯" menu, so the header keeps only that, theme
 * and language beside the brand.
 */
export function HeaderTools<L extends string>({
  tools,
  menuLabel,
  theme,
  language,
  size = `max(32px, ${d(36)})`,
  hover = "var(--mui-palette-action-hover)",
}: HeaderToolsProps<L>) {
  const [moreAnchor, setMoreAnchor] = useState<HTMLElement | null>(null)
  const closeMore = () => setMoreAnchor(null)
  /** Shown from `sm` up; folded into the menu below it. */
  const wide = { display: { xs: "none", sm: "inline-flex" } }
  return (
    <Stack
      direction="row"
      spacing={0.5}
      sx={{
        alignItems: "center",
        "& .MuiIconButton-root, & .MuiButton-root": {
          height: size,
          minHeight: 0,
          minWidth: size,
          p: 0,
          borderRadius: r(8),
          color: "inherit",
          "&:hover": { bgcolor: hover },
        },
        "& .MuiButton-root": { px: 1 },
        ".dark & .MuiIconButton-root:hover, .dark & .MuiButton-root:hover": {
          bgcolor: "var(--mui-palette-action-hover)",
        },
      }}
    >
      {tools.map((tool) => (
        <Tooltip key={tool.id} title={tool.label}>
          {tool.href ? (
            <IconButton
              component={Link}
              href={tool.href}
              aria-label={tool.label}
              sx={wide}
            >
              {tool.icon(20)}
            </IconButton>
          ) : (
            <IconButton
              aria-label={tool.label}
              aria-haspopup="dialog"
              onClick={tool.onClick}
              sx={wide}
            >
              {tool.icon(20)}
            </IconButton>
          )}
        </Tooltip>
      ))}
      {tools.length ? (
        <>
          <IconButton
            aria-label={menuLabel}
            aria-haspopup="menu"
            aria-expanded={moreAnchor ? true : undefined}
            onClick={(e) => setMoreAnchor(e.currentTarget)}
            sx={{ display: { xs: "inline-flex", sm: "none" } }}
          >
            <EllipsisIcon size={20} />
          </IconButton>
          <Menu
            anchorEl={moreAnchor}
            open={Boolean(moreAnchor)}
            onClose={closeMore}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
            slotProps={{ paper: { sx: { mt: 0.5, minWidth: 220 } } }}
          >
            {tools.map((tool) =>
              tool.href ? (
                <MenuItem
                  key={tool.id}
                  component={Link}
                  href={tool.href}
                  onClick={closeMore}
                >
                  <ListItemIcon>{tool.icon(18)}</ListItemIcon>
                  {tool.label}
                </MenuItem>
              ) : (
                <MenuItem
                  key={tool.id}
                  onClick={() => {
                    closeMore()
                    tool.onClick?.()
                  }}
                >
                  <ListItemIcon>{tool.icon(18)}</ListItemIcon>
                  {tool.label}
                </MenuItem>
              )
            )}
          </Menu>
        </>
      ) : null}
      <ThemeToggle label={theme.label} onToggle={theme.onToggle} />
      <LanguageMenu {...language} />
    </Stack>
  )
}

/* ------------------------------------------------------------------ */
/* The header                                                          */
/* ------------------------------------------------------------------ */

export type SiteHeaderProps<L extends string> = HeaderToolsProps<L> & {
  /** The app's mark, in its 34px-high box (with any morph copy over it). */
  mark: React.ReactNode
  /** The wordmark next to it ("Solavi"). */
  name: string
  /** Where the brand leads; "/" by default. */
  homeHref?: string
  homeLabel?: string
  /** Clicks on the brand (the apps count pokes for an easter egg). */
  onBrandClick?: () => void
  /** Extra content between the brand and the tools. */
  children?: React.ReactNode
}

/**
 * The family's site header: the mark and wordmark on the left, the tools on
 * the right. It stays at the top while the page scrolls, with no background
 * of its own: the page shows through.
 */
export function SiteHeader<L extends string>({
  mark,
  name,
  homeHref = "/",
  homeLabel,
  onBrandClick,
  children,
  ...tools
}: SiteHeaderProps<L>) {
  return (
    <Box
      component="header"
      sx={{
        position: "sticky",
        top: 0,
        zIndex: 10,
        display: "flex",
        alignItems: "center",
        gap: 1,
        px: { xs: 2, md: 4 },
        py: 1.5,
      }}
    >
      <Box
        component={Link}
        href={homeHref}
        aria-label={homeLabel}
        onClick={onBrandClick}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          color: "text.primary",
          textDecoration: "none",
        }}
      >
        {mark}
        <Typography
          sx={{
            fontWeight: 800,
            fontSize: FONT_SIZE.TITLE_SM,
            letterSpacing: "-0.02em",
          }}
        >
          {name}
        </Typography>
      </Box>
      <Box sx={{ flex: 1 }} />
      {children}
      <HeaderTools {...tools} />
    </Box>
  )
}
