import { Content } from './content'
import { Drag } from './drag'
import { Position } from './types'
import { Zoom, ZoomSource } from './zoom'

export type Transform = Position & { k: number }
export type TranslateEventParams = { previous: Transform, position: Position }
export type ZoomEventParams = { previous: Transform, zoom: number, source?: ZoomSource }

type Events = {
  zoomed: (params: ZoomEventParams) => Promise<unknown>
  pointerDown: (position: Position, event: PointerEvent) => void
  pointerMove: (position: Position, event: PointerEvent) => void
  pointerUp: (position: Position, event: PointerEvent) => void
  resize: (event: Event) => void
  translated: (params: TranslateEventParams) => Promise<unknown>
  reordered: (element: HTMLElement) => Promise<unknown>
}
type Guards = {
  translate: (params: TranslateEventParams) => Promise<unknown | boolean>
  zoom: (params: ZoomEventParams) => Promise<unknown | boolean>
}

export class Area {
  public transform: Transform = { k: 1, x: 0, y: 0 }
  public pointer: Position = { x: 0, y: 0 }
  public content: Content

  private zoomHandler: Zoom | null = null
  private dragHandler: Drag | null = null

  constructor(private container: HTMLElement, private events: Events, private guards: Guards) {
    this.content = new Content(element => this.events.reordered(element))
    this.content.holder.style.transformOrigin = '0 0'

    this.setZoomHandler(new Zoom(0.1))
    this.setDragHandler(new Drag())

    this.container.addEventListener('pointerdown', this.pointerdown)
    this.container.addEventListener('pointermove', this.pointermove)
    window.addEventListener('pointerup', this.pointerup)
    window.addEventListener('resize', this.resize)

    container.appendChild(this.content.holder)
    this.update()
  }

  private update() {
    const { x, y, k } = this.transform

    this.content.holder.style.transform = `translate(${x}px, ${y}px) scale(${k})`
  }

  public setDragHandler(drag: Drag | null) {
    if (this.dragHandler) this.dragHandler.destroy()
    this.dragHandler = drag
    if (this.dragHandler) this.dragHandler.initialize(
      this.container,
      {
        getCurrentPosition: () => this.transform,
        getZoom:  () => 1
      },
      {
        start: () => null,
        translate: this.onTranslate,
        drag: () => null
      }
    )
  }

  public setZoomHandler(zoom: Zoom | null) {
    if (this.zoomHandler) this.zoomHandler.destroy()
    this.zoomHandler = zoom
    if (this.zoomHandler) this.zoomHandler.initialize(this.container, this.content.holder, this.onZoom)
  }

  public setPointerFrom(event: MouseEvent) {
    const { x, y } = this.content.getPointerFrom(event)
    const { k } = this.transform

    this.pointer = { x: x / k, y: y / k }
  }

  private pointerdown = (event: PointerEvent) => {
    this.setPointerFrom(event)
    this.events.pointerDown(this.pointer, event)
  }

  private pointermove = (event: PointerEvent) => {
    this.setPointerFrom(event)
    this.events.pointerMove(this.pointer, event)
  }

  private pointerup = (event: PointerEvent) => {
    this.setPointerFrom(event)
    this.events.pointerUp(this.pointer, event)
  }

  private resize = (event: Event) => {
    this.events.resize(event)
  }

  private onTranslate = (x: number, y: number) => {
    if (this.zoomHandler && this.zoomHandler.isTranslating()) return // lock translation while zoom on multitouch
    this.translate(x, y)
  }

  private onZoom = (delta: number, ox: number, oy: number, source?: ZoomSource) => {
    this.zoom(this.transform.k * (1 + delta), ox, oy, source)

    this.update()
  }

  public async translate(x: number, y: number) {
    type T = undefined | { data: TranslateEventParams }
    const position = { x, y }
    const result = await this.guards.translate({ previous: this.transform, position }) as T

    if (!result) return false

    this.transform.x = result.data.position.x
    this.transform.y = result.data.position.y

    this.update()

    await this.events.translated(result.data)
    return true
  }

  public async zoom(zoom: number, ox = 0, oy = 0, source?: ZoomSource) {
    type T = undefined | { data: ZoomEventParams }
    const k = this.transform.k
    const result = await this.guards.zoom({ previous: this.transform, zoom, source }) as T

    if (!result) return true

    const d = (k - result.data.zoom) / ((k - zoom) || 1)

    this.transform.k = result.data.zoom || 1
    this.transform.x += ox * d
    this.transform.y += oy * d

    this.update()

    await this.events.zoomed(result.data)
    return false
  }

  public destroy() {
    this.container.removeEventListener('pointerdown', this.pointerdown)
    this.container.removeEventListener('pointermove', this.pointermove)
    window.removeEventListener('pointerup', this.pointerup)
    window.removeEventListener('resize', this.resize)
    if (this.dragHandler) this.dragHandler.destroy()
    if (this.zoomHandler) this.zoomHandler.destroy()
    this.content.holder.innerHTML = ''
  }
}
