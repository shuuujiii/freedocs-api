const mongoose = require('mongoose')

let ArticleSchema = new mongoose.Schema(
    {
        url: {
            type: String,
            require: true
        },
        description: {
            type: String,
        },
        tags: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Tag'
        }],
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            require: true,
        }
    }
)

module.exports = mongoose.model('Article', ArticleSchema)