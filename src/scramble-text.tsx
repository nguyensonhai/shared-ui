"use client"

import { useEffect, useRef } from "react"
import Box from "@mui/material/Box"
import { keyframes } from "@mui/material/styles"

import { prefersReducedMotion } from "./motion"

// prettier-ignore
/** Katakana, as in nguyensonhai.dev's DecoderText. */
const GLYPHS = [
  "ア", "イ", "ウ", "エ", "オ", "カ", "キ", "ク", "ケ", "コ",
  "サ", "シ", "ス", "セ", "ソ", "タ", "チ", "ツ", "テ", "ト",
  "ナ", "ニ", "ヌ", "ネ", "ノ", "ハ", "ヒ", "フ", "ヘ", "ホ",
  "マ", "ミ", "ム", "メ", "モ", "ヤ", "ユ", "ヨ", "ー",
  "ラ", "リ", "ル", "レ", "ロ", "ワ", "ヰ", "ヱ", "ヲ", "ン",
  "ガ", "ギ", "グ", "ゲ", "ゴ", "ザ", "ジ", "ズ", "ゼ", "ゾ",
  "ダ", "ヂ", "ヅ", "デ", "ド", "バ", "ビ", "ブ", "ベ", "ボ",
  "パ", "ピ", "プ", "ペ", "ポ",
]

const GLYPH_FONT =
  '"Hiragino Sans", "Hiragino Kaku Gothic ProN", "Yu Gothic", "Meiryo", "Noto Sans JP", sans-serif'

/** Same spring as the portfolio (framer-motion stiffness 8, damping 5). */
const STIFFNESS = 8
const DAMPING = 5
const START_DELAY_MS = 200

/** The intro decode plays once per page load, not on every visit home. */
let introPlayed = false

type Cell = { glyph: boolean; value: string }

/**
 * Text that decodes from katakana into place: once when it first appears
 * in a page load (or on every mount with `replay`), then whenever it changes. A spring drives how many
 * letters have settled, so it starts quick and eases in slowly.
 *
 * The real text keeps the layout (made transparent while decoding). The
 * scramble is an aria-hidden overlay on a single, centered, non-wrapping
 * line, so wide glyphs can never push the heading onto a new line.
 */
/** Same glyphs every render (server and hydration must agree). */
function glyphFrames(text: string, count: number): string[] {
  let seed = 7
  for (const c of text) seed = (seed * 31 + c.codePointAt(0)!) >>> 0
  const next = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0
    return GLYPHS[seed % GLYPHS.length]
  }
  const chars = [...text.normalize("NFC")]
  return Array.from({ length: count }, () =>
    chars.map((c) => (c === " " ? " " : next())).join("")
  )
}

const FRAMES = 8

/**
 * What a `ScrambleText` looks like before the page's JavaScript runs:
 * katakana that keep flickering in place of the text (pure CSS, so it
 * moves even before hydration). Swap in the real `ScrambleText` once the
 * page is interactive; its intro decode then picks up from here.
 */
export function ScramblePlaceholder({ text }: { text: string }) {
  const frames = glyphFrames(text, FRAMES)
  const flicker = keyframes(
    Object.fromEntries(
      frames.map((f, i) => [
        `${(i / FRAMES) * 100}%`,
        { content: JSON.stringify(f) },
      ])
    )
  )
  return (
    <Box
      component="span"
      sx={{ position: "relative", display: "inline-block" }}
    >
      <Box
        component="span"
        sx={{
          color: "transparent",
          "@media (prefers-reduced-motion: reduce)": { color: "inherit" },
        }}
      >
        {text}
      </Box>
      <Box
        component="span"
        aria-hidden
        sx={{
          position: "absolute",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          whiteSpace: "nowrap",
          pointerEvents: "none",
          userSelect: "none",
          opacity: 0.8,
          fontWeight: 400,
          fontFamily: GLYPH_FONT,
          "&::after": {
            content: JSON.stringify(frames[0]),
            animation: `${flicker} 0.9s steps(1, end) infinite`,
          },
          "@media (prefers-reduced-motion: reduce)": { display: "none" },
        }}
      />
    </Box>
  )
}

export function ScrambleText({
  text,
  replay = false,
}: {
  text: string
  /** Decode on every mount, not only on the first one of the page load. */
  replay?: boolean
}) {
  const realRef = useRef<HTMLSpanElement>(null)
  const overlayRef = useRef<HTMLSpanElement>(null)
  const first = useRef(true)

  useEffect(() => {
    const real = realRef.current
    const overlay = overlayRef.current
    if (!real || !overlay) return
    const isFirst = first.current
    first.current = false
    if ((isFirst && introPlayed && !replay) || prefersReducedMotion()) return
    introPlayed = true

    const chars = [...text.normalize("NFC")]
    const target = chars.length
    let cells: Cell[] = chars.map(() => ({ glyph: true, value: "" }))
    let position = 0
    let velocity = 0
    let last = 0
    let frame = 0

    const randomGlyph = () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)]

    // Portfolio rule: settled letters show; the rest re-roll only during the
    // first half of each step, so the flicker reads calm, not noisy.
    const shuffle = () => {
      cells = chars.map((value, i) => {
        if (i < position || value === " ") return { glyph: false, value }
        if (position % 1 < 0.5) return { glyph: true, value: randomGlyph() }
        return cells[i].value ? cells[i] : { glyph: true, value: randomGlyph() }
      })
    }

    const render = () => {
      overlay.replaceChildren(
        ...cells.map(({ glyph, value }) => {
          if (!glyph) return document.createTextNode(value)
          const span = document.createElement("span")
          span.textContent = value
          span.style.cssText = `opacity:0.8;font-weight:400;font-family:${GLYPH_FONT};line-height:0`
          return span
        })
      )
    }

    const finish = () => {
      overlay.replaceChildren()
      real.style.color = ""
    }

    const tick = (now: number) => {
      const dt = Math.min((now - (last || now)) / 1000, 1 / 30)
      last = now
      const acceleration = STIFFNESS * (target - position) - DAMPING * velocity
      velocity += acceleration * dt
      position += velocity * dt
      const done =
        Math.abs(target - position) < 0.05 && Math.abs(velocity) < 0.05
      if (done) {
        finish()
        return
      }
      shuffle()
      render()
      frame = requestAnimationFrame(tick)
    }

    real.style.color = "transparent"
    shuffle()
    render()
    const timer = setTimeout(() => {
      frame = requestAnimationFrame(tick)
    }, START_DELAY_MS)

    return () => {
      clearTimeout(timer)
      cancelAnimationFrame(frame)
      finish()
    }
  }, [text, replay])

  return (
    <span style={{ position: "relative", display: "inline-block" }}>
      <span ref={realRef}>{text}</span>
      <span
        ref={overlayRef}
        aria-hidden
        style={{
          position: "absolute",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          whiteSpace: "nowrap",
          pointerEvents: "none",
          userSelect: "none",
        }}
      />
    </span>
  )
}
