"use client"

import { ArrowUpRightIcon } from "lucide-react"
import Box from "@mui/material/Box"
import Tooltip from "@mui/material/Tooltip"
import Typography from "@mui/material/Typography"

import { FONT_SIZE, r, RADIUS, SHADOWS } from "./internal/tokens"

export const MONTIDE_URL = "https://montide.app"

/** The Montide family colours (teal, blue, coral, yellow). */
const STROKES = [
  { d: "M108 410L178 112", color: "#0BB2AC" },
  { d: "M178 112L256 344", color: "#5E92CD" },
  { d: "M256 344L334 112", color: "#EE3E56" },
  { d: "M334 112L404 410", color: "#FCDC59" },
]

const glow = (color: string, pct: number) =>
  `color-mix(in srgb, ${color} ${pct}%, transparent)`

/**
 * The Montide mark (its four-stroke M, as in montide.app's icon) over soft
 * glows of the family colours; fills its (positioned) parent.
 */
export function MontideArt() {
  return (
    <Box
      aria-hidden
      sx={{
        position: "absolute",
        inset: 0,
        display: "grid",
        placeItems: "center",
        bgcolor: "background.default",
        backgroundImage: [
          `radial-gradient(circle at 18% 28%, ${glow("#0BB2AC", 26)}, transparent 55%)`,
          `radial-gradient(circle at 82% 22%, ${glow("#FCDC59", 30)}, transparent 50%)`,
          `radial-gradient(circle at 78% 86%, ${glow("#EE3E56", 22)}, transparent 55%)`,
          `radial-gradient(circle at 24% 90%, ${glow("#5E92CD", 24)}, transparent 55%)`,
        ].join(", "),
      }}
    >
      <svg
        viewBox="60 65 392 392"
        width={84}
        height={84}
        fill="none"
        strokeLinecap="round"
      >
        {STROKES.map(({ d, color }) => (
          <path
            key={d}
            d={d}
            stroke={color}
            strokeWidth={58}
            strokeOpacity={0.85}
          />
        ))}
      </svg>
    </Box>
  )
}

/** What the card says, in the app's language. */
export type FamilyCardStrings = {
  name: string
  role: string
  bio: string
  visit: string
}

/**
 * A footer card: picture on top, the app's four-colour stripe
 * (`--skin-0`…`--skin-3`), then a title, a subtitle, a short text and a
 * "visit" line in `accent`. The whole card is the link (it renders in a
 * portal, so it is never nested in the footer link).
 */
export function FamilyCard({
  href = MONTIDE_URL,
  picture = <MontideArt />,
  strings,
  accent = "var(--accent)",
}: {
  href?: string
  picture?: React.ReactNode
  strings: FamilyCardStrings
  accent?: string
}) {
  return (
    <Box
      component="a"
      href={href}
      target="_blank"
      rel="noopener"
      sx={{
        display: "block",
        width: 264,
        textAlign: "left",
        color: "inherit",
        textDecoration: "none",
        "&:hover .card-visit, &:focus-visible .card-visit": {
          textDecoration: "underline",
          textUnderlineOffset: "3px",
        },
        "&:hover .card-visit svg": { transform: "translate(2px, -2px)" },
      }}
    >
      <Box
        sx={{
          position: "relative",
          height: 148,
          overflow: "hidden",
          borderRadius: `${r(RADIUS.MD)} ${r(RADIUS.MD)} 0 0`,
        }}
      >
        {picture}
      </Box>
      <Box
        aria-hidden
        sx={{
          height: 4,
          background:
            "linear-gradient(90deg, var(--skin-0) 0 25%, var(--skin-1) 25% 50%, var(--skin-2) 50% 75%, var(--skin-3) 75% 100%)",
        }}
      />
      <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 0.5 }}>
        <Typography sx={{ fontSize: FONT_SIZE.TITLE_SM, fontWeight: 800 }}>
          {strings.name}
        </Typography>
        <Typography
          sx={{
            fontSize: FONT_SIZE.BODY_SM,
            fontWeight: 600,
            color: "text.secondary",
          }}
        >
          {strings.role}
        </Typography>
        <Typography sx={{ mt: 0.5, fontSize: FONT_SIZE.BODY, lineHeight: 1.5 }}>
          {strings.bio}
        </Typography>
        <Box
          className="card-visit"
          sx={{
            mt: 1,
            display: "inline-flex",
            alignItems: "center",
            gap: 0.5,
            fontSize: FONT_SIZE.BODY,
            fontWeight: 700,
            color: accent,
            "& svg": { transition: "transform 150ms" },
          }}
        >
          {strings.visit}
          <ArrowUpRightIcon size={15} />
        </Box>
      </Box>
    </Box>
  )
}

/** Footer link that shows `card` on hover or keyboard focus. */
export function CardLink({
  href,
  card,
  children,
}: {
  href: string
  card: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <Tooltip
      title={card}
      placement="top"
      arrow
      enterDelay={150}
      leaveDelay={100}
      // A link: keyboard users get the card too.
      disableFocusListener={false}
      slotProps={{
        tooltip: {
          sx: {
            p: 0,
            maxWidth: "none",
            bgcolor: "background.paper",
            color: "text.primary",
            borderRadius: r(RADIUS.MD),
            border: 1,
            borderColor: "divider",
            boxShadow: SHADOWS.LG,
            overflow: "hidden",
          },
        },
        arrow: {
          sx: {
            color: "background.paper",
            "&::before": { border: 1, borderColor: "divider" },
          },
        },
      }}
    >
      <Box
        component="a"
        href={href}
        target="_blank"
        rel="noopener"
        sx={{
          color: "inherit",
          textDecoration: "none",
          transition: "color 150ms",
          "&:hover, &:focus-visible": { color: "text.primary" },
        }}
      >
        {children}
      </Box>
    </Tooltip>
  )
}

/**
 * The footer's credit line: "© {year} Montide", the name a link to
 * montide.app that shows the Montide card on hover or focus.
 */
export function MontideCredit({
  year,
  strings,
  accent,
}: {
  year: number
  strings: FamilyCardStrings
  accent?: string
}) {
  return (
    <>
      © {year}{" "}
      <CardLink
        href={MONTIDE_URL}
        card={<FamilyCard strings={strings} accent={accent} />}
      >
        Montide
      </CardLink>
    </>
  )
}
