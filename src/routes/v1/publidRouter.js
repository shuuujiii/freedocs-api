const express = require('express')
const router = express.Router()
const publicController = require('../../controllers/publicController')

router.get('/', publicController.read)

module.exports = router