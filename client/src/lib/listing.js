// Las propiedades que ya existian no tienen listingType (null): son ventas.
export function isRental(property) {
  return property?.listingType === 'RENT'
}
