let chai = require('chai');
let chaiHttp = require('chai-http');
let should = chai.should();
const app = require('../app.js')
const { StatusCodes } = require('http-status-codes');
const User = require('../models/userModel')
const bc = require('../utils/bcrypto');
const defaultUser = { username: 'nabe', password: 'abcdefgh' }
chai.use(chaiHttp);
beforeEach(async () => { //Before each test we empty the database
    await User.deleteMany({})
    await User.create({ username: defaultUser.username, password: bc.hashPassword(defaultUser.password) })
});
describe('Create User', () => {
    it('should create user', (done) => {
        chai.request(app)
            .post('/api/v1/users')
            .send({ username: 'nabeshi', password: "abcdefgh" })
            .end((err, res) => {
                res.should.have.status(StatusCodes.CREATED)
                res.body.username.should.to.eql('nabeshi')
                done();
            })
    });
    it('it should not create duplicate user', (done) => {
        chai.request(app)
            .post('/api/v1/users')
            .send({ username: 'nabe', password: "abcdefghi" })
            .end((err, res) => {
                res.should.have.status(StatusCodes.CONFLICT)
                done();
            })
    });
    it('it should not create username with space', (done) => {
        chai.request(app)
            .post('/api/v1/users')
            .send({ username: 'na be', password: "abcdefghi" })
            .end((err, res) => {
                res.should.have.status(StatusCodes.BAD_REQUEST)
                done();
            })
    });
    it('it should not create user with number password', (done) => {
        chai.request(app)
            .post('/api/v1/users')
            .send({ username: 'nabeshi', password: 12345678 })
            .end((err, res) => {
                res.should.have.status(StatusCodes.BAD_REQUEST)
                done();
            })
    });
});

describe('login user', () => {
    it('should login user', (done) => {
        chai
            .request(app)
            .post("/api/v1/users/login")
            .send(defaultUser)
            .end((err, res) => {
                // token = res.body.token;
                res.body.should.have.property('token')
                res.should.have.status(StatusCodes.OK);
                done();
            });
    });
    it('should not login user with invalid password', (done) => {
        chai
            .request(app)
            .post("/api/v1/users/login")
            .send({ username: defaultUser.username, password: 'invalidpassword' })
            .end((err, res) => {
                // token = res.body.token;
                res.body.should.not.have.property('token')
                res.should.have.status(StatusCodes.UNAUTHORIZED);
                done();
            });
    });

});

let token;

describe('Authenticated', () => {
    beforeEach(done => {
        chai
            .request(app)
            .post("/api/v1/users/login")
            .send(defaultUser)
            .end((err, res) => {
                token = res.body.token;
                res.should.have.status(200);
                done();
            });
    });
    describe('Read User', () => {
        it('it should read user', (done) => {
            chai.request(app)
                .get('/api/v1/users')
                .query({ username: defaultUser.username })
                .set({ Authorization: `Bearer ${token}` })
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
                .set({ Authorization: `Bearer ${token}` })
                .end((err, res) => {
                    res.should.have.status(StatusCodes.UNAUTHORIZED);
                    // res.body.message.should.to.eql('user not found')
                    done();
                });
        });
    });


    describe('Update User', () => {
        it('should update user', (done) => {
            chai.request(app)
                .put('/api/v1/users')
                .send({ username: 'nabe', admin: true })
                .set({ Authorization: `Bearer ${token}` })
                .end((err, res) => {
                    res.body.admin.should.to.eql(true)
                    done();
                })
        });
        it('should not update user with invalid parameter', (done) => {
            chai.request(app)
                .put('/api/v1/users')
                .send({ username: 'nabe', admin: "aaa" })
                .set({ Authorization: `Bearer ${token}` })
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
                .set({ Authorization: `Bearer ${token}` })
                .end((err, res) => {
                    res.body.deletedCount.should.to.eql(1)
                    done();
                })
        });
    });
});

