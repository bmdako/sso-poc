// This is a init script to do stuff at startup
'use strict';


const bpc = require('./bpc_client');

bpc.events.on('ready', function() {

  console.log('Running init');

  if(false){
    bpc.request({
      method: 'POST',
      // path: '/permissions/auid**4889e885-3fe8-4261-b490-e0d09b93b218/anonymous',
      path: '/permissions/auid**3a40e1e3-809f-4d4c-a227-7dd6e212946c/anonymous',
      payload: {
        model_banner: 'B'
      }
    },
    null,
    function (err, response){
      // }, function (err, response){
      console.log('abiba', err, response);
    });
  }

  if(false){
    bpc.request({
      method: 'GET',
      // path: '/permissions/_guid_dVlIynSm5Mk913pi57uG3j0l7hGnSb7hMy4GlTGJXFU=/berlingske'
      path: '/permissions/dako@berlingskemedia.dk/weekendavisen'
    },
    null,
    function (err, response){
      console.log('ghgh1', err, response);
    });

    bpc.request({
      method: 'GET',
      path: '/permissions/dako@berlingskemedia.dk/berlingske'
    },
    null,
    function (err, response){
      console.log('ghgh2', err, response);
    });
  }

  if(false){
    bpc.request({
      method: 'GET',
      // path: '/gigya?email=dako@berlingskemedia.dk'
      path: '/gigya?email=inmaols@gmail.com.invalid'
    },
    null,
    function (err, response){
      // }, function (err, response){
      console.log('gigs', err, response);
    });
  }

});
