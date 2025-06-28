import { Resolver, createResolver } from './resolver'
import { Identity } from './identity'

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

    it('binds constructor identity to resolver', () => {
      class TestClass {
        value = 'constructed'
        constructor(_bundle: any) {}
      }
  
      const resolver = createResolver({ constructor: TestClass })
      const result = resolver({})
  
      expect(result).toBeInstanceOf(TestClass)
      expect(result.value).toBe('constructed')
  
      const constructorId = Identity.extract(TestClass)
      const resolverId = Identity.extract(resolver)
  
      expect(resolverId).toBe(constructorId)
    })

    it('binds factory identity to resolver', () => {
      const factory = () => ({})
      const resolver = createResolver({ factory })

      const factoryId = Identity.extract(factory)
      const resolverId = Identity.extract(resolver)

      expect(resolverId).toBe(factoryId)
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
