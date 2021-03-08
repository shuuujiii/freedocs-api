const bcrypt = require('bcrypt');

const environment = process.env.NODE_ENV;
const stage = require('../config.js')[environment];

module.exports = {
    hashPassword: function (password) {
        // TODO password not allowed number only (it makes error on bctypt)
        return bcrypt.hashSync(password, stage.saltingRounds);
    }
}