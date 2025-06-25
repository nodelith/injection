export type Target<R extends object = object, P extends readonly any[] = any[]> = TargetFactory<R, P> | TargetConstructor<R, P>

export type TargetFactory<R extends object = object, P extends readonly any[] = any[]> = (...parameters: P) => R

export type TargetConstructor<R extends object = object, P extends readonly any[] = any[]> = 
  | ( new (...parameters: P) => R ) 
  | { new (...parameters: P): R }
