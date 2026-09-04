const mongoose = require('mongoose')

const propertySchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    city: { type: String, required: true },
    neighborhood: { type: String, default: '' },
    address: { type: String, default: '' },
    type: { type: String, enum: ['HOUSE', 'APARTMENT', 'LAND'], required: true, uppercase: true },
    bedrooms: { type: Number, default: 0 },
    bathrooms: { type: Number, default: 0 },
    parking: { type: Number, default: 0 },
    stratum: { type: Number },
    areaM2: { type: Number, required: true },
    areaBuiltM2: { type: Number },
    zoning: { type: String, default: '' },
    propertyRegistration: { type: String, default: '' },
    cadastralCode: { type: String, default: '' },
    legalStatus: { type: String, default: '' },
    images: [{ type: String }],
    lat: { type: Number },
    lng: { type: Number },
    features: [{ type: String }],
    agentName: { type: String, default: 'Camila Restrepo' },
    agentPhone: { type: String, default: '+57 300 000 0000' },
  },
  { timestamps: true },
)

module.exports = mongoose.model('Property', propertySchema)
