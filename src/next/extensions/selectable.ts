import { BaseSchemes, GetSchemes, NodeEditor } from 'rete'

import { AreaPlugin } from '..'

type Schemes = GetSchemes<BaseSchemes['Node'] & { selected?: boolean }, any>

function watchCtrlPressed(change?: (state: boolean) => void) {
    let pressed = false

    function keydown(e: KeyboardEvent) {
        if (e.key === 'Control') {
            pressed = true
            change && change(true)
        }
    }
    function keyup(e: KeyboardEvent) {
        if (e.key === 'Control') {
            pressed = false
            change && change(false)
        }
    }

    document.addEventListener('keydown', keydown)
    document.addEventListener('keyup', keyup)

    return {
        isPressed() {
            return pressed
        },
        destroy() {
            document.removeEventListener('keydown', keydown)
            document.removeEventListener('keyup', keyup)
        }
    }
}

type Props = {
    translate?: (dx: number, dy: number) => void
    unselect?: () => void
}

export function selectableNodes<T>(area: AreaPlugin<Schemes, T>, props?: Props) {
    let editor: null | NodeEditor<Schemes> = null
    const getEditor = () => editor || (editor = area.parentScope<NodeEditor<Schemes>>(NodeEditor))
    const ctrl = watchCtrlPressed()
    let pickedNode: string | null = null

    let unselect = false

    function selectNode(node: Schemes['Node']) {
        if (!node.selected) {
            node.selected = true
            area.renderNode(node)
        }
    }

    function unselectNode(node: Schemes['Node']) {
        if (node.selected) {
            node.selected = false
            area.renderNode(node)
        }
    }

    // eslint-disable-next-line max-statements
    area.addPipe(context => {
        if (!('type' in context)) return context
        if (context.type === 'nodepicked') {
            const pickedId = context.data.id

            pickedNode = pickedId

            getEditor().getNodes().forEach(node => {
                if (node.id === pickedId) {
                    selectNode(node)
                } else if (!ctrl.isPressed()) {
                    unselectNode(node)
                }
            })
            if (!ctrl.isPressed()) props?.unselect && props.unselect()
        } else if (context.type === 'nodetranslated') {
            const { id, position, previous } = context.data
            const dx = position.x - previous.x
            const dy = position.y - previous.y

            if (pickedNode === id) {
                getEditor().getNodes().forEach(node => {
                    if (node.id === id) return
                    if (!node.selected) return
                    if (!ctrl.isPressed()) return
                    const view = area.nodeViews.get(node.id)
                    const current = view?.position

                    if (current) {
                        view.translate(current.x + dx, current.y + dy)
                    }
                })
                if (props?.translate) props.translate(dx, dy)
            }
        } else if (context.type === 'pointerdown') {
            unselect = true
        } else if (context.type === 'pointermove') {
            unselect = false
        } else if (context.type === 'pointerup') {
            if (unselect) {
                getEditor().getNodes().forEach(unselectNode)
                props?.unselect && props.unselect()
            }
            unselect = false
        }
        return context
    })

    return {
        destroy() {
            ctrl.destroy()
        }
    }
}

