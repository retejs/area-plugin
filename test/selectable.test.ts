import { NodeEditor } from 'rete'

import { selectableNodes, Selector, selector, type SelectorEntity } from '../src/extensions/selectable'

type Pipe = (context: unknown) => Promise<unknown>

type TestNode = {
  id: string
  selected?: boolean
}

function createEntity(id: string) {
  return {
    label: 'node',
    id,
    unselect: jest.fn(),
    translate: jest.fn()
  }
}

function createSelectableContext(accumulate = false) {
  const pipes: Pipe[] = []
  const update = jest.fn()
  const nodes = new Map<string, TestNode>([
    ['n1', { id: 'n1' }],
    ['n2', { id: 'n2' }]
  ])
  const editor = {
    getNode: (id: string) => nodes.get(id)
  }
  const accumulating = { active: jest.fn(() => accumulate) }
  const core = selector()
  const base = {
    nodeViews: new Map<string, { position: { x: number, y: number }, translate: jest.Mock }>(),
    connectionViews: new Map(),
    area: {
      content: {
        holder: {},
        add: jest.fn(),
        remove: jest.fn(),
        reorder: jest.fn()
      }
    },
    addPipe: (pipe: Pipe) => {
      pipes.push(pipe)
    },
    parentScope: (scope: unknown) => {
      if (scope === NodeEditor) return editor
      throw new Error('unexpected scope')
    },
    update
  }

  const api = selectableNodes(base as never, core, { accumulating })

  return {
    pipe: pipes[0],
    core,
    nodes,
    update,
    accumulating,
    api
  }
}

describe('Selector', () => {
  it('selects a single entity without accumulate', async () => {
    const core = new Selector<SelectorEntity>()
    const first = createEntity('n1')

    await core.add(first, false)

    expect(core.isSelected(first)).toBe(true)
    expect(core.entities.size).toBe(1)
    expect(first.unselect).not.toHaveBeenCalled()
  })

  it('replaces selection when another entity is picked without accumulate', async () => {
    const core = new Selector<SelectorEntity>()
    const first = createEntity('n1')
    const second = createEntity('n2')

    await core.add(first, false)
    await core.add(second, false)

    expect(core.isSelected(first)).toBe(false)
    expect(core.isSelected(second)).toBe(true)
    expect(core.entities.size).toBe(1)
    expect(first.unselect).toHaveBeenCalledTimes(1)
    expect(second.unselect).not.toHaveBeenCalled()
  })

  it('accumulates entities when accumulate is enabled', async () => {
    const core = new Selector<SelectorEntity>()
    const first = createEntity('n1')
    const second = createEntity('n2')

    await core.add(first, false)
    await core.add(second, true)

    expect(core.isSelected(first)).toBe(true)
    expect(core.isSelected(second)).toBe(true)
    expect(core.entities.size).toBe(2)
    expect(first.unselect).not.toHaveBeenCalled()
    expect(second.unselect).not.toHaveBeenCalled()
  })

  it('reduces multi-selection to the clicked entity without accumulate', async () => {
    const core = new Selector<SelectorEntity>()
    const first = createEntity('n1')
    const second = createEntity('n2')

    await core.add(first, false)
    await core.add(second, true)
    await core.add(first, false)

    expect(core.isSelected(first)).toBe(true)
    expect(core.isSelected(second)).toBe(false)
    expect(core.entities.size).toBe(1)
    expect(second.unselect).toHaveBeenCalledTimes(1)
  })

  it('clears all entities on unselectAll', async () => {
    const core = new Selector<SelectorEntity>()
    const first = createEntity('n1')
    const second = createEntity('n2')

    await core.add(first, false)
    await core.add(second, true)
    await core.unselectAll()

    expect(core.entities.size).toBe(0)
    expect(first.unselect).toHaveBeenCalledTimes(1)
    expect(second.unselect).toHaveBeenCalledTimes(1)
  })

  it('does not unselect when re-adding the sole selected entity', async () => {
    const core = new Selector<SelectorEntity>()
    const first = createEntity('n1')

    await core.add(first, false)
    await core.add(first, false)

    expect(core.isSelected(first)).toBe(true)
    expect(core.entities.size).toBe(1)
    expect(first.unselect).not.toHaveBeenCalled()
  })

  it('does not unselect the clicked entity when reducing multi-selection without accumulate', async () => {
    const core = new Selector<SelectorEntity>()
    const first = createEntity('n1')
    const second = createEntity('n2')

    await core.add(first, false) // {n1}
    await core.add(second, true) // {n1, n2}
    await core.add(first, false) // click already selected n1 without Ctrl => should keep n1 selected, only remove n2

    expect(core.isSelected(first)).toBe(true)
    expect(core.isSelected(second)).toBe(false)
    expect(core.entities.size).toBe(1)

    // unselect must be invoked only for the entity that is removed from selection (n2)
    expect(second.unselect).toHaveBeenCalledTimes(1)
    expect(first.unselect).not.toHaveBeenCalled()
  })
})

