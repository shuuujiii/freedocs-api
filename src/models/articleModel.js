const mongoose = require('mongoose')
// const mongoosePaginate = require('mongoose-paginate-v2');
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
        likes: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: [],
        }],
        good: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: [],
        }],
        bad: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: [],
        }]
    }
)

ArticleSchema.plugin(aggregatePaginate);
module.exports = mongoose.model('Article', ArticleSchema)