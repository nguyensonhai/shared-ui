"use client"

import { useState } from "react"
import { CheckIcon, SlidersHorizontalIcon } from "lucide-react"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import FormControlLabel from "@mui/material/FormControlLabel"
import Radio from "@mui/material/Radio"
import RadioGroup from "@mui/material/RadioGroup"
import Slider from "@mui/material/Slider"
import Stack from "@mui/material/Stack"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"

import { AppModal, ModalButton, ModalSubmitButton } from "./app-modal"
import { fill, FONT_SIZE, r, RADIUS } from "./internal/tokens"
import {
  defaultUiPreferences,
  densities,
  densityToNumber,
  fontFamilyCss,
  fontOptions,
  fontScaleMarks,
  radiusScales,
  radiusToNumber,
  resolveDensity,
  type Density,
  type FontFamilyId,
  type RadiusScale,
  type UiPreferences,
  type UiPreferencesStore,
} from "./ui-preferences"
import { useUiPreferencesOf } from "./ui-preferences-react"
import { useViewportWidth } from "./viewport"

/** Every string the dialog shows; each app passes its dictionary's. */
export type UiPreferencesStrings = {
  title: string
  fontSize: string
  fontSizeHelp: string
  fontFamily: string
  fontFamilyHelp: string
  fontDescriptions: Record<FontFamilyId, string>
  density: string
  densityHelp: string
  densities: Record<Density, string>
  /** May contain `{density}`. */
  densityAutoHint: string
  radius: string
  radiusHelp?: string
  radii: Record<RadiusScale, string>
  preview: string
  previewHeading: string
  previewBody: string
  previewCaption: string
  previewPlaceholder: string
  reset: string
  cancel: string
  save: string
}

const tint = (amount: number) =>
  `color-mix(in srgb, var(--mui-palette-primary-main) ${amount}%, transparent)`

// Label only the 10% steps; the 5% steps stay as unlabeled dots.
const sliderMarks = fontScaleMarks.map((v) => {
  const pct = Math.round(v * 100)
  return { value: v, label: pct % 10 === 0 ? `${pct}%` : undefined }
})

function SectionHead({ title, desc }: { title: string; desc?: string }) {
  return (
    <Box sx={{ mb: 1 }}>
      <Typography
        sx={{ fontSize: FONT_SIZE.BODY_LG, fontWeight: 700, lineHeight: 1.3 }}
      >
        {title}
      </Typography>
      {desc ? (
        <Typography
          sx={{
            fontSize: FONT_SIZE.BODY_SM,
            color: "text.secondary",
            mt: 0.5,
            lineHeight: 1.5,
          }}
        >
          {desc}
        </Typography>
      ) : null}
    </Box>
  )
}

const radioLabelSx = {
  "& .MuiFormControlLabel-label": { fontSize: FONT_SIZE.BODY, fontWeight: 500 },
}

/**
 * "UI preferences" — text size, font, density and corner radius. Edits a
 * draft with a live preview; nothing applies until Save, which writes to
 * `store`.
 */
