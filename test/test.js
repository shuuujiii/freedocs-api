let chai = require('chai');
let chaiHttp = require('chai-http');
let should = chai.should();
const app = require('../app.js')
const { StatusCodes } = require('http-status-codes');

const User = require('../models/userModel')
const bc = require('../utils/bcrypto')
chai.use(chaiHttp);
beforeEach(async () => { //Before each test we empty the database
    await User.deleteMany({})
    await User.create({ username: 'nabe', password: bc.hashPassword('abcd') })
    // User.deleteMany({}, (err) => {
    //     // done();
    // });
    // User.create({ username: 'nabe', password: bc.hashPassword('abcd') }, (err) => {
    //     done()
    // })
});
describe('Create User', () => {
    it('should create user', (done) => {
        chai.request(app)
            .put('/api/v1/users')
            .send({ username: 'nabeshi', password: "aaaa" })
            .end((err, res) => {
                res.should.have.status(StatusCodes.CREATED)
                res.body.username.should.to.eql('nabeshi')
                done();
            })
    });
    it('it should not create duplicate user', (done) => {
        chai.request(app)
            .put('/api/v1/users')
            .send({ username: 'nabe', password: "aaaa" })
            .end((err, res) => {
                res.should.have.status(StatusCodes.CONFLICT)
                done();
            })
    });
});

describe('Read User', () => {
    it('it should read user', (done) => {
        chai.request(app)
            .get('/api/v1/users')
            .query({ username: 'nabe' })
            .end((err, res) => {
                res.should.have.status(StatusCodes.OK);
                res.body.username.should.to.eql('nabe')
                done();
            });
    });
    it('should not read user', (done) => {
        chai.request(app)
            .get('/api/v1/users')
            .query({ username: 'nabenotexist' })
            .end((err, res) => {
                res.should.have.status(StatusCodes.NOT_FOUND);
                res.body.message.should.to.eql('user not found')
                done();
            });
    });
});


describe('Update User', () => {
    it('should update user', (done) => {
        chai.request(app)
            .post('/api/v1/users')
            .send({ username: 'nabe', admin: true })
            .end((err, res) => {
                res.body.admin.should.to.eql(true)
                done();
            })
    });
    it('should not update user with invalid parameter', (done) => {
        chai.request(app)
            .post('/api/v1/users')
            .send({ username: 'nabe', admin: "aaa" })
            .end((err, res) => {
                res.should.have.status(StatusCodes.BAD_REQUEST)
                done()
            })
    });
});
describe('Delete User', () => {
    it('should delete user', (done) => {
        chai.request(app)
            .delete('/api/v1/users')
            .send({ 'username': 'nabe' })
            .end((err, res) => {
                res.body.deletedCount.should.to.eql(1)
                done();
            })
    });
});
