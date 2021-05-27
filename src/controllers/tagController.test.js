const Tag = require('../models/tagModel')
const User = require('../models/userModel')
const sinon = require('sinon')
const chai = require('chai')
const expect = chai.expect
let chaiHttp = require('chai-http');
const app = require('../app.js')
const { StatusCodes } = require('http-status-codes');
const bc = require('../utils/bcrypto');

chai.use(chaiHttp)
const defaultUser = {
    username: 'defaultuser',
    password: 'defaultuser',
    email: 'freedocsfordev@gmail.com',
    authEmail: true
}
describe('tagController', () => {
    let agent
    let loginUser
    beforeEach(async () => {
        agent = chai.request.agent(app)
        await User.deleteMany({})
        await Tag.deleteMany({})
        await User.create({
            username: defaultUser.username,
            password: bc.hashPassword(defaultUser.password),
            email: defaultUser.email,
            authEmail: defaultUser.authEmail
        })

        const res = await agent
            .post("/api/v1/user/login")
            .send(defaultUser)
        loginUser = res.body.user
        expect(res).to.have.cookie('connect.sid');
        expect(res).to.have.status(StatusCodes.OK)

    })
    afterEach(() => {
        agent.close()
        loginUser = null
    })
    it('should create tag', async () => {
        const res = await agent.post('/api/v1/tag')
            .send({ name: 'newtag' })
        expect(res.body.name).to.equal('newtag')
    })
    it('should get tag if the name already exist', async () => {
        const existTag = await Tag.create({ name: 'exist' })
        const res = await agent.post('/api/v1/tag')
            .send({ name: 'exist' })
        expect(res.body._id).to.equal(existTag._id.toString())
    })
})
