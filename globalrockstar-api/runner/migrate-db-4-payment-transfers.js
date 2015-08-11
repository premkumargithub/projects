/* global db, ObjectId, ISODate */
// Run in mongo shell

db.payments.update(
    { currency: "dollar" },
    { $set: { currency: 'USD' } },
    { "multi" : true }
);

db.payments.update(
    { currency: "euro" },
    { $set: { currency: 'EUR' } },
    { "multi" : true }
);

