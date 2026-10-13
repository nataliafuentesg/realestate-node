// Las propiedades que ya existian no tienen listingType (null): son ventas.
export function isRental(property) {
  return property?.listingType === 'RENT'
}

export const FURNISHING_LABELS = {
  FURNISHED: 'Amoblado',
  UNFURNISHED: 'Sin amoblar',
  BOTH: 'Amoblado o sin amoblar',
}
