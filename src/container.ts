import { Token } from './token'
import { Context } from './context'
import { Registration } from './registration'
import { Bundle, BundleDescriptorEntry } from './bundle'

export type ContainerDeclarationOptions = {
  context?: Context | undefined,
}

export type ContainerResolutionOptions = {
  context?: Context | undefined,
  bundle?: Bundle | undefined,
}

export class Container<R extends Registration = Registration> {
  public static create<R extends Registration>(options?: ContainerDeclarationOptions): Container<R> {
    return new Container(options)
  }
  
  private readonly context: Context

  private readonly registry: Map<Token, R>

  public get registrations(): ReadonlyArray<R> {
    return [...this.registry.values()]
  }

  public get entries(): Readonly<[Token, R][]> {
    return [...this.registry.entries()]
  }

  public get(token: Token): undefined | R {
    return this.registry.get(token)
  }

  public has(token: Token): boolean {
    return this.registry.has(token)
  }

  public constructor(options?: ContainerDeclarationOptions) {
    this.context = options?.context ?? Context.create()
    this.registry = new Map()
  }

  public resolve<R>(token: Token, options?: ContainerResolutionOptions): R {
    const resolutionContext = options?.context ?? Context.create()

    const resolutionEntries = this.entries.map(([token, registration]): BundleDescriptorEntry => {
      return [token, { resolve(bundle: Bundle) {
        return registration.resolve({ bundle, 
          context: resolutionContext
        })
      }}]
    })

    const resolutionBundle = Bundle.create(
      ...resolutionEntries
    )

    return this.registry.get(token)?.resolve({ ...options,
      context: resolutionContext,
      bundle: Bundle.merge(
        resolutionBundle,
        options?.bundle,
      )
    })
  }

  public register<T>(token: Token, registration: R & Registration<T>): void {
    this.registry.set(token, registration.clone({
      context: this.context,
    }) as R & Registration<T>)
  }

  public clone(options?: ContainerDeclarationOptions): Container<R> {
    const container = new Container<R>({
      context: options?.context
    })

    for (const [token, registration] of this.entries) {
      container.register(token, registration)
    }

    return container;
  }
}
