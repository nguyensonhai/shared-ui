"use client"

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react"
import { ChevronLeftIcon, ChevronRightIcon, XIcon } from "lucide-react"
import Box from "@mui/material/Box"
import IconButton from "@mui/material/IconButton"
import Modal from "@mui/material/Modal"
import { keyframes } from "@mui/material/styles"
import Typography from "@mui/material/Typography"

import { prefersReducedMotion } from "./motion"

/**
 * A picture the viewer can show. `darkSrc` is the same picture for the dark
 * colour scheme: both are in the page and the one that doesn't match the
 * class on <html> is hidden, so switching scheme never waits for a load.
 */
export interface ViewerImage {
  src: string
  darkSrc?: string
  alt: string
  /** A line under the picture (a step's name). */
  caption?: string
}

interface ViewerState {
  images: ViewerImage[]
  index: number
  /** Where the picture was on the page: it grows from there. */
  from: DOMRect | null
}

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)"

const slideIn = (dir: number) => keyframes`
  from { opacity: 0; transform: translateX(${dir * 48}px) scale(0.98); }
  to { opacity: 1; transform: none; }
`
const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`

/**
 * Open/closed state for one full-screen image viewer that any picture can
 * open, kept outside React and shared through a window event (as
 * `createDialogState`). Mount one `<ImageViewer viewer={…} />` per app.
 */
export function createImageViewer(event: string) {
  let state: ViewerState | null = null
  const emit = (next: ViewerState | null) => {
    state = next
    window.dispatchEvent(new Event(event))
  }
  const subscribe = (onChange: () => void) => {
    window.addEventListener(event, onChange)
    return () => window.removeEventListener(event, onChange)
  }
  return {
    /**
     * Show `images` from `index`. Pass the clicked element as `from` and
     * the picture grows out of it (and shrinks back on close).
     */
    open: (images: ViewerImage[], index = 0, from?: Element | null) =>
      emit({
        images,
        index: Math.max(0, Math.min(index, images.length - 1)),
        from: from?.getBoundingClientRect() ?? null,
      }),
    close: () => emit(null),
    useState: () =>
      useSyncExternalStore(
        subscribe,
        () => state,
        () => null
      ),
  }
}

export type ImageViewerHandle = ReturnType<typeof createImageViewer>

/** The words the viewer needs, in the page's language. */
export interface ImageViewerLabels {
  close: string
  previous: string
  next: string
  /** "{n} of {total}" for screen readers; `{n}`/`{total}` are filled in. */
  position?: string
}

/** The round glass buttons over the picture. */
const glass = {
  color: "#fff",
  bgcolor: "rgba(255, 255, 255, 0.12)",
  border: "1px solid rgba(255, 255, 255, 0.18)",
  backdropFilter: "blur(12px)",
  transition: `background-color 200ms, transform 300ms ${EASE}, opacity 200ms`,
  "&:hover": { bgcolor: "rgba(255, 255, 255, 0.22)" },
  "&:active": { transform: "scale(0.94)" },
  "&.Mui-disabled": { opacity: 0, pointerEvents: "none" },
} as const

/**
 * A full-screen viewer for screenshots: the picture grows from where it was
 * clicked, arrows (keys, buttons, swipe) step through a set without closing,
 * dots jump straight to one, and Esc, the X or a click beside the picture
 * closes it. Motion is transform and opacity only, and none of it plays
 * when the reader asked for less motion.
 *
 * `darkClass` is the class the app puts on <html> in dark mode.
 */
export function ImageViewer({
  viewer,
  labels,
  darkClass = "dark",
}: {
  viewer: ImageViewerHandle
  labels: ImageViewerLabels
  darkClass?: string
}) {
  const state = viewer.useState()
  const [index, setIndex] = useState(0)
  const [dir, setDir] = useState(0)
  const [leaving, setLeaving] = useState(false)
  const figure = useRef<HTMLDivElement>(null)
  const drag = useRef<{ x: number; id: number } | null>(null)
  const images = state?.images ?? []
  const count = images.length
  const image = images[index]

  // A new open starts at its own picture.
  const [opened, setOpened] = useState<ViewerState | null>(null)
  if (state !== opened) {
    setOpened(state)
    if (state) {
      setIndex(state.index)
      setDir(0)
      setLeaving(false)
    }
  }

  const go = useCallback(
    (to: number) => {
      if (to < 0 || to >= count || to === index) return
      setDir(to > index ? 1 : -1)
      setIndex(to)
    },
    [count, index]
  )

  /** Plays the picture back towards where it came from, then closes. */
  const close = useCallback(() => {
    if (leaving) return
    const el = figure.current
    const from = state?.from
    if (!el || prefersReducedMotion()) return viewer.close()
    setLeaving(true)
    const box = el.getBoundingClientRect()
    const to =
      from && index === state?.index
        ? `translate(${from.left + from.width / 2 - (box.left + box.width / 2)}px, ${
            from.top + from.height / 2 - (box.top + box.height / 2)
          }px) scale(${from.width / box.width})`
        : "scale(0.94)"
    el.animate(
      [
        { transform: "none", opacity: 1 },
        { transform: to, opacity: from && index === state?.index ? 0.4 : 0 },
      ],
      { duration: 260, easing: EASE, fill: "forwards" }
    ).onfinish = () => viewer.close()
  }, [leaving, state, index, viewer])

  // The first picture grows out of the one that was clicked.
  useEffect(() => {
    const el = figure.current
    if (!state || !el || prefersReducedMotion()) return
    const from = state.from
    const box = el.getBoundingClientRect()
    if (!box.width) return
    const start = from
      ? `translate(${from.left + from.width / 2 - (box.left + box.width / 2)}px, ${
          from.top + from.height / 2 - (box.top + box.height / 2)
        }px) scale(${from.width / box.width})`
      : "scale(0.94)"
    const anim = el.animate(
      [
        { transform: start, opacity: from ? 0.6 : 0 },
        { transform: "none", opacity: 1 },
      ],
      { duration: 420, easing: EASE }
    )
    return () => anim.cancel()
  }, [state])

  // Arrow keys step; Esc is the Modal's.
  useEffect(() => {
    if (!state) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(index + 1)
      if (e.key === "ArrowLeft") go(index - 1)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [state, go, index])

  // The neighbours load in the background, so a step never waits.
  useEffect(() => {
    for (const n of [images[index - 1], images[index + 1]]) {
      if (!n) continue
      const dark = document.documentElement.classList.contains(darkClass)
      new window.Image().src = dark && n.darkSrc ? n.darkSrc : n.src
    }
  }, [images, index, darkClass])

  const many = count > 1
  const reduced = typeof window !== "undefined" && prefersReducedMotion()

  return (
    <Modal
      open={!!state && !!image}
      onClose={close}
      aria-label={image?.alt}
      slotProps={{
        backdrop: {
          sx: {
            bgcolor: "rgba(8, 10, 14, 0.88)",
            backdropFilter: "blur(6px)",
            opacity: leaving ? 0 : 1,
            transition: `opacity 260ms ${EASE}`,
            animation: reduced ? "none" : `${fadeIn} 300ms ${EASE}`,
          },
        },
      }}
    >
      <Box
        onClick={(e) => {
          // A click beside the picture closes; on it, nothing happens.
          if (e.target === e.currentTarget) close()
        }}
        onPointerDown={(e) => {
          drag.current = { x: e.clientX, id: e.pointerId }
        }}
        onPointerUp={(e) => {
          const d = drag.current
          drag.current = null
          if (!d || d.id !== e.pointerId) return
          const dx = e.clientX - d.x
          if (Math.abs(dx) > 50) go(index + (dx < 0 ? 1 : -1))
        }}
        sx={{
          position: "fixed",
          inset: 0,
          outline: "none",
          display: "grid",
          gridTemplateRows: "1fr auto",
          placeItems: "center",
          px: { xs: 1.5, sm: 9 },
          pt: { xs: 7, sm: 4 },
          pb: { xs: 2, sm: 3 },
          touchAction: "pan-y",
          [`html.${darkClass} & .iv-light, html:not(.${darkClass}) & .iv-dark`]:
            { display: "none" },
        }}
      >
        {image ? (
          <Box
            ref={figure}
            // A new key per picture so each step slides in.
            key={index}
            onClick={(e) => e.stopPropagation()}
            sx={{
              maxWidth: "min(1600px, 100%)",
              maxHeight: "100%",
              minHeight: 0,
              display: "grid",
              placeItems: "center",
              animation:
                dir && !reduced ? `${slideIn(dir)} 380ms ${EASE}` : "none",
              "& img": {
                display: "block",
                maxWidth: "100%",
                maxHeight: { xs: "calc(100dvh - 160px)", sm: "calc(100dvh - 140px)" },
                width: "auto",
                height: "auto",
                objectFit: "contain",
                userSelect: "none",
              },
            }}
          >
            <img
              className={image.darkSrc ? "iv-light" : undefined}
              src={image.src}
              alt={image.alt}
              draggable={false}
            />
            {image.darkSrc ? (
              <img
                className="iv-dark"
                src={image.darkSrc}
                alt={image.alt}
                draggable={false}
              />
            ) : null}
          </Box>
        ) : null}

        {/* Caption, then a dot per picture (a tap jumps to it). */}
        <Box
          sx={{
            display: "grid",
            justifyItems: "center",
            gap: 1.25,
            mt: 1.5,
            minHeight: 24,
            opacity: leaving ? 0 : 1,
            transition: `opacity 200ms`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {image?.caption ? (
            <Typography
              key={index}
              sx={{
                color: "rgba(255, 255, 255, 0.92)",
                fontWeight: 700,
                fontSize: "0.9375rem",
                textAlign: "center",
                animation: reduced ? "none" : `${fadeIn} 320ms ${EASE}`,
              }}
            >
              {image.caption}
            </Typography>
          ) : null}
          {many ? (
            <Box
              role="tablist"
              aria-label={labels.position
                ?.replace("{n}", String(index + 1))
                .replace("{total}", String(count))}
              sx={{ display: "flex", gap: 1 }}
            >
              {images.map((img, i) => (
                <Box
                  key={i}
                  component="button"
                  type="button"
                  role="tab"
                  aria-selected={i === index}
                  aria-label={img.caption ?? img.alt}
                  onClick={() => go(i)}
                  sx={{
                    all: "unset",
                    cursor: "pointer",
                    width: 28,
                    height: 16,
                    display: "grid",
                    placeItems: "center",
                    "&::before": {
                      content: '""',
                      width: 24,
                      height: 4,
                      borderRadius: 2,
                      bgcolor: "#fff",
                      opacity: i === index ? 0.95 : 0.3,
                      transform: i === index ? "none" : "scaleX(0.4)",
                      transition: `opacity 300ms, transform 400ms ${EASE}`,
                    },
                    "&:hover::before": { opacity: i === index ? 0.95 : 0.6 },
                    "&:focus-visible": {
                      outline: "2px solid #fff",
                      outlineOffset: 2,
                      borderRadius: "4px",
                    },
                  }}
                />
              ))}
            </Box>
          ) : null}
        </Box>

        <IconButton
          onClick={close}
          aria-label={labels.close}
          sx={{
            ...glass,
            position: "fixed",
            top: { xs: 12, sm: 20 },
            right: { xs: 12, sm: 20 },
            width: 44,
            height: 44,
          }}
        >
          <XIcon size={20} />
        </IconButton>

        {many ? (
          <>
            <IconButton
              onClick={(e) => {
                e.stopPropagation()
                go(index - 1)
              }}
              disabled={index === 0}
              aria-label={labels.previous}
              sx={{
                ...glass,
                position: "fixed",
                left: { xs: 8, sm: 20 },
                top: "50%",
                mt: "-24px",
                width: 48,
                height: 48,
                display: { xs: "none", sm: "inline-flex" },
              }}
            >
              <ChevronLeftIcon size={24} />
            </IconButton>
            <IconButton
              onClick={(e) => {
                e.stopPropagation()
                go(index + 1)
              }}
              disabled={index === count - 1}
              aria-label={labels.next}
              sx={{
                ...glass,
                position: "fixed",
                right: { xs: 8, sm: 20 },
                top: "50%",
                mt: "-24px",
                width: 48,
                height: 48,
                display: { xs: "none", sm: "inline-flex" },
              }}
            >
              <ChevronRightIcon size={24} />
            </IconButton>
          </>
        ) : null}
      </Box>
    </Modal>
  )
}
