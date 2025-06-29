import { createProxy } from './proxy'
import { Bundle } from './bundle'
import { Context } from  './context'
import { Resolver } from './resolver'

type RegistrationLifecycle =
  | 'scoped' // Return an instance from the scope context if one exist
  | 'transient' // Will always return a new instance of the registration
  | 'singleton' // Will return an instance from the root context if one exist

export type RegistrationOptions = {
  bundle?: Bundle | undefined
  context?: Context | undefined,
  lifecycle?: RegistrationLifecycle,
}

export class Registration<R = any> {
  public static create<T>(resolver: Resolver<T>, options?: RegistrationOptions): Registration<T> {
    return new Registration<T>(resolver, options)
  }

  protected readonly resolver: Resolver<R>

  protected readonly context: Context

  public readonly lifecycle: RegistrationLifecycle

  protected constructor(resolver: Resolver<R>, options?: RegistrationOptions) {
    this.resolver = resolver
    this.context = options?.context ?? Context.create()
    this.lifecycle = options?.lifecycle ?? 'singleton'
  }

  public clone(options?: RegistrationOptions): Registration<R> {
    return new Registration(this.resolver, {
      lifecycle: this.lifecycle,
      context: options?.context ?? this.context,
    })
  }
  
  public resolve(options?: RegistrationOptions): R {
    const lifecycle = options?.lifecycle ?? this.lifecycle

    if(lifecycle === 'transient') {
      return this.resolver(options?.bundle ?? Bundle.create()) 
    }

    if(lifecycle === 'singleton') {
      return this.context.resolve(this.resolver, options?.bundle)
    }

    if(lifecycle === 'scoped' && options?.context) {
      return options.context.resolve(this.resolver, options?.bundle)
    }

    if(lifecycle === 'scoped' && !options?.context) {
      throw new Error('Could not resolve scoped registration. Missing resolution context')
    }

    throw new Error(`Could not resolve registration. Invalid lifecycle: ${this.lifecycle}.`)
  }
}

