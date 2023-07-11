import { BaseSchemes, ConnectionId, NodeId, Root, Scope } from 'rete'

import { NodeResizeEventParams, NodeTranslateEventParams } from './node-view'
import { GetRenderTypes, Position, RenderSignal } from './types'

interface NodeView {
  element: HTMLElement
  position: Position
  translate(x: number, y: number): Promise<boolean>
  resize(width: number, height: number): Promise<boolean>
}

interface ConnectionView {
  element: HTMLElement
}

interface Content {
  holder: HTMLElement
  add(element: HTMLElement): void
  // eslint-disable-next-line no-undef
  reorder(target: HTMLElement, next: ChildNode | null): void
  remove(element: HTMLElement): void
}

interface Area {
  pointer: Position
  content: Content
}

/**
 * A union of all possible signals that can be emitted by any area plugin
 * @priority 10
 */
export type BaseArea<Schemes extends BaseSchemes> =
  | { type: 'nodepicked', data: { id: string } }
  | { type: 'nodedragged', data: Schemes['Node'] }
  | { type: 'nodetranslate', data: { id: string } & NodeTranslateEventParams }
  | { type: 'nodetranslated', data: { id: string } & NodeTranslateEventParams }
  | { type: 'contextmenu', data: { event: MouseEvent, context: 'root' | Schemes['Node'] | Schemes['Connection'] } }
  | { type: 'pointerdown', data: { position: Position, event: PointerEvent } }
  | { type: 'pointermove', data: { position: Position, event: PointerEvent } }
  | { type: 'pointerup', data: { position: Position, event: PointerEvent } }
  | { type: 'noderesize', data: { id: string } & NodeResizeEventParams }
  | { type: 'noderesized', data: { id: string } & NodeResizeEventParams }
  | RenderSignal<'node', { payload: Schemes['Node'] }>
  | RenderSignal<'connection', { payload: Schemes['Connection'], start?: Position, end?: Position }>
  | { type: 'unmount', data: { element: HTMLElement } }
  | { type: 'reordered', data: { element: HTMLElement } }

/**
 * Base abstract class for area plugins that provides a common interface
 * @abstract
 */
export abstract class BaseAreaPlugin<Schemes extends BaseSchemes, Signals> extends Scope<Signals, [Root<Schemes>]> {
  public abstract nodeViews: Map<NodeId, NodeView>
  public abstract connectionViews: Map<ConnectionId, ConnectionView>
  public abstract area: Area

  abstract addNodeView(connection: Schemes['Node']): NodeView
  abstract removeNodeView(connection: NodeId): void
  abstract addConnectionView(connection: Schemes['Connection']): ConnectionView
  abstract removeConnectionView(connection: ConnectionId): void
  abstract update(type: GetRenderTypes<Signals>, id: string): Promise<void | boolean | undefined>
  abstract resize(id: NodeId, width: number, height: number): Promise<void | boolean | undefined>
  abstract translate(id: NodeId, position: Position): Promise<void | boolean | undefined>
  abstract destroy(): void
}
