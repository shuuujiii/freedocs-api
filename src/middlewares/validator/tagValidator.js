const Joi = require('joi')
Joi.objectId = require('joi-objectid')(Joi)
const _id = Joi.objectId()
const name = Joi.string().alphanum().min(2).max(20)
const user = Joi.string().max(24).required()
const TagValidator = Joi.object({
    _id: _id,
    name: name,
})

module.exports = TagValidator