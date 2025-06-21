export type Target<R, D extends readonly unknown[] = []> = (...dependencies: D) => R

export type TargetFactory<R extends object, P extends readonly unknown[] = []> = (...parameters: P) => R

export type TargetConstructor<R extends object, P extends readonly unknown[] = []> = 
  | ( new (...params: P) => R ) 
  | { new (...params: P): R }
