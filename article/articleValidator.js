const Joi = require('joi')

const ArticleValidator = Joi.object({
    title: Joi.string().required(),
    url: Joi.string().uri().required(),
    user: Joi.string().required(),

})
module.exports = ArticleValidator