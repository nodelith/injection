export type Target<T extends object = object, P extends readonly any[] = any[]> = TargetFactory<T, P> | TargetConstructor<T, P>

export type TargetFactory<T extends object = object, P extends readonly any[] = any[]> = (...parameters: P) => T

export type TargetConstructor<T extends object = object, P extends readonly any[] = any[]> = 
  | ( new (...parameters: P) => T ) 
  | { new (...parameters: P): T }

export type TargetWrapper<T extends object = object, P extends readonly any[] = any[]> = 
  | TargetConstructorWrapper<T, P>
  | TargetFactoryWrapper<T, P>

export type TargetFactoryWrapper<T extends object = object, P extends readonly any[] = any[]> = {
  factory: TargetFactory<T, P>
}
export type TargetConstructorWrapper<T extends object = object, P extends readonly any[] = any[]> = {
  constructor: TargetConstructor<T, P>
}
