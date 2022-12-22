import { BaseSchemes, GetSchemes, NodeEditor, NodeId } from 'rete'

import { AreaPlugin } from '..'
import { NodeView } from '../node-view'
import { getBoundingBox } from '../utils'

type ExpectedSchemes = GetSchemes<
    BaseSchemes['Node'] & { width?: number, height?: number },
    BaseSchemes['Connection']
>
type NodeRef<Schemes extends BaseSchemes> = Schemes['Node'] | Schemes['Node']['id']

type Params = { scale?: number }

// eslint-disable-next-line max-statements, max-len
export async function zoomAt<Schemes extends ExpectedSchemes, K>(plugin: AreaPlugin<Schemes, K>, nodes: NodeRef<Schemes>[], params?: Params) {
    const { scale = 0.9 } = params || {}
    const editor = plugin.parentScope<NodeEditor<Schemes>>(NodeEditor)
    const list = nodes.map(node => typeof node === 'object' ? node : editor.getNode(node))
    const rects = getNodesRect(list, plugin.nodeViews)
    const boundingBox = getBoundingBox(rects)
    const [w, h] = [plugin.container.clientWidth, plugin.container.clientHeight]
    const [kw, kh] = [w / boundingBox.width, h / boundingBox.height]
    const k = Math.min(kh * scale, kw * scale, 1)

    plugin.area.transform.x = w / 2 - boundingBox.center.x * k
    plugin.area.transform.y = h / 2 - boundingBox.center.y * k
    await plugin.area.zoom(k, 0, 0)
}

function getNodesRect(nodes: ExpectedSchemes['Node'][], views: Map<NodeId, NodeView>) {
    return nodes
        .map(node => ({ view: views.get(node.id) as NodeView, node }))
        .filter(item => item.view)
        .map(({ view, node }) => {
            const { width, height } = node

            if (typeof width !== 'undefined' && typeof height !== 'undefined') {
                return {
                    position: view.position,
                    width,
                    height
                }
            }

            return {
                position: view.position,
                width: view.element.clientWidth,
                height: view.element.clientHeight
            }
        })
}
