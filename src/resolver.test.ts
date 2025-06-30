import { createResolver } from './resolver'
import { Identity } from './identity'

describe('Resolver', () => {
  it('creates a lazy resolver from a factory', () => {
    const target = jest.fn(() => ({ foo: 'bar' }))

    const resolver = createResolver({
      factory: target,
      resolution: 'lazy'
    })

    const result = resolver({})
    expect(result.foo).toEqual('bar')
  })

  it('creates a lazy resolver from a constructor', () => {
    class Target { foo = 'bar' }

    const resolver = createResolver({
      constructor: Target,
      resolution: 'lazy'
    })

    const result = resolver({})
    expect(result.foo).toBe('bar')
    expect(result).toBeInstanceOf(Target)
  })

  it('creates an eager resolver from a factory', () => {
    const target = jest.fn(() => ({ foo: 'bar' }))

    const resolver = createResolver({ 
      factory: target,
      resolution: 'eager'
    })

    const result = resolver({})
    expect(result.foo).toEqual('bar')
  })

  it('creates an eager resolver from a constructor', () => {
    class Target { foo = 'bar' }

    const resolver = createResolver({
      constructor: Target,
      resolution: 'eager'
    })

    const result = resolver({})
    expect(result.foo).toBe('bar')
    expect(result).toBeInstanceOf(Target)
  })

  it('binds constructor identity to lazy resolver', () => {
    class Target { foo = 'bar' }

    const resolver = createResolver({ 
      constructor: Target,
      resolution: 'lazy'
    })

    const result = resolver({})
    expect(result.foo).toBe('bar')
    expect(result).toBeInstanceOf(Target)

    const targetId = Identity.extract(Target)
    const resolverId = Identity.extract(resolver)
    expect(resolverId).toBe(targetId)
  })

  it('binds factory identity to lazy resolver', () => {
    const target = jest.fn(() => ({ foo: 'bar' }))

    const resolver = createResolver({ 
      factory: target,
      resolution: 'lazy'
    })

    const targetId = Identity.extract(target)
    const resolverId = Identity.extract(resolver)
    expect(resolverId).toBe(targetId)
  })

  it('binds constructor identity to eager resolver', () => {
    class Target { foo = 'bar' }

    const resolver = createResolver({ 
      constructor: Target,
      resolution: 'eager'
    })

    const result = resolver({})
    expect(result).toBeInstanceOf(Target)
    expect(result.foo).toBe('bar')

    const targetId = Identity.extract(Target)
    const resolverId = Identity.extract(resolver)
    expect(resolverId).toBe(targetId)
  })

  it('binds factory identity to eager resolver', () => {
    const target = jest.fn(() => ({ foo: 'bar' }))

    const resolver = createResolver({ 
      factory: target,
      resolution: 'eager'
    })

    const factoryId = Identity.extract(target)
    const resolverId = Identity.extract(resolver)
    expect(resolverId).toBe(factoryId)
  })

  it('initializes lazy factory resolver instance only when accessed', () => {
    const target = jest.fn(() => ({ foo: 'bar' }))

    const resolver = createResolver({
      factory: target,
      resolution: 'lazy'
    })

    const result = resolver({})
    expect(target).toHaveBeenCalledTimes(0)
    
    result.foo
    expect(target).toHaveBeenCalledTimes(1)
    
    result.foo
    expect(target).toHaveBeenCalledTimes(1)
  })

  it('initializes lazy constructor resolver instance only when accessed', () => {
    const counter = jest.fn();

    class Target {
      foo = 'bar';
      constructor() {
        counter()
      }
    }
  
    const resolver = createResolver({ 
      constructor: Target,
      resolution: 'lazy'
    });
  
    const result = resolver({}) as Target;
    expect(counter).toHaveBeenCalledTimes(0);
  
    result.foo;
    expect(counter).toHaveBeenCalledTimes(1);
  
    result.foo;
    expect(counter).toHaveBeenCalledTimes(1);
  })

  it('supports property existence check in lazy factory resolver', () => {
    const target = jest.fn(() => ({ foo: 'bar' }))

    const resolver = createResolver({
      factory: target,
      resolution: 'lazy'
    })

    const result = resolver({})
    expect('foo' in result).toBe(true)
    expect('nonexistent' in result).toBe(false)
  })

  it('supports property existence check in eager factory resolver', () => {
    const target = jest.fn(() => ({ foo: 'bar' }))

    const resolver = createResolver({
      factory: target,
      resolution: 'eager'
    })

    const result = resolver({})
    expect('foo' in result).toBe(true)
    expect('nonexistent' in result).toBe(false)
  })

  it('supports property existence check in lazy constructor resolver', () => {
    class Target { foo = 'bar' }

    const resolver = createResolver({
      constructor: Target,
      resolution: 'lazy'
    })

    const result = resolver({})
    expect('foo' in result).toBe(true)
    expect('nonexistent' in result).toBe(false)
  })

  it('supports property existence check in eager constructor resolver', () => {
    class Target { foo = 'bar' }

    const resolver = createResolver({
      constructor: Target,
      resolution: 'eager'
    })

    const result = resolver({})
    expect('foo' in result).toBe(true)
    expect('nonexistent' in result).toBe(false)
  })

  it('supports Object.keys enumeration in lazy factory resolver', () => {
    const target = jest.fn(() => ({ foo: 'bar' }))

    const resolver = createResolver({
      factory: target,
      resolution: 'lazy'
    })

    const result = resolver({})
    expect(Object.keys(result)).toEqual(['foo'])
  })

  it('supports Object.keys enumeration in eager factory resolver', () => {
    const target = jest.fn(() => ({ foo: 'bar' }))

    const resolver = createResolver({
      factory: target,
      resolution: 'eager'
    })

    const result = resolver({})
    expect(Object.keys(result)).toEqual(['foo'])
  })

  it('supports Object.keys enumeration in lazy constructor resolver', () => {
    class Target { foo = 'bar' }

    const resolver = createResolver({
      constructor: Target,
      resolution: 'lazy'
    })

    const result = resolver({})
    expect(Object.keys(result)).toEqual(['foo'])
  })

  it('supports Object.keys enumeration in eager constructor resolver', () => {
    class Target { foo = 'bar' }

    const resolver = createResolver({
      constructor: Target,
      resolution: 'eager'
    })

    const result = resolver({})
    expect(Object.keys(result)).toEqual(['foo'])
  })

  it('supports Object.getOwnPropertyDescriptor in lazy factory resolver', () => {
    const target = jest.fn(() => ({ foo: 'bar' }))

    const resolver = createResolver({
      factory: target,
      resolution: 'lazy'
    })

    const result = resolver({})
    const descriptor = Object.getOwnPropertyDescriptor(result, 'foo')
    expect(descriptor).toBeDefined()
    expect(descriptor!.value).toBe('bar')
    expect(descriptor!.writable).toBe(true)
  })

  it('supports Object.getOwnPropertyDescriptor in eager factory resolver', () => {
    const target = jest.fn(() => ({ foo: 'bar' }))

    const resolver = createResolver({
      factory: target,
      resolution: 'lazy'
    })

    const result = resolver({})
    const descriptor = Object.getOwnPropertyDescriptor(result, 'foo')
    expect(descriptor).toBeDefined()
    expect(descriptor!.value).toBe('bar')
    expect(descriptor!.writable).toBe(true)
  })

  it('supports Object.getOwnPropertyDescriptor in lazy constructor resolver', () => {
    class Target { foo = 'bar' }

    const resolver = createResolver({
      constructor: Target,
      resolution: 'lazy'
    })

    const result = resolver({})
    const descriptor = Object.getOwnPropertyDescriptor(result, 'foo')
    expect(descriptor).toBeDefined()
    expect(descriptor!.value).toBe('bar')
    expect(descriptor!.writable).toBe(true)
  })

  it('supports Object.getOwnPropertyDescriptor in eager constructor resolver', () => {
    class Target { foo = 'bar' }

    const resolver = createResolver({
      constructor: Target,
      resolution: 'lazy'
    })

    const result = resolver({})
    const descriptor = Object.getOwnPropertyDescriptor(result, 'foo')
    expect(descriptor).toBeDefined()
    expect(descriptor!.value).toBe('bar')
    expect(descriptor!.writable).toBe(true)
  })

  it('supports property modification in lazy factory resolver result', () => {
    const target = jest.fn(() => ({ foo: 'bar' }))

    const resolver = createResolver({
      factory: target,
      resolution: 'lazy'
    })

    const result = resolver({})
    result.foo = 'modified'
    expect(result.foo).toBe('modified')
  })
  
  it('supports property modification in eager factory resolver result', () => {
    const target = jest.fn(() => ({ foo: 'bar' }))

    const resolver = createResolver({
      factory: target,
      resolution: 'eager'
    })

    const result = resolver({})
    result.foo = 'modified'
    expect(result.foo).toBe('modified')
  })

  it('supports property modification in lazy constructor resolver result', () => {
    class Target { foo = 'bar' }

    const resolver = createResolver({
      constructor: Target,
      resolution: 'lazy'
    })

    const result = resolver({})
    result.foo = 'modified'
    expect(result.foo).toBe('modified')
  })
  
  it('supports property modification in eager constructor resolver result', () => {
    class Target { foo = 'bar' }

    const resolver = createResolver({
      constructor: Target,
      resolution: 'eager'
    })

    const result = resolver({})
    result.foo = 'modified'
    expect(result.foo).toBe('modified')
  })

  it('creates resolvers for object static values', () => {
    const staticValue = { foo: 'bar', baz: 123 }

    const resolver = createResolver<typeof staticValue>({
      static: staticValue
    })

    const result = resolver({})
    expect(result).toBe(staticValue)
    expect(result.foo).toBe('bar')
    expect(result.baz).toBe(123)
  })

  it('creates resolvers for primitive static value', () => {
    const staticValue = 'hello world'

    const resolver = createResolver<string>({
      static: staticValue
    })

    const result = resolver({})
    expect(result).toBe(staticValue)
    expect(typeof result).toBe('string')
  })

  it('creates resolvers for null static value', () => {
    const resolver = createResolver<null>({
      static: null
    })

    const result = resolver({})
    expect(result).toBe(null)
  })


  it('creates resolvers for undefined static value', () => {
    const resolver = createResolver<undefined>({
      static: undefined
    })

    const result = resolver({})
    expect(result).toBe(undefined)
  })

  it('ignores resolution option for static resolver', () => {
    const staticValue = { foo: 'bar' }

    const resolver = createResolver<typeof staticValue>({
      // @ts-expect-error
      static: staticValue,
      resolution: 'lazy'
    })

    const result = resolver({})
    expect(result).toBe(staticValue)
  })
})
