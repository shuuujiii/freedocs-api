const jwt = require('jsonwebtoken');

const defaultOptions = {
    expiresIn: '2d',
    issuer: 'shuji watanabe'
}

const defaultEmailOptions = {
    expiresIn: '2d',
    issuer: 'shuji watanabe'
}

const createToken = (payload, options = defaultOptions) => {
    return jwt.sign(payload, process.env.JWT_SECRET, options)
}

const verifyToken = (token, options = defaultOptions) => {
    return jwt.verify(token, process.env.JWT_SECRET, options)
}
const createEmailToken = (payload, options = defaultEmailOptions) => {
    return jwt.sign(payload, process.env.EMAIL_SECRET, options)
}

const verifyEmailToken = (token, options = defaultEmailOptions) => {
    return jwt.verify(token, process.env.EMAIL_SECRET, options)
}

module.exports = {
    createToken,
    verifyToken,
    createEmailToken,
    verifyEmailToken,
}