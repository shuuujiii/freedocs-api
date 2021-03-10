const mongoose = require('mongoose')

let ArticleSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            require: true,
        },
        url: {
            type: String,
            require: true
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            require: true,
        }
    }
)

module.exports = mongoose.model('Article', ArticleSchema)