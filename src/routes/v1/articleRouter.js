const express = require('express')
const router = express.Router()
const { validateToken } = require('../../middlewares/validator/jwtvalidator')
const articleController = require('../../controllers/articleController')
const commentController = require('../../controllers/commentController')
const favoriteController = require('../../controllers/favoriteController')
const voteController = require('../../controllers/voteController')
const Joi = require('joi')
Joi.objectId = require('joi-objectid')(Joi)

router.get('/lists', articleController.getPosts)
// router.get('/lists/author/:author',articleController.getAuthor)
// router.get('/lists/tag/:tagname')
// router.get('/lists/search/')
// router.get('/lists/favorite')
router.get('/ranking', articleController.getRank)

router.post('/create', validateToken, articleController.create)
router.put('/update', validateToken, articleController.update)
router.delete('/delete', validateToken, articleController.delete)

router.post('/likes', validateToken, favoriteController.invertFav)
router.post('/upvote', validateToken, voteController.upvote)
router.post('/downvote', validateToken, voteController.downvote)

router.get('/comment', commentController.getComment)
router.post('/comment', validateToken, commentController.addComment)







module.exports = router