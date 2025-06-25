import { Resolver, createResolver } from './resolver'
import { Bundle } from './bundle'
import { TargetFactory } from './target'

describe('Resolver', () => {
  describe('createResolver', () => {
    it('creates a resolver from a factory', () => {
      const factory = () => ({
        foo: 'bar',
      })
  
      const resolver = createResolver({
        factory: factory
      })

      const resolution = resolver({})
      expect(resolution.foo).toEqual('bar')
    })
  
    it('creates a resolver from a constructor', () => {
      class Constructor {
        public foo: string
        constructor() {
          this.foo = 'bar'
        }
      }
  
      const resolver = createResolver({
        constructor: Constructor
      })

      const resolution = resolver({})
      expect(resolution).toBeInstanceOf(Constructor)
      expect(resolution.foo).toBe('bar')
    })
  
    it('throws if no valid registration target is provided', () => {
      const expectedErrorMessage = 'Could not create resolver. Missing a valid registration target.'
      // @ts-expect-error
      expect(() => createResolver({})).toThrow(expectedErrorMessage)
    })
  })

  describe('namespace', () => {
    it('exposes create function', () => {
      expect(Resolver.create).toBe(createResolver)
    })
  })
})
