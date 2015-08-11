/**
 * Provides routes for slider ralated activities
 *
 * @module Routes:Slider-Route
 * @requires module:../controllers/sliders
 * @requires module:../lib/pre-search-query
 */
var SlidersController = require('../controllers/sliders'),
preSearchQuery = require('../lib/pre-search-query');

module.exports = function (server) {
    /**
    * @event
    * @name Routes:Slider.Get-Sliders
    * @description <p>path: /settings </p>
    * <p><b>operations:</b></p>
    * <p>-  httpMethod: GET</p>
    * <p> summary: Get sliders for listing in the admin section</p>
    * <p>  parameters:</p>
    * <ul>
    * <li> SliderId: req.params.id</li>
    * </ul>
    * @fires SlidersController.index
    * @returns The slider results <br><br><hr>
    **/
    server.route([
        {
            method: 'GET',
            path: '/sliders',
            handler: SlidersController.index,
            config: {
                pre: preSearchQuery
            }
        },
        /**
        * @event
        * @name Routes:Slider.Create-Slider
        * @description <p>path: /sliders </p>
        * <p><b>operations:</b></p>
        * <p>-  httpMethod: GET</p>
        * <p> summary: Create slider for slider object in the admin section</p>
        * <p>  parameters:</p>
        * <ul>
        * <li> SliderId: req.params.id</li>
        * </ul>
        * @fires SlidersController.create
        **/
        {
            method: 'POST',
            path: '/sliders',
            handler: SlidersController.create
        },
        /**
        * @event
        * @name Routes:Slider.Get-Slider
        * @description <p>path: /sliders/{id} </p>
        * <p><b>operations:</b></p>
        * <p>-  httpMethod: GET</p>
        * <p> summary: Get slider object for viewing in the admin section</p>
        * <p>  parameters:</p>
        * <ul>
        * <li> SliderId: req.params.id</li>
        * </ul>
        * @fires SlidersController.show
        * @returns The slider object <br><br><hr>
        **/
        {
            method: 'GET',
            path: '/sliders/{id}',
            config: {
                handler: SlidersController.show
            }
        },
        /**
        * @event
        * @name Routes:Slider.Update-Slider
        * @description <p>path: /sliders/{id} </p>
        * <p><b>operations:</b></p>
        * <p>-  httpMethod: PUT</p>
        * <p> summary: Update slider object in the admin section</p>
        * <p>  parameters:</p>
        * <ul>
        * <li> SliderId: req.params.id</li>
        * </ul>
        * @fires SlidersController.update
        **/
        {
            method: 'PUT',
            path: '/sliders/{id}',
            config: {
                handler: SlidersController.update
            }
        },
        /**
        * @event
        * @name Routes:Slider.Delete-Slider
        * @description <p>path: /sliders/{id} </p>
        * <p><b>operations:</b></p>
        * <p>-  httpMethod: PUT</p>
        * <p> summary: Delete slider object from the tablle based on the slider Id</p>
        * <p>  parameters:</p>
        * <ul>
        * <li> SliderId: req.params.id</li>
        * </ul>
        * @fires SlidersController.update
        **/
        {
            method: 'DELETE',
            path: '/sliders/{id}',
            config: {
                handler: SlidersController.delete
            }
        }
    ]) ;
} ;
