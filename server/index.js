require('dotenv').config()
const express = require('express')
const cors = require('cors')
const connectDB = require('./config/db')
const propertyRoutes = require('./routes/propertyRoutes')
const authRoutes = require('./routes/authRoutes')
const inquiryRoutes = require('./routes/inquiryRoutes')

const app = express()
const PORT = process.env.PORT || 4000

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
  res.json({ message: 'Hello from your first Node.js + Express server!' })
})

app.use('/api/properties', propertyRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/inquiries', inquiryRoutes)

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`)
  })
})
