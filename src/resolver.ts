import { 
  TargetConstructorWrapper,
  TargetFactoryWrapper,
  TargetFunctionWrapper,
  TargetStaticWrapper,
  TargetStatic,
} from 'target'
import { Identity } from './identity'
import { Bundle } from './bundle'

export type ResolutionStrategy = 'eager' | 'lazy'

export type InjectionStrategy = 'positional' | 'bundle'

export type Resolver<T = any> = (bundle: Bundle) => T

export type ResolverConstructorOptions<T extends object = any> =
  (TargetConstructorWrapper<T> & {
    resolution?: ResolutionStrategy
    injection?: InjectionStrategy
  })

export type ResolverFactoryOptions<T extends object = any> =
  (TargetFactoryWrapper<T> & { 
    resolution?: ResolutionStrategy 
    injection?: InjectionStrategy
  })

export type ResolverFunctionOptions<T extends any = any> = 
  (TargetFunctionWrapper<T> & {
    resolution?: Extract<ResolutionStrategy, 'lazy'>
    injection?: InjectionStrategy
  })

export type ResolverStaticOptions<T extends any = any> = 
  (TargetStaticWrapper<T> & { 
    resolution?: Extract<ResolutionStrategy, 'lazy'>
  })

export type ResolverObjectOptions<T extends object = any> =
  | ResolverConstructorOptions<T>
  | ResolverFactoryOptions<T>

export type ResolverValueOptions<T extends any = any> = 
  | ResolverFunctionOptions<T>
  | ResolverStaticOptions<T>

export type ResolverOptions<T extends any> = T extends object 
  ? ResolverObjectOptions<T> | ResolverValueOptions<T>
    : ResolverValueOptions<T>

function extractParameters(target: any): string[] {
  const functionArgumentListRegex = new RegExp(/(\/\/.*$)|(\/\*[\s\S]*?\*\/)|(\s*=[^,)]*(('(?:\\'|[^'\r\n])*')|("(?:\\"|[^"\r\n])*"))|(\s*=[^,)]*))/gm)

  const functionArgumentIdentifiersRegex = new RegExp(/([^\s,]+)/g)

  const functionString = target.toString().replace(functionArgumentListRegex, '')

  const argumentDeclarationFirstIndex = functionString.indexOf('(') + 1

  const argumentDeclarationLastIndex = functionString.indexOf(')')

  const argumentString = functionString.slice(argumentDeclarationFirstIndex, argumentDeclarationLastIndex)

  const argumentNames = argumentString.match(functionArgumentIdentifiersRegex)

  return argumentNames ?? []
}

function createProxy<T extends object = any>(resolver: Resolver<T>, prototype?: object): Resolver<T> {
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
    const { function: target, injection = 'bundle' } = options as ResolverFunctionOptions<T>

    const parameters = injection === 'positional'
      ? extractParameters(target)
      : undefined

    if(resolution !== 'eager') {
      throw new Error(`Could not create resolver. Invalid "${resolution}" resolution option for function target.`)
    }

    return Identity.bind(target, (bundle: Bundle) => {
      return target(...parameters?.map(parameter => {
        return bundle[parameter]
      }) ?? [bundle])
    })
  }

  if(Object.prototype.hasOwnProperty.call(options, 'factory') && 'factory' in options && resolution === 'eager') {
    const { factory: target, injection = 'bundle' } = options as ResolverFactoryOptions<T & object>

    const parameters = injection === 'positional'
      ? extractParameters(target)
      : undefined

    return Identity.bind(target, (bundle: Bundle) => {
      return target(...parameters?.map(parameter => {
        return bundle[parameter]
      }) ?? [bundle])
    })
  }

  if(Object.prototype.hasOwnProperty.call(options, 'factory') && 'factory' in options && resolution === 'lazy') {
    const { factory: target, injection = 'bundle' } = options as ResolverFactoryOptions<T & object>

    const params = injection === 'positional'
      ? extractParameters(target)
      : undefined

    return createProxy(Identity.bind(target, (bundle: Bundle) => {
      return target(...params?.map(parameter => {
        return bundle[parameter]
      }) ?? [bundle])
    }))
  }

  if(Object.prototype.hasOwnProperty.call(options, 'constructor') && 'constructor' in options && resolution === 'eager') {
    const { constructor: target, injection = 'bundle' } = options as ResolverConstructorOptions<T & object>

    const params = injection === 'positional'
      ? extractParameters(target)
      : undefined

    return Identity.bind(target, (bundle: Bundle) => {
      return new target(...params?.map(parameter => {
        return bundle[parameter]
      }) ?? [bundle])
    })
  }

  if(Object.prototype.hasOwnProperty.call(options, 'constructor') && 'constructor' in options && resolution === 'lazy') {
    const { constructor: target, injection = 'bundle' } = options as ResolverConstructorOptions<T & object>

    const params = injection === 'positional'
      ? extractParameters(target)
      : undefined

    return createProxy(Identity.bind(target, (bundle: Bundle) => {
      return new target(...params?.map(parameter => {
        return bundle[parameter]
      }) ?? [bundle]) 
    }), target.prototype)
  }

  throw new Error(`Could not create resolver. Invalid registration options.`)
} 

export namespace Resolver {
  export const create = createResolver
}
