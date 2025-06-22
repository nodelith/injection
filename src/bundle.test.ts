import { Token } from 'token'
import { createBundle, mergeBundles, Bundle } from './bundle'

describe('Bundle', () => {
  describe('createBundle', () => {
    it('creates a bundle from a descriptor object', () => {
      const propertyDescriptors: PropertyDescriptorMap = {
        foo: { value: 1, enumerable: true },
        bar: { value: 2, enumerable: true },
      }

      const bundle = createBundle(propertyDescriptors)

      expect(bundle.foo).toBe(1)
      expect(bundle.bar).toBe(2)
    })

    it('creates a bundle from an entry list', () => {
      const propertyDescriptors: [Token, PropertyDescriptor][] = [
        ['foo', { value: 1, enumerable: true }],
        ['bar', { value: 2, enumerable: true }],
      ]

      const bundle = createBundle(propertyDescriptors)

      expect(bundle.foo).toBe(1)
      expect(bundle.bar).toBe(2)
    })

    it('respects first key precedence in entry list', () => {
      const propertyDescriptors: [Token, PropertyDescriptor][] = [
        ['foo', { value: 1, enumerable: true }],
        ['foo', { value: 999, enumerable: true }],
      ]

      const bundle = createBundle(propertyDescriptors)

      expect(bundle.foo).toBe(1)
    })

    it('skips duplicate keys from object descriptor input', () => {
      const propertyDescriptors: PropertyDescriptorMap = {
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
})
