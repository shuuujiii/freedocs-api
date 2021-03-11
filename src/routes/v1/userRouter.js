
var express = require('express')
var router = express.Router()
const { validateToken } = require('../../middlewares/validator/jwtvalidator');
const userController = require('../../controllers/userController')
const { StatusCodes } = require('http-status-codes');
const { AppError } = require('../../utils/appError')
// login
router.post('/login', userController.login)
// create
router.post('/', userController.create)
//read
router.get('/', validateToken, userController.read)
//update
router.put('/', userController.update)
//delete
router.delete('/', validateToken, userController.delete)

module.exports = router