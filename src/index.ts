import { BaseSchemes, ConnectionId, NodeId, Root } from 'rete'

import { Area, TranslateEventParams, ZoomEventParams } from './area'
import { BaseArea, BaseAreaPlugin } from './base'
import { ConnectionView } from './connection-view'
import { ElementsHolder } from './elements-holder'
import { NodeView } from './node-view'
import { GetRenderTypes, Position, RenderMeta } from './types'

export { Area } from './area'
export type { BaseArea } from './base'
export { BaseAreaPlugin } from './base'
export { Drag } from './drag'
export * as AreaExtensions from './extensions'
export { NodeView } from './node-view'
export type { RenderSignal } from './types'
export type { PointerListener } from './utils'
export { usePointerListener } from './utils'
export { Zoom } from './zoom'

/**
 * A union of all possible signals that can be emitted by the area
 * @priority 9
 */
export type Area2D<Schemes extends BaseSchemes> =
  | BaseArea<Schemes>
  | { type: 'translate', data: TranslateEventParams }
  | { type: 'translated', data: TranslateEventParams }
  | { type: 'zoom', data: ZoomEventParams }
  | { type: 'zoomed', data: ZoomEventParams }
  | { type: 'resized', data: { event: Event } }

export type Area2DInherited<Schemes extends BaseSchemes, ExtraSignals = never> = [Area2D<Schemes> | ExtraSignals, Root<Schemes>]

/**
 * A plugin that provides a 2D area for nodes and connections
 * @priority 8
 * @emits render
 * @emits rendered
 * @emits unmount
 * @listens nodecreated
 * @listens noderemoved
 * @listens connectioncreated
 * @listens connectionremoved
 */
export class AreaPlugin<Schemes extends BaseSchemes, ExtraSignals = never> extends BaseAreaPlugin<Schemes, Area2D<Schemes> | ExtraSignals> {
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
        pointerDown: (position, event) => void this.emit({ type: 'pointerdown', data: { position, event } }),
        pointerMove: (position, event) => void this.emit({ type: 'pointermove', data: { position, event } }),
        pointerUp: (position, event) => void this.emit({ type: 'pointerup', data: { position, event } }),
        resize: event => void this.emit({ type: 'resized', data: { event } }),
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
    void this.emit({ type: 'contextmenu', data: { event, context: 'root' } })
  }

  public addNodeView(node: Schemes['Node']) {
    const { id } = node
    const view = new NodeView(
      () => this.area.transform.k,
      {
        picked: () => void this.emit({ type: 'nodepicked', data: { id } }),
        translated: data => this.emit({ type: 'nodetranslated', data: { id, ...data } }),
        dragged: () => void this.emit({ type: 'nodedragged', data: node }),
        contextmenu: event => void this.emit({ type: 'contextmenu', data: { event, context: node } }),
        resized: ({ size }) => this.emit({ type: 'noderesized', data: { id: node.id, size } })
      },
      {
        translate: data => this.emit({ type: 'nodetranslate', data: { id, ...data } }),
        resize: ({ size }) => this.emit({ type: 'noderesize', data: { id: node.id, size } })
      }
    )

    this.nodeViews.set(id, view)
    this.area.content.add(view.element)

    void this.emit({
      type: 'render',
      data: { element: view.element, type: 'node', payload: node }
    })

    return view
  }

  public removeNodeView(id: NodeId) {
    const view = this.nodeViews.get(id)

    if (view) {
      void this.emit({ type: 'unmount', data: { element: view.element } })
      this.nodeViews.delete(id)
      this.area.content.remove(view.element)
    }
  }

  public addConnectionView(connection: Schemes['Connection']) {
    const view = new ConnectionView({
      contextmenu: event => void this.emit({ type: 'contextmenu', data: { event, context: connection } })
    })

    this.connectionViews.set(connection.id, view)
    this.area.content.add(view.element)

    void this.emit({
      type: 'render',
      data: { element: view.element, type: 'connection', payload: connection }
    })

    return view
  }

  public removeConnectionView(id: ConnectionId) {
    const view = this.connectionViews.get(id)

    if (view) {
      void this.emit({ type: 'unmount', data: { element: view.element } })
      this.connectionViews.delete(id)
      this.area.content.remove(view.element)
    }
  }

  /**
   * Force update rendered element by id (node, connection, etc.)
   * @param type Element type
   * @param id Element id
   * @emits render
   */
  public async update(type: GetRenderTypes<Area2D<Schemes>> | GetRenderTypes<ExtraSignals>, id: string) {
    const data = this.elements.get(type, id)

    if (data) await this.emit({ type: 'render', data } as Area2D<Schemes>)
  }

  /**
   * Resize node
   * @param id Node id
   * @param width Desired width
   * @param height Desired height
   */
  public async resize(id: NodeId, width: number, height: number) {
    const view = this.nodeViews.get(id)

    if (view) return await view.resize(width, height)
  }

  /**
   * Translate node to position
   * @param id Node id
   * @param position Position
   */
  public async translate(id: NodeId, { x, y }: Position) {
    const view = this.nodeViews.get(id)

    if (view) return await view.translate(x, y)
  }

  /**
   * Destroy all views and remove all event listeners
   */
  public destroy() {
    this.container.removeEventListener('contextmenu', this.onContextMenu)
    Array.from(this.connectionViews.keys()).forEach(id => this.removeConnectionView(id))
    Array.from(this.nodeViews.keys()).forEach(id => this.removeNodeView(id))
    this.area.destroy()
  }
}
