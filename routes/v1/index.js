var express = require('express')
var router = express.Router()

var userRouter = require('./userRouter')
var loginRouter = require('./loginRouter')
router.use('/users', userRouter)
router.use('/login', loginRouter)

module.exports = router