const jwt = require('jsonwebtoken');
const TokenService = require('../../utils/token')
const { AppError } = require('../../utils/appError')
const { StatusCodes, getReasonPhrase } = require('http-status-codes')
module.exports = {
    validateToken: (req, res, next) => {
        try {
            const token = () => {
                if (req.session && req.session.token) { return req.session.token };
                const authorizationHeader = req.headers.authorization;
                if (!authorizationHeader) {
                    throw new AppError(getReasonPhrase(StatusCodes.UNAUTHORIZED), StatusCodes.UNAUTHORIZED, 'Token required', true)
                }
                return req.headers.authorization.split(' ')[1]; // Bearer <token>)
            };
            const decoded = TokenService.verifyToken(token())
            // const options = {
            //     expiresIn: '2d',
            //     issuer: 'shuji watanabe'
            // };
            // verify makes sure that the token hasn't expired and has been issued by us
            // const decoded = jwt.verify(token(), process.env.JWT_SECRET, options);
            // Let's pass back the decoded token to the request object
            req.decoded = decoded;
            // We call next to pass execution to the subsequent middleware
            next();
        } catch (e) {
            next(e)
        }
    },
    silentValidateToken: (req, res, next) => {
        try {
            if (!req.session) {
                // console.log('nosession', req.session)
                return next()
            }
            if (!req.session.token) {
                // console.log('no token', req.session.token)
                return next()
            }
            // console.log('validate')
            const decoded = TokenService.verifyToken(req.session.token)
            // const options = {
            //     expiresIn: '2d',
            //     issuer: 'shuji watanabe'
            // };
            // verify makes sure that the token hasn't expired and has been issued by us
            // const decoded = jwt.verify(req.session.token, process.env.JWT_SECRET, options);
            // Let's pass back the decoded token to the request object
            req.decoded = decoded;
            // We call next to pass execution to the subsequent middleware
            next();
        } catch (e) {
            next(e)
        }
    }
};