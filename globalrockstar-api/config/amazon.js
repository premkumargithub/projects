if (!process.env.SEND_NOTIFICATIONS) {
    require('newrelic');
}

module.exports = {
    address: "0.0.0.0",
    secret: "sdhfgkajsdhbcjkdhbckauerzbjsdhbckaudzbca",
    db: 'mongodb://172.16.200.60/global-rockstar',
    upload: process.env['UPLOAD'] || 'http://localhost:3043',
    agenda: {
        db: 'mongodb://172.16.200.60/global-rockstar-agenda',
        collection: 'agenda'
    },
    arena: 'http://localhost:3045',
    mandrill_api_key: 'bcyRkNdPRPIKDa4q4rKUmw',
    redis: {
        port: 6379,
        host: '172.16.200.60',
        auth: 'ahkoogh7rah1deifohsh1Eik1Paida',
        scope: 'globalrockstar-prod'
    },
    goodOptions: {
        subscribers: {
            'udp://172.16.200.70:3004': ['request', 'error', 'ops']
        },
        opsInterval: 60000
    },
    twitter: {
        key: '8gmJNgzYEsxKZGF12X5WayPpR',
        secret: 'mbHiV8c0psLls6m66qxJa8ErIAcS4aJfpCqXKUlicxkCTCUqC9'
    },
    frontendUrl: 'https://www.globalrockstar.com',
    facebook: {
        artistUrl: 'https://facebook-artist.globalrockstar.com',
        arenaUrl: 'https://facebook-arena.globalrockstar.com'
    },
    payPal_sandbox: {
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
        ipnNotificationUrl: 'https://ipn.globalrockstar.com',
        simple: {
            paymentUrl: 'https://www.sandbox.paypal.com/incontext?useraction=commit&token=',
            apiUrl: 'https://api-3t.sandbox.paypal.com/nvp'
        },
        chained: {
            paymentUrl: 'https://www.sandbox.paypal.com/webapps/adaptivepayment/flow/pay'
        }
    },
    payPal: {
        defaultAccount: {
            sandbox: false,
            userId: 'paypal_api1.globalrockstar.com',
            appId: 'APP-0S7361879R428462U',
            password: 'V4UCJB7APNSKD28Z',
            signature: 'AUuNxgwKiIzZ.9l5eJGjSk.ZhSsdAHLb2qjTDDiYktyfmh4xlNFmT3tW',
            grPayPalEmail: 'paypal@globalrockstar.com'
        },
        microPaymentAccount: {
            sandbox: false,
            appId: 'APP-1CL170439S5825534',
            userId: 'micropayment_api1.globalrockstar.com',
            password: '224GC9ZXY9JQ4KBB',
            signature: 'AFcWxV21C7fd0v3bYYYRCpSSRl31AbEMtiylOZbgds2zDxbu0o3qmsKQ',
            grPayPalEmail: 'micropayment@globalrockstar.com'
        },
        ipnNotificationUrl: 'https://ipn.globalrockstar.com',
        simple: {
            paymentUrl: 'https://www.paypal.com/incontext?useraction=commit&token=',
            apiUrl: 'https://api-3t.paypal.com/nvp'
        },
        chained: {
            paymentUrl: 'https://www.paypal.com/webapps/adaptivepayment/flow/pay'
        }
    }
};
