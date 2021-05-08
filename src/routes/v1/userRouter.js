
var express = require('express')
var router = express.Router()
const { validateToken, silentValidateToken } = require('../../middlewares/validator/jwtvalidator');
const userController = require('../../controllers/userController')

router.post('/login', userController.login)
router.post('/logout', userController.logout)
// router.post('/authenticate', validateToken, userController.authenticate)
router.post('/silent', silentValidateToken, userController.silent)
router.post('/auth/email', userController.authEmail)
router.post('/changepassword', validateToken, userController.changePassword)
router.post('/changeemail', validateToken, userController.changeEmail)
router.post('/', userController.create)
router.put('/', userController.update)
router.delete('/', validateToken, userController.delete)
module.exports = router