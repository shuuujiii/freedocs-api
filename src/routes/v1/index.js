const express = require('express')
const router = express.Router()

const userRouter = require('./userRouter')
const articleRouter = require('./articleRouter')
const tagRouter = require('./tagRouter')

router.use('/users', userRouter)
router.use('/article', articleRouter)
router.use('/tag', tagRouter)

module.exports = router