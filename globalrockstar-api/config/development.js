if (process.env.LOCAL_DB) {
    console.log("Using Local DB");
} else {
    console.log("Using Remote DB");
}

if (process.env.LOCAL_ELASTIC) {
    console.log("Using Local Elasticsearch");
} else {
    console.log("Using Remote Elasticsearch");
}

module.exports = {
    address: '0.0.0.0',
    secret: 'Your secret here',
    db: process.env.LOCAL_DB ? 'mongodb://localhost/global-rockstar' : 'mongodb://devdb/global-rockstar',
    upload: process.env['UPLOAD'] || 'http://upload.globalrockstar.devweb.globalrockstar.com',
    arena: 'http://localhost:3011',
    agenda: {
        db: process.env.LOCAL_DB ? 'mongodb://localhost/global-rockstar-agenda' : 'mongodb://devdb/global-rockstar-agenda',
        collection: 'agenda'
    },
    mandrill_api_key: 's1PFXGABZJApKa9iuFrFkw   <---   Are we sure that we are not sending email during our tests?',
    redis: {
        port: 6379,
        host: process.env.LOCAL_DB ? 'localhost' : 'devdb',
        auth: process.env.LOCAL_DB ? '' : 'ahkoogh7rah1deifohsh1Eik1Paida',
        scope: 'globalrockstar'
    },
    goodOptions: {
        subscribers: {
            'console': ['error']
        }
    },
    es: {
        port: 9200,
        host: process.env.LOCAL_ELASITC ? 'localhost' : 'devdb',
        index: 'globalrockstar'
    },
    frontendUrl: 'http://localhost:4000',
    facebook: {
        artistUrl: 'https://localhost:3443',
        arenaUrl: 'https://localhost:3444'
    },

    // Sabdbox
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

    twitter: {
        key: '41zF7wKiFyVKepqJFaVPyiiOc',
        secret: 'Rig53e52Orgt2YRbb7H9vu1e5UA6q24tgdOURAoV6pWJtc7dlM'
    }
};