describe('selectableNodes', () => {
  it('selects a node on nodepicked and marks it as selected', async () => {
    const { pipe, nodes, update } = createSelectableContext()

    await pipe({ type: 'nodepicked', data: { id: 'n1' } })

    expect(nodes.get('n1')?.selected).toBe(true)
    expect(update).toHaveBeenCalledWith('node', 'n1')
  })

  it('accumulates nodes when accumulate mode is active', async () => {
    const { pipe, core, nodes, accumulating } = createSelectableContext()

    accumulating.active.mockReturnValueOnce(false).mockReturnValueOnce(true)

    await pipe({ type: 'nodepicked', data: { id: 'n1' } })
    await pipe({ type: 'nodepicked', data: { id: 'n2' } })

    expect(nodes.get('n1')?.selected).toBe(true)
    expect(nodes.get('n2')?.selected).toBe(true)
    expect(core.entities.size).toBe(2)
  })

  it('clears selection on background pointerup click', async () => {
    const { pipe, core, nodes } = createSelectableContext()

    await pipe({ type: 'nodepicked', data: { id: 'n1' } })
    await pipe({ type: 'pointerdown', data: {} })
    await pipe({ type: 'pointerup', data: {} })

    expect(nodes.get('n1')?.selected).toBe(false)
    expect(core.entities.size).toBe(0)
  })

  it('does not re-render when re-picking the sole selected node', async () => {
    const { pipe, nodes, update } = createSelectableContext()

    await pipe({ type: 'nodepicked', data: { id: 'n1' } })
    await pipe({ type: 'nodepicked', data: { id: 'n1' } })

    expect(nodes.get('n1')?.selected).toBe(true)
    expect(update).toHaveBeenCalledTimes(1)
  })

  it('does not re-render when reducing multi-selection by clicking already selected node without accumulate', async () => {
    const { pipe, nodes, update, accumulating } = createSelectableContext()

    accumulating.active
      .mockReturnValueOnce(false) // n1 without Ctrl
      .mockReturnValueOnce(true) // n2 with Ctrl => {n1, n2}
      .mockReturnValueOnce(false) // click n1 without Ctrl => should keep n1 selected

    await pipe({ type: 'nodepicked', data: { id: 'n1' } })
    await pipe({ type: 'nodepicked', data: { id: 'n2' } })
    await pipe({ type: 'nodepicked', data: { id: 'n1' } })

    expect(nodes.get('n1')?.selected).toBe(true)
    expect(nodes.get('n2')?.selected).toBe(false)

    /*
     * update calls:
     * 1) select n1
     * 2) select n2
     * 3) unselect n2 when reducing to single selection (no unselect/select for n1)
     */
    expect(update).toHaveBeenCalledTimes(3)
  })
})
