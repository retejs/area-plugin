import { Drag } from './drag'
import { Position } from './types'
import { Zoom, ZoomSource } from './zoom'

export type Transform = Position & { k: number }
export type TranslateEventParams = { previous: Transform, position: Position }
export type ZoomEventParams = { previous: Transform, zoom: number, source: ZoomSource }

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
      private onPointerMove: (position: Position) => void
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

        this.container.addEventListener('pointermove', this.pointermove)

        this.update()
    }

    private update() {
        const { x, y, k } = this.transform

        this.element.style.transform = `translate(${x}px, ${y}px) scale(${k})`
    }

    private pointermove = (event: PointerEvent) => {
        const { left, top } = this.element.getBoundingClientRect()
        const x = event.clientX - left
        const y = event.clientY - top
        const k = this.transform.k

        this.pointer = { x: x / k, y: y / k }
        this.onPointerMove(this.pointer)
    }

    private onTranslate = (x: number, y: number) => {
        if (this.zoomHandler.isTranslating()) return // lock translation while zoom on multitouch
        this.translate(x, y)
    }

    private onZoom = (delta: number, ox: number, oy: number, source: ZoomSource) => {
        this.zoom(this.transform.k * (1 + delta), ox, oy, source)

        this.update()
    }

    public async translate(x: number, y: number) {
        const params = { previous: this.transform, position: { x, y } }

        if (!await this.canTranslate(params)) return false

        this.transform.x = params.position.x
        this.transform.y = params.position.y

        this.update()

        await this.onTranslated(params)
        return true
    }

    public async zoom(zoom: number, ox = 0, oy = 0, source: ZoomSource) {
        const k = this.transform.k
        const params = { previous: this.transform, zoom, source }

        if (!await this.canZoom(params)) return true

        const d = (k - params.zoom) / ((k - zoom) || 1)

        this.transform.k = params.zoom || 1
        this.transform.x += ox * d
        this.transform.y += oy * d

        this.update()

        await this.onZoomed(params)
        return false
    }

    public appendChild(el: HTMLElement) {
        this.element.appendChild(el)
    }

    public removeChild(el: HTMLElement) {
        this.element.removeChild(el)
    }

    public destroy() {
        this.dragHandler.destroy()
        this.zoomHandler.destroy()
    }
}
