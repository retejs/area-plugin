import { Drag } from './drag'
import { Position, Size } from './types'

export type NodeTranslateEventParams = { position: Position, previous: Position }
export type NodeResizeEventParams = { size: Size, previous: Size }

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
        this.translate(0, 0)

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
        type Params = undefined | { data: NodeTranslateEventParams }
        const previous = { ...this.position }
        const translation = await this.canTranslate({ previous, position: { x, y } }) as Params

        if (!translation) return false

        this.position = { ...translation.data.position }
        this.element.style.transform = `translate(${this.position.x}px, ${this.position.y}px)`

        await this.translated({ position: this.position, previous })

        return true
    }

    public destroy() {
        this.dragHandler.destroy()
    }
}
