/** 
*@module Helper:Normalize-Urls
*@description This module used provide the facebook details 
**/

module.exports = function mongooseSlugify(schema, options) {
    //Checks options fields
    if (options.fields === undefined) {
        throw new Error('fields must be defined') ;
    }
    /**
     * Used to add http in the URL
     * @name Helper:Normalize-Urls.prefixUrl
     * @function 
     * @param {string} field URL string 
     * @return {string} URL string 
     */
    function prefixUrl(field) {
        if ((field.toString()).indexOf('http') < 0) {
            field = "http://" + String(field).replace(/'/g, '') ;
        }
        return field ;
    }

    /**
     * Appends prefix http in the URL before save and transfer the control to next middleware
     * @function 
     * @param {string} field URL string 
     */
    schema.pre('save', function (next) {
        var self = this ;
        options.fields.forEach(function (field) {
            if (self[field])
                self[field] = prefixUrl(self[field]) ;
        }) ;

        next() ;
    });
};
