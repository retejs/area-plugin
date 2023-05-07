export type Position = { x: number, y: number }
export type Size = { width: number, height: number }

export type GetRenderTypes<Signals> = Extract<
  Signals,
  { type: 'render', data: any }
> extends { type: 'render', data: { type: infer G } } ? (G extends string ? G : string) : string

export type RenderMeta = { filled?: boolean }
export type RenderSignal<Type extends string, Data> =
  | { type: 'render', data: { element: HTMLElement, type: Type } & RenderMeta & Data }
  | { type: 'rendered', data: { element: HTMLElement, type: Type } & Data }
