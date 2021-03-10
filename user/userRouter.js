
var express = require('express')
var router = express.Router()
const { validateToken } = require('../utils/jwtvalidation');
const userController = require('./userController')

// login
router.post('/login', userController.login)
// create
router.post('/', userController.create)
//read
router.get('/', validateToken, userController.read)
//update
router.put('/', userController.update)
//delete
router.delete('/', userController.delete)

module.exports = router