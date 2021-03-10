const jwt = require('jsonwebtoken');
const { AppError } = require('../appError')
const { StatusCodes, getReasonPhrase } = require('http-status-codes')
module.exports = {
    validateToken: (req, res, next) => {
        try {
            const authorizationHeader = req.headers.authorization;
            if (!authorizationHeader) {
                throw new AppError(getReasonPhrase(StatusCodes.UNAUTHORIZED), StatusCodes.UNAUTHORIZED, 'Token required', true)
            }

            const token = req.headers.authorization.split(' ')[1]; // Bearer <token>
            const options = {
                expiresIn: '2d',
                issuer: 'shuji watanabe'
            };
            // verify makes sure that the token hasn't expired and has been issued by us
            const decoded = jwt.verify(token, process.env.JWT_SECRET, options);
            // Let's pass back the decoded token to the request object
            req.decoded = decoded;
            // We call next to pass execution to the subsequent middleware
            next();
        } catch (e) {
            next(e)
        }
    }
};