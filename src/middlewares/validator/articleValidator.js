const Joi = require('joi')
Joi.objectId = require('joi-objectid')(Joi)

const ArticleValidator = Joi.object({
    url: Joi.string().uri().required(),
    description: Joi.string().allow(null).allow(''),
    user: Joi.string().required(),
    tags: Joi.array().items(Joi.objectId().allow(null)).required()
})
module.exports = ArticleValidator