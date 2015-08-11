'use strict';
/**
 *   @module Controller:Physical-Products
 *   @description This controller is used for physical products actions for an artists
 *   Required modules are defined here
 *   @requires module:mongoose
 *   @requires module:hapi
 *   @requires module:../lib/mongoose-hapi-errors
 *   @requires module:Physical-Products
 *   @requires module:../public/configs/pre-defined-products-type.json
 *   @requires module:q
 */
var mongoose = require('mongoose'),
    Hapi = require('hapi'),
    reformatErrors = require('../lib/mongoose-hapi-errors'),
    PredefinedProducts = require('../public/configs/pre-defined-products-type.json'),
    PhysicalProducts = mongoose.model('PhysicalProducts'),
    Q = require('q');

module.exports = {
    /**
     *   Gets prdefined product list
     *   @param {object} req - Request object
     *   @param {function} reply - Hapi interface, Which replies
     *   @return the success/Error or objects with codes
     */
    preDefinedProducts: function (req, reply) {
        if (PredefinedProducts.length) {
            reply({
                total: PredefinedProducts.length,
                products: PredefinedProducts
            });
        } else {
            reply({total: 0, products: []});
        }
    },
    /**
     *   Creates physical products to an artist
     *   @param {object} req - Request with physical product object
     *   @param {function} reply - Hapi interface, Which replies
     *   @return the success/Error objects with codes
     */
    index: function (req, reply) {
        var query = req.pre.search || {},
            start, offset;
        var sortBy = req.query.sort || '-createdAt';
        if (req.query.start && req.query.end) {
            start = req.query.start;
            offset = req.query.end;
        }
        if (start !== null && offset !== null) {
            if (req.params.artistId) {
                if (!query.$and) {
                    query.$and = [];
                }
                query.$and.push(
                    {artist: req.params.artistId}
                );
            }
            Q.all([
                PhysicalProducts.count(query).exec(),
                PhysicalProducts.find(query).sort(sortBy)
                    .skip(start)
                    .limit(offset)
                    .populate('artist', '_id slug name picture').exec()
            ])
                .then(function (products) {
                    reply({
                        total: products[0],
                        products: products[1]
                    });
                });
        } else {
            PhysicalProducts.find(query).sort(sortBy)
                .populate('artist', '_id slug name picture').exec()
                .then(function (products) {
                    reply(products);
                });
        }
    },
    /**
     *   Creates physical products to an artist
     *   @param {object} req - Request with physical product object
     *   @param {function} reply - Hapi interface, Which replies
     *   @return the success/Error objects with codes
     */
    create: function (req, reply) {
        if (req.payload.predefined) {
            if (!(req.payload.ppId === 0 || req.payload.ppId > 0)) {
                reply({statusCode: 400, message: "ppId: Pre-defined product Id missing"});
            } else {
                var preProduct = PredefinedProducts[req.payload.ppId];
                if (!((preProduct.name == req.payload.title) &&
                    ((req.payload.price >= preProduct.price_range.min) &&
                    (req.payload.price <= preProduct.price_range.max)) &&
                    (req.payload.shipping_included == preProduct.shipping_included))) {
                    var msg = "Invalid pre-defined product information like title or price range";
                    reply({statusCode: 400, message: msg});
                }
            }
        }
        var physicalProduct = new PhysicalProducts({
            artist: req.payload.artist,
            title: req.payload.title,
            description: req.payload.description,
            type: req.payload.type,
            predefined: req.payload.predefined,
            price: req.payload.price,
            shipping_included: req.payload.shipping_included,
            stock_handling: req.payload.stock_handling,
            // Version 2 is for documents created starting from the 2015
            gr_doc_ver: req.payload.gr_doc_ver, //Optional
            state: 'active' //TODO with pre hooks
        });
        physicalProduct.save(function (err, savedProduct) {
            if (!err) {
                savedProduct.populate('artist', '_id slug name picture',
                    function (err, result) {
                        if (!err) {
                            reply(result);
                        } else {
                            return reply(reformatErrors(err));
                        }
                    }
                );
            } else {
                return reply(reformatErrors(err));
            }
        });
    },
    /**
     *   Updates physical products by an artist
     *   @param {object} req - Request with physical product object
     *   @param {function} reply - Hapi interface, Which replies
     *   @return the success/Error objects with codes
     */
    updateProduct: function (req, reply) {
        PhysicalProducts.findOne({_id: req.params.id},
            function (err, product) {
                if (!err) {
                    if (!product) {
                        return reply(Hapi.error.notFound());
                    }
                    product.title = req.payload.title ? req.payload.title : product.title;
                    product.description = req.payload.description ?
                        req.payload.description :
                        product.description;
                    //Todo for range
                    product.price = req.payload.price ?
                        req.payload.price : product.price;
                    product.stock_handling = req.payload.stock_handling ?
                        req.payload.stock_handling :
                        product.stock_handling;
                    product.save(function (err, updatedProduct) {
                        if (!err) {
                            updatedProduct.populate('artist', '_id slug name picture',
                                function (err, result) {
                                    if (!err) {
                                        reply(result);
                                    } else {
                                        return reply(reformatErrors(err));
                                    }
                                }
                            );
                        } else {
                            return reply(reformatErrors(err));
                        }
                    });
                } else {
                    return reply(reformatErrors(err));
                }
            }
        );
    },
    /**
     *   Creates physical products to an artist
     *   @param {object} req - Request with physical product object
     *   @param {function} reply - Hapi interface, Which replies
     *   @return the success/Error objects with codes
     */
    productDetails: function (req, reply) {
        PhysicalProducts.findOne({
                $and: [{_id: req.params.productId}, {artist: req.params.artistId}]
            },
            function (err, products) {
                if (!err) {
                    if (!products) {
                        return reply(Hapi.error.notFound());
                    }
                    reply(products);
                } else {
                    return reply(reformatErrors(err));
                }
            });
    },
    /**
     *   Remove physical product by an artist
     *   @param {object} req - Request with physical product Id
     *   @param {function} reply - Hapi interface, Which replies
     *   @return the success/Error objects with codes
     */
    removeProduct: function (req, reply) {
        PhysicalProducts.remove({_id: req.params.productId}, function (err) {
            if (!err) {
                return reply({message: "Product deleted successfully"});
            }
            return reply(reformatErrors(err));
        });
    }

};
