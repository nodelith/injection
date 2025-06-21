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
    it('returns a UUID string (8-4-4-4-12)', () => {
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
      const a = createIdentity()
      const b = createIdentity()
      expect(a).not.toBe(b)
    })
  })

  describe('extract', () => {
    it('attaches a hidden base62 identity to an object as a symbol', () => {
      const obj: Record<PropertyKey, any> = {}
      extractIdentity(obj)

      const symbols = Object.getOwnPropertySymbols(obj)
      expect(symbols.length).toBeGreaterThan(0)

      const symbolValue = obj[symbols[0]!]
      expect(typeof symbolValue).toBe('string')
      expect(symbolValue).toHaveLength(22)

      const decoded = decodeIdentity(symbolValue)
      expect(decoded).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
      )
    })

    it('does not add enumerable keys', () => {
      const obj: Record<PropertyKey, any> = {}
      extractIdentity(obj)
      expect(Object.keys(obj)).toHaveLength(0)
    })

    it('returns same identity on multiple calls', () => {
      const obj: Record<PropertyKey, any> = {}
      extractIdentity(obj)
      const sym1 = Object.getOwnPropertySymbols(obj)[0]
      const id1 = obj[sym1!]

      extractIdentity(obj)
      const sym2 = Object.getOwnPropertySymbols(obj)[0]
      const id2 = obj[sym2!]

      expect(sym1).toBe(sym2)
      expect(id1).toBe(id2)
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
