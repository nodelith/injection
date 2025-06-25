import { Bundle } from './bundle'
import { Identity } from './identity'
import { Resolver } from './resolver'

export class Context {
  private instances: Map<Identity, any> = new Map()

  public clear() {
    this.instances.clear()
  }
 
  public resolve<R>(resolver: Resolver<R>, bundle: Bundle = {}): R {
    const identity = Identity.extract(resolver)

    if (this.instances.has(identity)) {
      return this.instances.get(identity)
    }

    const result = resolver(bundle)

    this.instances.set(identity, result)

    return result
  }
}
