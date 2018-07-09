// This is a init script to do stuff at startup
'use strict';


const bpc = require('./bpc_client');
const ku = require('./kundeunivers_client');

bpc.events.on('ready', function() {

  console.log('Running init');

  if(false) {
    ku.request('DELETE', '/my/kundeunivers_user/7d1e3ba250584eafbace0a61c9159768',
      null,
      bpc.appTicket,
      function(err, res) {
        console.log('dASDAS')
        console.log(err, res);
      }
    )
  }

  if(false){
    bpc.request({
      method: 'POST',
      // path: '/permissions/auid**4889e885-3fe8-4261-b490-e0d09b93b218/anonymous',
      // path: '/permissions/auid**3a40e1e3-809f-4d4c-a227-7dd6e212946c/anonymous',
      path: '/permissions/auid**707143b8-155b-4b00-bf4a-1124169a8d02/anonymous',
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
      path: '/permissions/4f112117cd454abdaa8a53486ddce53f/berlingske'
    },
    null,
    function (err, response){
      // }, function (err, response){
      console.log('anne.madsen@azets.com', err, response);
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
      path: '/gigya?email=dako@berlingskemedia.dk'
      // path: '/gigya?email=inmaols@gmail.com.invalid'
      // path: '/gigya?email=doesnotexists@gmail.com'
    },
    null,
    function (err, response){
      // }, function (err, response){
      console.log('gigs', err, response);
    });
  }

  if (false) {
    bpc.request({
      method: 'PATCH',
      path: '/permissions/dako+visiolink1@berlingskemedia.dk/berlingske',
      payload: {
        $set: {
          'bdk_apps':'calculate',
          'roles.0': {
            "access":"calculate","weekday_rule":"service_type_access","weekday_pattern":96,"role":"bdk_apps","type":"sap","entity_id":"101841416","subscription_type":"Komplet","edition_code":"BM","mix_type":"01","access_level":"0002"
          }
        }
      }
    },
    null,
    function (err, response){
      // }, function (err, response){
      console.log('pach visiolink1', err, response);
    });
  }

  if (false) {
    bpc.request({
      method: 'POST',
      path: '/permissions/frdo@berlingskemedia.dk/mdb',
      payload: {
        roles:[]
      }
    },
    null,
    function (err, response){
      // }, function (err, response){
      console.log('POST Semy', err, response);
    });
  }

  // bt automated access
  // btdk-test+automation@berlingskemedia.dk
  // 0f597f01985a4e2682fe4521e2bd6de2
  if (false) {
    bpc.request({
      method: 'POST',
      path: '/permissions/0f597f01985a4e2682fe4521e2bd6de2/bt',
      payload: {
        roles:[{"access":"yes","weekday_rule":"always","weekday_pattern":127,"role":"Plus member","type":"company","entity_id":"berlingske"}],
        "bta_epaper": "no",
        "bt_light": "no",
        "Plus member":	"yes"
      }
    },
    null,
    function (err, response){
      console.log('POST bt automated access', err, response);
    });
  }

});
