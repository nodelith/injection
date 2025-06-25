import { TargetConstructor, TargetFactory } from 'target'
import { Bundle } from './bundle'

export type Resolver<T = any> = (bundle: Bundle) => T

export type ResolverOptions<R = any> =
 R extends object ? (
  | { factory: TargetFactory<R> }
  | { constructor: TargetConstructor<R> }
 ) : never
  

export function createResolver<R>(options: ResolverOptions<R>): Resolver {
  if('factory' in options) {
    return (bundle: Bundle) => options.factory(bundle)
  }

  if('constructor' in options && Object.hasOwnProperty.call(options, 'constructor')) {
    return (bundle: Bundle) => new options.constructor(bundle)
  }

  throw new Error(`Could not create resolver. Missing a valid registration target.`)
}

export namespace Resolver {
  export const create = createResolver
}
