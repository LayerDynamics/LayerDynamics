import type { PortalState, TransportDescriptor } from '../../../shared/contract'

/** Server-side record of what a single portal session currently shows. */
export class PortalDisplay {
  readonly portalId: string
  readonly appId: string
  state: PortalState = 'dormant'
  transport: TransportDescriptor | null = null
  constructor(portalId: string, appId: string) {
    this.portalId = portalId
    this.appId = appId
  }
  setTransport(t: TransportDescriptor): void {
    this.transport = t
  }
  setState(s: PortalState): void {
    this.state = s
  }
}
