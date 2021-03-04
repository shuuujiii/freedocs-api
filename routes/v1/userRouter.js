
var express = require('express')
var router = express.Router()
const mongoose = require('mongoose')
const checktoken = require('../../utils/jwtvalidation').validateToken;
const User = mongoose.model('User')

module.exports = (router) => {
  users(router);
  return router;
};

// create
router.put('/', async (req, res) => {
  const { username, password } = req.body
  let result = {};
  let status = 201;
  //const { username, password } = req.body;
  const user = new User({ username, password }); // document = instance of a model
  // TODO: We can hash the password here before we insert instead of in the model
  user.save((err, user) => {
    if (!err) {
      result.status = status;
      result.result = user;
    } else {
      status = 500;
      result.status = status;
      result.error = err;
    }
    res.status(status).send(result);
  });

  // const user = await User.findOneAndUpdate(
  //   {
  //     username: username
  //   },
  //   {
  //     $set: {
  //       username: username,
  //       email: email,
  //     }
  //   },
  //   {
  //     new: true,
  //     upsert: true
  //   })

  // return res.json(user)
})

//read
router.get('/', async (req, res) => {
  //console.log('params is ', req.query)
  console.log(req.query.email)
  const user = await User.findOne(
    { 'username': req.query.username }
  )
  console.log(user)
  res.json(user)
})

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