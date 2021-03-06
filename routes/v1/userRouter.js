
var express = require('express')
var router = express.Router()
const mongoose = require('mongoose')
const checktoken = require('../../utils/jwtvalidation').validateToken;
const User = mongoose.model('User')
const userController = require('../../controllers/userController')

// module.exports = (router) => {
//   users(router);
//   return router;
// };

// create
router.put('/', userController.create)
router.get('/', userController.read)

//read
// router.get('/', )

//read all
router.get('/all', checktoken, async (req, res) => {
  const user = await User.find({})
  res.json(user)
})

//update
router.post('/', async (req, res) => {
  const { email, username } = req.body
  const user = await User.findOneAndUpdate(
    { 'email': email },
    { 'username': username },
    { new: true })
  res.json(user)
})

router.delete('/', async (req, res) => {
  const { email } = req.body
  const user = await User.deleteOne({ 'email': email })
  res.json(user)
})
module.exports = router