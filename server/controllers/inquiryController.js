const Inquiry = require('../models/Inquiry')

// POST /api/inquiries
async function createInquiry(req, res) {
  try {
    const inquiry = await Inquiry.create(req.body)
    res.status(201).json(inquiry)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
}

// GET /api/inquiries (admin)
async function getInquiries(req, res) {
  try {
    const inquiries = await Inquiry.find().populate('property', 'title city').sort({ createdAt: -1 })
    res.json(inquiries)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// DELETE /api/inquiries/:id (admin)
async function deleteInquiry(req, res) {
  try {
    const inquiry = await Inquiry.findByIdAndDelete(req.params.id)
    if (!inquiry) {
      return res.status(404).json({ message: 'Inquiry not found' })
    }
    res.json({ message: 'Inquiry deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

module.exports = { createInquiry, getInquiries, deleteInquiry }
