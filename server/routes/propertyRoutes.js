const express = require('express')
const router = express.Router()
const protect = require('../middleware/protect')
const {
  getProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
} = require('../controllers/propertyController')

router.get('/', getProperties)
router.get('/:id', getPropertyById)
router.post('/', protect, createProperty)
router.put('/:id', protect, updateProperty)
router.delete('/:id', protect, deleteProperty)

module.exports = router
