import { Drag } from './drag'
import { Position } from './types'

export type NodeTranslateEventParams = { position: Position, previous: Position }

export class NodeView {
    element: HTMLElement
    position: Position
    dragHandler: Drag

    constructor(
      private getZoom: () => number,
      private picked: () => void,
      private canTranslate: (params: NodeTranslateEventParams) => Promise<unknown | boolean>,
      private translated: (params: NodeTranslateEventParams) => Promise<unknown | boolean>,
      private dragged: () => void
    ) {
        this.element = document.createElement('div')
        this.element.style.position = 'absolute'
        this.position = { x: 0, y: 0 }
        this.translate(200, 100)

        this.dragHandler = new Drag(
            this.element,
            () => this.position,
            () => this.getZoom(),
            this.picked,
            this.translate,
            this.dragged
        )
    }

    public translate = async (x: number, y: number) => {
        const previous = { ...this.position }

        if (!await this.canTranslate({ previous, position: { x, y } })) return false

        this.position = { x, y }
        this.element.style.transform = `translate(${x}px, ${y}px)`

        await this.translated({ position: { x, y }, previous })

        return true
    }

    public destroy() {
        this.dragHandler.destroy()
    }
}
