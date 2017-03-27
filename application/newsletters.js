/*jshint node: true */
'use strict';

const Boom = require('boom');
const Joi = require('joi');
const Hawk = require('hawk');
const bpc = require('./bpc_client');
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


      bpc.getUserPermissions(request.state.ticket, 'mdb', function (err, response){
        if (err || !response.ekstern_id){

          // If the profile does not have ekstern_id, we try to find the ekstern_id by email.
          // But before that, we need to find email using SSO/BPC or Gigya
          bpc.me(request.state.ticket, function(err, me){
            console.log('me', err, me);
            if(err){
              return reply(Boom.forbidden());
            }

            // Now we can search user be email
            mdbapi_client.getUserByEmail(me.email, function(err, result){
              console.log('getUserByEmail', err, result);
              if(err){
                return reply(Boom.forbidden());
              } else if (result.length !== 1){
                return reply(Boom.forbidden('Missing profile in MDB'));
              }

              var user = result[0];

              // And we set the ekstern_id to BPC for later usage
              bpc.setUserPermissions(request.state.ticket.user, 'mdb', { ekstern_id: user.ekstern_id}, function (err, response){
                console.log('setUserPermissions mdb', err, response);
              });

              reply(null, user);

            });
          });

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

      bpc.getUserPermissions(request.state.ticket, 'mdb', function (err, response){
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

      bpc.getUserPermissions(request.state.ticket, 'mdb', function (err, response){
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