import { Position, Size } from './types'

type PointerHandler = (event: PointerEvent) => void
type PointerListenerHandlers = {
    down: PointerHandler
    move: PointerHandler
    up: PointerHandler
}

export type PointerListener = { destroy: () => void }

/**
 * listen to pointerdown, window's pointermove and pointerup events,
 * where last two not active before pointerdown triggered for performance reasons
 */
export function usePointerListener(element: HTMLElement, handlers: PointerListenerHandlers): PointerListener {
  const move: PointerHandler = (event) => {
    handlers.move(event)
  }
  const up: PointerHandler = (event) => {
    window.removeEventListener('pointermove', move)
    window.removeEventListener('pointerup', up)
    window.removeEventListener('pointercancel', up)
    handlers.up(event)
  }
  const down: PointerHandler = (event) => {
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
    handlers.down(event)
  }

  element.addEventListener('pointerdown', down)

  return {
    destroy() {
      element.removeEventListener('pointerdown', down)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
    }
  }
}

/**
 * Bounding box
 */
const min = (arr: number[]) => arr.length === 0 ? 0 : Math.min(...arr)
const max = (arr: number[]) => arr.length === 0 ? 0 : Math.max(...arr)

export function getBoundingBox(rects: ({ position: Position } & Size)[]) {
  const left = min(rects.map(rect => rect.position.x))
  const top = min(rects.map(rect => rect.position.y))
  const right = max(rects.map(rect => rect.position.x + rect.width))
  const bottom = max(rects.map(rect => rect.position.y + rect.height))

  return {
    left,
    right,
    top,
    bottom,
    width: Math.abs(left - right),
    height: Math.abs(top - bottom),
    center: {
      x: (left + right) / 2,
      y: (top + bottom) / 2
    }
  }
}
