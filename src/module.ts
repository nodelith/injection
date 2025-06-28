import { Container, ContainerDeclarationOptions, ContainerResolutionOptions } from './container'
import { Registration, RegistrationOptions } from './registration'
import { TargetFactory, TargetConstructor } from './target'
import { Bundle, BundleDescriptorEntry } from './bundle'
import { Resolver } from './resolver'
import { Context } from './context'
import { Token } from './token'

export type ModuleDeclarationOptions = ContainerDeclarationOptions

export type ModuleResolutionOptions = ContainerResolutionOptions

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
  private readonly _modules = new Set<Module>()
  
  private readonly _container: Container<ModuleRegistration>
  
  private readonly _context: Context

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

  public get modules(): Module[] {
    return [...this._modules]
  }

  public constructor(options?: ModuleDeclarationOptions) {
    this._context = options?.context ?? Context.create()
    this._container = Container.create( {context: this._context })
  }

  public exposes(token: Token): boolean {
    return !!(this._container.get(token)?.visibility === 'public')
  }

  public import (module: Module): void {
    const clone = module.clone({ context: this._context })
    this._modules.add(clone)
  }

  public clone(options?: ModuleDeclarationOptions): Module {
    const module = new Module(options)
    module.setRegistrations(...this._container.entries)
    return module
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

  public registerFactory(token: Token, factory: TargetFactory, options?: ModuleRegistrationOptions): void {
    const resolver = Resolver.create({ factory })
    this.setResolver(token, resolver, options)
  }

  public registerConstructor(token: Token, constructor: TargetConstructor, options?: ModuleRegistrationOptions): void {
    const resolver = Resolver.create({ constructor })
    this.setResolver(token, resolver, options)
  }

  protected setResolvers<R extends object>(...entries: [token: Token, resolver: Resolver<R>, options?: ModuleRegistrationOptions][]): void {
    entries.forEach(entry => this.setResolver(...entry))
  }

  protected setResolver<R extends object>(token: Token, resolver: Resolver<R>, options?: ModuleRegistrationOptions): void {
    const registration = ModuleRegistration.create(resolver, options)
    this.setRegistration(token, registration)
  }

  protected setRegistrations<R extends object>(...entries: [token: Token, registration: ModuleRegistration<R>][]): void {
    entries.forEach(entry => this.setRegistration(...entry))
  }
  
  protected setRegistration<R extends object>(token: Token, registration: ModuleRegistration<R>): void {
    if (this._container.has(token)) {
      throw new Error(`Could not register token "${token.toString()}". Module already contains a registration assigned to the same token.`)
    }

    this._container.register(token, registration)
  }

  public resolve<T>(token: Token, options?: ModuleResolutionOptions): T {
    if(!this._container.has(token)) {
      throw new Error(`Could not resolve token "${token.toString()}". Module does not contain a registration associted to the given token.`)
    }

    if(!this.exposes(token)) {
      throw new Error(`Could not resolve token "${token.toString()}". Module does not expose a registration associted to the given token.`)
    }

    const resolutionContext = options?.context ?? Context.create()

    const resolutionEntries = this.modules.flatMap((module): BundleDescriptorEntry[] => {
      return module.entries.map(([token, registration]): BundleDescriptorEntry => [token, {
        resolve: (bundle: Bundle) => registration.resolve({ 
          context: options?.context ?? Context.create(),
          bundle 
        })
      }])
    })

    const resolutionBundle = Bundle.create(...resolutionEntries)

    return this._container.resolve(token, {
      context: resolutionContext,
      bundle: resolutionBundle,
    })
  }
}
