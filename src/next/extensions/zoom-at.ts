import { NodeEditor } from 'rete'

import { AreaPlugin } from '..'
import { getBoundingBox } from '../utils'
import { NodeRef, SchemesWithSizes } from './shared/types'
import { getNodesRect } from './shared/utils'

type Params = { scale?: number }

// eslint-disable-next-line max-statements, max-len
export async function zoomAt<Schemes extends SchemesWithSizes, K>(plugin: AreaPlugin<Schemes, K>, nodes: NodeRef<Schemes>[], params?: Params) {
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
