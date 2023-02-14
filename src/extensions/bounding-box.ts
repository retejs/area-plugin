import { BaseSchemes, NodeEditor } from 'rete'

import { AreaPlugin } from '..'
import { getBoundingBox as getBBox } from '../utils'
import { NodeRef } from './shared/types'
import { getNodesRect } from './shared/utils'

export function getBoundingBox<Schemes extends BaseSchemes, K>(plugin: AreaPlugin<Schemes, K>, nodes: NodeRef<Schemes>[]) {
  const editor = plugin.parentScope<NodeEditor<Schemes>>(NodeEditor)
  const list = nodes.map(node => typeof node === 'object' ? node : editor.getNode(node))
  const rects = getNodesRect(list, plugin.nodeViews)

  return getBBox(rects)
}
