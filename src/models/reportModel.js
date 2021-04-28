const mongoose = require('mongoose')
let ReportSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            require: true,
        },
        detail: {
            type: String,
        },
        article: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Article',
            require: true,
        }],
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            require: true,
        },
    }
)

module.exports = mongoose.model('Report', ReportSchema)