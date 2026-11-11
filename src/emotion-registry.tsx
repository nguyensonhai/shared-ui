"use client"

import { useState } from "react"
import { useServerInsertedHTML } from "next/navigation"
import createCache from "@emotion/cache"
import { CacheProvider } from "@emotion/react"

/**
 * Emotion SSR for the App Router — MUI's `AppRouterCacheProvider` (with
 * `enableCssLayer`), plus one fix.
 *
 * With Cache Components, Next renders each page twice while prerendering (a
 * prospective render, then the real one) and the first render's
 * `useServerInsertedHTML` callback is still called when the real render
 * flushes. Each render has its own Emotion cache, so every style was written
 * into the HTML twice (~200 KB extra on the home page).
 *
 * All callbacks of one flush run synchronously one after another, so a set
 * that lives until the next microtask is shared by exactly that flush: a
 * style already written by an earlier callback is skipped.
 */
let flushed: Set<string> | null = null

function flushedInThisTick() {
  if (!flushed) {
    flushed = new Set()
    queueMicrotask(() => {
      flushed = null
    })
  }
  return flushed
}

type Inserted = { name: string; isGlobal: boolean }

export function EmotionRegistry({
  cacheKey = "mui",
  children,
}: {
  cacheKey?: string
  children: React.ReactNode
}) {
  const [registry] = useState(() => {
    const cache = createCache({ key: cacheKey })
    cache.compat = true
    const insert = cache.insert
    let inserted: Inserted[] = []
    cache.insert = (selector, serialized, sheet, shouldCache) => {
      // Wrap in a layer so app CSS (and `sx`) can override MUI without
      // specificity fights — same as MUI's `enableCssLayer`.
      if (!/^@layer\s+[^{]*$/.test(serialized.styles)) {
        serialized.styles = `@layer mui {${serialized.styles}}`
      }
      if (cache.inserted[serialized.name] === undefined) {
        inserted.push({ name: serialized.name, isGlobal: !selector })
      }
      return insert(selector, serialized, sheet, shouldCache)
    }
    const flush = () => {
      const pending = inserted
      inserted = []
      return pending
    }
    return { cache, flush }
  })

  useServerInsertedHTML(() => {
    const pending = registry.flush()
    if (pending.length === 0) return null

    const seen = flushedInThisTick()
    const { key, inserted } = registry.cache
    const globals: { name: string; style: string }[] = []
    let styles = ""
    let names = key
    for (const { name, isGlobal } of pending) {
      const style = inserted[name]
      const id = `${isGlobal ? "g" : "c"}:${name}`
      if (typeof style !== "string" || seen.has(id)) continue
      seen.add(id)
      if (isGlobal) {
        globals.push({ name, style })
      } else {
        styles += style
        names += ` ${name}`
      }
    }

    return (
      <>
        {globals.map(({ name, style }) => (
          <style
            key={name}
            data-emotion={`${key}-global ${name}`}
            dangerouslySetInnerHTML={{ __html: style }}
          />
        ))}
        {styles ? (
          <style
            data-emotion={names}
            dangerouslySetInnerHTML={{ __html: styles }}
          />
        ) : null}
      </>
    )
  })

  return <CacheProvider value={registry.cache}>{children}</CacheProvider>
}
