
var express = require('express')
var router = express.Router()
const { validateToken, silentValidateToken: silentValudateToken } = require('../../middlewares/validator/jwtvalidator');
const userController = require('../../controllers/userController')
// login
router.post('/login', userController.login)
// logout
router.post('/logout', userController.logout)
// authenticate
router.post('/authenticate', validateToken, userController.authenticate)
router.post('/silent', silentValudateToken, userController.silent)
router.post('/auth/email', userController.authEmail)

// create
router.post('/', userController.create)
// read
router.get('/', validateToken, userController.read)
// update
router.put('/', userController.update)
// delete
router.delete('/', validateToken, userController.delete)

// auth email

module.exports = router