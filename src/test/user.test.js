let chai = require('chai');
let chaiHttp = require('chai-http');
// let should = chai.should();
let expect = chai.expect;
const app = require('../app.js')
const { StatusCodes } = require('http-status-codes');
const User = require('../models/userModel')
const bc = require('../utils/bcrypto');
const defaultUser = { username: 'defaultuser', password: 'defaultuser' }
chai.use(chaiHttp);
beforeEach(async () => { //Before each test we empty the database
    await User.deleteMany({})
    await User.create({ username: defaultUser.username, password: bc.hashPassword(defaultUser.password) })
});

describe.only('Users', () => {
    describe('post /users', () => {
        let agent
        beforeEach(() => {
            agent = chai.request.agent(app)
        })

        afterEach(() => {
            agent.close()
        })
        it('should create user', (done) => {
            agent.post('/api/v1/users')
                .send({
                    username: 'nabeshi',
                    email: 'test@gmail.com',
                    password: "abcdefgh",
                })
                .end((err, res) => {
                    expect(res).to.have.cookie('connect.sid');
                    expect(res).to.have.status(StatusCodes.CREATED)
                    expect(res.body.user).to.have.property('_id')
                    expect(res.body.user.username).to.equal('nabeshi')
                    expect(res.body.user.email).to.equal('test@gmail.com')
                    expect(res.body.user.authEmail).to.equal(false)
                    expect(res.body.user.admin).to.equal(false)
                    done()
                })
        });
        it('it should not create duplicate user', (done) => {
            agent
                .post('/api/v1/users')
                .send({ username: 'defaultuser', password: "abcdefghi" })
                .end((err, res) => {
                    res.should.have.status(StatusCodes.CONFLICT)
                    done();
                })
        });
        it('it should not create username with space', (done) => {
            agent
                .post('/api/v1/users')
                .send({ username: 'na be', password: "abcdefghi" })
                .end((err, res) => {
                    res.should.have.status(StatusCodes.BAD_REQUEST)
                    done();
                })
        });
        it('it should not create user with number password', (done) => {
            agent
                .post('/api/v1/users')
                .send({ username: 'nabeshi', password: 12345678 })
                .end((err, res) => {
                    res.should.have.status(StatusCodes.BAD_REQUEST)
                    done();
                })
        });
    });

    describe('post /users/login', () => {
        it('should login user', (done) => {
            chai.request(app)
                .post("/api/v1/users/login")
                .send(defaultUser)
                .end((err, res) => {
                    // expect(res).to.have.cookie('connect.sid');
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
                    // res.body.should.not.have.property('token')
                    expect(res).to.have.cookie('connect.sid');
                    res.should.have.status(StatusCodes.UNAUTHORIZED);
                    done();
                });
        });

    });
    describe('validate user', () => {
        let agent
        beforeEach(function (done) {
            agent = chai.request.agent(app)
            agent
                .post("/api/v1/users/login")
                .send(defaultUser)
                .end((err, res) => {
                    expect(res).to.have.cookie('connect.sid');
                    res.should.have.status(StatusCodes.OK);
                    done();
                });
        });
        afterEach(() => {
            agent.close()
        })
        // beforeEach(done => {
        //     chai
        //         .request(app)
        //         .post("/api/v1/users/login")
        //         .send(defaultUser)
        //         .end((err, res) => {
        //             token = res.body.token;
        //             res.should.have.status(200);
        //             done();
        //         });
        // });
        describe('put /users', () => {
            it('should update user', (done) => {
                agent.put('/api/v1/users')
                    .send({ username: 'nabe', admin: true })
                    .end((err, res) => {
                        expect(res.body.username).to.equal('nabe')
                        done();
                    })
            });
            it('should not update user with invalid parameter', (done) => {
                agent
                    .put('/api/v1/users')
                    .send({ username: 'nabe', admin: "aaa" })
                    .end((err, res) => {
                        res.should.have.status(StatusCodes.BAD_REQUEST)
                        done()
                    })
            });
            it('should not update user with invalid parameter', (done) => {
                agent.put('/api/v1/users')
                    .send({ username: 'nabe', admin: "aaa" })
                    .end((err, res) => {
                        res.should.have.status(StatusCodes.BAD_REQUEST)
                        done()
                    })
            });
            it('should not update user with duplicate username', (done) => {
                const createdupUser = async () => {
                    await User.create({ username: 'duplicateuser', password: bc.hashPassword('duplicateuser') })
                }
                createdupUser()

                agent.put('/api/v1/users')
                    .send({ username: 'duplicateuser', admin: true })
                    .end((err, res) => {
                        res.should.have.status(StatusCodes.CONFLICT)
                        done()
                    })
            });
        });
        describe('Delete User', () => {
            it('should delete user', (done) => {
                agent.delete('/api/v1/users')
                    .end((err, res) => {
                        res.should.have.status(StatusCodes.OK);
                        done();
                    })
            });
        });
        // todo should test db clear correctly

        // logout
        // /silent
        // /auth/email
        // /changepassword
        // /forgotpassword
        // resetpassword
        // profile
    });
})


