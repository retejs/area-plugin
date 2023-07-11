import { BaseSchemes, ClassicPreset as Classic, GetSchemes, NodeEditor } from 'rete'

import { BaseAreaPlugin } from '../base'

type Scheme = GetSchemes<Classic.Node, Classic.Connection<Classic.Node, Classic.Node>>
type Visible<S extends Scheme> = (props: { hasAnyConnection: boolean, input: NonNullable<S['Node']['inputs'][string]> }) => boolean

/**
 * Show input control extension. It will show the input's control when there is no connection and hide it when there is a connection.
 * @param area The base area plugin
 * @param visible The visible function
 * @listens connectioncreated
 * @listens connectionremoved
 */
export function showInputControl<S extends Scheme>(area: BaseAreaPlugin<BaseSchemes, any>, visible?: Visible<S>) {
  let editor: null | NodeEditor<S> = null
  const getEditor = () => editor || (editor = area.parentScope<NodeEditor<S>>(NodeEditor))

  function updateInputControlVisibility(target: string, targetInput: string) {
    const node = getEditor().getNode(target)

    if (!node) return

    const input = (node.inputs as Record<string, S['Node']['inputs'][string] | undefined>)[targetInput]

    if (!input) throw new Error('cannot find input')

    const previous = input.showControl
    const connections = getEditor().getConnections()
    const hasAnyConnection = Boolean(connections.find(connection => {
      return connection.target === target && connection.targetInput === targetInput
    }))

    input.showControl = visible ? visible({ hasAnyConnection, input }) : !hasAnyConnection

    if (input.showControl !== previous) {
      area.update('node', node.id)
    }
  }

  area.addPipe(context => {
    if (context.type === 'connectioncreated' || context.type === 'connectionremoved') {
      updateInputControlVisibility(context.data.target, context.data.targetInput)
    }
    return context
  })
}
