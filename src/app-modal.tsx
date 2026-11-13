"use client"

import { useId } from "react"
import { XIcon } from "lucide-react"
import Box from "@mui/material/Box"
import Button, { type ButtonProps } from "@mui/material/Button"
import Dialog, { type DialogProps } from "@mui/material/Dialog"
import IconButton from "@mui/material/IconButton"
import {
  keyframes,
  styled,
  useColorScheme,
  useTheme,
  type SxProps,
  type Theme,
} from "@mui/material/styles"
import Typography from "@mui/material/Typography"

const modalIn = keyframes`
  from { opacity: 0; transform: translateY(8px) scale(0.97); }
  to { opacity: 1; transform: none; }
`
const sheetIn = keyframes`
  from { transform: translateY(100%); }
  to { transform: none; }
`
const modalEase = "cubic-bezier(0.22, 1, 0.36, 1)"

/** Type scale shared by every modal. */
export const modalFont = {
  caption: "0.6875rem", // 11px — hints, sub-lines
  label: "0.75rem", // 12px — section labels, row labels
  body: "0.8125rem", // 13px — body copy
  title: "0.875rem", // 14px — modal title
} as const

/** Inner padding used by the header, body and footer so they line up. */
const GAP = 16

const tint = (color: string, amount: number) =>
  `color-mix(in srgb, ${color} ${amount}%, transparent)`

