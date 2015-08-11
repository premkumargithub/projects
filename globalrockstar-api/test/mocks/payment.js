var utils = require('./_utils');

module.exports = {
    /**
     * Creates a mock object with minimal information needed for testing
     *
     * @returns {object}
     */
    getTiniestMock: function () {
        return {
            // artist is not mandatory here as we add a new song using the /artists API
            "updatedAt" : new Date(),
            "createdAt" : new Date(),
            "amount" : 1,
            "userdata" : {
                    "jsCallback" : "",
                    "jsEvent" : utils.createUniqueString("crowdfunding-payment-complete"),
                    "redirectTo" : "",
                    "itemName" : utils.createUniqueString("_Pyment_TEST"),
                },
            "paymentType" : "chained",
            "platform" : "desktop",
            "transfered" : false,
            "usedGRCollectiveAddress" : true,
            "exchangeRate" : 0.7900000000000000,
            "dollarAmount" : 1.2700000000000000,
            "paymentFlow" : [
            ],
            "state" : "completed",
            "currency" : ['EUR'],
            "shares" : {
                    "artist" : 0.9000000000000000,
                    "gr" : 0.1000000000000000
                },
            "target" : {
                    //"artist" : ObjectId("53d923b70789ef6f2db57f6b"),
                    //"project" : ObjectId("5417555f6199864d0d5b48f6"),
                    "type" : "Project"
                },
            "source" : {
                    //"fan" : ObjectId("54038e3b02563d43251c4e7f"),
                    "type" : "Fan"
                },
            "__v" : 0,
            "completed" : new Date()
        };
    }
}
