import { BaseAreaPlugin } from '../../base'
import { NodeView } from '../../node-view'
import { SchemesWithSizes } from './types'

export function getNodesRect<S extends SchemesWithSizes, K>(nodes: S['Node'][], views: BaseAreaPlugin<S, K>['nodeViews']) {
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
