import { Registration, RegistrationOptions } from './registration'
import { TargetFactory, TargetConstructor } from './target'
import { Container } from './container'
import { Resolver } from './resolver'
import { Token } from './token'

export type ModuleRegistrationVisibility = 'private' | 'public'

type ModuleRegistrationOptions = RegistrationOptions & {
  visibility?: ModuleRegistrationVisibility
}

class ModuleRegistration<R = any> extends Registration<R> {
  private static DEFAULT_VISIBILITY: ModuleRegistrationVisibility = 'public'

  public static create<R>(resolver: Resolver<R>, options?: ModuleRegistrationOptions) {
    return new ModuleRegistration(resolver, options)
  }

  public readonly visibility: ModuleRegistrationVisibility
  
  protected constructor(resolver: Resolver<R>, options?: ModuleRegistrationOptions) {
    super(resolver, options)
    this.visibility = options?.visibility ?? ModuleRegistration.DEFAULT_VISIBILITY
  }

  public clone(options?: ModuleRegistrationOptions): Registration<R> {
    return new ModuleRegistration(this.resolver, {
      lifecycle: this.lifecycle,
      bundle: options?.bundle ?? this.bundle,
      context: options?.context ?? this.context,
      visibility: options?.visibility ?? this.visibility,
    })
  }
}

export class Module {
  private readonly _container = Container.create<ModuleRegistration>()

  public get registrations(): Readonly<Registration[]> {
    return this._container.registrations.filter(registration => {
      return registration.visibility === 'public'
    })
  }

  public get entries(): Readonly<[Token, ModuleRegistration][]> {
    return this._container.entries.filter(([_token, registration]) => {
      return registration.visibility === 'public'
    })
  }

  public exposes(token: Token): boolean {
    return !!(this._container.get(token)?.visibility === 'public')
  }

  public register<R extends object>(token: Token, options: (
    ModuleRegistrationOptions & { factory: TargetFactory<R> }
  )): void 

  public register<R extends object>(token: Token, options: (
    ModuleRegistrationOptions & { constructor: TargetConstructor<R> }
  )): void 

  public register(token: Token, options: (
    | ModuleRegistrationOptions & { factory: TargetFactory }
    | ModuleRegistrationOptions & { constructor: TargetConstructor }
  )): void {
    const resolver = Resolver.create(options)
    this.setResolver(token, resolver, options)
  }

  public registerFactory(token: Token, factory: TargetFactory, options: ModuleRegistrationOptions): void {
    const resolver = Resolver.create({ factory })
    this.setResolver(token, resolver, options)
  }

  public registerConstructor(token: Token, constructor: TargetConstructor, options: ModuleRegistrationOptions): void {
    const resolver = Resolver.create({ constructor })
    this.setResolver(token, resolver, options)
  }

  protected setResolver<R extends object>(token: Token, resolver: Resolver<R>, options?: ModuleRegistrationOptions): void {
    const registration = ModuleRegistration.create(resolver, options)
    this.setRegistration(token, registration)
  }

  protected setRegistration<R extends object>(token: Token, registration: ModuleRegistration<R>): void {
    if (this._container.has(token)) {
      throw new Error(`Could not register token "${token.toString()}". Module already contains a registration assigned to the same token.`)
    }

    this._container.register(token, registration)
  }

  public resolve<T>(token: Token): T {
    if(!this._container.has(token)) {
      throw new Error(`Could not resolve token "${token.toString()}". Module does not contain a registration associted to the given token.`)
    }

    if(!this.exposes(token)) {
      throw new Error(`Could not resolve token "${token.toString()}". Module does not expose a registration associted to the given token.`)
    }
    return this._container.resolve(token)  
  }
}
