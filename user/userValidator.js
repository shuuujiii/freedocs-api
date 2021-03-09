const Joi = require('joi')
const UserValidator = Joi.object().keys({
    username: Joi.string().alphanum().min(3).max(30).required(),
    password: Joi.string().regex(/^[a-zA-Z0-9]{8,30}$/),
    admin: Joi.boolean(),
}).with('username', 'password')

module.exports = UserValidator