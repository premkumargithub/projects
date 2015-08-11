'use strict';

module.exports = {
    secret : 'Your secret here',
    db : process.env.LOCAL_DB ? 'mongodb://localhost/global-rockstar-test' : 'mongodb://devdblin.dmz.dd.loc/global-rockstar-test',
    mandrill_api_key : false,
    agenda: {
        db:  process.env.LOCAL_DB ? 'mongodb://localhost/global-rockstar-agenda-test' : 'mongodb://devdblin.dmz.dd.loc/global-rockstar-agenda-test',
        collection: 'agenda'
    },
    redis: {
        port: 6379,
        host: process.env.LOCAL_DB ? 'localhost' : 'devdblin.dmz.dd.loc',
        auth: process.env.LOCAL_DB ? '' : 'eepho0tiupohnatiuc8ait7Wei9geigootheesae',
        scope: 'globalrockstar-test'
    },
    payment: {
        // number of Day a Mobile Paym,ent need to be old to allow it to be transefered to the artist
        transferMobilePaymentMinimumAge: 90,
        transferMobilePaymentMaximumAge: 370,

        // price definition for paid votes for each currencay
        paidVotePrice: {
            EUR: {
                artist: 0.5,
                gr: 0.7
            },
            USD: {
                artist: 0.7,
                gr: 0.9
            },

            NZD: {
                artist: 0.2,
                gr: 0.3
            }
        },
        //  gr share for crowdfunding projects
        projectFee: 0.1,
        voucherFee: 0.5,
        maxMicroPayment: {
            EUR: 3,
            USD: 3
        }
    },
    frontendUrl: 'http://localhost:3000',
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
        ipnNotificationUrl: 'https://bed-keen.usefinch.com',
        simple: {
            paymentUrl: 'https://www.sandbox.paypal.com/incontext?useraction=commit&token=',
            apiUrl: 'https://api-3t.sandbox.paypal.com/nvp'
        },
        chained: {
            paymentUrl: 'https://www.sandbox.paypal.com/webapps/adaptivepayment/flow/pay'
        }
    },
    twitter: {
        key:   '8gmJNgzYEsxKZGF12X5WayPpR',
        secret: 'mbHiV8c0psLls6m66qxJa8ErIAcS4aJfpCqXKUlicxkCTCUqC9'
    }
};