export function UiPreferencesDialog({
  open,
  onClose,
  store,
  strings: t,
  closeLabel,
  followColorScheme,
}: {
  open: boolean
  onClose: () => void
  store: UiPreferencesStore
  strings: UiPreferencesStrings
  closeLabel: string
  followColorScheme?: boolean
}) {
  const saved = useUiPreferencesOf(store)
  const autoDensity = resolveDensity("auto", useViewportWidth())
  const [draft, setDraft] = useState<UiPreferences>(saved)
  const set = (patch: Partial<UiPreferences>) =>
    setDraft((d) => ({ ...d, ...patch }))

  return (
    <AppModal
      open={open}
      onClose={onClose}
      width={600}
      icon={<SlidersHorizontalIcon />}
      title={t.title}
      closeLabel={closeLabel}
      followColorScheme={followColorScheme}
      // Start from the saved values every time it opens.
      slotProps={{ transition: { onEnter: () => setDraft(saved) } }}
      bodySx={{ px: 3, py: 3 }}
      actions={
        <>
          <ModalButton
            color="inherit"
            onClick={() => setDraft({ ...defaultUiPreferences })}
            sx={{ mr: "auto", color: "text.secondary" }}
          >
            {t.reset}
          </ModalButton>
          <ModalButton color="inherit" onClick={onClose}>
            {t.cancel}
          </ModalButton>
          <ModalSubmitButton
            onClick={() => {
              store.set(draft)
              onClose()
            }}
          >
            {t.save}
          </ModalSubmitButton>
        </>
      }
    >
      <Stack spacing={3}>
        {/* Text size */}
        <Box>
          <SectionHead title={t.fontSize} desc={t.fontSizeHelp} />
          <Box sx={{ px: 1, pt: 1 }}>
            <Slider
              value={draft.fontScale}
              min={fontScaleMarks[0]}
              max={fontScaleMarks[fontScaleMarks.length - 1]}
              step={null}
              marks={sliderMarks}
              valueLabelDisplay="auto"
              valueLabelFormat={(v) => `${Math.round(v * 100)}%`}
              aria-label={t.fontSize}
              onChange={(_, v) =>
                set({ fontScale: typeof v === "number" ? v : v[0] })
              }
              sx={{
                height: 4,
                "& .MuiSlider-rail": { opacity: 1, bgcolor: "divider" },
                "& .MuiSlider-mark": {
                  width: 4,
                  height: 4,
                  borderRadius: "50%",
                  bgcolor: "text.disabled",
                },
                "& .MuiSlider-markActive": { bgcolor: "primary.main" },
                "& .MuiSlider-markLabel": {
                  fontSize: FONT_SIZE.CAPTION_LG,
                  fontWeight: 600,
                  color: "text.disabled",
                },
                "& .MuiSlider-markLabelActive": {
                  color: "text.primary",
                  fontWeight: 700,
                },
                "& .MuiSlider-thumb": {
                  width: 20,
                  height: 20,
                  border: "3px solid #fff",
                  boxShadow: `0 2px 8px ${tint(40)}`,
                },
              }}
            />
          </Box>
        </Box>

        {/* Font family */}
        <Box>
          <SectionHead title={t.fontFamily} desc={t.fontFamilyHelp} />
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
              gap: 1.25,
            }}
          >
            {fontOptions.map((font) => {
              const active = draft.fontFamily === font.id
              return (
                <Box
                  key={font.id}
                  component="button"
                  type="button"
                  aria-pressed={active}
                  onClick={() => set({ fontFamily: font.id })}
                  sx={{
                    textAlign: "left",
                    cursor: "pointer",
                    font: "inherit",
                    color: "inherit",
                    p: "14px 14px 12px",
                    border: "1.5px solid",
                    borderColor: active ? "primary.main" : "divider",
                    bgcolor: active ? tint(6) : "background.paper",
                    borderRadius: r(RADIUS.SM),
                    boxShadow: active ? `0 0 0 3px ${tint(12)}` : "none",
                    transition: "all 150ms",
                    "&:hover": {
                      borderColor: active ? "primary.main" : "text.disabled",
                    },
                  }}
                >
                  <Typography
                    sx={{
                      fontFamily: font.family,
                      fontSize: 26,
                      fontWeight: 700,
                      lineHeight: 1,
                      mb: 1,
                      letterSpacing: "-0.5px",
                      color: active ? "primary.main" : "text.primary",
                    }}
                  >
                    Aa
                  </Typography>
                  <Box
                    sx={{ display: "flex", alignItems: "center", gap: 0.75 }}
                  >
                    <Typography
                      sx={{ fontSize: FONT_SIZE.BODY, fontWeight: 700 }}
                    >
                      {font.label}
                    </Typography>
                    {active ? (
                      <Box
                        component="span"
                        sx={{ display: "inline-flex", color: "primary.main" }}
                      >
                        <CheckIcon size={14} strokeWidth={3} />
                      </Box>
                    ) : null}
                  </Box>
                  <Typography
                    sx={{
                      fontSize: FONT_SIZE.CAPTION_LG,
                      color: "text.secondary",
                      mt: 0.25,
                      lineHeight: 1.4,
                    }}
                  >
                    {t.fontDescriptions[font.id]}
                  </Typography>
                </Box>
              )
            })}
          </Box>
        </Box>

        {/* Density */}
        <Box>
          <SectionHead title={t.density} desc={t.densityHelp} />
          <RadioGroup
            row
            value={draft.density}
            onChange={(_, v) => set({ density: v as Density })}
            sx={{ columnGap: 3 }}
          >
            {densities.map((value) => (
              <FormControlLabel
                key={value}
                value={value}
                control={<Radio size="small" />}
                label={t.densities[value]}
                sx={radioLabelSx}
              />
            ))}
          </RadioGroup>
          {draft.density === "auto" ? (
            <Typography
              sx={{
                fontSize: FONT_SIZE.BODY_SM,
                color: "text.secondary",
                mt: 0.5,
              }}
            >
              {fill(t.densityAutoHint, {
                density: t.densities[autoDensity],
              })}
            </Typography>
          ) : null}
        </Box>

        {/* Corner radius */}
        <Box>
          <SectionHead title={t.radius} desc={t.radiusHelp} />
          <RadioGroup
            row
            value={draft.radiusScale}
            onChange={(_, v) => set({ radiusScale: v as RadiusScale })}
            sx={{ columnGap: 3 }}
          >
            {radiusScales.map((value) => (
              <FormControlLabel
                key={value}
                value={value}
                control={<Radio size="small" />}
                label={t.radii[value]}
                sx={radioLabelSx}
              />
            ))}
          </RadioGroup>
        </Box>

        {/* Live preview — the draft's vars cascade into this subtree only. */}
        <Box>
          <SectionHead title={t.preview} />
          <Box
            sx={{
              zoom: draft.fontScale,
              "--ui-density-scale": densityToNumber(
                draft.density === "auto" ? autoDensity : draft.density
              ),
              "--ui-radius-scale": radiusToNumber(draft.radiusScale),
              "--ui-font-family": fontFamilyCss(draft.fontFamily),
              fontFamily: fontFamilyCss(draft.fontFamily),
              p: 1.5,
              borderRadius: r(RADIUS.MD),
              border: 1,
              borderColor: tint(20),
              bgcolor: tint(4),
            }}
          >
            <Box
              sx={{
                p: 2,
                borderRadius: r(RADIUS.SM),
                border: 1,
                borderColor: "divider",
                bgcolor: "background.paper",
              }}
            >
              <Typography
                sx={{ fontSize: FONT_SIZE.TITLE_SM, fontWeight: 700, mb: 0.5 }}
              >
                {t.previewHeading}
              </Typography>
              <Typography
                sx={{
                  fontSize: FONT_SIZE.BODY,
                  color: "text.secondary",
                  mb: 0.5,
                  lineHeight: 1.55,
                }}
              >
                {t.previewBody}
              </Typography>
              <Typography
                sx={{
                  fontSize: FONT_SIZE.CAPTION_LG,
                  color: "text.disabled",
                  mb: 1.5,
                  fontWeight: 600,
                }}
              >
                {t.previewCaption}
              </Typography>
              <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                <TextField
                  placeholder={t.previewPlaceholder}
                  sx={{ flex: 1 }}
                  slotProps={{
                    htmlInput: { "aria-label": t.previewPlaceholder },
                  }}
                />
                <Button variant="contained">{t.save}</Button>
              </Box>
            </Box>
          </Box>
        </Box>
      </Stack>
    </AppModal>
  )
}
