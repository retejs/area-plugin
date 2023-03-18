import { BaseSchemes } from 'rete'

import { AreaPlugin } from '..'

export function simpleNodesOrder<T>(plugin: AreaPlugin<BaseSchemes, T>) {
  plugin.addPipe(context => {
    if (!('type' in context)) return context
    if (context.type === 'nodepicked') {
      const view = plugin.nodeViews.get(context.data.id)
      const { content } = plugin.area

      if (view) {
        content.reorder(view.element, null)
      }
    }
    if (context.type === 'connectioncreated') {
      const view = plugin.connectionViews.get(context.data.id)
      const { content } = plugin.area

      if (view) {
        content.reorder(view.element, content.holder.firstChild)
      }
    }
    return context
  })
}
