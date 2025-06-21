import { Context } from './context'

describe('Context', () => {
  describe('resolve()', () => {
    it('calls the target function and returns its result', () => {
      const context = new Context()
      const someFunction = (a: number, b: number) => a + b

      const result = context.resolve(someFunction, 2, 3)
      expect(result).toBe(5)
    })

    it('returns the same result on repeated calls to the same target', () => {
      const context = new Context()
      const someFunction = jest.fn((x: number) => ({ value: x }))

      const result1 = context.resolve(someFunction, 1)
      const result2 = context.resolve(someFunction, 999) // should be ignored

      expect(result1).toBe(result2)
      expect(someFunction).toHaveBeenCalledTimes(1)
    })

    it('calls different targets independently', () => {
      const context = new Context()
      const someFunction_0 = jest.fn(() => '0')
      const someFunction_1 = jest.fn(() => '1')

      const result_0 = context.resolve(someFunction_0)
      const result_1 = context.resolve(someFunction_1)

      expect(result_0).toBe('0')
      expect(result_1).toBe('1')
      expect(someFunction_0).toHaveBeenCalledTimes(1)
      expect(someFunction_1).toHaveBeenCalledTimes(1)
    })

    it('passes dependencies to the function', () => {
      const context = new Context()
      const someFunction = jest.fn((x: string, y: number) => `${x}-${y}`)

      const result = context.resolve(someFunction, 'item', 42)
      expect(someFunction).toHaveBeenCalledWith('item', 42)
      expect(result).toBe('item-42')
    })

    it('ensures resolve uses a stable identity for each function', () => {
      const context = new Context()
      const someFunction = () => 123
      const identity1 = context['resolve'](someFunction)
      const identity2 = context['resolve'](someFunction)
      expect(identity1).toBe(identity2)
    })

    it('ensures identities are unique for different functions', () => {
      const context = new Context()
      const someFunction_0 = () => '1'
      const someFunction_1 = () => '2'
      const result_0 = context.resolve(someFunction_0)
      const result_1 = context.resolve(someFunction_1)
      expect(result_0).toBe('1')
      expect(result_1).toBe('2')
    })
  })

  describe('clear()', () => {
    it('evicts cached result and re-resolves', () => {
      const context = new Context()
      const someFunction = jest.fn(() => Math.random())

      const result_0 = context.resolve(someFunction)
      context.clear()
      const result_1 = context.resolve(someFunction)

      expect(result_0).not.toBe(result_1)
      expect(someFunction).toHaveBeenCalledTimes(2)
    })
  })
})
