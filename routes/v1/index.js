var express = require('express')
var router = express.Router()

var userRouter = require('./userRouter')

router.use('/users', userRouter)

module.exports = router