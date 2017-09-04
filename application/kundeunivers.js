'use strict';

const https = require('https');
const bpc = require('./bpc_client');
const ku = require('./kundeunivers_client');

module.exports.register = function (server, options, next) {

  server.route({
    method: 'GET',
    path: '/',
    config: {
      state: {
        parse: true,
        failAction: 'log'
      }
    },
    handler: function(request, reply) {

      if (request.state.test_app_ticket) {
        ku.request('GET', '/my/epaper/weekendavisen', null, request.state.test_app_ticket, reply);
        // test(request.state.test_app_ticket, reply);
      } else {
        reply();
      }
    }
  });

  next();

};

module.exports.register.attributes = {
  name: 'kundeunivers-testing',
  version: '1.0.0'
};

function test (credentials, callback){

  const Hawk = require('hawk');

  var options = {
    hostname: 'berlingskemedia.kundeunivers.dk',
    port: 443,
    path: '/my/epaper/weekendavisen',
    method: 'GET',
    headers: {
    }
  };

  var url = https.globalAgent.protocol.concat('//', options.hostname, ':', options.port, options.path)
  // var url = https.globalAgent.protocol.concat('//', options.hostname, options.path)

  options.headers.authorization = Hawk.client.header(url, options.method, {credentials: credentials, app: credentials.app }).field;

  var payload = {
    method: options.method,
    // url: options.path,
    url: url,
    authorization: options.headers.authorization
  };

  console.log('payload to validate', payload);

  bpc.request({path: '/validate' , method: 'POST'}, payload, null, callback);

}
