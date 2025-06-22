import { Token } from './token'

export type Bundle = Record<Token, any>

export function createBundle(descriptors: PropertyDescriptorMap | [Token, PropertyDescriptor][]): Bundle {
  if (!Array.isArray(descriptors)) {
    return createBundle(Object.entries(descriptors))
  }

  const bundle: Bundle = {}

  for (const [token, descriptor] of descriptors) {
    if (!(token in bundle)) {
      Object.defineProperty(bundle, token, descriptor)
    }
  }

  return bundle
}

export function mergeBundles(...bundles: (Bundle | undefined | null)[]): Bundle {
  return createBundle(bundles.flatMap(bundle => {
    return Object.entries(Object.getOwnPropertyDescriptors(bundle ?? {}))
  }))
}