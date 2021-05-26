let chai = require('chai');
require('../app.js')
let expect = chai.expect;
const User = require('../models/userModel')
const UserService = require('../services/userService')
const bc = require('../utils/bcrypto');
let user

const defaultUser = {
    username: 'defaultuser',
    password: 'defaultuser',
    email: 'freedocsfordev@gmail.com',
    authEmail: true
}

describe('deleteUser', () => {
    beforeEach(async () => { //Before each test we empty the database
        await User.deleteMany({})
        user = await User.create({
            username: defaultUser.username,
            password: bc.hashPassword(defaultUser.password),
            email: defaultUser.email,
            authEmail: defaultUser.authEmail
        })
        console.log('userservice beforeeach called')
    });
    afterEach(() => {
        user = null
    })
    it('should delete user data', async () => {
        await UserService.deleteUser(user._id)
        const u = await User.findById(user._id)
        expect(u).to.be.null
    })
})
