const express = require('express')
const router = express.Router()

const userRouter = require('./userRouter')
const articleRouter = require('./articleRouter')

router.use('/users', userRouter)
router.use('/article', articleRouter)

module.exports = router