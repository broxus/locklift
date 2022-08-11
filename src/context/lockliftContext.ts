import { ConfigState, NetworkValue } from "../config";

export class LockliftContext {
  constructor(public readonly network: { name: string; config: NetworkValue<ConfigState.INTERNAL> }) {}
}
