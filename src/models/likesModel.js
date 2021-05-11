const mongoose = require('mongoose')
// const mongoosePaginate = require('mongoose-paginate-v2');
let LikesSchema = new mongoose.Schema(
    {
        article: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Article',
            require: true
        },
        users: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: [],
        }],
    }
)

module.exports = mongoose.model('Likes', LikesSchema)