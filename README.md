# @nguyensonhai/shared-ui

UI pieces shared by Solavi and Raykit (Next.js App Router + MUI + Emotion).
Shipped as TypeScript source: each app lists it in `transpilePackages`.

| Import                                          | What                                                          |
| ----------------------------------------------- | ------------------------------------------------------------- |
| `@nguyensonhai/shared-ui/app-modal`             | `AppModal` (bottom sheet on phones), `ModalButton`, labels…   |
| `@nguyensonhai/shared-ui/ui-preferences`        | Text size, font, density, radius store (`createUiPreferencesStore`) |
| `@nguyensonhai/shared-ui/ui-preferences-react`  | `createUiPreferencesHooks(store)`: hooks + `UiPreferencesProvider` |
| `@nguyensonhai/shared-ui/ui-preferences-dialog` | `UiPreferencesDialog` (strings passed in by the app)          |
| `@nguyensonhai/shared-ui/slide-to-reset`        | `SlideToReset` (drag-to-confirm, mascot `knob`)               |
| `@nguyensonhai/shared-ui/viewport`              | `useViewportWidth`                                            |
| `@nguyensonhai/shared-ui/motion`                | `prefersReducedMotion`, `runViewTransition`                   |
| `@nguyensonhai/shared-ui/scramble-text`         | `ScrambleText`, `ScramblePlaceholder` (katakana decode)       |
| `@nguyensonhai/shared-ui/family-card`           | `MontideCredit` (© year Montide + card), `FamilyCard`, `CardLink`, `MontideArt` |
| `@nguyensonhai/shared-ui/egg-toast`             | `EggToast` (cracking egg; the app's mascot as `hatchling`)    |
| `@nguyensonhai/shared-ui/dialog-state`          | `createDialogState(event)`: open a dialog from anywhere       |
| `@nguyensonhai/shared-ui/site-header`           | `SiteHeader` (transparent sticky header), `HeaderTools`, `ThemeToggle`, `LanguageMenu`, `useThemeSwitch` |
| `@nguyensonhai/shared-ui/inline-script`         | `InlineScript`: run a script before first paint               |
| `@nguyensonhai/shared-ui/emotion-registry`      | `EmotionRegistry` for MUI in the App Router                   |

Components take their strings as props (`closeLabel`, `strings`), so the
package has no i18n of its own. Each app keeps a thin wrapper that passes its
dictionary, e.g. `src/components/ui/app-modal.tsx`.

The header works the same way: each app's `top-bar.tsx` passes its mark,
name, tools (guide, skins, UI preferences…) and labels.

```tsx
<SiteHeader
  mark={<SolaviMark size={34} />}
  name="Solavi"
  tools={[{ id: "guide", label: t.common.guide, href: "/guide", icon: (s) => <CircleHelpIcon size={s} /> }]}
  menuLabel={t.common.menu}
  theme={{ label: t.common.theme, onToggle: countFlips }}
  language={{ label: t.common.language, locale, locales, names: localeNames, short: localeShort, onChange: setLocale }}
/>
```

```ts
// src/features/preferences/ui-preferences.ts in an app
import { createUiPreferencesStore } from "@nguyensonhai/shared-ui/ui-preferences"
import { createUiPreferencesHooks } from "@nguyensonhai/shared-ui/ui-preferences-react"
export * from "@nguyensonhai/shared-ui/ui-preferences"
const store = createUiPreferencesStore("solavi") // localStorage key solavi-ui-preferences
export const { useUiPreferences, useResolvedDensity, UiPreferencesProvider } =
  createUiPreferencesHooks(store)
```

## Releasing

1. Change the code, bump `version` in `package.json`.
2. `git tag v0.3.0 && git push --tags`.
3. In each app: `pnpm add github:nguyensonhai/shared-ui#v0.3.0`.
