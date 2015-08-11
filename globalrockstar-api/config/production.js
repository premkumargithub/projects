module.exports = {
    address: "0.0.0.0",
    secret: "sdhfgkajsdhbcjkdhbckauerzbjsdhbckaudzbca",
    db: 'mongodb://172.28.0.91/global-rockstar',
    agenda: {
        db: 'mongodb://172.28.0.91/global-rockstar-agenda',
        collection: 'agenda'
    },
    mandrill_api_key: 's1PFXGABZJApKa9iuFrFkw',
    redis: {
        port: 6379,
        host: '172.28.0.91',
        auth: 'eepho0tiupohnatiuc8ait7Wei9geigootheesae',
        scope: 'globalrockstar-prod'
    },
    goodOptions: {
        subscribers: {
            'console': ['error']
        }
    }
};