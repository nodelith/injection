import { Identity } from './identity'
import { Target } from './target'

export class Context {
  private instances: Map<Identity, any> = new Map()

  public clear() {
    this.instances.clear()
  }
 
  public resolve<R, D extends readonly unknown[] = []>(target: Target<R, D>, ...dependencies: D): R {
    const identity = Identity.extract(target)

    if (this.instances.has(identity)) {
      return this.instances.get(identity)
    }

    const result = target(...dependencies)

    this.instances.set(identity, result)

    return result
  }
}
