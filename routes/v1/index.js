const express = require('express')
const router = express.Router()

const userRouter = require('../../user/userRouter')
const articleRouter = require('../../article/articleRouter')

router.use('/users', userRouter)
router.use('/article', articleRouter)

module.exports = router