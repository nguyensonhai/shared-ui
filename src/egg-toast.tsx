"use client"

import Box from "@mui/material/Box"
import ButtonBase from "@mui/material/ButtonBase"
import { keyframes } from "@mui/material/styles"

import { FONT_SIZE } from "./internal/tokens"

const enter = keyframes`
  0% { opacity: 0; transform: translate3d(0, -14px, 0) scale(0.92); }
  60% { opacity: 1; transform: translate3d(0, 2px, 0) scale(1.02); }
  100% { opacity: 1; transform: none; }
`
/** The egg wobbles, then its top half pops off… */
const wobble = keyframes`
  0%, 100% { transform: rotate(0deg); }
  15% { transform: rotate(-9deg); }
  30% { transform: rotate(8deg); }
  45% { transform: rotate(-5deg); }
  60% { transform: rotate(0deg); }
`
const lidOff = keyframes`
  0%, 55% { transform: translate3d(0, 0, 0) rotate(0deg); }
  80% { transform: translate3d(-5px, -12px, 0) rotate(-28deg); }
  100% { transform: translate3d(-6px, -9px, 0) rotate(-22deg); }
`
/** …and a sparkle (or, for a skin, the app's mascot wearing it) rises out. */
const popOut = keyframes`
  0%, 55% { opacity: 0; transform: translate3d(0, 8px, 0) scale(0.4); }
  85% { opacity: 1; transform: translate3d(0, -3px, 0) scale(1.15); }
  100% { opacity: 1; transform: translate3d(0, -1px, 0) scale(1); }
`
const shimmer = keyframes`
  from { background-position: 200% 0; }
  to { background-position: -200% 0; }
`

/** A speckled egg that cracks open. */
function CrackingEgg({
  bird,
  hatchling,
}: {
  bird: boolean
  hatchling: React.ReactNode
}) {
  return (
    <Box
      aria-hidden
      sx={{
        position: "relative",
        width: 40,
        height: 44,
        flexShrink: 0,
        animation: `${wobble} 900ms ease-in-out both`,
      }}
    >
      <Box
        sx={{
          position: "absolute",
          zIndex: 2,
          left: "50%",
          top: bird ? -6 : 10,
          ml: bird ? "-15px" : "-8px",
          animation: `${popOut} 1100ms cubic-bezier(0.22, 1, 0.36, 1) both`,
          ...(bird
            ? {}
            : {
                width: 16,
                height: 16,
                fontSize: 16,
                lineHeight: "16px",
                textAlign: "center",
                color: "#FFF3B0",
                textShadow: "0 0 10px rgba(255, 236, 160, 0.95)",
              }),
        }}
      >
        {bird ? hatchling : "✦"}
      </Box>
      {/* Bottom half, with a zig-zag rim. */}
      <svg
        width={40}
        height={44}
        viewBox="0 0 40 44"
        style={{ position: "absolute", inset: 0 }}
      >
        <path
          d="M5 24 L10 20 L15 25 L20 20 L25 25 L30 20 L35 24 C36 36 29 42 20 42 C11 42 4 36 5 24Z"
          fill="#FFF7EC"
          stroke="#E8C9A6"
          strokeWidth={1.2}
        />
        <circle cx={14} cy={33} r={1.6} fill="#D9A97A" />
        <circle cx={24} cy={36} r={1.2} fill="#D9A97A" />
        <circle cx={28} cy={30} r={1.4} fill="#D9A97A" />
      </svg>
      {/* Top half, tipping off. */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          transformOrigin: "8px 22px",
          animation: `${lidOff} 1100ms cubic-bezier(0.34, 1.4, 0.64, 1) both`,
        }}
      >
        <svg width={40} height={44} viewBox="0 0 40 44">
          <path
            d="M5 24 C5 10 12 2 20 2 C28 2 35 10 35 24 L30 20 L25 25 L20 20 L15 25 L10 20Z"
            fill="#FFFBF4"
            stroke="#E8C9A6"
            strokeWidth={1.2}
          />
          <circle cx={16} cy={11} r={1.5} fill="#D9A97A" />
          <circle cx={25} cy={15} r={1.2} fill="#D9A97A" />
        </svg>
      </Box>
    </Box>
  )
}

/**
 * The toast for a found easter egg: an egg cracks open with a sparkle, on a
 * golden-hour gradient. When the egg unlocked a skin, `hatchling` (the app's
 * mascot, about 30px) hatches out instead, and a click on the toast opens the
 * app's skin dialog.
 */
export function EggToast({
  message,
  detail,
  skin = false,
  hatchling,
  onClick,
  ...rest
}: {
  message: string
  detail?: string
  skin?: boolean
  hatchling: React.ReactNode
  onClick?: () => void
  ref?: React.Ref<HTMLButtonElement>
  style?: React.CSSProperties
}) {
  return (
    <ButtonBase
      {...rest}
      onClick={onClick}
      disabled={!onClick}
      role="status"
      sx={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        pl: 1.25,
        pr: 2,
        py: 1,
        minWidth: 260,
        maxWidth: 400,
        borderRadius: "16px",
        color: "#fff",
        textAlign: "left",
        background: skin
          ? "linear-gradient(120deg, #3B2A6B 0%, #7A4FB5 45%, #C8961E 100%)"
          : "linear-gradient(rgba(20, 22, 28, 0.35), rgba(20, 22, 28, 0.35)), var(--accent-grad)",
        boxShadow:
          "0 14px 34px rgba(20, 10, 30, 0.35), inset 0 0 0 1px rgba(255,255,255,0.18)",
        overflow: "hidden",
        animation: `${enter} 520ms cubic-bezier(0.22, 1, 0.36, 1) both`,
        "&.Mui-disabled": { color: "#fff", pointerEvents: "auto" },
        "&::after": {
          content: '""',
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "linear-gradient(100deg, transparent 30%, rgba(255,255,255,0.18) 50%, transparent 70%)",
          backgroundSize: "200% 100%",
          animation: `${shimmer} 2.4s linear 400ms 1 both`,
        },
      }}
    >
      <CrackingEgg bird={skin} hatchling={hatchling} />
      <Box sx={{ minWidth: 0 }}>
        <Box
          sx={{
            fontWeight: 700,
            fontSize: FONT_SIZE.BODY_LG,
            lineHeight: 1.35,
          }}
        >
          {message}
        </Box>
        {detail ? (
          <Box sx={{ mt: 0.25, fontSize: FONT_SIZE.BODY, opacity: 0.85 }}>
            {detail}
          </Box>
        ) : null}
      </Box>
    </ButtonBase>
  )
}
