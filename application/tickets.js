/*jshint node: true */
'use strict';

const Boom = require('boom');
const bpc = require('./bpc_client');

module.exports.register = function (server, options, next) {

  server.state('test_app_ticket', {
    // ttl: 1000 * 60 * 60 * 24 * 30, // (one month)
    ttl: null,
    isHttpOnly: false,
    isSecure: false,
    // isSameSite: false,
    path: '/',
    encoding: 'base64json'
  });

  server.route({
    method: 'POST',
    path: '/',
    config: {
      cors: false,
      state: {
        parse: true,
        failAction: 'log'
      }
    },
    handler: function(request, reply) {
      bpc.getUserTicket(request.payload.rsvp, function (err, userTicket){
        console.log('getUserTicket', err, userTicket);
        if (err){
          return reply(err);
        }

        reply(userTicket)
          .state('test_app_ticket', userTicket);
      });
    }
  });

  server.route({
    method: 'DELETE',
    path: '/',
    config: {
      cors: false,
      state: {
        parse: true,
        failAction: 'log'
      }
    },
    handler: function(request, reply) {
      // This is not a global signout.
      reply()
        .unstate('test_app_ticket');
    }
  });

  server.route({
    method: 'GET',
    path: '/',
    config: {
      cors: false,
      state: {
        parse: true,
        failAction: 'log'
      }
    },
    handler: function(request, reply) {
      bpc.refreshUserTicket(request.state.test_app_ticket, function (err, userTicket){
        console.log('refreshUserTicket', err, userTicket);
        if (err) {
          return reply(err);
        }
        reply(userTicket)
          .state('test_app_ticket', userTicket);
      });
    }
  });

  next();
};


module.exports.register.attributes = {
  name: 'tickets',
  version: '1.0.0'
};
