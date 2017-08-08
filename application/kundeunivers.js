'use strict';

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

      ku.request('GET', '/my/epaper/weekendavisen', null, request.state.test_app_ticket, reply);
    }
  });

  next();

};

module.exports.register.attributes = {
  name: 'kundeunivers-testing',
  version: '1.0.0'
};
