import { Token } from 'token'
import { Bundle, createBundle, mergeBundles } from './bundle'

describe('Bundle', () => {
  describe('createBundle', () => {
    it('creates a bundle from a descriptor object', () => {
      const propertyDescriptors: Bundle.DescriptorMap = {
        foo: { value: 1, enumerable: true },
        bar: { value: 2, enumerable: true },
      }

      const bundle = createBundle(propertyDescriptors)

      expect(bundle.foo).toBe(1)
      expect(bundle.bar).toBe(2)
    })

    it('creates a bundle from an entry list', () => {
      const propertyDescriptors: Bundle.DescriptorEntry[] = [
        ['foo', { value: 1, enumerable: true }],
        ['bar', { value: 2, enumerable: true }],
      ]

      const bundle = createBundle(propertyDescriptors)

      expect(bundle.foo).toBe(1)
      expect(bundle.bar).toBe(2)
    })

    it('respects first key precedence in entry list', () => {
      const propertyDescriptors: Bundle.DescriptorEntry[] = [
        ['foo', { value: 1, enumerable: true }],
        ['foo', { value: 999, enumerable: true }],
      ]

      const bundle = createBundle(propertyDescriptors)

      expect(bundle.foo).toBe(1)
    })

    it('skips duplicate keys from object descriptor input', () => {
      const propertyDescriptors: Bundle.DescriptorMap = {
        foo: { value: 1, enumerable: true },
        bar: { value: 2, enumerable: true },
      }

      const bundle = createBundle(propertyDescriptors)

      expect(Object.keys(bundle)).toContain('foo')
      expect(Object.keys(bundle)).toContain('bar')
    })
    
    it('does not trigger getters during createBundle', () => {
      const get = jest.fn(() => 123)
    
      const source = {}

      Object.defineProperty(source, 'expensive', { get, enumerable: true })
    
      const descriptors = Object.getOwnPropertyDescriptors(source)
      const bundle = createBundle(descriptors)
    
      expect(get).not.toHaveBeenCalled()
      expect(bundle.expensive).toBe(123)
      expect(get).toHaveBeenCalledTimes(1)
    })

    it('supports function-based BundleDescriptors', () => {
      const descriptor = jest.fn((bundle) => ({
        get: () => Object.keys(bundle).length,
        enumerable: true,
      }))
    
      const bundle = createBundle([
        ['count', descriptor]
      ])
    
      expect(descriptor).toHaveBeenCalledTimes(1)
      expect(typeof bundle.count).toBe('number')
      expect(bundle.count).toBe(1)
    })

    it('returns an empty frozen bundle from empty descriptor input', () => {
      const bundle = createBundle([])
      expect(Object.keys(bundle)).toHaveLength(0)
      expect(Object.isFrozen(bundle)).toBe(true)
    })

    it('freezes the returned bundle', () => {
      const descriptors: Bundle.DescriptorEntry[] = [
        ['foo', { value: 123, enumerable: true }]
      ]

      const bundle = createBundle(descriptors)
    
      expect(Object.isFrozen(bundle)).toBe(true)
    })
  })

  describe('mergeBundles', () => {
    it('merges multiple bundles with first key precedence', () => {
      const bundleA: Bundle = { foo: 1 }
      const bundleB: Bundle = { foo: 2, bar: 3 }
      const bundleC: Bundle = { baz: 4, bar: 5 }

      const bundle = mergeBundles(bundleA, bundleB, bundleC)

      expect(bundle.foo).toBe(1)
      expect(bundle.bar).toBe(3)
      expect(bundle.baz).toBe(4)
    })

    it('ignores undefined and null bundles', () => {
      const bundleA: Bundle = { foo: 1 }
      const bundleB: Bundle = { bar: 2 }

      const merged = mergeBundles(bundleA, null, undefined, bundleB)

      expect(merged.foo).toBe(1)
      expect(merged.bar).toBe(2)
    })

    it('returns an empty bundle if given no arguments', () => {
      const merged = mergeBundles()
      expect(Object.keys(merged)).toHaveLength(0)
    })

    it('preserves property descriptor behavior (non-enumerable)', () => {
      const propertyDescriptors: [Token, PropertyDescriptor][] = [
        ['hidden', { value: 42, enumerable: false }],
      ]

      const bundle = createBundle(propertyDescriptors)

      const merged = mergeBundles(bundle)

      expect(merged.hidden).toBe(42)
      expect(Object.keys(merged)).not.toContain('hidden')
    })
    
    it('does not trigger getters during mergeBundles', () => {
      const get = jest.fn(() => 123)
    
      const bundleWithGetter = {}
      Object.defineProperty(bundleWithGetter, 'expensive', { get, enumerable: true })
    
      const merged = mergeBundles(bundleWithGetter)
    
      expect(get).not.toHaveBeenCalled()
      expect(merged.expensive).toBe(123)
      expect(get).toHaveBeenCalledTimes(1)
    })
  })

  describe('namespace', () => {
    it('exposes create function', () => {
      expect(typeof Bundle.create).toBe('function')
      expect(Bundle.create).toBe(createBundle)
    })

    it('exposes merge function', () => {
      expect(typeof Bundle.merge).toBe('function')
      expect(Bundle.merge).toBe(mergeBundles)
    })
  })
})
