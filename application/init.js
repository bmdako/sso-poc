// This is a init script to do stuff at startup
'use strict';


const bpc = require('./bpc_client');

bpc.events.on('ready', function() {

  if(false){
    bpc.request({
      method: 'POST',
      path: '/permissions/auid::43b4e88a-f1e6-4f3e-9daa-ba22d961482d/anonymous',
      payload: {
        test_boolean: true
      }
    },
    null,
    function (err, response){
      // }, function (err, response){
      console.log('abiba', err, response);
    });
  }
  
});
