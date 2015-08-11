var config = require('../config') ;
var mandrill = require('mandrill-api') ;

module.exports = function (user, state) {
    return ;

    if (!config.mandrill_api_key)return ;
    if (user.email.split("@")[1] !== 'diamonddogs.cc' && user.email.split("@")[1] !== 'globalrockstar.com') return ;

    mandrill_client = new mandrill.Mandrill(config.mandrill_api_key);

    var template_name = "state change";
    var template_content = {} ;

    var message = {
        "global_merge_vars": [{
            "name": "USERNAME",
            "content": user.fullname
        },
        {
            "name" : "STATE",
            "content": state
        }],
        "subject": "[gr] state changed",
        "html": "<p>Example HTML content</p>",
        "to": [{
            "email": user.email,
            "name": user.fullname,
            "type": "to"
        }],
    };

    mandrill_client.messages.sendTemplate({
        "template_name": template_name,
        "template_content": template_content,
        "async": true,
        "message": message,
        "ip_pool": "Main Pool"
    }, function (result) {
        console.log(result);
    }, function (e) {
        console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
    });

} ;
