
export class ElementsHolder<E extends HTMLElement, Ctx extends { type: string, element: E, payload?: { id: string } }> {
  views = new WeakMap<E, Ctx>()
  viewsElements = new Map<`${string}_${string}`, E>()

  public set(context: Ctx) {
    const { element, type, payload } = context

    if (payload?.id) {
      this.views.set(element, context)
      this.viewsElements.set(`${type}_${payload.id}`, element)
    }
  }

  public get(type: string, id: string) {
    const element = this.viewsElements.get(`${type}_${id}`)

    return element && this.views.get(element)
  }

  public delete(element: E) {
    const view = this.views.get(element)

    if (view && view.payload?.id) {
      this.views.delete(element)
      this.viewsElements.delete(`${view.type}_${view.payload.id}`)
    }
  }
}
