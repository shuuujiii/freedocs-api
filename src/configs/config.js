module.exports = {
    development: {
        dbUri: process.env.MONGODB_URI_LOCAL,
        port: process.env.PORT || 5000,
        saltingRounds: 11,
        cookie: {
            sameSite: 'lax',
            secure: false,
        }
    },
    test: {
        dbUri: process.env.MONGODB_URI_TEST,
        port: process.env.PORT || 5000,
        saltingRounds: 10,
        cookie: {
            sameSite: 'lax',
            secure: false,
        }
    },
    staging: {
        dbUri: process.env.MONGODB_URI_STAGING,
        port: process.env.PORT || 5000,
        saltingRounds: 10,
        cookie: {
            sameSite: 'none',
            secure: true,
        }
    },
    production: {
        dbUri: process.env.MONGODB_URI_PRODUCTION,
        port: process.env.PORT || 5000,
        saltingRounds: 10,
        cookie: {
            sameSite: 'none',
            secure: true,
        }
    }
}