import { BaseSchemes } from 'rete'

import { BaseArea, BaseAreaPlugin } from '../base'

export function simpleNodesOrder<Schemes extends BaseSchemes, T>(base: BaseAreaPlugin<Schemes, T>) {
  const area = base as BaseAreaPlugin<Schemes, BaseArea<Schemes>>

  area.addPipe(context => {
    if (!context || typeof context !== 'object' || !('type' in context)) return context

    if (context.type === 'nodepicked') {
      const view = area.nodeViews.get(context.data.id)
      const { content } = area.area

      if (view) {
        content.reorder(view.element, null)
      }
    }
    if (context.type === 'connectioncreated') {
      const view = area.connectionViews.get(context.data.id)
      const { content } = area.area

      if (view) {
        content.reorder(view.element, content.holder.firstChild)
      }
    }
    return context
  })
}
