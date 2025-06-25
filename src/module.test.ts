import { Module } from './module'

describe('Module', () => {
  class Constructor {
    public value: number
    constructor() {
      this.value = 123
    }
  }

  const factory = () => ({
    value: 123
  })

  it('resolves a constructor-based registration', () => {
    const module = new Module()
    const token = 'token'

    module.register(token, { constructor: Constructor, lifecycle: 'transient' })

    const resolution = module.resolve<{ value: number }>(token)
    expect(resolution).toBeInstanceOf(Constructor)
    expect(resolution).toEqual({ value: 123 })
  })

  it('resolves a factory-based registration', () => {
    const module = new Module()
    const token = 'test'

    module.register(token, { factory, lifecycle: 'transient' })

    const resolution = module.resolve(token)
    expect(resolution).toEqual({ value: 123 })
  })

  it('throws when resolving an unregistered token', () => {
    const module = new Module()
    const token = 'test'

    expect(() => module.resolve(token)).toThrow(
      `Could not resolve token "${token}". Module does not contain a registration associted to the given token.`
    )
  })

  it('throws when registering the same token twice', () => {
    const module = new Module()
    const token = 'test'

    module.register(token, {
      lifecycle: 'transient',
      constructor: Constructor,
    })

    const register = () => {
      module.register(token, {
        lifecycle: 'transient',
        constructor: Constructor,
      })
    }

    expect(() => register()).toThrow(
      `Could not register token "${token}". Module already contains a registration assigned to the same token.`
    )
  })

  it('throws if no valid registration target is passed', () => {
    const module = new Module()
    const token = 'token'

    // @ts-expect-error
    expect(() => module.register(token, { lifecycle: 'transient' })).toThrow(
      "Could not create resolver. Missing a valid registration target."
    )
  })
})
