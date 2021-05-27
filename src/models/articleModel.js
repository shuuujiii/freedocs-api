const mongoose = require('mongoose')
const aggregatePaginate = require('mongoose-aggregate-paginate-v2');
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
        },
        favoriteUsers: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        }],
        upvoteUsers: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        }],
        downvoteUsers: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        }],
        createdAt: {
            type: mongoose.Schema.Types.Date,
        },
        updatedAt: {
            type: mongoose.Schema.Types.Date,
        }
    }, {
    timestamps: true
}
)

ArticleSchema.plugin(aggregatePaginate);
module.exports = mongoose.model('Article', ArticleSchema)