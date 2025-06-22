import { Token } from './token'

export type BundleDescriptor = PropertyDescriptor | ((bundle: Bundle) => PropertyDescriptor )

export type BundleDescriptorMap = { [token: Token]: BundleDescriptor };

export type BundleDescriptorEntry = [Token, BundleDescriptor]

export type BundleRecord = Record<Token, any>

export type Bundle = Readonly<BundleRecord>

export function createBundle(descriptors: BundleDescriptorMap | BundleDescriptorEntry[]): Bundle {
  if (!Array.isArray(descriptors)) {
    return createBundle(Object.entries(descriptors))
  }

  const bundle: BundleRecord = {}

  for (const [token, descriptor] of descriptors) {
    if (!(token in bundle)) {
      if(typeof descriptor === 'function') {
        Object.defineProperty(bundle, token, descriptor(bundle))
      } else {
        Object.defineProperty(bundle, token, descriptor)
      }
    }
  }

  return Object.freeze(bundle)
}

export function mergeBundles(...bundles: (Bundle | undefined | null)[]): Bundle {
  return createBundle(bundles.flatMap((bundle) => {
    return Object.entries(Object.getOwnPropertyDescriptors(bundle ?? {}))
  }))
}

export namespace Bundle {
  export type Record = BundleRecord
  export type Descriptor = BundleDescriptor
  export type DescriptorMap = BundleDescriptorMap
  export type DescriptorEntry = BundleDescriptorEntry
  export const create = createBundle
  export const merge = mergeBundles
}