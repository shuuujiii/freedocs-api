let chai = require('chai');
let chaiHttp = require('chai-http');
// let should = chai.should();
let expect = chai.expect;
const app = require('../app.js')
const { StatusCodes } = require('http-status-codes');
const User = require('../models/userModel')
const bc = require('../utils/bcrypto');
const jwt = require('jsonwebtoken');
const defaultUser = {
    username: 'defaultuser',
    password: 'defaultuser',
    email: 'freedocsfordev@gmail.com',
    authEmail: true
}

chai.use(chaiHttp);
let user
beforeEach(async () => { //Before each test we empty the database
    await User.deleteMany({})
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

describe.only('/user', () => {
    describe('/user/create', () => {
        let agent
        beforeEach(() => {
            agent = chai.request.agent(app)
        })

        afterEach(() => {
            agent.close()
        })
        it('should create user', (done) => {
            agent.post('/api/v1/user/create')
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
                .post('/api/v1/user/create')
                .send({ username: 'defaultuser', password: "abcdefghi" })
                .end((err, res) => {
                    res.should.have.status(StatusCodes.CONFLICT)
                    done();
                })
        });
        it('it should not create username with space', (done) => {
            agent
                .post('/api/v1/user/create')
                .send({ username: 'na be', password: "abcdefghi" })
                .end((err, res) => {
                    res.should.have.status(StatusCodes.BAD_REQUEST)
                    done();
                })
        });
        it('it should not create user with number password', (done) => {
            agent
                .post('/api/v1/user/create')
                .send({ username: 'nabeshi', password: 12345678 })
                .end((err, res) => {
                    res.should.have.status(StatusCodes.BAD_REQUEST)
                    done();
                })
        });
    });

    describe('post /user/login', () => {
        it('should login user', (done) => {
            chai.request(app)
                .post("/api/v1/user/login")
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
                .post("/api/v1/user/login")
                .send({ username: defaultUser.username, password: 'invalidpassword' })
                .end((err, res) => {
                    // res.body.should.not.have.property('token')
                    expect(res).to.have.cookie('connect.sid');
                    res.should.have.status(StatusCodes.UNAUTHORIZED);
                    done();
                });
        });
    });
    describe('after user login', () => {
        let agent
        let loginUser = null
        beforeEach(function (done) {
            agent = chai.request.agent(app)
            agent
                .post("/api/v1/user/login")
                .send(defaultUser)
                .end((err, res) => {
                    expect(res).to.have.cookie('connect.sid');
                    res.should.have.status(StatusCodes.OK);
                    loginUser = res.body.user
                    // console.log('loginuser', loginUser)
                    done();
                });
        });
        afterEach(() => {
            agent.close()
            loginUser = null
        })
        // beforeEach(done => {
        //     chai
        //         .request(app)
        //         .post("/api/v1/user/login")
        //         .send(defaultUser)
        //         .end((err, res) => {
        //             token = res.body.token;
        //             res.should.have.status(200);
        //             done();
        //         });
        // });
        describe('/user/update', () => {
            it('should update user', (done) => {
                agent.put('/api/v1/user/update')
                    .send({ username: 'nabe', admin: true })
                    .end((err, res) => {
                        expect(res.body.username).to.equal('nabe')
                        done();
                    })
            });
            it('should not update user with invalid parameter', (done) => {
                agent
                    .put('/api/v1/user/update')
                    .send({ username: 'nabe', admin: "aaa" })
                    .end((err, res) => {
                        res.should.have.status(StatusCodes.BAD_REQUEST)
                        done()
                    })
            });
            it('should not update user with invalid parameter', (done) => {
                agent.put('/api/v1/user/update')
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

                agent.put('/api/v1/user/update')
                    .send({ username: 'duplicateuser', admin: true })
                    .end((err, res) => {
                        res.should.have.status(StatusCodes.CONFLICT)
                        done()
                    })
            });
        });
        describe('/user/delete', () => {
            it('should delete user', (done) => {
                agent.delete('/api/v1/user/delete')
                    .end((err, res) => {
                        res.should.have.status(StatusCodes.OK);
                        done();
                    })
            });
        });
        // todo should test db clear correctly
        describe('/user/logout', () => {
            it('should logout user', (done) => {
                agent.post('/api/v1/user/logout')
                    .end((err, res) => {
                        res.should.have.status(StatusCodes.OK);
                        expect(res).not.to.have.cookie('connect.sid');
                        expect(err).to.equal(null)
                        done();
                    })
            });
        });
        // describe('/user/logout', () => {
        //     it('should logout user', (done) => {
        //         agent.post('/api/v1/user/logout')
        //             .end((err, res) => {
        //                 res.should.have.status(StatusCodes.OK);
        //                 expect(res).not.to.have.cookie('connect.sid');
        //                 expect(err).to.equal(null)
        //                 done();
        //             })
        //     });
        // });
        describe('/user/silent', () => {
            it('should authenticate', (done) => {
                agent.post('/api/v1/user/silent')
                    .end((err, res) => {
                        res.should.have.status(StatusCodes.OK);
                        // how to test session .token has changed?
                        // expect(res).to.have.cookie('connect.sid');
                        expect(res.body.payload.user).to.have.property('_id')
                        expect(res.body.payload.user).to.have.property('username')
                        expect(res.body.payload.user.username).to.equal('defaultuser')
                        expect(res.body.payload.user).to.have.property('authEmail')
                        expect(res.body.payload.user).to.have.property('admin')
                        expect(res.body.payload.user).not.to.have.property('password')
                        expect(err).to.equal(null)
                        done();
                    })
            });
        });
        // /auth/email

        // /changepassword
        describe('/user/changepassword', () => {
            it('should change password', (done) => {
                agent.post('/api/v1/user/changepassword')
                    .send({
                        oldPassword: 'defaultuser',
                        newPassword: 'newpassword'
                    })
                    .end((err, res) => {
                        res.should.have.status(StatusCodes.OK);
                        expect(res.body.message).to.equal('password changed');
                        expect(err).to.equal(null)
                        done();
                    })
            });
            it('should not change password', (done) => {
                agent.post('/api/v1/user/changepassword')
                    .send({
                        oldPassword: 'invalidpassword',
                        newPassword: 'newpassword'
                    })
                    .end((err, res) => {
                        res.should.have.status(StatusCodes.UNAUTHORIZED);
                        // expect(err).to.equal(null)
                        done();
                    })
            });
        });
        // change email
        describe('/user/changeemail', () => {
            it('should change email', (done) => {
                agent.post('/api/v1/user/changeemail')
                    .send({
                        email: 'newaddress@gmail.xxx',
                    })
                    .end((err, res) => {
                        res.should.have.status(StatusCodes.OK);
                        expect(res.body.user).to.have.property('username');
                        expect(res.body.user.username).to.equal('defaultuser');
                        expect(res.body.user).to.have.property('email');
                        expect(res.body.user.email).to.equal('newaddress@gmail.xxx');
                        expect(res.body.user).to.have.property('authEmail');
                        expect(res.body.user.authEmail).to.equal(false);
                        expect(err).to.equal(null)
                        done();
                    })
            });
        });

    });
    describe('/user/auth/email', () => {
        it('should authenticate email', (done) => {
            const defaultEmailOptions = {
                expiresIn: '2d',
                issuer: 'shuji watanabe'
            }
            const createEmailToken = (payload, options = defaultEmailOptions) => {
                return jwt.sign(payload, process.env.EMAIL_SECRET, options)
            }
            const emailToken = createEmailToken({ user: defaultUser })
            chai.request(app)
                .post('/api/v1/user/auth/email')
                .send({ token: emailToken })
                .end((err, res) => {
                    res.should.have.status(StatusCodes.OK);
                    expect(err).to.equal(null)
                    done();
                })
        });
        it('should not authenticate email by invalid token', (done) => {
            const emailToken = 'afafoajaoeijapwojfa'
            chai.request(app)
                .post('/api/v1/user/auth/email')
                .send({ token: emailToken })
                .end((err, res) => {
                    res.should.have.status(StatusCodes.INTERNAL_SERVER_ERROR);
                    done();
                })
        });
    });
    // /forgotpassword
    describe('/user/forgotpassword', () => {
        it('should send email', (done) => {
            chai.request(app)
                .post('/api/v1/user/forgotpassword')
                .send({ email: 'freedocsfordev@gmail.com' })
                .end((err, res) => {
                    res.should.have.status(StatusCodes.OK);
                    expect(res.body.message).to.equal('send email')
                    expect(err).to.equal(null)
                    done();
                })
        });
        it('should not send email to not email authorized', (done) => {
            chai.request(app).post('/api/v1/user/forgotpassword')
                .send({
                    email: 'test@gmail.xxx',
                })
                .end((err, res) => {
                    res.should.have.status(StatusCodes.NO_CONTENT);
                    done();
                })
        });
    });
    // resetpassword
    describe('/user/resetpassword', () => {
        it('should reset password', (done) => {
            const defaultEmailOptions = {
                expiresIn: '2d',
                issuer: 'shuji watanabe'
            }
            const createEmailToken = (payload, options = defaultEmailOptions) => {
                return jwt.sign(payload, process.env.EMAIL_SECRET, options)
            }
            const emailToken = createEmailToken({ user: user })
            chai.request(app)
                .post('/api/v1/user/resetpassword')
                .send({ token: emailToken, password: 'newpassword' })
                .end((err, res) => {
                    res.should.have.status(StatusCodes.OK);
                    expect(res.body.message).to.equal('password changed')
                    expect(err).to.equal(null)
                    done();
                })
        });
        it('should not change password with invalid token', (done) => {
            chai.request(app).post('/api/v1/user/resetpassword')
                .send({
                    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImF1dGhFbWFpbCI6dHJ1ZSwiYWRtaW4iOmZhbHNlLCJfaWQiOiI2MGFhMGQwMjcyMjU4NzQ2YzRlNjFlY2MiLCJ1c2VybmFtZSI6ImRlZmF1bHR1c2VyIiwicGFzc3dvcmQiOiIkMmIkMTAkcjBleDJLbnBtb0RMQXl1d2Z5NFFaZW9QbjRjaUo1enZyenlFeXZaWlhvMHJSbDN2cERrdW0iLCJlbWFpbCI6ImZyZWVkb2NzZm9yZGV2QGdtYWlsLmNvbSIsIl9fdiI6MH0sImlhdCI6MTYyMTc1NzE4NiwiZXhwIjoxNjIxOTI5OTg2LCJpc3MiOiJzaHVqaSB3YXRhbmFiZSJ9.8EBnn2L11MRW6ZE1hnyV1S9eMJpNb9ZBZn8m4qhIcZa',
                    password: 'newpassword'
                })
                .end((err, res) => {
                    res.should.have.status(StatusCodes.INTERNAL_SERVER_ERROR);
                    done();
                })
        });
    })

    // profile
    describe('/user/profile', () => {
        it('should get user profile', (done) => {
            chai.request(app)
                .get('/api/v1/user/profile?username=defaultuser')
                .end((err, res) => {
                    res.should.have.status(StatusCodes.OK);
                    expect(res.body).to.have.property('username')
                    expect(res.body.username).to.equal('defaultuser')
                    expect(res.body).to.have.property('posts')
                    expect(res.body.posts).to.equal(0)
                    expect(err).to.equal(null)
                    done();
                })
        });

    })
})


