"use client"

import { useRef, useState } from "react"
import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"

import { FONT_SIZE } from "./internal/tokens"

const KNOB = 40
const PAD = 4

/**
 * "Slide to reset": a knob dragged all the way to the right confirms, so a
 * stray click never wipes anything. Arrow keys work too (End confirms).
 * `knob` is what rides on the handle (each app's mascot emoji).
 */
export function SlideToReset({
  label,
  onConfirm,
  knob,
}: {
  label: string
  onConfirm: () => void
  knob: React.ReactNode
}) {
  const track = useRef<HTMLDivElement>(null)
  const start = useRef<{ x: number; at: number } | null>(null)
  const [at, setAt] = useState(0)
  const [dragging, setDragging] = useState(false)

  const room = () => (track.current?.clientWidth ?? 0) - KNOB - PAD * 2
  const finish = (value: number) => {
    setDragging(false)
    start.current = null
    if (value >= 0.92) {
      setAt(1)
      window.setTimeout(() => {
        onConfirm()
        setAt(0)
      }, 180)
    } else {
      setAt(0)
    }
  }

  return (
    <Box
      ref={track}
      sx={{
        position: "relative",
        height: KNOB + PAD * 2,
        maxWidth: 340,
        borderRadius: 999,
        border: 1,
        borderColor: "divider",
        bgcolor:
          "color-mix(in srgb, var(--mui-palette-error-main) 6%, transparent)",
        overflow: "hidden",
        userSelect: "none",
        touchAction: "none",
      }}
    >
      {/* Fills in behind the knob as it goes. */}
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          inset: 0,
          width: `calc(${KNOB + PAD * 2}px + (100% - ${KNOB + PAD * 2}px) * ${at})`,
          bgcolor:
            "color-mix(in srgb, var(--mui-palette-error-main) 16%, transparent)",
          transition: dragging ? "none" : "width 220ms ease",
        }}
      />
      <Typography
        aria-hidden
        sx={{
          position: "absolute",
          inset: 0,
          pl: `${KNOB + PAD * 3}px`,
          pr: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: FONT_SIZE.BODY_SM,
          fontWeight: 600,
          color: "text.secondary",
          opacity: 1 - at * 1.4,
          // A soft shimmer that runs the way the knob should go.
          backgroundImage:
            "linear-gradient(90deg, currentColor 40%, var(--mui-palette-text-primary) 50%, currentColor 60%)",
          backgroundSize: "300% 100%",
          backgroundClip: "text",
          WebkitTextFillColor: "transparent",
          animation: "shared-slide-hint 2.6s linear infinite",
          "@keyframes shared-slide-hint": {
            from: { backgroundPosition: "100% 0" },
            to: { backgroundPosition: "0% 0" },
          },
          "@media (prefers-reduced-motion: reduce)": { animation: "none" },
        }}
      >
        {label} →
      </Typography>
      <Box
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(at * 100)}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId)
          start.current = { x: e.clientX, at }
          setDragging(true)
        }}
        onPointerMove={(e) => {
          if (!start.current) return
          const w = room()
          if (w <= 0) return
          setAt(
            Math.min(
              1,
              Math.max(0, start.current.at + (e.clientX - start.current.x) / w)
            )
          )
        }}
        onPointerUp={() => finish(at)}
        onPointerCancel={() => finish(0)}
        onKeyDown={(e) => {
          if (e.key === "End") finish(1)
          else if (e.key === "ArrowRight") {
            const next = Math.min(1, at + 0.25)
            if (next >= 1) finish(1)
            else setAt(next)
          } else if (e.key === "ArrowLeft" || e.key === "Home") setAt(0)
          else return
          e.preventDefault()
        }}
        sx={{
          position: "absolute",
          top: PAD,
          left: `calc(${PAD}px + (100% - ${KNOB + PAD * 2}px) * ${at})`,
          width: KNOB,
          height: KNOB,
          borderRadius: "50%",
          display: "grid",
          placeItems: "center",
          fontSize: 20,
          bgcolor: "background.paper",
          boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
          cursor: dragging ? "grabbing" : "grab",
          transition: dragging ? "none" : "left 220ms ease",
          outlineOffset: 2,
        }}
      >
        {knob}
      </Box>
    </Box>
  )
}
