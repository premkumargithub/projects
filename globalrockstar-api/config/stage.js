module.exports = {
    address: '0.0.0.0',
    secret: 'Your secret here',
    db: process.env.LOCAL_DB ? 'mongodb://localhost/global-rockstar' : 'mongodb://devdblin.dmz.dd.loc/global-rockstar',
    upload: process.env['UPLOAD'] || 'http://upload.globalrockstar.devweb.diamonddogs.cc',
    agenda: {
        db: process.env.LOCAL_DB ? 'mongodb://localhost/global-rockstar-agenda' : 'mongodb://devdblin.dmz.dd.loc/global-rockstar-agenda',
        collection: 'agenda'
    },
    arena: 'http://localhost:3057',
    mandrill_api_key: 's1PFXGABZJApKa9iuFrFkw',
    redis: {
        port: 6379,
        host: process.env.LOCAL_DB || process.env.LOCAL_REDIS ? 'localhost' : 'devdblin.dmz.dd.loc',
        auth: process.env.LOCAL_DB || process.env.LOCAL_REDIS ? '' : 'eepho0tiupohnatiuc8ait7Wei9geigootheesae',
        scope: 'globalrockstar'
    },
    goodOptions: {
        subscribers: {
            'console': ['error']
        }
    },
    frontendUrl: 'http://frontend.globalrockstar.devweb.diamonddogs.cc',
    facebook: {
        artistUrl: 'https://facebook-profile-globalrockstar-devweb.diamonddogs.cc',
        arenaUrl: 'https://facebook-globalrockstar-devweb.diamonddogs.cc'
    },

    payPal: {
        defaultAccount: {
            sandbox: true,
            appId: 'APP-80W284485P519543T',
            userId: 'paypal-facilitator_api1.globalrockstar.com',
            password: '1406108653',
            signature: 'AIz5yf-uBBgyPv3K.ilO23PmZa1nAnn21ZVlEULBwKDBxeL6PvfK-qsz',
            grPayPalEmail: 'paypal-facilitator@globalrockstar.com'
        },
        microPaymentAccount: {
            sandbox: true,
            appId: 'APP-80W284485P519543T',
            userId: 'micropayment-facilitator_api1.globalrockstar.com',
            password: '3SLU2MYQD7N6NLVT',
            signature: 'AC-JAvmkfUEvzSa40h1eyYXC8VB1A1PhSxz5-kyeUMPKG-YWsPShwNJg',
            grPayPalEmail: 'micropayment-facilitator@globalrockstar.com'
        },
        ipnNotificationUrl: 'https://scarce-bells.usefinch.com',
        simple: {
            paymentUrl: 'https://www.sandbox.paypal.com/incontext?useraction=commit&token=',
            apiUrl: 'https://api-3t.sandbox.paypal.com/nvp'
        },
        chained: {
            paymentUrl: 'https://www.sandbox.paypal.com/webapps/adaptivepayment/flow/pay'
        }
    },
    payPal_live: {
        sandbox: false,
        appId: 'APP-0S7361879R428462U',
        grPayPalEmail: 'paypal@globalrockstar.com',
        user: 'paypal_api1.globalrockstar.com',
        password: 'V4UCJB7APNSKD28Z',
        signature: 'AUuNxgwKiIzZ.9l5eJGjSk.ZhSsdAHLb2qjTDDiYktyfmh4xlNFmT3tW',
        simple: {
            paymentUrl: 'https://www.paypal.com/incontext?useraction=commit&token=',
            apiUrl: 'https://api-3t.paypal.com/nvp'
        },
        chained: {
            paymentUrl: 'https://www.paypal.com/webapps/adaptivepayment/flow/pay'
        }

    },
    twitter: {
        key: '8gmJNgzYEsxKZGF12X5WayPpR',
        secret: 'mbHiV8c0psLls6m66qxJa8ErIAcS4aJfpCqXKUlicxkCTCUqC9'
    }
};
