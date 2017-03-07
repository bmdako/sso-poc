/*jshint node: true */
'use strict';

const Boom = require('boom');
const Joi = require('joi');
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
      sso_client.getUserPermissions(request.state.ticket, 'mdb', function (err, response){
        if (err || !response.ekstern_id){
          return reply(Boom.forbidden('Missing ekstern_id'));
        } else {
          mdbapi_client.getUser(response.ekstern_id, reply);
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
      },
      validate: {
        payload: {
          nyhedsbrev_id: Joi.number().integer().min(1)
        }
      }
    },
    handler: function(request, reply) {

      var nyhedsbrev_id = request.payload.nyhedsbrev_id;

      sso_client.getUserPermissions(request.state.ticket, 'mdb', function (err, response){
        if (err || !response.ekstern_id){
          return reply(Boom.forbidden('Missing ekstern_id'));
        } else {
          mdbapi_client.createSignup(response.ekstern_id, nyhedsbrev_id, reply);
        }
      });
    }
  });


  server.route({
    method: 'DELETE',
    path: '/signups',
    config: {
      state: {
        parse: true,
        failAction: 'log'
      },
      validate: {
        payload: {
          nyhedsbrev_id: Joi.number().integer().min(1)
        }
      }
    },
    handler: function(request, reply) {

      var nyhedsbrev_id = request.payload.nyhedsbrev_id;

      sso_client.getUserPermissions(request.state.ticket, 'mdb', function (err, response){
        if (err || !response.ekstern_id){
          return reply(Boom.forbidden('Missing ekstern_id'));
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
