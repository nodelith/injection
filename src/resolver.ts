import { 
  ConstructorTarget,
  ConstructorTargetWrapper,
  FactoryTarget,
  FactoryTargetWrapper,
  FunctionTargetWrapper,
  StaticTargetWrapper
} from 'target'
import { Identity } from './identity'
import { Bundle } from './bundle'

export type Resolver<T = any> = (bundle: Bundle) => T

export type ConstructorResolverOptions<T extends object = any> =
  (ConstructorTargetWrapper<T> & { resolution?: 'lazy' | 'eager' })

export type FactoryResolverOptions<T extends object = any> =
  (FactoryTargetWrapper<T> & { resolution?: 'lazy' | 'eager' })

export type FunctionResolverOptions<T extends any = any> = 
  (FunctionTargetWrapper<T> & { resolution?: 'eager' })

export type StaticResolverOptions<T extends any = any> = 
  (StaticTargetWrapper<T> & { resolution?: 'eager' })

export type ObjectResolverOptions<T extends object = any> =
  | ConstructorResolverOptions<T>
  | FactoryResolverOptions<T>

export type ValueResolverOptions<T extends any = any> = 
  | FunctionResolverOptions<T>
  | StaticResolverOptions<T>

export type ResolverOptions<T extends any> = T extends object 
  ? ObjectResolverOptions<T> | ValueResolverOptions<T>
    : ValueResolverOptions<T>


export function createProxy<T extends object = any>(resolver: Resolver<T>, prototype?: object): Resolver<T> {
  const resolution: { instance?: T } = { }

  const resolveInstance = (bundle: Bundle): T => {
    return !('instance' in resolution ) 
      ? resolution.instance = resolver(bundle)
      : resolution.instance 
  }

  return Identity.bind(resolver, (bundle: Bundle) => {
    return new Proxy<T>(Object.create(prototype ?? null), {
      get: function(_target, property) {
        const instance = resolveInstance(bundle)
        return instance[property]
      },
      set: function(_target, property, value) {
        const instance = resolveInstance(bundle)
        instance[property] = value
        return true
      },
      has: function(_target, property) {
        const instance = resolveInstance(bundle)
        return property in instance 
      },
      ownKeys: function() {
        const instance = resolveInstance(bundle)
        return Reflect.ownKeys(instance as any)
      },
      getOwnPropertyDescriptor: function(_target, property) {
        const instance = resolveInstance(bundle)
        return Object.getOwnPropertyDescriptor(instance, property)
      }
    })
  })
}
    
export function createResolver<T = any>(options: ResolverOptions<T>): Resolver<T> {
  const resolution = options.resolution ?? 'eager'

  if('static' in options) {
    throw new Error('Not Implemented')
  }

  if('function' in options) {
    throw new Error('Not Implemented')
  }

  if('factory' in options && resolution === 'eager') {
    return Identity.bind(options.factory, (bundle: Bundle) => {
      return (options.factory as FactoryTarget<T & object>)(bundle)
    })
  }

  if('factory' in options && resolution === 'lazy') {
    return createProxy(Identity.bind(options.factory, (bundle: Bundle) => {
      return (options.factory as FactoryTarget<T & object>)(bundle)
    }))
  }

  if('constructor' in options && resolution === 'eager') {
    return Identity.bind(options.constructor, (bundle: Bundle) => {
      return new (options.constructor as ConstructorTarget<T & object>)(bundle)
    })
  }

  if('constructor' in options && resolution === 'lazy') {
    return createProxy(Identity.bind(options.constructor, (bundle: Bundle) => {
      return new (options.constructor as ConstructorTarget<T & object>)(bundle) 
    }), options.constructor.prototype)
  }

  throw new Error(`Could not create resolver. Invalid registration options.`)
} 

export namespace Resolver {
  export const create = createResolver
}
