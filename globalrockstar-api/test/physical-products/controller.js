'use strict';
var PhysicalProductsMock = require('../mocks/physical-products'),
    artitsMock = require('../mocks/artists'),
    config = require('../../lib/database'),
    models = require('../../models'),
    mongoose = require('mongoose'),
    PhysicalProducts = mongoose.model('PhysicalProducts'),
    Artist = mongoose.model('Artist'),
    should = require('should'),
    chai = require('chai'),
    expect = chai.expect,
    server = require('../../index');

var Main = require('../main');
var successCode = Main.successCode,
    artistObj,
    productObj,
    preProductList;
    
describe('Physical products API tests:', function () {

    var removeUser = function (id) {
        Artist.remove({_id: id}, function () {
            return;
        });
    };

    var removeProduct = function (id) {
        PhysicalProducts.remove({_id: id}, function () {
            return;
        });
    };

    it('Should create an artist for Physical products', function (done) {
        var options = {
            method: "POST",
            url: "/artists",
            payload: JSON.stringify(artitsMock.getArtistMock()),
            headers: { 'Content-Type': 'application/json' }
        };
        server.inject(options, function (res) {
            expect(res.statusCode).to.equal(successCode);
            res.should.have.property('payload');
            artistObj = JSON.parse(res.payload);
            var expected = artitsMock.createAfterMock();
            if (!Main.validateTwoObjects(expected, artistObj)) throw err;

            done();
        });
    });

    it('Should return predefined products list', function (done) {
        var options = {
            method: "GET",
            url: "/physical-products/list",
            headers: { 'Content-Type': 'application/json' }
        };
        server.inject(options, function (res) {
            expect(res.statusCode).to.equal(successCode);
            res.should.have.property('payload');
            preProductList = JSON.parse(res.payload);
            var expected = PhysicalProductsMock.predefinedMock();
            if (!Main.validateTwoObjects(expected, preProductList.products[0])) throw err;

            done();
        });
    });

    it('Should create a physical products', function (done) {
        var opts = PhysicalProductsMock.createProduct();
        opts.artist = artistObj.id;
        opts.title = preProductList.products[0].name;
        opts.price = preProductList.products[0].price_range.min;
        opts.type = preProductList.products[0].slug;
        opts.predefined = true;
        opts.predefined = true;   
        opts.ppId = 0; 
        opts.shipping_included = preProductList.products[0].shipping_included;

        var options = {
            method: "POST",
            url: "/physical-products",
            payload: JSON.stringify(opts),
            headers: { 'Content-Type': 'application/json' }
        };
        server.inject(options, function (res) {
            expect(res.statusCode).to.equal(successCode);
            res.should.have.property('payload');
            productObj = JSON.parse(res.payload);
            var expected = PhysicalProductsMock.createAfterMock();
            if (!Main.validateTwoObjects(expected, productObj)) throw err;

            expect(productObj.artist._id).to.equal(opts.artist);
            expect(productObj.title).to.equal(opts.title);
            expect(productObj.description).to.equal(opts.description);
            expect(productObj.type).to.equal(opts.type);
            expect(productObj.predefined).to.equal(opts.predefined);
            expect(productObj.price).to.equal(opts.price);
            expect(productObj.shipping_included).to.equal(opts.shipping_included);
            expect(productObj.stock_handling).to.equal(opts.stock_handling);

            done();
        });
    });

    it('Should update Physical products an artist', function (done) {
        var opts = {};
        opts.title = "updated title";
        opts.description = "updated description";
        opts.price = 15; //Todo for range validation
        opts.stock_handling = 300;
        
        var options = {
            method: "PUT",
            url: "/physical-products/" + productObj._id,
            payload: JSON.stringify(opts),
            headers: { 'Content-Type': 'application/json' }
        };
        server.inject(options, function (res) {
            expect(res.statusCode).to.equal(successCode);
            res.should.have.property('payload');
            productObj = JSON.parse(res.payload);
            var expected = PhysicalProductsMock.createAfterMock();
            if (!Main.validateTwoObjects(expected, productObj)) throw err;

            expect(productObj.title).to.equal(opts.title);
            expect(productObj.description).to.equal(opts.description);
            expect(productObj.price).to.equal(opts.price);

            done();
        });
    });

    it('Should return physical product list for an artist', function (done) {
        var options = {
            method: "GET",
            url: "/physical-products/" + artistObj.id,
            headers: { 'Content-Type': 'application/json' }
        };
        server.inject(options, function (res) {
            expect(res.statusCode).to.equal(successCode);
            res.should.have.property('payload');
            var results = JSON.parse(res.payload);
            var expected = PhysicalProductsMock.createAfterMock();
            if (results.length > 0)
            if (!Main.validateTwoObjects(expected, results.products[0])) throw err;
            
            done();
        });
    });

    it('Should return physical product details for an artist', function (done) {
        var options = {
            method: "GET",
            url: "/physical-products/" + productObj._id + "/" + artistObj.id,
            headers: { 'Content-Type': 'application/json' }
        };
        server.inject(options, function (res) {
            expect(res.statusCode).to.equal(successCode);
            res.should.have.property('payload');
            var results = JSON.parse(res.payload);

            var expected = PhysicalProductsMock.createAfterMock();
            if (!Main.validateTwoObjects(expected, results)) throw err;
            
            removeUser(artistObj.id);
            removeProduct(productObj._id);
            done();
        });
    });

});
