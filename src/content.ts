export class Content {
  public holder: HTMLElement

  constructor(private reordered: (target: HTMLElement) => Promise<unknown>) {
    this.holder = document.createElement('div')
    this.holder.style.transformOrigin = '0 0'
  }

  public getPointerFrom(event: MouseEvent) {
    const { left, top } = this.holder.getBoundingClientRect()
    const x = event.clientX - left
    const y = event.clientY - top

    return { x, y }
  }

  add(element: HTMLElement) {
    this.holder.appendChild(element)
  }

  // eslint-disable-next-line no-undef
  async reorder(target: HTMLElement, next: ChildNode | null) {
    if (!this.holder.contains(target)) {
      throw new Error(`content doesn't have 'target' for reordering`)
    }
    if (next !== null && !this.holder.contains(next)) {
      throw new Error(`content doesn't have 'next' for reordering`)
    }

    this.holder.insertBefore(target, next)
    await this.reordered(target)
  }

  remove(element: HTMLElement) {
    this.holder.removeChild(element)
  }
}
