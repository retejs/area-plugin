import { BaseSchemes, ClassicPreset as Classic, GetSchemes, NodeEditor } from 'rete'

import { AreaPlugin } from '..'

type Scheme = GetSchemes<Classic.Node, Classic.Connection<Classic.Node, Classic.Node>>

export function showInputControl<S extends Scheme>(area: AreaPlugin<BaseSchemes, any>) {
    let editor: null | NodeEditor<S> = null
    const getEditor = () => editor || (editor = area.parentScope<NodeEditor<S>>(NodeEditor))

    function updateInputControlVisibility(target: string, targetInput: string) {
        const node = getEditor().getNode(target)

        if (!node) throw new Error('cannot find node')

        const input = (node.inputs as Record<string, Classic.Input<Classic.Socket> | undefined>)[targetInput]

        if (!input) throw new Error('cannot find input')

        const previous = input.showControl
        const connections = getEditor().getConnections()
        const hasAnyConnection = Boolean(connections.find(connection => {
            return connection.target === target && connection.targetInput === targetInput
        }))

        input.showControl = !hasAnyConnection

        if (input.showControl !== previous) {
            area.renderNode(node)
        }
    }

    area.addPipe(context => {
        if (context.type === 'connectioncreated' || context.type === 'connectionremoved') {
            updateInputControlVisibility(context.data.target, context.data.targetInput)
        }
        return context
    })
}
