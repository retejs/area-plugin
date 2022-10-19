import { BaseSchemes, ConnectionId, NodeId, Root, Scope } from 'rete'

import { Drag } from './drag'

console.log('area')

type Position = { x: number, y: number }

export type Area2D<Schemes extends BaseSchemes> =
    | { type: 'nodepicked', data: { id: string } }
    | { type: 'nodetranslate', data: { id: string, position: Position, previous: Position } }
    | { type: 'nodetranslated', data: { id: string, position: Position, previous: Position } }
    | { type: 'translate', data: { position: Position } }
    | { type: 'contextmenu', data: { event: MouseEvent, context: 'root' | Schemes['Node'] } }
    | { type: 'zoom', data: { k: number } }
    | { type: 'zoomed', data: { k: number } }
    | {
        type: 'render',
        data:
            | { element: HTMLElement, type: 'node', payload: Schemes['Node'] }
            | { element: HTMLElement, type: 'connection', payload: Schemes['Connection'] }
    }
    | { type: 'nodedragged', data: Schemes['Node'] }

class NodeView {
    element: HTMLElement
    position: Position
    drag: Drag

    constructor(
        private picked: () => void,
        private canTranslate: (params: { position: Position, previous: Position }) => Promise<unknown>,
        private translated: (params: { position: Position, previous: Position }) => Promise<unknown>,
        private dragged: () => void
    ) {
        this.element = document.createElement('div')
        this.element.style.position = 'absolute'
        this.position = { x: 0, y: 0 }
        this.translate(0, 0)

        let startPosition: Position = { x: 0, y: 0 }

        this.drag = new Drag(
            this.element,
            () => {
                startPosition = { ...this.position }
                this.picked()
            },
            (dx: number, dy: number) => {
                this.translate(startPosition.x + dx, startPosition.y + dy)
            },
            this.dragged
        )
    }

    async translate(x: number, y: number) {
        const previous = { ...this.position }

        if (!await this.canTranslate({ previous, position: { x, y } })) return false

        this.position = { x, y }
        this.element.style.transform = `translate(${x}px, ${y}px)`;

        await this.translated({ position: { x, y }, previous })

        return true
    }
}

export class AreaPlugin<Schemes extends BaseSchemes> extends Scope<Area2D<Schemes>, Root<Schemes>> {
    nodeViews = new Map<NodeId, NodeView>
    connectionViews = new Map<ConnectionId, HTMLElement>

    constructor(container: HTMLElement) {
        super('area')
        container.style.overflow = 'hidden';

        container.addEventListener('contextmenu', event => {
            this.emit({ type: 'contextmenu', data: { event, context: 'root' } })
        })
        // eslint-disable-next-line max-statements
        this.addPipe(payload => {
            if (payload.type === 'nodecreated') {
                const node = payload.data
                const view = this.createNodeView(node)

                this.nodeViews.set(node.id, view)
                container.appendChild(view.element)
            }
            if (payload.type === 'noderemoved') {
                const id = payload.data
                const view = this.nodeViews.get(id)

                if (view) {
                    this.nodeViews.delete(id)
                    container.removeChild(view.element)
                }
            }
            if (payload.type === 'connectioncreated') {
                const connection = payload.data
                const element = this.createConnection(connection)

                this.connectionViews.set(connection.id, element)
                container.appendChild(element)
            }
            if (payload.type === 'connectionremoved') {
                const id = payload.data
                const element = this.connectionViews.get(id)

                if (element) {
                    this.nodeViews.delete(id)
                    container.removeChild(element)
                }
            }
            return payload
        })
    }

    createNodeView(node: Schemes['Node']) {
        const id = node.id
        const view = new NodeView(
            () => this.emit({ type: 'nodepicked', data: { id } }),
            data => this.emit({ type: 'nodetranslate', data: { id, ...data } }),
            data => this.emit({ type: 'nodetranslated', data: { id, ...data } }),
            () => this.emit({ type: 'nodedragged', data: node })
        )

        view.element.addEventListener('contextmenu', event => {
            this.emit({ type: 'contextmenu', data: { event, context: node } })
        })
        this.emit({ type: 'render', data: { element: view.element, type: 'node', payload: node } })

        return view
    }

    createConnection(connection: Schemes['Connection']) {
        const element = document.createElement('div')

        element.style.position = 'absolute'
        element.style.left = '0'
        element.style.top = '0'
        element.addEventListener('contextmenu', event => {
            this.emit({ type: 'contextmenu', data: { event, context: connection } })
        })
        this.emit({ type: 'render', data: { element, type: 'connection', payload: connection } })

        return element
    }
}
