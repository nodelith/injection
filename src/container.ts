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
  
  private readonly rootContext: Context

  protected readonly _registrations: Record<Token, R> = {}

  public get registrations(): ReadonlyArray<R> {
    return Object.values(this._registrations)
  }

  public get entries(): Readonly<[Token, R][]> {
    return Object.entries(this._registrations)
  }

  protected constructor(options?: ContainerDeclarationOptions) {
    this.rootContext = options?.context ?? new Context()
  }

  public resolve<R>(token: Token, options?: ContainerResolutionOptions): R | undefined {
    const resolutionEntries = this.entries.map(([token, registration]): BundleDescriptorEntry => {
      return [token, { resolve(bundle: Bundle) {
        return registration.resolve({ bundle, 
          context: options?.context 
        })
      }}]
    })

    const resolutionBundle = Bundle.create(
      ...resolutionEntries
    )

    return this._registrations[token]?.resolve({ ...options,
      bundle: Bundle.merge(
        resolutionBundle,
        options?.bundle,
      )
    })
  }

  public register<T>(token: Token, registration: R & Registration<T>): void {
    this._registrations[token] = registration.clone({
      context: this.rootContext,
    }) as R & Registration<T>
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
