import { BaseSchemes } from 'rete'

import { BaseArea, BaseAreaPlugin } from '../base'

export function snapGrid<Schemes extends BaseSchemes, K>(base: BaseAreaPlugin<Schemes, K>, params?: { size?: number, dynamic?: boolean }) {
  const area = base as BaseAreaPlugin<Schemes, BaseArea<Schemes>>
  const size = typeof params?.size === 'undefined' ? 16 : params.size
  const dynamic = typeof params?.dynamic === 'undefined' ? true : params.dynamic

  function snap(value: number) {
    return Math.round(value / size) * size
  }

  area.addPipe(context => {
    if (!context || typeof context !== 'object' || !('type' in context)) return context
    if (dynamic && context.type === 'nodetranslate') {
      const { position } = context.data
      const x = snap(position.x)
      const y = snap(position.y)

      return {
        ...context,
        data: {
          ...context.data,
          position: { x, y }
        }
      }
    }
    if (!dynamic && context.type === 'nodedragged') {
      const view = area.nodeViews.get(context.data.id)

      if (view) {
        const { x, y } = view.position

        view.translate(snap(x), snap(y))
      }
    }
    return context
  })
}
