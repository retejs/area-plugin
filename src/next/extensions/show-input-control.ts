import { BaseSchemes, ClassicPreset as Classic, GetSchemes, NodeEditor } from 'rete'

import { AreaPlugin } from '..'

type Scheme = GetSchemes<Classic.Node, Classic.Connection<Classic.Node, Classic.Node>>

export function showInputControl(editor: NodeEditor<Scheme>, area: AreaPlugin<BaseSchemes, any>) {
    function updateInputControlVisibility(target: string, targetInput: string) {
        const node = editor.getNode(target)

        if (!node) throw new Error('cannot find node')

        const input = (node.inputs as Record<string, Classic.Input<Classic.Socket> | undefined>)[targetInput]

        if (!input) throw new Error('cannot find input')

        const previous = input.showControl
        const connections = editor.getConnections()
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
