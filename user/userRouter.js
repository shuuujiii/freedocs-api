
var express = require('express')
var router = express.Router()
const { validateToken } = require('../utils/jwtvalidation');
const userController = require('./userController')

// login
router.get('/login', userController.login)
// create
router.put('/', userController.create)
//read
router.get('/', validateToken, userController.read)
//update
router.post('/', userController.update)
//delete
router.delete('/', userController.delete)

module.exports = router