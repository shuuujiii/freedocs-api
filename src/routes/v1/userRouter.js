
var express = require('express')
var router = express.Router()
const { validateToken, silentValidateToken } = require('../../middlewares/validator/jwtvalidator');
const userController = require('../../controllers/userController')
router.post('/create', userController.create)
router.post('/login', userController.login)
router.post('/logout', userController.logout)
router.put('/update', validateToken, userController.update)
router.delete('/delete', validateToken, userController.delete)
// router.post('/authenticate', validateToken, userController.authenticate)
router.post('/silent', silentValidateToken, userController.silent)
router.post('/changepassword', validateToken, userController.changePassword)
router.post('/changeemail', validateToken, userController.changeEmail)

router.post('/auth/email', userController.authEmail)
router.post('/forgotpassword', userController.forgotPassword)
router.post('/resetpassword', userController.resetPassword)
router.get('/profile', userController.profile)
module.exports = router