// Motion helpers shared by Solavi and Montide. Everything here degrades to
// "no animation" when the browser lacks the API or the user asked for less
// motion (the OS "reduce motion" setting).

/** True when animations should be skipped. Browser only. */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return true
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

type ViewTransitionLike = { ready: Promise<void>; finished: Promise<void> }
type StartViewTransition = (update: () => void) => ViewTransitionLike

/**
 * Run `update` inside a document view transition when possible; otherwise
 * just run it. `className` is put on <html> for the transition's lifetime
 * so CSS can scope its `::view-transition-*` rules to this one use.
 */
export function runViewTransition(
  update: () => void,
  className?: string
): ViewTransitionLike | null {
  const start = (
    document as Document & { startViewTransition?: StartViewTransition }
  ).startViewTransition
  if (!start || prefersReducedMotion()) {
    update()
    return null
  }
  const root = document.documentElement
  if (className) root.classList.add(className)
  const transition = start.call(document, update)
  if (className) {
    transition.finished.finally(() => root.classList.remove(className))
  }
  return transition
}
