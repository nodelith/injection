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

  it('registers and resolves a singleton value', () => {
    const container = Container.create()
    container.register(token_a, Registration.create(value(123)))

    const result = container.resolve(token_a)
    expect(result).toBe(123)
  })

  it('registers and resolves a dependent target via bundle injection', () => {
    const container = Container.create()
    container.register(token_a, Registration.create(value(2)))
    container.register(token_b, Registration.create(value(3)))
    container.register(token_c, Registration.create(sum(token_a, token_b)))

    const result = container.resolve(token_c)
    expect(result).toBe(5)
  })

  it('reuses instance from context for singleton lifecycle', () => {
    const context = new Context()

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

  it('throws if resolving scoped registration without context', () => {
    const container = Container.create()

    container.register(token_a, Registration.create(() => 1, {
      lifecycle: 'scoped'
    }))

    expect(() => container.resolve(token_a)).toThrow(/Missing resolution context/)
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

  it('uses resolution context when resolving scoped lifecycle', () => {
    const targetMock = jest.fn(() => ({ value: 'scoped-value' }))

    const rootContext = new Context()

    const rootContextSpy = jest.spyOn(rootContext, 'resolve')

    const resolutionContext = new Context()

    const resolutionContextSpy = jest.spyOn(resolutionContext, 'resolve')

    const container = Container.create({ context: rootContext })
  
    container.register(token_a, Registration.create(targetMock, {
      lifecycle: 'scoped'
    }))

    expect(resolutionContextSpy).toHaveBeenCalledTimes(0)
    expect(rootContextSpy).toHaveBeenCalledTimes(0)
    expect(targetMock).toHaveBeenCalledTimes(0)
  
    const result_0 = container.resolve(token_a, { context: resolutionContext })
    expect(resolutionContextSpy).toHaveBeenCalledTimes(1)
    expect(rootContextSpy).toHaveBeenCalledTimes(0)
    expect(targetMock).toHaveBeenCalledTimes(1)

    const result_1 = container.resolve(token_a, { context: resolutionContext })
    expect(resolutionContextSpy).toHaveBeenCalledTimes(2)
    expect(rootContextSpy).toHaveBeenCalledTimes(0)
    expect(targetMock).toHaveBeenCalledTimes(1)
  
    expect(result_0).toEqual({ value: 'scoped-value' })
    expect(result_0).toBe(result_1)
  })

  it('uses root context when resolving singleton lifecycle', () => {
    const targetMock = jest.fn(() => ({ value: 'singleton-value' }))

    const rootContext = new Context()

    const rootContextSpy = jest.spyOn(rootContext, 'resolve')

    const resolutionContext = new Context()

    const resolutionContextSpy = jest.spyOn(resolutionContext, 'resolve')

    const container = Container.create({ context: rootContext })
  
    container.register(token_a, Registration.create(targetMock, {
      lifecycle: 'singleton'
    }))

    expect(resolutionContextSpy).toHaveBeenCalledTimes(0)
    expect(rootContextSpy).toHaveBeenCalledTimes(0)
    expect(targetMock).toHaveBeenCalledTimes(0)
  
    const result_0 = container.resolve(token_a, { context: resolutionContext })
    expect(resolutionContextSpy).toHaveBeenCalledTimes(0)
    expect(rootContextSpy).toHaveBeenCalledTimes(1)
    expect(targetMock).toHaveBeenCalledTimes(1)

    const result_1 = container.resolve(token_a, { context: resolutionContext })
    expect(resolutionContextSpy).toHaveBeenCalledTimes(0)
    expect(rootContextSpy).toHaveBeenCalledTimes(2)
    expect(targetMock).toHaveBeenCalledTimes(1)
  
    expect(result_0).toEqual({ value: 'singleton-value' })
    expect(result_0).toBe(result_1)
  })

  it('ignores contexts when resolving transient lifecycle', () => {
    const targetMock = jest.fn(() => ({ value: 'transient-value' }))

    const rootContext = new Context()

    const rootContextSpy = jest.spyOn(rootContext, 'resolve')

    const resolutionContext = new Context()

    const resolutionContextSpy = jest.spyOn(resolutionContext, 'resolve')

    const container = Container.create({ context: rootContext })
  
    container.register(token_a, Registration.create(targetMock, {
      lifecycle: 'transient'
    }))

    expect(resolutionContextSpy).toHaveBeenCalledTimes(0)
    expect(rootContextSpy).toHaveBeenCalledTimes(0)
    expect(targetMock).toHaveBeenCalledTimes(0)
  
    const result_0 = container.resolve(token_a, { context: resolutionContext })
    expect(resolutionContextSpy).toHaveBeenCalledTimes(0)
    expect(rootContextSpy).toHaveBeenCalledTimes(0)
    expect(targetMock).toHaveBeenCalledTimes(1)

    const result_1 = container.resolve(token_a, { context: resolutionContext })
    expect(resolutionContextSpy).toHaveBeenCalledTimes(0)
    expect(rootContextSpy).toHaveBeenCalledTimes(0)
    expect(targetMock).toHaveBeenCalledTimes(2)
  
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
})
