import { Bundle } from './bundle'

export type Resolver<T = any> = (bundle: Bundle) => T