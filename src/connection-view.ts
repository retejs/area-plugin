
type Events = {
  contextmenu: (event: MouseEvent) => void
}

export class ConnectionView {
  element: HTMLElement

  constructor(events: Events) {
    this.element = document.createElement('div')

    this.element.style.position = 'absolute'
    this.element.style.left = '0'
    this.element.style.top = '0'
    this.element.addEventListener('contextmenu', event => events.contextmenu(event))
  }
}
