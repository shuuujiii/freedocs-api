
var express = require('express')
var router = express.Router()
const mongoose = require('mongoose')
const checktoken = require('../../utils/jwtvalidation').validateToken;
const User = mongoose.model('User')
const userController = require('../../controllers/userController')

// create
router.put('/', userController.create)
//read
router.get('/', userController.read)
//read all
router.get('/all', checktoken, async (req, res) => {
  const user = await User.find({})
  res.json(user)
})
//update
router.post('/', userController.update)
//delete
router.delete('/', userController.delete)
module.exports = router