import { PointerListener, usePointerListener } from './utils'

type Position = { x: number, y: number }

export class Drag {

    private pointerStart?: Position
    private startPosition?: Position
    private pointerListener: PointerListener

    constructor(
      private element: HTMLElement,
      private getCurrentPosition: () => Position,
      private getZoom: () => number,
      private onStart: (e: PointerEvent) => void,
      private onTranslate: (x: number, y: number, e: PointerEvent) => void,
      private onDrag: (e: PointerEvent) => void
    ) {
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
        this.startPosition = { ...this.getCurrentPosition() }

        this.onStart(e)
    }

    private move = (e: PointerEvent) => {
        if (!this.pointerStart || !this.startPosition) return
        e.preventDefault()

        const delta = {
            x: e.pageX - this.pointerStart.x,
            y: e.pageY - this.pointerStart.y
        }
        const zoom = this.getZoom()
        const x = this.startPosition.x + delta.x / zoom
        const y = this.startPosition.y + delta.y / zoom

        this.onTranslate(x, y, e)
    }

    private up = (e: PointerEvent) => {
        if (!this.pointerStart) return

        delete this.pointerStart
        this.onDrag(e)
    }

    public destroy() {
        this.pointerListener.destroy()
    }
}
