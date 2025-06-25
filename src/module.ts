import { Registration, RegistrationOptions } from './registration'
import { TargetFactory, TargetConstructor } from './target'
import { Resolver, ResolverOptions } from './resolver'
import { Container } from './container'
import { Token } from './token'

type ModuleRegistrationOptions<R = any> =
  & ResolverOptions<R>
  & RegistrationOptions

export class Module {
  private readonly container = Container.create<Registration>()

  public resolve<T>(token: Token): T {
    if(!this.container.has(token)) {
      throw new Error(`Could not resolve token "${token.toString()}". Module does not contain a registration associted to the given token.`)
    }

    return this.container.resolve(token)  
  }

  public register(token: Token, options: ModuleRegistrationOptions): void {
    const resolver = Resolver.create(options)
    this.setRegistration(token, resolver, options)
  }

  public registerFactory(
    token: Token,
    factory: TargetFactory,
    options: RegistrationOptions,
  ): void {
    const resolver = Resolver.create({ factory })
    this.setRegistration(token, resolver, options)
  }

  public registerConstructor(
    token: Token,
    constructor: TargetConstructor,
    options: RegistrationOptions,
  ): void {
    const resolver = Resolver.create({ constructor })
    this.setRegistration(token, resolver, options)
  }

  private setRegistration<R extends object>(
    token: Token, 
    resolver: Resolver<R>,
    options?: RegistrationOptions
  ): void {
    if (this.container.has(token)) {
      throw new Error(`Could not register token "${token.toString()}". Module already contains a registration assigned to the same token.`)
    }

    const registration = Registration.create(resolver, options)

    this.container.register(token, registration)
  }
}
