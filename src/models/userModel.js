const mongoose = require('mongoose');
var UserSchema = new mongoose.Schema(
    {
        username: {
            type: 'String',
            required: true,
            trim: true,
        },
        password: {
            type: 'String',
            required: true,
            trim: true
        },
        email: {
            type: String,
            trim: true,
        },
        authEmail: {
            type: Boolean,
            default: false
        },
        admin: {
            type: Boolean,
            default: false,
        }
    }, {
    timestamps: false
})

// UserSchema.pre('save', function (next) {
//     const user = this;
//     if (!user.isModified || !user.isNew) { // don't rehash if it's an old user
//         next();
//     } else {
//         bcrypt.hash(user.password, stage.saltingRounds, function (err, hash) {
//             if (err) {
//                 console.log('Error hashing password for user', user.name);
//                 next(err);
//             } else {
//                 user.password = hash;
//                 next();
//             }
//         });
//     }
// });


module.exports = mongoose.model('User', UserSchema)