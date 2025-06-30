import { TargetConstructor, TargetFactory } from 'target'
import { Identity } from './identity'
import { Bundle } from './bundle'

export type Resolver<T extends object = any> = (bundle: Bundle) => T

export type ResolverFactoryTarget<T extends object = any> = { factory: TargetFactory<T> }

export type ResolverControllerTarget<T extends object = any> = { constructor: TargetConstructor<T> }

export type ResolverTarget<T extends object = any> = ResolverFactoryTarget<T> | ResolverControllerTarget<T> 

export const ResolutionType = ['lazy', 'eager'] as const

export type ResolutionType = typeof ResolutionType[number]

export type ResolverOptions = { resolution?: ResolutionType }

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
    
export function createResolver<T extends object = any>(options: ResolverTarget<T> & ResolverOptions): Resolver<T> {
  const resolution = options.resolution ?? 'eager'

  if(!ResolutionType.includes(resolution)) {
    throw new Error('')
  }

  if(resolution === 'lazy') {
    if('factory' in options) {
      return createProxy(Identity.bind(options.factory, (bundle: Bundle) => {
        return options.factory(bundle)
      }))
    }
    
    if('constructor' in options) {
      return createProxy(Identity.bind(options.constructor, (bundle: Bundle) => {
        return new options.constructor(bundle)
      }), options.constructor.prototype)
    }
  }

  if('factory' in options) {
    return Identity.bind(options.factory, (bundle: Bundle) => {
      return options.factory(bundle)
    })
  }
  
  if('constructor' in options) {
    return Identity.bind(options.constructor, (bundle: Bundle) => {
      return new options.constructor(bundle)
    })
  }

  throw new Error(`Could not create resolver. Invalid registration options.`)
} 

export namespace Resolver {
  export const create = createResolver
}
