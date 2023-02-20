import { Position } from './types'
import { PointerListener, usePointerListener } from './utils'

type Events = {
  start: (e: PointerEvent) => void
  translate: (x: number, y: number, e: PointerEvent) => void
  drag: (e: PointerEvent) => void
}

type DragConfig = {
  getCurrentPosition: () => Position
  getZoom: () => number
}

export class Drag {
  private pointerStart?: Position
  private startPosition?: Position
  private pointerListener: PointerListener

  constructor(private element: HTMLElement, private config: DragConfig, private events: Events) {
    this.element.style.touchAction = 'none'
    this.pointerListener = usePointerListener(this.element, {
      down: this.down,
      move: this.move,
      up: this.up
    })
  }

  private down = (e: PointerEvent) => {
    if ((e.pointerType === 'mouse') && (e.button !== 0)) return

    e.stopPropagation()
    this.pointerStart = { x: e.pageX, y: e.pageY }
    this.startPosition = { ...this.config.getCurrentPosition() }

    this.events.start(e)
  }

  private move = (e: PointerEvent) => {
    if (!this.pointerStart || !this.startPosition) return
    e.preventDefault()

    const delta = {
      x: e.pageX - this.pointerStart.x,
      y: e.pageY - this.pointerStart.y
    }
    const zoom = this.config.getZoom()
    const x = this.startPosition.x + delta.x / zoom
    const y = this.startPosition.y + delta.y / zoom

    this.events.translate(x, y, e)
  }

  private up = (e: PointerEvent) => {
    if (!this.pointerStart) return

    delete this.pointerStart
    this.events.drag(e)
  }

  public destroy() {
    this.pointerListener.destroy()
  }
}
