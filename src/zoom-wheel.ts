/** Pixels per wheel line ({@link WheelEvent.DOM_DELTA_LINE}) */
export const LINE_HEIGHT_PX = 8

/** Pixels per wheel page ({@link WheelEvent.DOM_DELTA_PAGE}) */
export const PAGE_HEIGHT_PX = 24

const DOM_DELTA_LINE = 1
const DOM_DELTA_PAGE = 2

/**
 * Converts wheel delta to pixels based on {@link WheelEvent.deltaMode}.
 * @internal
 */
export function wheelDeltaToPixels(delta: number, mode: number): number {
  if (mode === DOM_DELTA_LINE) return delta * LINE_HEIGHT_PX
  if (mode === DOM_DELTA_PAGE) return delta * PAGE_HEIGHT_PX

  return delta
}

/**
 * Maps normalized wheel movement to a zoom delta, capped at `intensity`.
 * @internal
 */
export function computeWheelZoomDelta(pixels: number, intensity: number): number {
  if (pixels === 0) return 0

  const unit = intensity / LINE_HEIGHT_PX
  const raw = -pixels * unit

  return Math.sign(raw) * Math.min(intensity, Math.abs(raw))
}
