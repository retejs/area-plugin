import { BaseSchemes } from 'rete'

import { BaseArea, BaseAreaPlugin } from '../../base'

const CONNECTION_Z_INDEX = 0
const NODE_BASE_Z_INDEX = 1

/**
 * Node ordering extension that relies only on z-index.
 * Use this extension when click handlers inside nodes must stay stable.
 * @param base The base area plugin
 * @listens nodecreated
 * @listens nodepicked
 * @listens connectioncreated
 */
export function zIndexNodesOrder<Schemes extends BaseSchemes, T>(base: BaseAreaPlugin<Schemes, T>) {
  const area = base as BaseAreaPlugin<Schemes, BaseArea<Schemes>>
  let nodeZIndex = NODE_BASE_Z_INDEX

  const setNodeBaseZIndex = (id: string) => {
    const view = area.nodeViews.get(id)

    if (view) {
      view.element.style.zIndex = String(NODE_BASE_Z_INDEX)
    }
  }

  const bringNodeToFront = (id: string) => {
    const view = area.nodeViews.get(id)

    if (view) {
      nodeZIndex += 1
      view.element.style.zIndex = String(nodeZIndex)
    }
  }

  const setConnectionBaseZIndex = (id: string) => {
    const view = area.connectionViews.get(id)

    if (view) {
      view.element.style.zIndex = String(CONNECTION_Z_INDEX)
    }
  }

  area.addPipe(context => {
    if (!context || typeof context !== 'object' || !('type' in context)) return context

    if (context.type === 'nodecreated') {
      setNodeBaseZIndex(context.data.id)
    }
    if (context.type === 'nodepicked') {
      bringNodeToFront(context.data.id)
    }
    if (context.type === 'connectioncreated') {
      setConnectionBaseZIndex(context.data.id)
    }
    return context
  })
}
