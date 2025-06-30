export type StaticTarget<T extends any = any> = T

export type FunctionTarget<T extends any = any, P extends Array<any> = any[]> = (...params: P) => T

export type FactoryTarget<T extends object = object, P extends Array<any> = any[]> = (...params: P) => T

export type ConstructorTarget<T extends object = object, P extends Array<any> = Array<any>> = 
  | ( new (...params: P) => T ) 
  | { new (...params: P): T }

export type ValueTarget<T extends any = any> =
  | FunctionTarget<T>
  | StaticTarget<T>

export type ObjectTarget<T extends object = any> =
  | ConstructorTarget<T>
  | FactoryTarget<T>

export type ConstructorTargetWrapper<T extends object> = {
  constructor: ConstructorTarget<T>
}

export type FactoryTargetWrapper<T extends object> = {
  factory: FactoryTarget<T> 
}

export type FunctionTargetWrapper<T extends any> = {
  function: FunctionTarget<T>
}

export type StaticTargetWrapper<T extends any> = {
  static: StaticTarget<T> 
}

export type ObjectTargetWrapper<T extends object> = 
  | ConstructorTargetWrapper<T>
  | FactoryTargetWrapper<T>

export type ValueTargetWrapper<T extends any> = 
  | FunctionTargetWrapper<T>
  | StaticTargetWrapper<T>
