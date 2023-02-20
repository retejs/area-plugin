import { Drag } from './drag'
import { Position, Size } from './types'

export type NodeTranslateEventParams = { position: Position, previous: Position }
export type NodeResizeEventParams = { size: Size, previous: Size }

type Events = {
  picked: () => void
  translated: (params: NodeTranslateEventParams) => Promise<unknown | boolean>
  dragged: () => void
}
type Guards = {
  translate: (params: NodeTranslateEventParams) => Promise<unknown | boolean>
}

export class NodeView {
  element: HTMLElement
  position: Position
  dragHandler: Drag

  constructor(private getZoom: () => number, private events: Events, private guards: Guards) {
    this.element = document.createElement('div')
    this.element.style.position = 'absolute'
    this.position = { x: 0, y: 0 }
    this.translate(0, 0)

    this.dragHandler = new Drag(
      this.element,
      {
        getCurrentPosition: () => this.position,
        getZoom: () => this.getZoom()
      },
      {
        start: this.events.picked,
        translate: this.translate,
        drag: this.events.dragged
      }
    )
  }

  public translate = async (x: number, y: number) => {
        type Params = undefined | { data: NodeTranslateEventParams }
        const previous = { ...this.position }
        const translation = await this.guards.translate({ previous, position: { x, y } }) as Params

        if (!translation) return false

        this.position = { ...translation.data.position }
        this.element.style.transform = `translate(${this.position.x}px, ${this.position.y}px)`

        await this.events.translated({ position: this.position, previous })

        return true
  }

  public destroy() {
    this.dragHandler.destroy()
  }
}
