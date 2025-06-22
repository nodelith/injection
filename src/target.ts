export type Target<R, D extends readonly any[] = any[]> = (...dependencies: D) => R

export type TargetFactory<R extends object, P extends readonly any[] = any[]> = (...parameters: P) => R

export type TargetConstructor<R extends object, P extends readonly any[] = any[]> = 
  | ( new (...params: P) => R ) 
  | { new (...params: P): R }
