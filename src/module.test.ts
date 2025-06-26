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

  describe('resolve', () => {
    it('throws when resolving an unregistered token', () => {
      const module = new Module()
      const token = 'unregistered'

      expect(() => module.resolve(token)).toThrow(
        `Could not resolve token "${token}". Module does not contain a registration associted to the given token.`
      )
    })

    it('throws when resolving a private registration', () => {
      const module = new Module()
      const token = 'token'

      module.register(token, {
        constructor: Constructor,
        lifecycle: 'transient',
        visibility: 'private',
      })

      expect(() => module.resolve(token)).toThrow(
        `Could not resolve token "${token.toString()}". Module does not expose a registration associted to the given token.`
      )
    })
  })
  
  describe('exposes', () => {
    it('returns true for a "public" registration', () => {
      const module = new Module()
      const token = 'token'
  
      module.register(token, {
        constructor: Constructor,
        lifecycle: 'transient',
        visibility: 'public',
      })
  
      expect(module.exposes(token)).toBe(true)
    })
  
    it('returns false for a "private" registration', () => {
      const module = new Module()
      const token = 'token'
  
      module.register(token, {
        constructor: Constructor,
        lifecycle: 'transient',
        visibility: 'private',
      })
  
      expect(module.exposes(token)).toBe(false)
    })
  })

  describe('register', () => {
    it('uses implicit "public" visibility as default visibility', () => {
      const module = new Module()
      const token = 'token'

      module.register(token, {
        constructor: Constructor,
        lifecycle: 'transient',
      })

      expect(module.exposes(token)).toBe(true)
      expect(module.registrations.length).toBe(1)
    })

    it('uses explicit "public" visibility', () => {
      const module = new Module()
      const token = 'token'

      module.register(token, {
        constructor: Constructor,
        lifecycle: 'transient',
        visibility: 'public',
      })

      expect(() => module.resolve(token)).not.toThrow()
      expect(module.registrations.length).toBe(1)
    })

    it('uses explicit "private" visibility', () => {
      const module = new Module()
      const token = 'token'

      module.register(token, {
        constructor: Constructor,
        lifecycle: 'transient',
        visibility: 'private',
      })

      expect(module.registrations.length).toBe(0)
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

    it('throws if no valid registration target is not passed', () => {
      const module = new Module()
      const token = 'token'

      // @ts-expect-error
      expect(() => module.register(token, { lifecycle: 'transient' })).toThrow(
        "Could not create resolver. Missing a valid registration target."
      )
    })
  })

  describe('registerFactory', () => {
    it('registers a factory and resolves it', () => {
      const module = new Module()
      const token = 'factory'

      module.registerFactory(token, factory, {
        lifecycle: 'transient',
        visibility: 'public',
      })

      const resolution = module.resolve(token)
      expect(resolution).toEqual({ value: 123 })
      expect(module.registrations.length).toBe(1)
    })
  })

  describe('registerConstructor', () => {
    it('registers a constructor and resolves it', () => {
      const module = new Module()
      const token = 'constructor'

      module.registerConstructor(token, Constructor, {
        lifecycle: 'transient',
        visibility: 'public',
      })

      const resolution = module.resolve(token)
      expect(resolution).toBeInstanceOf(Constructor)
      expect(resolution).toEqual({ value: 123 })
      expect(module.registrations.length).toBe(1)
    })
  })

  describe('registrations', () => {
    it('returns only public registrations', () => {
      const module = new Module()

      module.register('token_a', {
        constructor: Constructor,
        lifecycle: 'transient',
        visibility: 'public',
      })

      module.register('token_b', {
        constructor: Constructor,
        lifecycle: 'transient',
        visibility: 'private',
      })

      const visible = module.registrations
      expect(visible).toHaveLength(1)
    })
  })
})
