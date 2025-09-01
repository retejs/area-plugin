import { BaseSchemes, GetSchemes, NodeEditor, NodeId } from 'rete'

import { BaseArea, BaseAreaPlugin } from '../base'

type Schemes = GetSchemes<BaseSchemes['Node'] & { selected?: boolean }, any>

/**
 * Selector's accumulate function, activated when the ctrl key is pressed
 */
export function accumulateOnCtrl() {
  let pressed = false

  function keydown(e: KeyboardEvent) {
    if (e.key === 'Control' || e.key === 'Meta') pressed = true
  }
  function keyup(e: KeyboardEvent) {
    if (e.key === 'Control' || e.key === 'Meta') pressed = false
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

export type SelectorEntity = {
  label: string
  id: string
  unselect(): void | Promise<void>
  translate(dx: number, dy: number): void | Promise<void>
}

/**
 * Selector class. Used to collect selected entities (nodes, connections, etc.) and synchronize them (select, unselect, translate, etc.).
 * Can be extended to add custom functionality.
 */
export class Selector<E extends SelectorEntity> {
  entities = new Map<string, E>()
  pickId: string | null = null

  isSelected(entity: Pick<E, 'label' | 'id'>) {
    return this.entities.has(`${entity.label}_${entity.id}`)
  }

  async add(entity: E, accumulate: boolean) {
    if (!accumulate) await this.unselectAll()
    this.entities.set(`${entity.label}_${entity.id}`, entity)
  }

  async remove(entity: Pick<E, 'label' | 'id'>) {
    const id = `${entity.label}_${entity.id}`
    const item = this.entities.get(id)

    if (item) {
      this.entities.delete(id)
      await item.unselect()
    }
  }

  async unselectAll() {
    await Promise.all([...Array.from(this.entities.values())].map(item => this.remove(item)))
  }

  async translate(dx: number, dy: number) {
    await Promise.all(Array.from(this.entities.values()).map(item => !this.isPicked(item) && item.translate(dx, dy)))
  }

  pick(entity: Pick<E, 'label' | 'id'>) {
    this.pickId = `${entity.label}_${entity.id}`
  }

  release() {
    this.pickId = null
  }

  isPicked(entity: Pick<E, 'label' | 'id'>) {
    return this.pickId === `${entity.label}_${entity.id}`
  }
}

/**
 * Selector factory, uses default Selector class
 * @returns Selector instance
 */
export function selector<E extends SelectorEntity>() {
  return new Selector<E>()
}

/**
 * Accumulating interface, used to determine whether to accumulate entities on selection
 */
export type Accumulating = {
  active(): boolean
}

export type Selectable = ReturnType<typeof selector>

/**
 * Selectable nodes extension. Adds the ability to select nodes in the area.
 * @param base BaseAreaPlugin instance
 * @param core Selectable instance
 * @param options.accumulating Accumulating interface
 * @listens nodepicked
 * @listens nodetranslated
 * @listens pointerdown
 * @listens pointermove
 * @listens pointerup
 */
export function selectableNodes<T>(base: BaseAreaPlugin<Schemes, T>, core: Selectable, options: { accumulating: Accumulating }) {
  let editor: null | NodeEditor<Schemes> = null
  const area = base as BaseAreaPlugin<Schemes, BaseArea<Schemes>>
  const getEditor = () => editor || (editor = area.parentScope<NodeEditor<Schemes>>(NodeEditor))

  let twitch: null | number = 0

  function selectNode(node: Schemes['Node']) {
    if (!node.selected) {
      node.selected = true
      void area.update('node', node.id)
    }
  }

  function unselectNode(node: Schemes['Node']) {
    if (node.selected) {
      node.selected = false
      void area.update('node', node.id)
    }
  }
  /**
   * Select node programmatically
   * @param nodeId Node id
   * @param accumulate Whether to accumulate nodes on selection
   */
  async function add(nodeId: NodeId, accumulate: boolean) {
    const node = getEditor().getNode(nodeId)

    if (!node) return

    await core.add({
      label: 'node',
      id: node.id,
      async translate(dx, dy) {
        const view = area.nodeViews.get(node.id)
        const current = view?.position

        if (current) {
          await view.translate(current.x + dx, current.y + dy)
        }
      },
      unselect() {
        unselectNode(node)
      }
    }, accumulate)
    selectNode(node)
  }
  /**
   * Unselect node programmatically
   * @param nodeId Node id
   */
  async function remove(nodeId: NodeId) {
    await core.remove({ id: nodeId, label: 'node' })
  }

  // eslint-disable-next-line max-statements, complexity
  area.addPipe(async context => {
    if (!context || typeof context !== 'object' || !('type' in context)) return context

    if (context.type === 'nodepicked') {
      const pickedId = context.data.id
      const accumulate = options.accumulating.active()

      core.pick({ id: pickedId, label: 'node' })
      twitch = null
      await add(pickedId, accumulate)
    } else if (context.type === 'nodetranslated') {
      const { id, position, previous } = context.data
      const dx = position.x - previous.x
      const dy = position.y - previous.y

      if (core.isPicked({ id, label: 'node' })) await core.translate(dx, dy)
    } else if (context.type === 'pointerdown') {
      twitch = 0
    } else if (context.type === 'pointermove') {
      if (twitch !== null) twitch++
    } else if (context.type === 'pointerup') {
      if (twitch !== null && twitch < 4) {
        await core.unselectAll()
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

