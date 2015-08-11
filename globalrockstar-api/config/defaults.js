module.exports = {
    port: process.env.PORT || 3003,
    frontendUrl: 'http://frontend.globalrockstar.devweb.diamonddogs.cc',
    phases: ['cfe', 'np', 'globalfinalsQualification', 'globalfinalsBest64', 'globalfinalsBest16', 'finals'],
    contestMeta: {
        countForToPhase: {
            "globalfinalsQualification": 100,
            "globalfinalsBest64": 60,
            "globalfinalsBest16": 14
        },
        wildcardsForToPhase: {
            "globalfinalsQualification": 0,
            "globalfinalsBest64": 4,
            "globalfinalsBest16": 2
        },
        phases: ['cfe', 'np', 'globalfinalsQualification', 'globalfinalsBest64', 'globalfinalsBest16']
    },
    payment: {
        // number of days a mobile payment needs to be old to allow it to be transefered to the artist
        transferMobilePaymentMinimumAge: 40,
        // max number of days a mobile payment is allowed to be old to be transeferable to the artist
        transferMobilePaymentMaximumAge: 370,

        // price definition for paid votes for each currencay
        paidVotePrice: {
            USD: {
                artist: 0.7,
                gr: 1.19
            },
            EUR: {
                artist: 0.5,
                gr: 0.89
            },
            AUD: {
                artist: 0.8,
                gr: 1.23
            },
            BRL: {
                artist: 1.74,
                gr: 2.97
            },
            CAD: {
                artist: 0.79,
                gr: 1.35
            },
            CHF: {
                artist: 0.66,
                gr: 1.14
            },
            CZK: {
                artist: 15.12,
                gr: 25.71
            },
            DKK: {
                artist: 4.08,
                gr: 6.95
            },
            GBP: {
                artist: 0.44,
                gr: 0.74
            },
            HKD: {
                artist: 5.42,
                gr: 9.23
            },
            HUF: {
                artist: 169.79,
                gr: 288.64
            },
            ILS: {
                artist: 2.61,
                gr: 4.44
            },
            JPY: {
                artist: 75.11,
                gr: 127.71
            },
            MXN: {
                artist: 9.55,
                gr: 15.89
            },
            MYR: {
                artist: 2.31,
                gr: 3.87
            },
            NOK: {
                artist: 4.61,
                gr: 7.82
            },
            NZD: {
                artist: 0.89,
                gr: 1.52
            },
            PHP: {
                artist: 31.28,
                gr: 53.19
            },
            PLN: {
                artist: 2.31,
                gr: 3.96
            },
            RUB: {
                artist: 28.62,
                gr: 48.67
            },
            SEK: {
                artist: 5.08,
                gr: 8.63
            },
            SGD: {
                artist: 0.89,
                gr: 1.52
            },
            THB: {
                artist: 22.73,
                gr: 38.64
            },
            TRY: {
                artist: 1.59,
                gr: 2.7
            },
            TWD: {
                artist: 20.75,
                gr: 35.28
            }
        },
        //  gr share for crowdfunding projects
        projectFee: 0.1,
        voucherFee: 0.5,
        maxMicroPayment: {
            USD: 12.13,
            EUR: (12.13 * 0.7832),
            AUD: (12.13 * 1.1268),
            BRL: (12.13 * 2.3779),
            CAD: (12.13 * 1.1098),
            CHF: (12.13 * 0.949),
            CZK: (12.13 * 21.555),
            DKK: (12.13 * 5.8304),
            GBP: (12.13 * 0.6175),
            HKD: (12.13 * 7.7549),
            HUF: (12.13 * 239.78),
            ILS: (12.13 * 3.6913),
            JPY: (12.13 * 107.845),
            MXN: (12.13 * 13.3047),
            MYR: (12.13 * 3.2429),
            NOK: (12.13 * 6.4166),
            NZD: (12.13 * 1.2578),
            PHP: (12.13 * 44.65),
            PLN: (12.13 * 3.2758),
            RUB: (12.13 * 39.9085),
            SEK: (12.13 * 7.1452),
            SGD: (12.13 * 1.2697),
            THB: (12.13 * 32.42),
            TRY: (12.13 * 2.2624),
            TWD: (12.13 * 30.355)
        }
    }
};
