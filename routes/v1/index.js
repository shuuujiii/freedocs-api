const express = require('express')
const router = express.Router()

const userRouter = require('../../user/userRouter')
const loginRouter = require('./loginRouter')

router.use('/users', userRouter)
router.use('/login', loginRouter)

module.exports = router