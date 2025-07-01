import { 
  TargetConstructor,
  TargetConstructorWrapper,
  TargetFactory,
  TargetFactoryWrapper,
  TargetFunction,
  TargetFunctionWrapper,
  TargetStatic,
  TargetStaticWrapper
} from 'target'
import { Identity } from './identity'
import { Bundle } from './bundle'

export type ResolutionStrategy = 'eager' | 'lazy' 

export type Resolver<T = any> = (bundle: Bundle) => T

export type ResolverConstructorOptions<T extends object = any> =
  (TargetConstructorWrapper<T> & { resolution?: ResolutionStrategy })

export type ResolverFactoryOptions<T extends object = any> =
  (TargetFactoryWrapper<T> & { resolution?: ResolutionStrategy })

export type ResolverFunctionOptions<T extends any = any> = 
  (TargetFunctionWrapper<T> & { resolution?: ResolutionStrategy & 'lazy' })

export type ResolverStaticOptions<T extends any = any> = 
  (TargetStaticWrapper<T> & { resolution?: ResolutionStrategy & 'lazy' })

export type ResolverObjectOptions<T extends object = any> =
  | ResolverConstructorOptions<T>
  | ResolverFactoryOptions<T>

export type ResolverValueOptions<T extends any = any> = 
  | ResolverFunctionOptions<T>
  | ResolverStaticOptions<T>

export type ResolverOptions<T extends any> = T extends object 
  ? ResolverObjectOptions<T> | ResolverValueOptions<T>
    : ResolverValueOptions<T>

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

  if(Object.prototype.hasOwnProperty.call(options, 'static') && 'static' in options ) {
    if(resolution !== 'eager') {
      throw new Error(`Could not create resolver. Invalid "${resolution}" resolution option for static target.`)
    }

    return (_bundle: Bundle) => {
      return options.static as TargetStatic<T>
    }
  }


  if(Object.prototype.hasOwnProperty.call(options, 'function') && 'function' in options ) {
    if(resolution !== 'eager') {
      throw new Error(`Could not create resolver. Invalid "${resolution}" resolution option for function target.`)
    }

    return Identity.bind(options.function, (bundle: Bundle) => {
      return (options.function as TargetFunction<T>)(bundle)
    })
  }

  if(Object.prototype.hasOwnProperty.call(options, 'factory') && 'factory' in options && resolution === 'eager') {
    return Identity.bind(options.factory, (bundle: Bundle) => {
      return (options.factory as TargetFactory<T & object>)(bundle)
    })
  }

  if(Object.prototype.hasOwnProperty.call(options, 'factory') && 'factory' in options && resolution === 'lazy') {
    return createProxy(Identity.bind(options.factory, (bundle: Bundle) => {
      return (options.factory as TargetFactory<T & object>)(bundle)
    }))
  }

  if(Object.prototype.hasOwnProperty.call(options, 'constructor') && 'constructor' in options && resolution === 'eager') {
    return Identity.bind(options.constructor, (bundle: Bundle) => {
      return new (options.constructor as TargetConstructor<T & object>)(bundle)
    })
  }

  if(Object.prototype.hasOwnProperty.call(options, 'constructor') && 'constructor' in options && resolution === 'lazy') {
    return createProxy(Identity.bind(options.constructor, (bundle: Bundle) => {
      return new (options.constructor as TargetConstructor<T & object>)(bundle) 
    }), options.constructor.prototype)
  }

  throw new Error(`Could not create resolver. Invalid registration options.`)
} 

export namespace Resolver {
  export const create = createResolver
}
