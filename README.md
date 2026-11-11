# @nguyensonhai/shared-ui

UI pieces shared by Solavi and Montide (Next.js App Router + MUI + Emotion).
Shipped as TypeScript source: each app lists it in `transpilePackages`.

| Import                                     | What                                                    |
| ------------------------------------------ | ------------------------------------------------------- |
| `@nguyensonhai/shared-ui/motion`           | `prefersReducedMotion`, `runViewTransition`             |
| `@nguyensonhai/shared-ui/scramble-text`    | `ScrambleText`, `ScramblePlaceholder` (katakana decode) |
| `@nguyensonhai/shared-ui/inline-script`    | `InlineScript`: run a script before first paint         |
| `@nguyensonhai/shared-ui/emotion-registry` | `EmotionRegistry` for MUI in the App Router             |
| `@nguyensonhai/shared-ui/ui-preferences`   | Text size, font, density, radius, reduced motion store  |

```ts
// src/features/preferences/ui-preferences.ts in an app
import { createUiPreferencesStore } from "@nguyensonhai/shared-ui/ui-preferences"
export * from "@nguyensonhai/shared-ui/ui-preferences"
const store = createUiPreferencesStore("solavi") // localStorage key solavi-ui-preferences
```

## Releasing

1. Change the code, bump `version` in `package.json`.
2. `git tag v0.2.0 && git push --tags`.
3. In each app: `pnpm add github:nguyensonhai/shared-ui#v0.2.0`.