/** Tinted rounded square behind an icon (header bubble, list rows). */
export function IconBubble({
  color = "var(--mui-palette-primary-main)",
  size = 28,
  iconSize = 16,
  children,
  sx,
}: {
  color?: string
  size?: number
  iconSize?: number
  children: React.ReactNode
  sx?: SxProps<Theme>
}) {
  return (
    <Box
      component="span"
      sx={[
        {
          display: "inline-flex",
          flexShrink: 0,
          alignItems: "center",
          justifyContent: "center",
          width: size,
          height: size,
          borderRadius: "8px",
          bgcolor: tint(color, 12),
          color,
          "& svg": { width: iconSize, height: iconSize },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {children}
    </Box>
  )
}

// Colors as CSS variables: `theme.palette` holds the light values only, so
// the label went dark-on-dark in dark mode.

/** Bold 12px label that heads a block inside a modal body. */
export const ModalLabel = styled(Typography)({
  fontSize: modalFont.label,
  fontWeight: 600,
  lineHeight: 1.4,
  color: "var(--mui-palette-text-primary)",
})

/** Muted 11px helper text. */
export const ModalHint = styled(Typography)({
  fontSize: modalFont.caption,
  lineHeight: 1.45,
  color: "var(--mui-palette-text-secondary)",
})

/** Footer button: 700 weight, 8px radius. */
export function ModalButton({ sx, ...props }: ButtonProps) {
  return (
    <Button
      {...props}
      sx={[
        { fontWeight: 700, borderRadius: "8px" },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    />
  )
}

/** Primary footer button: wider padding so it reads as the main action. */
export function ModalSubmitButton({ sx, ...props }: ButtonProps) {
  return (
    <ModalButton
      variant="contained"
      {...props}
      sx={[{ px: 4 }, ...(Array.isArray(sx) ? sx : [sx])]}
    />
  )
}

/**
 * Project modal shell: slim header (28px icon bubble, 14px title, small X),
 * 16px body, compact footer. On phones it is a bottom sheet, only as tall as
 * its content (up to nearly the full screen).
 *
 * `closeLabel` is the X button's accessible name, in the page's language.
 * `followColorScheme` scopes the saved light / dark choice onto the modal,
 * for pages that force a scheme on <body> (Solavi's HUD is always dark).
 */
export function AppModal({
  open,
  onClose,
  title,
  subtitle,
  icon,
  width = 560,
  actions,
  children,
  bodySx,
  slotProps,
  disableBackdropClose = false,
  closeLabel,
  followColorScheme = false,
}: {
  open: boolean
  onClose: () => void
  title: React.ReactNode
  subtitle?: React.ReactNode
  icon?: React.ReactNode
  /** Max width of the paper, in px. */
  width?: number
  /** Footer content; omit for no footer. */
  actions?: React.ReactNode
  children: React.ReactNode
  bodySx?: SxProps<Theme>
  slotProps?: DialogProps["slotProps"]
  /** Keep the modal open on backdrop click (long forms, drafts). */
  disableBackdropClose?: boolean
  closeLabel: string
  followColorScheme?: boolean
}) {
  const theme = useTheme()
  const { colorScheme } = useColorScheme()
  const phone = theme.breakpoints.down("sm")
  const titleId = useId()

  return (
    <Dialog
      className={followColorScheme ? colorScheme : undefined}
      open={open}
      onClose={(_, reason) => {
        if (disableBackdropClose && reason === "backdropClick") return
        onClose()
      }}
      fullWidth
      aria-labelledby={titleId}
      slotProps={slotProps}
      sx={{
        "& .MuiBackdrop-root": {
          backdropFilter: "blur(3px)",
        },
        "& .MuiDialog-paper": {
          maxWidth: width,
          borderRadius: "12px",
          boxShadow: "0 24px 48px -12px rgba(16,24,40,0.24)",
          animation: `${modalIn} 220ms ${modalEase}`,
        },
        [phone]: {
          "& .MuiDialog-container": { alignItems: "flex-end" },
          "& .MuiDialog-paper": {
            m: 0,
            width: "100%",
            maxWidth: "100%",
            maxHeight: "calc(100dvh - 40px)",
            borderRadius: "16px 16px 0 0",
            animation: `${sheetIn} 280ms ${modalEase}`,
          },
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.25,
          px: `${GAP}px`,
          py: "6px",
          minHeight: 48,
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        {icon ? <IconBubble>{icon}</IconBubble> : null}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            id={titleId}
            component="h2"
            noWrap
            sx={{ fontSize: modalFont.title, fontWeight: 700, lineHeight: 1.3 }}
          >
            {title}
          </Typography>
          {subtitle ? (
            <Typography
              noWrap
              sx={{
                fontSize: modalFont.label,
                fontWeight: 500,
                color: "text.secondary",
                lineHeight: 1.4,
              }}
            >
              {subtitle}
            </Typography>
          ) : null}
        </Box>
        <IconButton
          size="small"
          onClick={onClose}
          aria-label={closeLabel}
          sx={{
            p: "5px",
            mr: -0.5,
            color: "text.disabled",
            // A finger-sized target on touch screens.
            "@media (pointer: coarse)": { p: "10px", mr: -1.25 },
          }}
        >
          <XIcon size={18} />
        </IconButton>
      </Box>

      <Box
        sx={[
          {
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            p: `${GAP}px`,
            // Sheet without a footer: keep clear of the home indicator.
            ...(actions
              ? {}
              : {
                  [phone]: {
                    pb: `max(${GAP}px, env(safe-area-inset-bottom, 0px))`,
                  },
                }),
          },
          ...(Array.isArray(bodySx) ? bodySx : [bodySx]),
        ]}
      >
        {children}
      </Box>

      {actions ? (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            // Buttons sit on the right, where the eye and thumb end up; an
            // extra (reset, hint) can push itself left with mr: "auto".
            justifyContent: "flex-end",
            gap: 1,
            px: `${GAP}px`,
            py: "12px",
            borderTop: 1,
            borderColor: "divider",
            // Phones: stack full-width, primary action (last) on top.
            [theme.breakpoints.down("sm")]: {
              flexDirection: "column-reverse",
              alignItems: "stretch",
              pb: `max(${GAP}px, env(safe-area-inset-bottom, 0px))`,
              "& > *": { width: "100%", m: "0 !important" },
            },
          }}
        >
          {actions}
        </Box>
      ) : null}
    </Dialog>
  )
}
