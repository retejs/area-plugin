import { BaseSchemes, ConnectionId, NodeId, Root, Scope } from 'rete'

// type BaseSchemes, ConnectionId, NodeId, Root, Scope
import { Area, TranslateEventParams, ZoomEventParams } from './area'
import { ConnectionView } from './connection-view'
import { ElementsHolder } from './elements-holder'
import { NodeResizeEventParams, NodeTranslateEventParams, NodeView } from './node-view'
import { GetRenderTypes, Position, RenderMeta, RenderSignal } from './types'

export { Area } from './area'
export { Drag } from './drag'
export * as AreaExtensions from './extensions'
export { NodeView } from './node-view'
export type { RenderSignal } from './types'
export type { PointerListener } from './utils'
export { usePointerListener } from './utils'
export { Zoom } from './zoom'

export type Area2D<Schemes extends BaseSchemes> =
    | { type: 'nodepicked', data: { id: string } }
    | { type: 'nodetranslate', data: { id: string } & NodeTranslateEventParams }
    | { type: 'nodetranslated', data: { id: string } & NodeTranslateEventParams }
    | { type: 'contextmenu', data: { event: MouseEvent, context: 'root' | Schemes['Node'] | Schemes['Connection'] } }
    | { type: 'pointerdown', data: { position: Position, event: PointerEvent }}
    | { type: 'pointermove', data: { position: Position, event: PointerEvent }}
    | { type: 'pointerup', data: { position: Position, event: PointerEvent }}
    | { type: 'translate', data: TranslateEventParams }
    | { type: 'translated', data: TranslateEventParams }
    | { type: 'zoom', data: ZoomEventParams }
    | { type: 'zoomed', data: ZoomEventParams }
    | RenderSignal<'node', { payload: Schemes['Node'] }>
    | RenderSignal<'connection', { payload: Schemes['Connection'], start?: Position, end?: Position }>
    | { type: 'unmount', data: { element: HTMLElement } }
    | { type: 'nodedragged', data: Schemes['Node'] }
    | { type: 'resized', data: { event: Event } }
    | { type: 'noderesize', data: { id: string } & NodeResizeEventParams }
    | { type: 'noderesized', data: { id: string } & NodeResizeEventParams }
    | { type: 'reordered', data: { element: HTMLElement } }

export type Area2DInherited<Schemes extends BaseSchemes, ExtraSignals = never> = [Area2D<Schemes> | ExtraSignals, Root<Schemes>]

export class AreaPlugin<Schemes extends BaseSchemes, ExtraSignals = never> extends Scope<Area2D<Schemes> | ExtraSignals, [Root<Schemes>]> {
  public nodeViews = new Map<NodeId, NodeView>()
  public connectionViews = new Map<ConnectionId, ConnectionView>()
  public area: Area
  private elements = new ElementsHolder<HTMLElement, Extract<Area2D<Schemes>, { type: 'render' }>['data'] & RenderMeta>()

  constructor(public container: HTMLElement) {
    super('area')
    container.style.overflow = 'hidden'
    container.addEventListener('contextmenu', this.onContextMenu)

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
        translated: params => this.emit({ type: 'translated', data: params }),
        reordered: element => this.emit({ type: 'reordered', data: { element } })
      },
      {
        translate: params => this.emit({ type: 'translate', data: params }),
        zoom: params => this.emit({ type: 'zoom', data: params })
      }
    )
  }

  private onContextMenu = (event: MouseEvent) => {
    this.emit({ type: 'contextmenu', data: { event, context: 'root' } })
  }

  private addNodeView(node: Schemes['Node']) {
    const { id } = node
    const view = new NodeView(
      () => this.area.transform.k,
      {
        picked: () => this.emit({ type: 'nodepicked', data: { id } }),
        translated: data => this.emit({ type: 'nodetranslated', data: { id, ...data } }),
        dragged: () => this.emit({ type: 'nodedragged', data: node }),
        contextmenu: event => this.emit({ type: 'contextmenu', data: { event, context: node } }),
        resized: ({ size }) => this.emit({ type: 'noderesized', data: { id: node.id, size } })
      },
      {
        translate: data => this.emit({ type: 'nodetranslate', data: { id, ...data } }),
        resize: ({ size }) => this.emit({ type: 'noderesize', data: { id: node.id, size } })
      }
    )

    this.nodeViews.set(id, view)
    this.area.content.add(view.element)

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
      this.area.content.remove(view.element)
    }
  }

  private addConnectionView(connection: Schemes['Connection']) {
    const view = new ConnectionView({
      contextmenu: event => this.emit({ type: 'contextmenu', data: { event, context: connection } })
    })

    this.connectionViews.set(connection.id, view)
    this.area.content.add(view.element)

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
      this.area.content.remove(view.element)
    }
  }

  public async update(type: GetRenderTypes<Area2D<Schemes>> | GetRenderTypes<ExtraSignals>, id: string) {
    const data = this.elements.get(type, id)

    if (data) await this.emit({ type: 'render', data } as Area2D<Schemes>)
  }

  public async resize(id: NodeId, width: number, height: number) {
    const view = this.nodeViews.get(id)

    if (view) return await view.resize(width, height)
  }

  public async translate(id: NodeId, { x, y }: Position) {
    const view = this.nodeViews.get(id)

    if (view) return await view.translate(x, y)
  }

  public destroy() {
    this.container.removeEventListener('contextmenu', this.onContextMenu)
    Array.from(this.connectionViews.keys()).forEach(id => this.removeConnectionView(id))
    Array.from(this.nodeViews.keys()).forEach(id => this.removeNodeView(id))
    this.area.destroy()
  }
}
