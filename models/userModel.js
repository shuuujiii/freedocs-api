var mongoose = require('mongoose')

var UserSchema = new mongoose.Schema(
    {
        username: { type: String },
        email: { type: String },
    }, {
    timestamps: false
})

module.exports = mongoose.model('User', UserSchema)