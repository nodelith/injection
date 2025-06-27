import { Container } from './container'
import { Registration } from './registration'
import { Context } from './context'
import { Token } from './token'

describe('Container (integration)', () => {
  const token_a: Token = 'a'
  const token_b: Token = 'b'
  const token_c: Token = 'c'

  const value = <T>(val: T): (() => T) => () => val

  const sum = (a: Token, b: Token) => (bundle: Record<Token, any>) => bundle[a] + bundle[b]

  it('returns the registration for a known token', () => {
    const container = Container.create()
    const token = 'known'

    container.register(token, Registration.create(() => {}))
    expect(container.get(token)).toBeInstanceOf(Registration)
  })

  it('returns undefined for an unknown token', () => {
    const container = Container.create()
    const token = 'unknown'

    expect(container.get(token)).toBeUndefined()
  })

  it('registers and resolves a singleton value', () => {
    const container = Container.create()
    container.register(token_a, Registration.create(value(123)))

    const result = container.resolve(token_a)
    expect(result).toBe(123)
  })

  it('registers and resolves a dependent resolver via bundle injection', () => {
    const container = Container.create()
    container.register(token_a, Registration.create(value(2)))
    container.register(token_b, Registration.create(value(3)))
    container.register(token_c, Registration.create(sum(token_a, token_b)))

    const result = container.resolve(token_c)
    expect(result).toBe(5)
  })

  it('reuses instance from context for singleton lifecycle', () => {
    const context = Context.create()

    const spy = jest.spyOn(context, 'resolve')
  
    const container = Container.create({ context })
  
    container.register(token_a, Registration.create(() => ({}), {
      context,
      lifecycle: 'singleton',
    }))
  
    expect(spy).not.toHaveBeenCalled()

    const resolution_0 = container.resolve(token_a)
    expect(spy).toHaveBeenCalledTimes(1)

    const resolution_1 = container.resolve(token_a)
    expect(spy).toHaveBeenCalledTimes(2)
    
    expect(resolution_0).toBe(resolution_1)
  })

  it('creates a new instance for transient lifecycle', () => {
    const container = Container.create()

    container.register(token_a, Registration.create(() => ({}), { lifecycle: 'transient' }))

    const resolution_0 = container.resolve(token_a)
    const resolution_1 = container.resolve(token_a)

    expect(resolution_0).not.toBe(resolution_1)
  })

  it('injects internal registrations', () => {
    const container = Container.create()

    container.register(token_a, Registration.create((bundle) => {
      return `${bundle[token_b]}-${bundle[token_c]}`
    }))

    container.register(token_b, Registration.create(() => 'prefix'))
    container.register(token_c, Registration.create(() => 'suffix'))

    const resolution = container.resolve(token_a, {
      bundle: { [token_b]: 'suffix' },
    })

    expect(resolution).toBe('prefix-suffix')
  })

  it('injects registrations from external bundle', () => {
    const container = Container.create()

    container.register(token_a, Registration.create((bundle) => {
      return `${bundle[token_b]}-${bundle[token_c]}`
    }))

    const resolution = container.resolve(token_a, {
      bundle: { 
        [token_b]: 'prefix',
        [token_c]: 'suffix',
      },
    })

    expect(resolution).toBe('prefix-suffix')
  })

  it('resolves with injected external bundle', () => {
    const container = Container.create()

    container.register(token_a, Registration.create((bundle) => 'prefix-' + bundle[token_b]))

    const result = container.resolve(token_a, {
      bundle: { [token_b]: 'suffix' },
    })

    expect(result).toBe('prefix-suffix')
  })

  it('uses passed resolution context when resolving scoped lifecycle', () => {
    const resolverMock = jest.fn(() => ({ value: 'scoped-value' }))

    const rootContext = Context.create()

    const rootContextSpy = jest.spyOn(rootContext, 'resolve')

    const resolutionContext = Context.create()

    const resolutionContextSpy = jest.spyOn(resolutionContext, 'resolve')

    const container = Container.create({ context: rootContext })
  
    container.register(token_a, Registration.create(resolverMock, {
      lifecycle: 'scoped'
    }))

    expect(resolutionContextSpy).toHaveBeenCalledTimes(0)
    expect(rootContextSpy).toHaveBeenCalledTimes(0)
    expect(resolverMock).toHaveBeenCalledTimes(0)
  
    const result_0 = container.resolve(token_a, { context: resolutionContext })
    expect(resolutionContextSpy).toHaveBeenCalledTimes(1)
    expect(rootContextSpy).toHaveBeenCalledTimes(0)
    expect(resolverMock).toHaveBeenCalledTimes(1)

    const result_1 = container.resolve(token_a, { context: resolutionContext })
    expect(resolutionContextSpy).toHaveBeenCalledTimes(2)
    expect(rootContextSpy).toHaveBeenCalledTimes(0)
    expect(resolverMock).toHaveBeenCalledTimes(1)
  
    expect(result_0).toEqual({ value: 'scoped-value' })
    expect(result_0).toBe(result_1)
  })

  it('uses new resolution context when resolving scoped lifecycle', () => {
    const resolverMock = jest.fn(() => ({ value: 'scoped-value' }))

    const rootContext = Context.create()

    const rootContextSpy = jest.spyOn(rootContext, 'resolve')
    const container = Container.create({ context: rootContext })
  
    container.register(token_a, Registration.create(resolverMock, {
      lifecycle: 'scoped'
    }))

    expect(rootContextSpy).toHaveBeenCalledTimes(0)
    expect(resolverMock).toHaveBeenCalledTimes(0)
  
    const result_0 = container.resolve(token_a)
    expect(rootContextSpy).toHaveBeenCalledTimes(0)
    expect(resolverMock).toHaveBeenCalledTimes(1)

    const result_1 = container.resolve(token_a)
    expect(rootContextSpy).toHaveBeenCalledTimes(0)
    expect(resolverMock).toHaveBeenCalledTimes(2)
  
    expect(result_0).toEqual({ value: 'scoped-value' })
    expect(result_0).not.toBe(result_1)
    expect(result_0).toEqual(result_1)
  })

  it('uses root context when resolving singleton lifecycle', () => {
    const resolverMock = jest.fn(() => ({ value: 'singleton-value' }))

    const rootContext = Context.create()

    const rootContextSpy = jest.spyOn(rootContext, 'resolve')

    const resolutionContext = Context.create()

    const resolutionContextSpy = jest.spyOn(resolutionContext, 'resolve')

    const container = Container.create({ context: rootContext })
  
    container.register(token_a, Registration.create(resolverMock, {
      lifecycle: 'singleton'
    }))

    expect(resolutionContextSpy).toHaveBeenCalledTimes(0)
    expect(rootContextSpy).toHaveBeenCalledTimes(0)
    expect(resolverMock).toHaveBeenCalledTimes(0)
  
    const result_0 = container.resolve(token_a, { context: resolutionContext })
    expect(resolutionContextSpy).toHaveBeenCalledTimes(0)
    expect(rootContextSpy).toHaveBeenCalledTimes(1)
    expect(resolverMock).toHaveBeenCalledTimes(1)

    const result_1 = container.resolve(token_a, { context: resolutionContext })
    expect(resolutionContextSpy).toHaveBeenCalledTimes(0)
    expect(rootContextSpy).toHaveBeenCalledTimes(2)
    expect(resolverMock).toHaveBeenCalledTimes(1)
  
    expect(result_0).toEqual({ value: 'singleton-value' })
    expect(result_0).toBe(result_1)
  })

  it('ignores contexts when resolving transient lifecycle', () => {
    const resolverMock = jest.fn(() => ({ value: 'transient-value' }))

    const rootContext = Context.create()

    const rootContextSpy = jest.spyOn(rootContext, 'resolve')

    const resolutionContext = Context.create()

    const resolutionContextSpy = jest.spyOn(resolutionContext, 'resolve')

    const container = Container.create({ context: rootContext })
  
    container.register(token_a, Registration.create(resolverMock, {
      lifecycle: 'transient'
    }))

    expect(resolutionContextSpy).toHaveBeenCalledTimes(0)
    expect(rootContextSpy).toHaveBeenCalledTimes(0)
    expect(resolverMock).toHaveBeenCalledTimes(0)
  
    const result_0 = container.resolve(token_a, { context: resolutionContext })
    expect(resolutionContextSpy).toHaveBeenCalledTimes(0)
    expect(rootContextSpy).toHaveBeenCalledTimes(0)
    expect(resolverMock).toHaveBeenCalledTimes(1)

    const result_1 = container.resolve(token_a, { context: resolutionContext })
    expect(resolutionContextSpy).toHaveBeenCalledTimes(0)
    expect(rootContextSpy).toHaveBeenCalledTimes(0)
    expect(resolverMock).toHaveBeenCalledTimes(2)
  
    expect(result_0).toEqual({ value: 'transient-value' })
    expect(result_0).not.toBe(result_1)
  })

  it('returns entries and registration list correctly', () => {
    const container = Container.create()
    const registration = Registration.create(value('foo'))

    container.register(token_a, registration)

    expect(container.entries).toEqual([[token_a, expect.any(Registration)]])
    expect(container.registrations).toEqual([registration])
  })

  it('clones the container and maintains resolution', () => {
    const container = Container.create()
    container.register(token_a, Registration.create(value('x')))

    const cloned = container.clone()

    expect(cloned).not.toBe(container)
    expect(cloned.resolve(token_a)).toBe('x')
  })

  it('returns false for unknown tokens', () => {
    const container = Container.create()
    expect(container.has(token_a)).toBe(false)
  })

  it('returns true for registered tokens', () => {
    const container = Container.create()
    container.register(token_a, Registration.create(() => ({})))
    expect(container.has(token_a)).toBe(true)
  })

  it('returns false after cloning if token was not registered', () => {
    const container = Container.create()
    const clone = container.clone()
    expect(clone.has(token_a)).toBe(false)
  })

  it('returns true in cloned container for copied registrations', () => {
    const container = Container.create()
    container.register(token_a, Registration.create(() => ({})))
    const clone = container.clone()
    expect(clone.has(token_a)).toBe(true)
  })
})
