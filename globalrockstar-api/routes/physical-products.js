'use strict';
/**
*   @module Routes:Physical-Products
*   @description Provides routes for CRUD feature to physical products
*   @requires module:../controllers/physical-products
*   @requires module:pretty-hapi-errors
*   @requires module:../validations/physical-products-schema
*/

var PhysicalProductsController = require('../controllers/physical-products'),
    PrettyHapiErrors = require('pretty-hapi-errors'),
    PhysicalProductsSchema = require('../validations/physical-products-schema');

module.exports = function (server) {
    server.route([
        /**
        *   @event
        *   @name Routes:Physical-Products.Add-Product
        *   @description <p>path: /physical-products </p>
        *   <p><b>operations:</b></p>
        *   <p>- httpMethod: POST</p>
        *   <p> Summary: Add the new product by an artist </p>
        *   <p> Request object: req.payload</p>     
        *   <p> {"artist":"55911b5b6bcd0e881c3178c0",
        *       "title":"Product title",
        *       "description":"This is for first project",
        *       "price":12,
        *       "type":"one",
        *       "predefined":true,
        *       "stock_handling":12,
        *       "shipping_included": true
        *       } </p>
        *   @fires PhysicalProductsController.create
        *   @returns Newly created PhysicalProduct object <br><br><hr>
        **/
        {
            method: 'POST',
            path: '/physical-products',
            config: {
                description: 'Add new Physical Product by an artist',
                handler: PhysicalProductsController.create,
                validate: {
                    payload: PhysicalProductsSchema.createPhysicalProductsSchema,
                    failAction: PrettyHapiErrors
                }
            }
        },
        /**
        *   @event
        *   @name Routes:Physical-Products.Update-Product
        *   @description <p>path: /physical-products </p>
        *   <p><b>operations:</b></p>
        *   <p>- httpMethod: PUT</p>
        *   <p> Summary: Update the existing physical product by an artist </p>
        *   <p> Request object: req.payload</p>     
        *   <p> {
        *       "title":"Product title",
        *       "description":"This is for first project",
        *       "price":12
        *       } </p>
        *   @fires PhysicalProductsController.updateProduct
        *   @returns Newly created PhysicalProduct object <br><br><hr>
        **/
        {
            method: 'PUT',
            path: '/physical-products/{id}',
            config: {
                description: 'Update Physical Product by an artist',
                handler: PhysicalProductsController.updateProduct
            }
        },
        /**
        *   @event
        *   @name Routes:Physical-Products.Get-Predefined-Products
        *   @description <p>path: /physical-products/{artistId} </p>
        *   <p><b>operations:</b></p>
        *   <p>- httpMethod: GET</p>
        *   <p> Summary: Get predefined products list</p>
        *   @fires PhysicalProductsController.preDefinedProducts
        *   @returns Predefined product lists object <br><br><hr>
        **/
        {
            method: 'GET',
            path: '/physical-products/list',
            config: {
                description: 'Get predfined products list',
                handler: PhysicalProductsController.preDefinedProducts
            }
        },
        /**
        *   @event
        *   @name Routes:Physical-Products.Get-Products
        *   @description <p>path: /physical-products/{artistId} </p>
        *   <p><b>operations:</b></p>
        *   <p>- httpMethod: GET</p>
        *   <p> Summary: Get artist's physical products list</p>
        *   @fires PhysicalProductsController.index
        *   @returns PhysicalProduct lists object <br><br><hr>
        **/
        {
            method: 'GET',
            path: '/physical-products/{artistId}',
            config: {
                description: 'Get physical products list for an artist',
                handler: PhysicalProductsController.index
            }
        },
        /**
        *   @event
        *   @name Routes:Physical-Products.Get-Products-Details
        *   @description <p>path: /physical-products/{productId}/{artistId} </p>
        *   <p><b>operations:</b></p>
        *   <p>- httpMethod: GET</p>
        *   <p> Summary: Get artist's physical product's details</p>
        *   <p>  parameters:</p>
        *   <ul>
        *   <li> ProductID: req.params.productId</li>
        *   <li> ArtistID: req.params.artistId</li>
        *   </ul> 
        *   @fires PhysicalProductsController.productDetails
        *   @returns PhysicalProduct detail object <br><br><hr>
        **/
        {
            method: 'GET',
            path: '/physical-products/{productId}/{artistId}',
            config: {
                description: 'Get physical product details for an artist',
                handler: PhysicalProductsController.productDetails
            }
        },
        /**
        *   @event
        *   @name Routes:Physical-Products.Delete-Product
        *   @description <p>path: /physical-products/{productId} </p>
        *   <p><b>operations:</b></p>
        *   <p>- httpMethod: DELETE</p>
        *   <p> Summary: Delete artist's physical product</p>
        *   <p>  parameters:</p>
        *   <ul>
        *   <li> ProductID: req.params.productId</li>
        *   </ul> 
        *   @fires PhysicalProductsController.removeProduct
        *   @returns success/error object <br><br><hr>
        **/
        {
            method: 'DELETE',
            path: '/physical-products/{productId}',
            config: {
                description: 'Delete physical product by an artist',
                handler: PhysicalProductsController.removeProduct
            }
        }

    ]);
};
