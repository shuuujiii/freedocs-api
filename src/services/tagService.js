const Tag = require('../models/tagModel')
const Joi = require('joi')
const TagValidator = Joi.object({
    name: Joi.string().alphanum().min(2).max(20),
})
const tagCreateValidation = async (name) => {
    await TagValidator.validateAsync({ name: name })
        .catch(e => {
            throw new AppError(e.name, StatusCodes.BAD_REQUEST, e.message, true)
        })
    return
}

const findOrCreateTag = async (name) => {
    const isExistTag = await Tag.findOne({ name: name })
    if (isExistTag) return isExistTag
    return await Tag.create({ name: name })
}

module.exports = {
    tagCreateValidation,
    findOrCreateTag,
}