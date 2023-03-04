const express = require('express')
const app = express()
// For Authentication using JOTS (Json Web Tokens)
const jwt = require('jsonwebtoken')

// All requests will be JSONified
app.use(express.json())

// Admin routes (Require Admin token authentication)
const adminRoute = require('./routes/admin');
app.use('/admin', adminRoute);

// Public routes
const publicRoute = require('./routes/public');
app.use('/', publicRoute);

app.listen(3000)