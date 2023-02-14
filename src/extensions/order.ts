import { BaseSchemes } from 'rete'

import { AreaPlugin } from '..'

export function simpleNodesOrder<T>(plugin: AreaPlugin<BaseSchemes, T>) {
  // eslint-disable-next-line max-statements
  plugin.addPipe(context => {
    if (!('type' in context)) return context
    if (context.type === 'nodepicked') {
      const view = plugin.nodeViews.get(context.data.id)

      if (view) {
        plugin.area.appendChild(view.element)
      }
    }
    if (context.type === 'connectioncreated') {
      const view = plugin.connectionViews.get(context.data.id)

      if (view) {
        plugin.area.element.prepend(view)
      }
    }
    return context
  })
}
