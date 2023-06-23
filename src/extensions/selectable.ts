import { BaseSchemes, GetSchemes, NodeEditor, NodeId } from 'rete'

import { BaseArea, BaseAreaPlugin } from '../base'

type Schemes = GetSchemes<BaseSchemes['Node'] & { selected?: boolean }, any>

export function accumulateOnCtrl() {
  let pressed = false

  function keydown(e: KeyboardEvent) {
    if (e.key === 'Control') pressed = true
  }
  function keyup(e: KeyboardEvent) {
    if (e.key === 'Control') pressed = false
  }

  document.addEventListener('keydown', keydown)
  document.addEventListener('keyup', keyup)

  return {
    active() {
      return pressed
    },
    destroy() {
      document.removeEventListener('keydown', keydown)
      document.removeEventListener('keyup', keyup)
    }
  }
}

export function selector<E extends { label: string, id: string, unselect(): void, translate(dx: number, dy: number): void }>() {
  const entities = new Map<string, E>()
  let pickId: string | null = null

  function unselectAll() {
    entities.forEach(item => item.unselect())
    entities.clear()
  }
  return {
    isSelected(entity: Pick<E, 'label' | 'id'>) {
      return entities.has(`${entity.label}_${entity.id}`)
    },
    add(entity: E, accumulate: boolean) {
      if (!accumulate) unselectAll()
      entities.set(`${entity.label}_${entity.id}`, entity)
    },
    remove(entity: Pick<E, 'label' | 'id'>) {
      const id = `${entity.label}_${entity.id}`
      const item = entities.get(id)

      if (item) {
        entities.delete(id)
        item.unselect()
      }
    },
    unselectAll,
    translate(dx: number, dy: number) {
      entities.forEach(item => !this.isPicked(item) && item.translate(dx, dy))
    },
    pick(entity: Pick<E, 'label' | 'id'>) {
      pickId = `${entity.label}_${entity.id}`
    },
    release() {
      pickId = null
    },
    isPicked(entity: Pick<E, 'label' | 'id'>) {
      return pickId === `${entity.label}_${entity.id}`
    }
  }
}

export type Accumulating = {
  active(): boolean
}

export type Selectable = ReturnType<typeof selector>

export function selectableNodes<T>(base: BaseAreaPlugin<Schemes, T>, core: Selectable, options: { accumulating: Accumulating }) {
  let editor: null | NodeEditor<Schemes> = null
  const area = base as BaseAreaPlugin<Schemes, BaseArea<Schemes>>
  const getEditor = () => editor || (editor = area.parentScope<NodeEditor<Schemes>>(NodeEditor))

  let twitch: null | number = 0

  function selectNode(node: Schemes['Node']) {
    if (!node.selected) {
      node.selected = true
      area.update('node', node.id)
    }
  }

  function unselectNode(node: Schemes['Node']) {
    if (node.selected) {
      node.selected = false
      area.update('node', node.id)
    }
  }
  function add(nodeId: NodeId, accumulate: boolean) {
    const node = getEditor().getNode(nodeId)

    if (!node) return

    core.add({
      label: 'node',
      id: node.id,
      translate(dx, dy) {
        const view = area.nodeViews.get(node.id)
        const current = view?.position

        if (current) {
          view.translate(current.x + dx, current.y + dy)
        }
      },
      unselect() {
        unselectNode(node)
      }
    }, accumulate)
    selectNode(node)
  }
  function remove(nodeId: NodeId) {
    core.remove({ id: nodeId, label: 'node' })
  }

  // eslint-disable-next-line max-statements, complexity
  area.addPipe(context => {
    if (!context || typeof context !== 'object' || !('type' in context)) return context

    if (context.type === 'nodepicked') {
      const pickedId = context.data.id
      const accumulate = options.accumulating.active()

      core.pick({ id: pickedId, label: 'node' })
      twitch = null
      add(pickedId, accumulate)
    } else if (context.type === 'nodetranslated') {
      const { id, position, previous } = context.data
      const dx = position.x - previous.x
      const dy = position.y - previous.y

      if (core.isPicked({ id, label: 'node' })) core.translate(dx, dy)
    } else if (context.type === 'pointerdown') {
      twitch = 0
    } else if (context.type === 'pointermove') {
      if (twitch !== null) twitch++
    } else if (context.type === 'pointerup') {
      if (twitch !== null && twitch < 4) {
        core.unselectAll()
      }
      twitch = null
    }
    return context
  })

  return {
    select: add,
    unselect: remove
  }
}

