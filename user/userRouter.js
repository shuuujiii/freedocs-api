
var express = require('express')
var router = express.Router()
const checktoken = require('../utils/jwtvalidation').validateToken;
const userController = require('./userController')

// create
router.put('/', userController.create)
//read
router.get('/', userController.read)
//update
router.post('/', userController.update)
//delete
router.delete('/', userController.delete)

module.exports = router