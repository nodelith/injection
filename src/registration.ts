import { Bundle } from './bundle'
import { Target } from './target'
import { Context } from  './context'

type RegistrationLifecycle =
  | 'scoped' // Return an instance from the scope context if one exist
  | 'transient' // Will always return a new instance of the registration target
  | 'singleton' // Will return an instance from the root context if one exist

export type RegistrationOptions = {
  bundle?: Bundle | undefined
  context?: Context | undefined,
  lifecycle?: RegistrationLifecycle,
}

export class Registration<R = any> {
  public static create<R>(target: Target<R>, options?: RegistrationOptions) {
    return new Registration<R>(target, options)
  }

  private readonly target: Target<R>

  private readonly bundle: Bundle

  private readonly context: Context

  private readonly lifecycle: RegistrationLifecycle

  protected constructor(target: Target<R>, options?: RegistrationOptions) {
    this.target = target
    this.bundle = options?.bundle ?? {}
    this.context = options?.context ?? new Context()
    this.lifecycle = options?.lifecycle ?? 'singleton'
  }

  public clone(options?: RegistrationOptions): Registration<R> {
    return new Registration(this.target, {
      bundle: options?.bundle ?? this.bundle,
      context: options?.context ?? this.context, 
      lifecycle: this.lifecycle,
    })
  }
  
  public resolve(options?: RegistrationOptions): R {
    const lifecycle = options?.lifecycle ?? this.lifecycle

    if(lifecycle === 'transient') {
      return this.target(options?.bundle ?? {}) 
    }

    if(lifecycle === 'singleton') {
      return this.context.resolve(this.target, options?.bundle)
    }

    if(lifecycle === 'scoped' && options?.context) {
      return options.context.resolve(this.target, options.bundle)
    }

    if(lifecycle === 'scoped' && !options?.context) {
      throw new Error('Could not resolve scoped registration. Missing resolution context')
    }

    throw new Error(`Could not resolve registration. Invalid lifecycle: ${this.lifecycle}.`)
  }
}
