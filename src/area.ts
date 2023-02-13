import { Drag } from './drag'
import { Position } from './types'
import { Zoom, ZoomSource } from './zoom'

export type Transform = Position & { k: number }
export type TranslateEventParams = { previous: Transform, position: Position }
export type ZoomEventParams = { previous: Transform, zoom: number, source?: ZoomSource }

export class Area {
    public transform: Transform = { k: 1, x: 0, y: 0 }
    public pointer: Position = { x: 0, y: 0 }
    public element: HTMLElement

    private zoomHandler: Zoom
    private dragHandler: Drag

    constructor(
      private container: HTMLElement,
      private canTranslate: (params: TranslateEventParams) => Promise<unknown | boolean>,
      private onTranslated: (params: TranslateEventParams) => Promise<unknown>,
      private canZoom: (params: ZoomEventParams) => Promise<unknown | boolean>,
      private onZoomed: (params: ZoomEventParams) => Promise<unknown>,
      private onPointerDown: (position: Position, event: PointerEvent) => void,
      private onPointerMove: (position: Position, event: PointerEvent) => void,
      private onPointerUp: (position: Position, event: PointerEvent) => void,
      private onResize: (event: Event) => void
    ) {
        this.element = document.createElement('div')
        this.element.style.transformOrigin = '0 0'

        this.zoomHandler = new Zoom(container, this.element, 0.1, this.onZoom)
        this.dragHandler = new Drag(
            container,
            () => this.transform,
            () => 1,
            () => null,
            this.onTranslate,
            () => null
        )

        this.container.addEventListener('pointerdown', this.pointerdown)
        this.container.addEventListener('pointermove', this.pointermove)
        window.addEventListener('pointerup', this.pointerup)
        window.addEventListener('resize', this.resize)

        this.update()
    }

    private update() {
        const { x, y, k } = this.transform

        this.element.style.transform = `translate(${x}px, ${y}px) scale(${k})`
    }

    public setPointerFrom(event: MouseEvent) {
        const { left, top } = this.element.getBoundingClientRect()
        const x = event.clientX - left
        const y = event.clientY - top
        const k = this.transform.k

        this.pointer = { x: x / k, y: y / k }
    }

    private pointerdown = (event: PointerEvent) => {
        this.setPointerFrom(event)
        this.onPointerDown(this.pointer, event)
    }

    private pointermove = (event: PointerEvent) => {
        this.setPointerFrom(event)
        this.onPointerMove(this.pointer, event)
    }

    private pointerup = (event: PointerEvent) => {
        this.setPointerFrom(event)
        this.onPointerUp(this.pointer, event)
    }

    private resize = (event: Event) => {
        this.onResize(event)
    }

    private onTranslate = (x: number, y: number) => {
        if (this.zoomHandler.isTranslating()) return // lock translation while zoom on multitouch
        this.translate(x, y)
    }

    private onZoom = (delta: number, ox: number, oy: number, source?: ZoomSource) => {
        this.zoom(this.transform.k * (1 + delta), ox, oy, source)

        this.update()
    }

    public async translate(x: number, y: number) {
        type T = undefined | { data: TranslateEventParams }
        const position = { x, y }
        const result = await this.canTranslate({ previous: this.transform, position }) as T

        if (!result) return false

        this.transform.x = result.data.position.x
        this.transform.y = result.data.position.y

        this.update()

        await this.onTranslated(result.data)
        return true
    }

    // eslint-disable-next-line max-statements
    public async zoom(zoom: number, ox = 0, oy = 0, source?: ZoomSource) {
        type T = undefined | { data: ZoomEventParams }
        const k = this.transform.k
        const result = await this.canZoom({ previous: this.transform, zoom, source }) as T

        if (!result) return true

        const d = (k - result.data.zoom) / ((k - zoom) || 1)

        this.transform.k = result.data.zoom || 1
        this.transform.x += ox * d
        this.transform.y += oy * d

        this.update()

        await this.onZoomed(result.data)
        return false
    }

    public appendChild(el: HTMLElement) {
        this.element.appendChild(el)
    }

    public removeChild(el: HTMLElement) {
        this.element.removeChild(el)
    }

    public destroy() {
        this.container.removeEventListener('pointerdown', this.pointerdown)
        this.container.removeEventListener('pointermove', this.pointermove)
        window.removeEventListener('pointerup', this.pointerup)
        window.removeEventListener('resize', this.resize)
        this.dragHandler.destroy()
        this.zoomHandler.destroy()
    }
}
