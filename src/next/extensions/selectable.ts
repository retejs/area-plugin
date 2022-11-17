import { BaseSchemes, GetSchemes, NodeEditor } from 'rete'

import { AreaPlugin } from '..'

type Scheme = GetSchemes<BaseSchemes['Node'] & { selected?: boolean }, any>

export function selectableNodes<T>(editor: NodeEditor<Scheme>, area: AreaPlugin<Scheme, T>) {
    let ctrlPressed = false
    let pickedNode: string | null = null

    let moved = false
    let unselect = false

    document.addEventListener('keydown', e => {
        if (e.key === 'Control') ctrlPressed = true

    })
    document.addEventListener('keyup', e => {
        if (e.key === 'Control') ctrlPressed = false
    })

    // eslint-disable-next-line max-statements
    area.addPipe(context => {
        if (!('type' in context)) return
        if (context.type === 'nodepicked') {
            const pickedId = context.data.id

            pickedNode = pickedId

            editor.getNodes().forEach(node => {
                if (node.id === pickedId) {
                    if (!node.selected) {
                        node.selected = true
                        area.renderNode(node)
                    }
                } else if (!ctrlPressed && node.selected) {
                    node.selected = false
                    area.renderNode(node)
                }
            })
        } else if (context.type === 'nodetranslated') {
            const { id, position, previous } = context.data
            const dx = position.x -previous.x
            const dy = position.y -previous.y

            if (pickedNode !== id) return

            editor.getNodes().forEach(node => {
                if (node.id === id) return
                if (!node.selected) return
                if (!ctrlPressed) return
                const view = area.nodeViews.get(node.id)

                if (view) {
                    view.translate(view.position.x + dx, view.position.y + dy)
                }
            })
        } else if (context.type === 'pointerdown') {
            unselect = true
            moved = false
        } else if (context.type === 'pointermove') {
            moved = true
        } else if (context.type === 'pointerup') {
            if (unselect && !moved) {
                editor.getNodes().forEach(node => {
                    if (node.selected) {
                        node.selected = false
                        area.renderNode(node)
                    }
                })
            }
            unselect = false
            moved = false
        }
        return context
    })


}

