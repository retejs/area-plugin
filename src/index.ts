import { BaseSchemes, ConnectionId, NodeId, Root, Scope } from 'rete'

import { Area, TranslateEventParams, ZoomEventParams } from './area'
import { ConnectionView } from './connection-view'
import { ElementsHolder } from './elements-holder'
import { NodeResizeEventParams, NodeTranslateEventParams, NodeView } from './node-view'
import { GetRenderTypes, Position } from './types'

export { Area } from './area'
export { Drag } from './drag'
export * as AreaExtensions from './extensions'
export { NodeView } from './node-view'
export type { PointerListener } from './utils'
export { usePointerListener } from './utils'

export type RenderMeta = { filled?: boolean }
export type RenderData<Schemes extends BaseSchemes> =
| { element: HTMLElement, type: 'node', payload: Schemes['Node'] }
| { element: HTMLElement, type: 'connection', payload: Schemes['Connection'], start?: Position, end?: Position }

export type Area2D<Schemes extends BaseSchemes> =
    | { type: 'nodepicked', data: { id: string } }
    | { type: 'nodetranslate', data: { id: string } & NodeTranslateEventParams }
    | { type: 'nodetranslated', data: { id: string } & NodeTranslateEventParams }
    | { type: 'translate', data: { position: Position } }
    | { type: 'contextmenu', data: { event: MouseEvent, context: 'root' | Schemes['Node'] } }
    | { type: 'pointerdown', data: { position: Position, event: PointerEvent }}
    | { type: 'pointermove', data: { position: Position, event: PointerEvent }}
    | { type: 'pointerup', data: { position: Position, event: PointerEvent }}
    | { type: 'translate', data: TranslateEventParams }
    | { type: 'translated', data: TranslateEventParams }
    | { type: 'zoom', data: ZoomEventParams }
    | { type: 'zoomed', data: ZoomEventParams }
    | { type: 'render', data: RenderData<Schemes> & RenderMeta }
    | { type: 'rendered', data: RenderData<Schemes> & RenderMeta }
    | { type: 'unmount', data: { element: HTMLElement } }
    | { type: 'nodedragged', data: Schemes['Node'] }
    | { type: 'resized', data: { event: Event } }
    | { type: 'noderesized', data: { id: string } & NodeResizeEventParams }

export type Area2DInherited<Schemes extends BaseSchemes, ExtraSignals = never> = [Area2D<Schemes> | ExtraSignals, Root<Schemes>]

export class AreaPlugin<Schemes extends BaseSchemes, ExtraSignals = never> extends Scope<Area2D<Schemes> | ExtraSignals, [Root<Schemes>]> {
  nodeViews = new Map<NodeId, NodeView>()
  public connectionViews = new Map<ConnectionId, ConnectionView>()
  area: Area
  elements = new ElementsHolder<HTMLElement, RenderData<Schemes> & RenderMeta>()

  constructor(public container: HTMLElement) {
    super('area')
    container.style.overflow = 'hidden'

    container.addEventListener('contextmenu', event => {
      this.emit({ type: 'contextmenu', data: { event, context: 'root' } })
    })
    // eslint-disable-next-line max-statements
    this.addPipe(context => {
      if (!context || !(typeof context === 'object' && 'type' in context)) return context
      if (context.type === 'nodecreated') {
        this.addNodeView(context.data)
      }
      if (context.type === 'noderemoved') {
        this.removeNodeView(context.data.id)
      }
      if (context.type === 'connectioncreated') {
        this.addConnectionView(context.data)
      }
      if (context.type === 'connectionremoved') {
        this.removeConnectionView(context.data.id)
      }
      if (context.type === 'render') {
        this.elements.set(context.data)
      }
      if (context.type === 'unmount') {
        this.elements.delete(context.data.element)
      }
      return context
    })
    this.area = new Area(
      container,
      {
        zoomed: params => this.emit({ type: 'zoomed', data: params }),
        pointerDown: (position, event) => this.emit({ type: 'pointerdown', data: { position, event } }),
        pointerMove: (position, event) => this.emit({ type: 'pointermove', data: { position, event } }),
        pointerUp: (position, event) => this.emit({ type: 'pointerup', data: { position, event } }),
        resize: event => this.emit({ type: 'resized', data: { event } }),
        translated: params => this.emit({ type: 'translated', data: params })
      },
      {
        translate: params => this.emit({ type: 'translate', data: params }),
        zoom: params => this.emit({ type: 'zoom', data: params })
      }
    )
  }

  private addNodeView(node: Schemes['Node']) {
    const id = node.id
    const view = new NodeView(
      () => this.area.transform.k,
      {
        picked: () => this.emit({ type: 'nodepicked', data: { id } }),
        translated: data => this.emit({ type: 'nodetranslated', data: { id, ...data } }),
        dragged: () => this.emit({ type: 'nodedragged', data: node })
      },
      {
        translate: data => this.emit({ type: 'nodetranslate', data: { id, ...data } })
      }
    )

    view.element.addEventListener('contextmenu', event => {
      this.emit({ type: 'contextmenu', data: { event, context: node } })
    })

    this.nodeViews.set(node.id, view)
    this.area.appendChild(view.element)

    this.emit({
      type: 'render',
      data: { element: view.element, type: 'node', payload: node }
    })
  }

  private removeNodeView(id: NodeId) {
    const view = this.nodeViews.get(id)

    if (view) {
      this.emit({ type: 'unmount', data: { element: view.element } })
      this.nodeViews.delete(id)
      this.area.removeChild(view.element)
    }
  }

  private addConnectionView(connection: Schemes['Connection']) {
    const view = new ConnectionView({
      contextmenu: event => this.emit({ type: 'contextmenu', data: { event, context: connection } })
    })

    this.connectionViews.set(connection.id, view)
    this.area.appendChild(view.element)

    this.emit({
      type: 'render',
      data: { element: view.element, type: 'connection', payload: connection }
    })
  }

  private removeConnectionView(id: ConnectionId) {
    const view = this.connectionViews.get(id)

    if (view) {
      this.emit({ type: 'unmount', data: { element: view.element } })
      this.connectionViews.delete(id)
      this.area.removeChild(view.element)
    }
  }

  public update(type: GetRenderTypes<Area2D<Schemes>> | GetRenderTypes<ExtraSignals>, id: string) {
    const data = this.elements.get(type, id)

    if (data) this.emit({ type: 'render', data })
  }

  public destroy() {
    this.area.destroy()
    this.nodeViews.forEach(node => node.destroy())
  }
}
