const bcrypt = require('bcrypt');

const environment = process.env.NODE_ENV;
const stage = require('../config.js')[environment];

module.exports = {
    hashPassword: (password) => {
        // return password;
        bcrypt.hash(password, stage.saltingRounds, function (err, hash) {
            if (err) {
                console.log('Error hashing password for user', user.name);
                // next(err);
            } else {
                console.log(hash)
                return hash;
                // next();
            }
        });
    }
}