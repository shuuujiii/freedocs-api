let chai = require('chai');
require('../app.js')
let expect = chai.expect;
const chaiAsPromised = require('chai-as-promised');
const User = require('../models/userModel')
const Article = require('../models/articleModel')
const Comment = require('../models/commentModel')

const UserService = require('../services/userService')
const bc = require('../utils/bcrypto');
chai.use(chaiAsPromised)
let user

const defaultUser = {
    username: 'defaultuser',
    password: 'defaultuser',
    email: 'freedocsfordev@gmail.com',
    authEmail: true
}

describe.only('UserService', () => {
    beforeEach(async () => { //Before each test we empty the database
        await User.deleteMany({})
        await Article.deleteMany({})
        await Comment.deleteMany({})
        user = await User.create({
            username: defaultUser.username,
            password: bc.hashPassword(defaultUser.password),
            email: defaultUser.email,
            authEmail: defaultUser.authEmail
        })
    });
    afterEach(() => {
        user = null
    })
    it('findByUserId', async () => {
        const findUser = await UserService.findUserById(user._id)
        expect(findUser).not.to.be.null
        expect(findUser._id.toString()).to.equal(user._id.toString())
    })
    it('findUserByUsername', async () => {
        const findUser = await UserService.findUserByUsername(user.username)
        expect(findUser).not.to.be.null
        expect(findUser._id.toString()).to.equal(user._id.toString())
    })
    it('findUserWithAuthEmail', async () => {
        const findUser = await UserService.findUserWithAuthEmail(user.email)
        expect(findUser).not.to.be.null
        expect(findUser._id.toString()).to.equal(user._id.toString())
    })
    it('checkUsernameDuplicated', async () => {
        await expect(UserService.checkUsernameDuplicated('newuser')).to.be.fulfilled
        await expect(UserService.checkUsernameDuplicated('defaultuser')).to.be.rejected
    })
    it('comparePassword', async () => {
        await expect(UserService.comparePassword('defaultuser', user.password)).to.be.fulfilled
        await expect(UserService.comparePassword('invalidpassword', user.password)).to.be.rejected
    })
    it('createUserValidation', async () => {
        await expect(UserService.createUserValidation('testuser', 'password', 'test@gmail.com')).to.be.fulfilled
        await expect(UserService.createUserValidation('', 'password', 'test@gmail.com')).to.be.rejected;
        await expect(UserService.createUserValidation('testuser', '', 'test@gmail.com')).to.be.rejected;
        await expect(UserService.createUserValidation('testuser', 'passwor', 'test@gmail.com')).to.be.rejected;
    })
    it('updateUserValidation', async () => {
        await expect(UserService.updateUserValidation({ username: 'testuser', password: 'abcdefgh', email: 'test@gmail.com' })).to.be.fulfilled
        await expect(UserService.updateUserValidation({ username: 'ab' })).to.be.rejected
        await expect(UserService.updateUserValidation({ username: 'aaaaaaaaaabbbbbbbbbbcccccccccca' })).to.be.rejected
        await expect(UserService.updateUserValidation({ password: 'abcdef' })).to.be.rejected
        await expect(UserService.updateUserValidation({ password: 'aaaaaaaaaabbbbbbbbbbcccccccccca' })).to.be.rejected
        await expect(UserService.updateUserValidation({ email: 'abcdefg' })).to.be.rejected
        await expect(UserService.updateUserValidation({ admin: 'aaa' })).to.be.rejected

    })
    it('createUser', async () => {
        const createdUser = await UserService.createUser('testuser', 'password', 'test@gmail.com')
        expect(createdUser).not.to.be.null
        expect(createdUser.username).to.equal('testuser')
        expect(createdUser.password).not.to.equal('password')
        expect(createdUser.email).to.equal('test@gmail.com')
        expect(createdUser.authEmail).to.equal(false)

    })
    it('findOneAndUpdateUser', async () => {
        const updatedUser = await UserService.findOneAndUpdateUser(user._id, { username: 'updateuser', email: 'update@gmail.com', authEmail: true })
        expect(updatedUser).not.to.be.null
        expect(updatedUser.username).to.equal('updateuser')
        expect(updatedUser.email).to.equal('update@gmail.com')
        expect(updatedUser.authEmail).to.equal(true)
    })
    it('should delete user data', async () => {
        const activeuser = await User.create({ username: 'activeuser', password: 'activeuser', email: '' })
        const activeUserArticle = await Article.insertMany([
            {
                url: 'http://othersarticle1.com',
                upvoteUsers: [activeuser._id, user._id],
                downvoteUsers: [activeuser._id, user._id],
                favoriteUsers: [activeuser._id, user._id],
                user: activeuser._id
            },
            {
                url: 'http://ownarticle1.com',
                user: user._id
            }, {
                url: 'http://ownarticle2.com',
                user: user._id
            }])

        const commentedArticle = await Article.create(
            {
                url: 'http://comment1.com',
                user: activeuser._id
            })

        const firstCommentToOne = await Comment.create({
            article: commentedArticle._id,
            comment: 'user comment',
            user: user._id,
            parent: null,
            children: [],
            depth: 1,
        })
        const secondCommentToOne = await Comment.create({
            article: commentedArticle._id,
            comment: 'reply to default user',
            user: activeuser._id,
            parent: firstCommentToOne._id,
            children: [],
            depth: 2
        })
        await Comment.findByIdAndUpdate(firstCommentToOne._id, {
            $push: {
                children: secondCommentToOne._id
            }
        })

        await UserService.deleteUser(user._id)
        const article1 = await Article.findOne({ url: 'http://othersarticle1.com' })
        // upvote should be deleted
        expect(article1.upvoteUsers).to.have.length(1)
        expect(article1.upvoteUsers[0].toString()).to.equal(activeuser._id.toString())
        // downvote should be deleted
        expect(article1.downvoteUsers).to.have.length(1)
        expect(article1.downvoteUsers[0].toString()).to.equal(activeuser._id.toString())
        // favirite should be deleted
        expect(article1.favoriteUsers).to.have.length(1)
        expect(article1.favoriteUsers[0].toString()).to.equal(activeuser._id.toString())

        // comments should be deleted
        const deletedUserComment = await Comment.findOne({ user: user._id })
        expect(deletedUserComment).to.be.null
        const comments = await Comment.find({ article: commentedArticle._id, parent: null })

        // posted articles should be deleted
        const postedArticles = await Article.find({ user: user._id })
        expect(postedArticles).to.have.length(0)

        // user account should be deleted
        const u = await User.findById(user._id)
        expect(u).to.be.null
    })
    it('getProfile', async () => {
        const profile = await UserService.getProfile(user.username)
        expect(profile).to.have.keys('_id', 'username', 'posts')
        expect(profile.username).to.equal('defaultuser')
        expect(profile.posts).to.equal(0)
    })

    it('login', async () => {
        const loginUser = await UserService.login(defaultUser.username, defaultUser.password)
        expect(loginUser.username).to.equal('defaultuser')
        expect(loginUser._id.toString()).to.equal(user._id.toString())
        await expect(UserService.login('notexistusername', defaultUser.password)).to.be.rejected
        await expect(UserService.login(defaultUser.username, 'invalidpassword')).to.be.rejected
    })
})
