import { randomUUID } from 'crypto'
import {
  encodeIdentity,
  decodeIdentity,
  createIdentity,
  extractIdentity,
  Identity,
} from './identity'

describe('identity', () => {
  describe('encode', () => {
    it('returns a string of length 22', () => {
      const uuid = '7e1c22c7-5b5f-4cd3-a678-9e9d0d7613fc'
      const encoded = encodeIdentity(uuid)
      expect(typeof encoded).toBe('string')
      expect(encoded.length).toBe(22)
    })

    it('is reversible via decodeIdentity', () => {
      const uuid = '7e1c22c7-5b5f-4cd3-a678-9e9d0d7613fc'
      const encoded = encodeIdentity(uuid)
      const decoded = decodeIdentity(encoded)
      expect(decoded).toBe(uuid)
    })

    it('works on random UUIDs (fuzz round-trip)', () => {
      for (let i = 0; i < 10; i++) {
        const uuid = randomUUID()
        const encoded = encodeIdentity(uuid)
        const decoded = decodeIdentity(encoded)
        expect(decoded).toBe(uuid)
      }
    })
  })

  describe('decode', () => {
    it('returns a UUID string', () => {
      const uuid = '123e4567-e89b-12d3-a456-426614174000'
      const encoded = encodeIdentity(uuid)
      const decoded = decodeIdentity(encoded)
      expect(decoded).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
      )
    })

    it('throws on invalid characters', () => {
      expect(() => decodeIdentity('bad$$$value@#!')).toThrow(/Invalid base62 character/)
    })

    it('decodes 22 zeroes into all-zero UUID', () => {
      const decoded = decodeIdentity('0000000000000000000000')
      expect(decoded).toBe('00000000-0000-0000-0000-000000000000')
    })
  })

  describe('create', () => {
    it('returns a 22-character base62 string', () => {
      const id = createIdentity()
      expect(typeof id).toBe('string')
      expect(id).toHaveLength(22)
    })

    it('decodes to a valid UUID v4 format', () => {
      const id = createIdentity()
      const uuid = decodeIdentity(id)
      expect(uuid).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
      )
    })

    it('produces different values each call', () => {
      const identity_0 = createIdentity()
      const identity_1 = createIdentity()
      expect(identity_0).not.toBe(identity_1)
    })
  })

  describe('extract', () => {
    it('returns a base62 identity string of length 22', () => {
      const object = {}
      const identity = extractIdentity(object)
      expect(typeof identity).toBe('string')
      expect(identity.length).toBe(22)
    })

    it('returns the same identity on multiple calls', () => {
      const object = {}
      const first = extractIdentity(object)
      const second = extractIdentity(object)
      expect(first).toBe(second)
    })

    it('returns a decodable UUID', () => {
      const object = {}
      const identity = extractIdentity(object)
      const uuid = decodeIdentity(identity)
      expect(uuid).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
      )
    })

    it('does not add enumerable keys', () => {
      const object = {}
      extractIdentity(object)
      expect(Object.keys(object)).toHaveLength(0)
    })

    it('works on plain objects', () => {
      const object = {}
      const identity = extractIdentity(object)
      expect(typeof identity).toBe('string')
    })

    it('works on class instances', () => {
      class SomeClass {}
      const instance = new SomeClass()
      const identity = extractIdentity(instance)
      expect(typeof identity).toBe('string')
    })

    it('works on functions', () => {
      const fn = () => {}
      const identity = extractIdentity(fn)
      expect(typeof identity).toBe('string')
    })

    it('works on arrays', () => {
      const arr: any[] = []
      const identity = extractIdentity(arr)
      expect(typeof identity).toBe('string')
    })

    it('works on Object.create(null)', () => {
      const object = Object.create(null)
      const identity = extractIdentity(object)
      expect(typeof identity).toBe('string')
    })

    it('throws on frozen objects', () => {
      const frozen = Object.freeze({})
      expect(() => extractIdentity(frozen)).toThrow()
    })

    it('throws on non-extensible objects', () => {
      const sealed = Object.preventExtensions({})
      expect(() => extractIdentity(sealed)).toThrow()
    })
  })

  describe('namespace', () => {
    it('exposes create function', () => {
      expect(typeof Identity.create).toBe('function')
    })

    it('exposes encode function', () => {
      expect(typeof Identity.encode).toBe('function')
    })

    it('exposes decode function', () => {
      expect(typeof Identity.decode).toBe('function')
    })

    it('exposes extract function', () => {
      expect(typeof Identity.extract).toBe('function')
    })
  })
})
