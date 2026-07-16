const express = require('express')
const router = express.Router()
const protect = require('../middleware/protect')
const { createInquiry, getInquiries, deleteInquiry } = require('../controllers/inquiryController')

router.post('/', createInquiry)
router.get('/', protect, getInquiries)
router.delete('/:id', protect, deleteInquiry)

module.exports = router
