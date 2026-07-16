const Property = require('../models/Property')

// GET /api/properties
async function getProperties(req, res) {
  try {
    const properties = await Property.find()
    res.json(properties)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// GET /api/properties/:id
async function getPropertyById(req, res) {
  try {
    const property = await Property.findById(req.params.id)
    if (!property) {
      return res.status(404).json({ message: 'Property not found' })
    }
    res.json(property)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// POST /api/properties
async function createProperty(req, res) {
  try {
    const property = await Property.create(req.body)
    res.status(201).json(property)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
}

// PUT /api/properties/:id
async function updateProperty(req, res) {
  try {
    const property = await Property.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
    if (!property) {
      return res.status(404).json({ message: 'Property not found' })
    }
    res.json(property)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
}

// DELETE /api/properties/:id
async function deleteProperty(req, res) {
  try {
    const property = await Property.findByIdAndDelete(req.params.id)
    if (!property) {
      return res.status(404).json({ message: 'Property not found' })
    }
    res.json({ message: 'Property deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

module.exports = {
  getProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
}
