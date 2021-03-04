
var express = require('express')
var router = express.Router()
const mongoose = require('mongoose')

const User = mongoose.model('User')

// create
router.put('/', async (req, res) => {
  const { username, email } = req.body
  const user = await User.findOneAndUpdate(
    {
      email: email
    },
    {
      $set: {
        username: username,
        email: email,
      }
    },
    {
      new: true,
      upsert: true
    })

  return res.json(user)
})

//read
router.get('/', async (req, res) => {
  //console.log('params is ', req.query)
  const user = await User.findOne(
    { 'email': req.query.email }
  )
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