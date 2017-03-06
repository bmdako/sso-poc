/*jshint node: true */
'use strict';

const Boom = require('boom');
const Hawk = require('hawk');
const sso_client = require('./sso_client');
const mdbapi_client = require('./mdbapi_client');

module.exports.register = function (server, options, next) {

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
      mdbapi_client.getNewsletters({'publisher_id': '1'}, reply);
    }
  });

  server.route({
    method: 'GET',
    path: '/signups',
    config: {
      state: {
        parse: true,
        failAction: 'log'
      }
    },
    handler: function(request, reply) {

      if(request.state.ticket === undefined || request.state.ticket === null){
        return reply(Boom.unauthorized());
      }

      if (request.state.ticket.exp < Hawk.utils.now()){
        return reply(Boom.forbidden('Ticket has expired'));
      }

      sso_client.getUserPermissions(request.state.ticket, 'mdb', function (err, response){
        console.log('cc', err, response);
        if (err || !response.ekstern_id){
          return reply(Boom.forbidden('Msssing ekstern_id'));
        } else {
          mdbapi_client.getSignups(response.ekstern_id, reply);
        }
      });
    }
  });


  server.route({
    method: 'POST',
    path: '/signups',
    config: {
      state: {
        parse: true,
        failAction: 'log'
      }
    },
    handler: function(request, reply) {

      if(request.state.ticket === undefined || request.state.ticket === null){
        return reply(Boom.unauthorized());
      }

      if (request.state.ticket.exp < Hawk.utils.now()){
        return reply(Boom.forbidden('Ticket has expired'));
      }

      var nyhedsbrev_id = request.payload.nyhedsbrev_id;

      sso_client.getUserPermissions(request.state.ticket, 'mdb', function (err, response){
        console.log('cc', err, response);
        if (err || !response.ekstern_id){
          return reply(Boom.forbidden('Msssing ekstern_id'));
        } else {
          mdbapi_client.createSignup(response.ekstern_id, nyhedsbrev_id, reply);
        }
      });
    }
  });

  next();
};


module.exports.register.attributes = {
  name: 'newsletters',
  version: '1.0.0'
};
