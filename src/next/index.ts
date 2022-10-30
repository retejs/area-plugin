import { BaseSchemes, ConnectionId, NodeId, Root, Scope } from 'rete'

import { Area, TranslateEventParams, ZoomEventParams } from './area'
import { NodeTranslateEventParams, NodeView } from './node-view'
import { Position } from './types'

console.log('area')

export type RenderData<Schemes extends BaseSchemes> =
| { element: HTMLElement, type: 'node', payload: Schemes['Node'] }
| { element: HTMLElement, type: 'connection', payload: Schemes['Connection'] }

export type Area2D<Schemes extends BaseSchemes> =
    | { type: 'nodepicked', data: { id: string } }
    | { type: 'nodetranslate', data: { id: string } & NodeTranslateEventParams }
    | { type: 'nodetranslated', data: { id: string } & NodeTranslateEventParams }
    | { type: 'translate', data: { position: Position } }
    | { type: 'contextmenu', data: { event: MouseEvent, context: 'root' | Schemes['Node'] } }
    | { type: 'pointermove', data: Position }
    | { type: 'translate', data: TranslateEventParams }
    | { type: 'translated', data: TranslateEventParams }
    | { type: 'zoom', data: ZoomEventParams }
    | { type: 'zoomed', data: ZoomEventParams }
    | { type: 'render', data: RenderData<Schemes> }
    | { type: 'unmount', data: { element: HTMLElement } }
    | { type: 'nodedragged', data: Schemes['Node'] }

export type Area2DInherited<Schemes extends BaseSchemes, ExtraSignals = never> = [Area2D<Schemes> | ExtraSignals, Root<Schemes>]

export class AreaPlugin<Schemes extends BaseSchemes, ExtraSignals = never> extends Scope<Area2D<Schemes> | ExtraSignals, [Root<Schemes>]> {
    nodeViews = new Map<NodeId, NodeView>
    connectionViews = new Map<ConnectionId, HTMLElement>
    area: Area

    constructor(public container: HTMLElement) {
        super('area')
        container.style.overflow = 'hidden'

        container.addEventListener('contextmenu', event => {
            this.emit({ type: 'contextmenu', data: { event, context: 'root' } })
        })
        this.addPipe(context => {
            if (!context || !('type' in context)) return context
            if (context.type === 'nodecreated') {
                this.addNodeView(context.data)
            }
            if (context.type === 'noderemoved') {
                this.removeNodeView(context.data)
            }
            if (context.type === 'connectioncreated') {
                this.addConnection(context.data)
            }
            if (context.type === 'connectionremoved') {
                this.removeConnection(context.data)
            }
            return context
        })
        this.area = new Area(
            container,
            params => this.emit({ type: 'translate', data: params }),
            params => this.emit({ type: 'translated', data: params }),
            params => this.emit({ type: 'zoom', data: params }),
            params => this.emit({ type: 'zoomed', data: params }),
            position => this.emit({ type: 'pointermove', data: position })
        )
        container.appendChild(this.area.element)
    }

    private addNodeView(node: Schemes['Node']) {
        const id = node.id
        const view = new NodeView(
            () => this.area.transform.k,
            () => this.emit({ type: 'nodepicked', data: { id } }),
            data => this.emit({ type: 'nodetranslate', data: { id, ...data } }),
            data => this.emit({ type: 'nodetranslated', data: { id, ...data } }),
            () => this.emit({ type: 'nodedragged', data: node })
        )

        view.element.addEventListener('contextmenu', event => {
            this.emit({ type: 'contextmenu', data: { event, context: node } })
        })

        this.nodeViews.set(node.id, view)
        this.area.appendChild(view.element)

        this.renderNode(node)
    }

    public renderNode(node: Schemes['Node']) {
        const view = this.nodeViews.get(node.id)

        if (view) {
            this.emit({
                type: 'render',
                data: { element: view.element, type: 'node', payload: node }
            })
        }
    }

    private removeNodeView(id: NodeId) {
        const view = this.nodeViews.get(id)

        if (view) {
            this.emit({ type: 'unmount', data: { element: view.element } })
            this.nodeViews.delete(id)
            this.area.removeChild(view.element)
        }
    }

    private addConnection(connection: Schemes['Connection']) {
        const element = document.createElement('div')

        element.style.position = 'absolute'
        element.style.left = '0'
        element.style.top = '0'
        element.addEventListener('contextmenu', event => {
            this.emit({ type: 'contextmenu', data: { event, context: connection } })
        })

        this.connectionViews.set(connection.id, element)
        this.area.appendChild(element)

        this.renderConnection(connection)
    }

    public renderConnection(connection: Schemes['Connection']) {
        const element = this.connectionViews.get(connection.id)

        if (element) {
            this.emit({
                type: 'render',
                data: { element, type: 'connection', payload: connection }
            })
        }
    }

    private removeConnection(id: ConnectionId) {
        const element = this.connectionViews.get(id)

        if (element) {
            this.emit({ type: 'unmount', data: { element } })
            this.nodeViews.delete(id)
            this.area.removeChild(element)
        }
    }

    public destroy() {
        this.area.destroy()
        this.nodeViews.forEach(node => node.destroy())
    }
}

export function simpleNodesOrder(plugin: AreaPlugin<BaseSchemes, any>) {
    plugin.addPipe(context => {
        if (context.type === 'nodepicked') {
            const view = plugin.nodeViews.get(context.data.id)

            if (view) {
                plugin.area.appendChild(view.element)
            }
        }
        return context
    })
}
