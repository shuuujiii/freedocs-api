const mongoose = require('mongoose')
let VoteModel = new mongoose.Schema(
    {
        article: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Article',
            require: true
        },
        upvoteUsers: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: [],
        }],
        downvoteUsers: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: [],
        }],
    }
)

module.exports = mongoose.model('Vote', VoteModel)