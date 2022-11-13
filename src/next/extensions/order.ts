import { BaseSchemes } from 'rete'

import { AreaPlugin } from '..'

export function simpleNodesOrder(plugin: AreaPlugin<BaseSchemes, any>) {
    plugin.addPipe(context => {
        if (context.type === 'nodepicked') {
            const view = plugin.nodeViews.get(context.data.id)

            if (view) {
                plugin.area.appendChild(view.element)
            }
        }
        return context
    })
}
