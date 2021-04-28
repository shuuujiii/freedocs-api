
var express = require('express')
var router = express.Router()
const { validateToken } = require('../../middlewares/validator/jwtvalidator');
const reportController = require('../../controllers/reportController')
// login
router.post('/', validateToken, reportController.report)

module.exports = router