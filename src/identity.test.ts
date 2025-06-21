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
    it('attaches a hidden base62 identity to an object as a symbol', () => {
      const object: Record<PropertyKey, any> = {}
      extractIdentity(object)

      const symbols = Object.getOwnPropertySymbols(object)
      expect(symbols.length).toBeGreaterThan(0)

      const symbolValue = object[symbols[0]!]
      expect(typeof symbolValue).toBe('string')
      expect(symbolValue).toHaveLength(22)

      const decoded = decodeIdentity(symbolValue)
      expect(decoded).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
      )
    })

    it('does not add enumerable keys', () => {
      const object: Record<PropertyKey, any> = {}
      extractIdentity(object)
      expect(Object.keys(object)).toHaveLength(0)
    })

    it('returns same identity on multiple calls', () => {
      const object: Record<PropertyKey, any> = {}
      extractIdentity(object)
      const symbol_0 = Object.getOwnPropertySymbols(object)[0]
      const identity_0 = object[symbol_0!]

      extractIdentity(object)
      const symbol_1 = Object.getOwnPropertySymbols(object)[0]
      const id2 = object[symbol_1!]

      expect(symbol_0).toBe(symbol_1)
      expect(identity_0).toBe(id2)
    })

    it('works on plain objects', () => {
      const object: Record<PropertyKey, any> = {}
      extractIdentity(object)
      const symbol = Object.getOwnPropertySymbols(object)[0]
      expect(typeof object[symbol!]).toBe('string')
      expect(object[symbol!].length).toBe(22)
    })
  
    it('works on class instances', () => {
      class SomeClass {}
      const user = new SomeClass()
      extractIdentity(user)
      const symbol = Object.getOwnPropertySymbols(user)[0]
      expect(typeof user[symbol!]).toBe('string')
    })
  
    it('works on functions', () => {
      const someFunction = function () {}
      extractIdentity(someFunction)
      const symbol = Object.getOwnPropertySymbols(someFunction)[0]
      expect(typeof someFunction[symbol!]).toBe('string')
    })
  
    it('works on arrays', () => {
      const array: any[] = []
      extractIdentity(array)
      const sym = Object.getOwnPropertySymbols(array)[0]
      expect(typeof array[sym!]).toBe('string')
    })
  
    it('works on Object.create(null)', () => {
      const object = Object.create(null)
      extractIdentity(object)
      const symbol = Object.getOwnPropertySymbols(object)[0]
      expect(typeof object[symbol!]).toBe('string')
    })
  
    it('throws on frozen objects', () => {
      const frozenObject = Object.freeze({})
      expect(() => extractIdentity(frozenObject)).toThrow()
    })
  
    it('throws on non-extensible objects', () => {
      const sealedObject = Object.preventExtensions({})
      expect(() => extractIdentity(sealedObject)).toThrow()
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
