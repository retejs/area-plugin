import { simpleNodesOrder, zIndexNodesOrder } from '../src/extensions/order'

type Pipe = (context: unknown) => unknown

function createMockBase() {
  const pipes: Pipe[] = []
  const reorder = jest.fn()
  const holder = { firstChild: null } as unknown as HTMLElement
  const add = jest.fn()
  const remove = jest.fn()

  const base = {
    nodeViews: new Map<string, { element: HTMLElement }>(),
    connectionViews: new Map<string, { element: HTMLElement }>(),
    area: {
      content: {
        holder,
        reorder,
        add,
        remove
      }
    },
    addPipe: (pipe: Pipe) => {
      pipes.push(pipe)
    }
  }

  return { base, pipes, reorder, holder, add, remove }
}

describe('zIndexNodesOrder', () => {
  it('sets baseline and raises picked nodes by z-index', () => {
    const { base, pipes, reorder } = createMockBase()
    const firstNode = { style: { zIndex: '' } } as unknown as HTMLElement
    const secondNode = { style: { zIndex: '' } } as unknown as HTMLElement
    const connection = { style: { zIndex: '' } } as unknown as HTMLElement

    base.nodeViews.set('n1', { element: firstNode })
    base.nodeViews.set('n2', { element: secondNode })
    base.connectionViews.set('c1', { element: connection })

    zIndexNodesOrder(base as never)

    const [pipe] = pipes

    pipe({ type: 'nodecreated', data: { id: 'n1' } })
    pipe({ type: 'nodecreated', data: { id: 'n2' } })
    pipe({ type: 'nodepicked', data: { id: 'n1' } })
    pipe({ type: 'nodepicked', data: { id: 'n2' } })

    expect(firstNode.style.zIndex).toBe('2')
    expect(secondNode.style.zIndex).toBe('3')
    expect(reorder).not.toHaveBeenCalled()
  })

  it('places connections below nodes without DOM reordering', () => {
    const { base, pipes, reorder } = createMockBase()
    const connection = { style: { zIndex: '' } } as unknown as HTMLElement

    base.connectionViews.set('c1', { element: connection })

    zIndexNodesOrder(base as never)

    const [pipe] = pipes

    pipe({ type: 'connectioncreated', data: { id: 'c1' } })

    expect(connection.style.zIndex).toBe('0')
    expect(reorder).not.toHaveBeenCalled()
  })

  it('raises the same node on repeated picks', () => {
    const { base, pipes } = createMockBase()
    const node = { style: { zIndex: '' } } as unknown as HTMLElement

    base.nodeViews.set('n1', { element: node })

    zIndexNodesOrder(base as never)

    const [pipe] = pipes

    pipe({ type: 'nodecreated', data: { id: 'n1' } })
    pipe({ type: 'nodepicked', data: { id: 'n1' } })
    pipe({ type: 'nodepicked', data: { id: 'n1' } })

    expect(node.style.zIndex).toBe('3')
  })

  it('keeps newly created nodes at baseline even after previous picks', () => {
    const { base, pipes } = createMockBase()
    const firstNode = { style: { zIndex: '' } } as unknown as HTMLElement
    const secondNode = { style: { zIndex: '' } } as unknown as HTMLElement

    base.nodeViews.set('n1', { element: firstNode })

    zIndexNodesOrder(base as never)

    const [pipe] = pipes

    pipe({ type: 'nodecreated', data: { id: 'n1' } })
    pipe({ type: 'nodepicked', data: { id: 'n1' } })

    base.nodeViews.set('n2', { element: secondNode })
    pipe({ type: 'nodecreated', data: { id: 'n2' } })

    expect(firstNode.style.zIndex).toBe('2')
    expect(secondNode.style.zIndex).toBe('1')
  })

  it('ignores missing views without errors', () => {
    const { base, pipes, reorder } = createMockBase()

    zIndexNodesOrder(base as never)

    const [pipe] = pipes

    expect(() => pipe({ type: 'nodecreated', data: { id: 'unknown-node' } })).not.toThrow()
    expect(() => pipe({ type: 'nodepicked', data: { id: 'unknown-node' } })).not.toThrow()
    expect(() => pipe({ type: 'connectioncreated', data: { id: 'unknown-connection' } })).not.toThrow()
    expect(reorder).not.toHaveBeenCalled()
  })

  it('returns input context for unsupported payloads', () => {
    const { base, pipes } = createMockBase()

    zIndexNodesOrder(base as never)

    const [pipe] = pipes
    const invalidContext = null
    const unknownContext = { type: 'other', data: { id: 'n1' } }

    expect(pipe(invalidContext)).toBe(invalidContext)
    expect(pipe(unknownContext)).toBe(unknownContext)
  })
})

describe('simpleNodesOrder', () => {
  it('keeps DOM reorder behavior for picked nodes and new connections', () => {
    const { base, pipes, reorder, holder } = createMockBase()
    const node = { style: { zIndex: '' } } as unknown as HTMLElement
    const connection = { style: { zIndex: '' } } as unknown as HTMLElement

    base.nodeViews.set('n1', { element: node })
    base.connectionViews.set('c1', { element: connection })

    simpleNodesOrder(base as never)

    const [pipe] = pipes

    pipe({ type: 'nodepicked', data: { id: 'n1' } })
    pipe({ type: 'connectioncreated', data: { id: 'c1' } })

    expect(reorder).toHaveBeenCalledTimes(2)
    expect(reorder).toHaveBeenNthCalledWith(1, node, null)
    expect(reorder).toHaveBeenNthCalledWith(2, connection, holder.firstChild)
  })
})
