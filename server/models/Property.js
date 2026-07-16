const mongoose = require('mongoose')

const propertySchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    city: { type: String, required: true },
    type: { type: String, enum: ['house', 'apartment', 'land'], required: true },
    bedrooms: { type: Number, default: 0 },
    bathrooms: { type: Number, default: 0 },
    areaM2: { type: Number, required: true },
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
