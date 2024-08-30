import { BaseSchemes, GetSchemes } from 'rete'

export type NodeRef<Schemes extends BaseSchemes> = Schemes['Node'] | Schemes['Node']['id']
export type SchemesWithSizes = GetSchemes<
  BaseSchemes['Node'] & { width?: number, height?: number },
  BaseSchemes['Connection']
>

