const mongoose = require('mongoose')

const CommentSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        article: { type: mongoose.Schema.Types.ObjectId, ref: 'Article' },
        parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment' },
        children: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
        comment: {
            type: String,
        },
        depth: {
            type: Number,
        }
    }, {
    timestamps: true
})

const autoPopulateChildren = function (next) {
    this.populate('children')
    next();
};

CommentSchema
    .pre('findOne', autoPopulateChildren)
    .pre('find', autoPopulateChildren)
// .pre('remove', async function (next) {
//     const deleteId = this.id
//     const children = await this.model('Comment').deleteMany({ _id: { $in: this.children } })
//     const parent = await this.model('Comment').updateOne({ children: { $in: deleteId } }, {
//         $pull: {
//             children: deleteId
//         }
//     }, { new: true })
//     next();
// })

module.exports = mongoose.model('Comment', CommentSchema)