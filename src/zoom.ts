export type ZoomSource = 'wheel' | 'touch' | 'dblclick'
export type OnZoom = (delta: number, ox: number, oy: number, source?: ZoomSource) => void

export class Zoom {
  previous: { cx: number, cy: number, distance: number } | null = null
  pointers: PointerEvent[] = []
  private container!: HTMLElement
  private element!: HTMLElement
  private onzoom!: OnZoom

  constructor(private intensity: number) {}

  public initialize(container: HTMLElement, element: HTMLElement, onzoom: OnZoom) {
    this.container = container
    this.element = element
    this.onzoom = onzoom
    this.container.addEventListener('wheel', this.wheel)
    this.container.addEventListener('pointerdown', this.down)
    this.container.addEventListener('dblclick', this.dblclick)

    window.addEventListener('pointermove', this.move)
    window.addEventListener('pointerup', this.up)
    window.addEventListener('pointercancel', this.up)
  }

  private wheel = (e: WheelEvent) => {
    e.preventDefault()

    const { left, top } = this.element.getBoundingClientRect()
    const isNegative = e.deltaY < 0
    const delta = isNegative ? this.intensity : - this.intensity
    const ox = (left - e.clientX) * delta
    const oy = (top - e.clientY) * delta

    this.onzoom(delta, ox, oy, 'wheel')
  }

  private getTouches() {
    const e = { touches: this.pointers }
    const [x1, y1] = [e.touches[0].clientX, e.touches[0].clientY]
    const [x2, y2] = [e.touches[1].clientX, e.touches[1].clientY]

    const distance = Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2))

    return {
      cx: (x1 + x2)/2,
      cy: (y1 + y2)/2,
      distance
    }
  }

  private down = (e: PointerEvent) => {
    this.pointers.push(e)
  }

  private move = (e: PointerEvent) => {
    this.pointers = this.pointers.map(p => p.pointerId === e.pointerId ? e : p)
    if (!this.isTranslating()) return

    const { left, top } = this.element.getBoundingClientRect()
    const { cx, cy, distance } = this.getTouches()

    if (this.previous !== null) {
      const delta = distance / this.previous.distance - 1

      const ox = (left - cx) * delta
      const oy = (top - cy) * delta

      this.onzoom(delta, ox - (this.previous.cx - cx), oy - (this.previous.cy - cy), 'touch')
    }
    this.previous = { cx, cy, distance }
  }

  private up = (e: PointerEvent) => {
    this.previous = null
    this.pointers = this.pointers.filter(p => p.pointerId !== e.pointerId)
  }

  private dblclick = (e: MouseEvent) => {
    e.preventDefault()

    const { left, top } = this.element.getBoundingClientRect()
    const delta = 4 * this.intensity

    const ox = (left - e.clientX) * delta
    const oy = (top - e.clientY) * delta

    this.onzoom(delta, ox, oy, 'dblclick')
  }

  public isTranslating() { // is translating while zoom (works on multitouch)
    return this.pointers.length >= 2
  }

  public destroy() {
    this.container.removeEventListener('wheel', this.wheel)
    this.container.removeEventListener('pointerdown', this.down)
    this.container.removeEventListener('dblclick', this.dblclick)

    window.removeEventListener('pointermove', this.move)
    window.removeEventListener('pointerup', this.up)
    window.removeEventListener('pointercancel', this.up)
  }
}
