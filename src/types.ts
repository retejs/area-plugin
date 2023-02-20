export type Position = { x: number, y: number }
export type Size = { width: number, height: number }

export type GetRenderTypes<Signals> = Extract<
  Signals,
  { type: 'render', data: any }
> extends { type: 'render', data: { type: infer G } } ? (G extends string ? G : string) : string
