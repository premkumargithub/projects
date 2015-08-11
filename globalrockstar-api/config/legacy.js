module.exports = {
    address: "0.0.0.0",
    secret : "Your secret here",
    db : 'mongodb://localhost:8122/global-rockstar',
    agenda: {
        db: 'mongodb://localhost:8124/global-rockstar-agenda',
        collection: 'agenda'
    },

    mandrill_api_key : 'bcyRkNdPRPIKDa4q4rKUmw',
    redis: {},
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
            userId: 'paypal_api1.globalrockstar.com',
            appId: 'APP-0S7361879R428462U',
            password: 'V4UCJB7APNSKD28Z',
            signature: 'AUuNxgwKiIzZ.9l5eJGjSk.ZhSsdAHLb2qjTDDiYktyfmh4xlNFmT3tW',
            grPayPalEmail: 'paypal@globalrockstar.com'
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
