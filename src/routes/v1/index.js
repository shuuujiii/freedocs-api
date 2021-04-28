const express = require('express')
const router = express.Router()

const userRouter = require('./userRouter')
const articleRouter = require('./articleRouter')
const tagRouter = require('./tagRouter')
// const publicRouter = require('./publidRouter')
const reportRouter = require('./reportRouter')

router.use('/users', userRouter)
router.use('/article', articleRouter)
router.use('/tag', tagRouter)
router.use('/report', reportRouter)
// router.use('/main', publicRouter)

module.exports = router