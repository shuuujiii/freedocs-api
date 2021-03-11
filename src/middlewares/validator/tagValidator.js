const Joi = require('joi')

const _id = Joi.string().max(24)
const name = Joi.string().alphanum().min(2).max(20).required()
const user = Joi.string().max(24).required()
module.exports = {
    checkAllKeys: Joi.object({
        _id: _id,
        name: name,
        user: user,
    }),
    checkId: Joi.object({
        _id: _id,
        user: user,
    })
}