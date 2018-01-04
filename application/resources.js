/*jshint node: true */
'use strict';

const Boom = require('boom');
const Hawk = require('hawk');
const http = require('http');
const https = require('https');
const bpc = require('./bpc_client');

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

      bpc.request({
        method: 'GET',
        // path: '/permissions/'.concat(request.state.test_app_ticket.user, '/berlingske'),
        // path: '/permissions/berlingske'
        path: '/permissions/berlingske?roles.0.access=calculate'
        // payload: {
          // '$inc': { 'tester_tal': 1 }
          // '$mul': { 'tester_tal': 2 }
          // '$addToSet': { 'tester_array': 'foerstevaerdi' }
          // '$push': { 'tester_array': 'nyvaerdi' }
          // '$pop': { 'tester_array': -1 }
          // "$addToSet": {
          //   "test_object.test_array_new": 200
          // }
        // }
      },
      request.state.test_app_ticket,
      function (err, response){
      // }, function (err, response){
        console.log('tester_tal', err, response);
        if (err) {
          reply(err);
        } else {
          Object.assign(response, {
            message: 'non-protected resource'
          });
          reply(response);
        }
      });
    }
  });


  server.route({
    method: 'GET',
    path: '/protected',
    config: {
      state: {
        parse: true,
        failAction: 'log'
      }
    },
    handler: function(request, reply) {

      if(request.state.test_app_ticket === undefined || request.state.test_app_ticket === null){
        return reply(Boom.unauthorized());
      }

      if (request.state.test_app_ticket.exp < Hawk.utils.now()){
        return reply(Boom.forbidden('Ticket has expired'));
      }

      // Different examples on how to validate the userTicket
      bpc.request({
        method: 'GET',
        // path: '/permissions/berlingske'
        // path: '/permissions/berlingske?tester=true&subscriber=true'
        // path: '/permissions/berlingske?tester_tal=6&subscriber=true'
        path: '/permissions/berlingske?tester_tal=6&subscriber=true&tester_text=hejsa'
      },
      request.state.test_app_ticket,
      function (err, response){
        console.log('GET permissions', err, response);
        // if (err || !response.subscriber){
        if (err || !response.statusCode === 200){

          // return reply(err);
          reply({message: 'public resource'});

        } else {


          bpc.request({
            method: 'PATCH',
            path: '/permissions/'.concat(request.state.test_app_ticket.user, '/berlingske'),
            payload: {
              '$inc': { 'resourceViewCounter': 1 },
              '$currentDate': { 'test': { '$type': 'date' } }
              // '$mul': { 'resourceViewCounter': 2 }
            }
          }, function (err, response){
            console.log('incResourceCounterRequest', err, response);
            reply({message: 'protected resource', resourceViewCounter: response.resourceViewCounter});
          });

        }
      });


      bpc.request({
        method: 'POST',
        path: '/permissions/'.concat(request.state.test_app_ticket.user, '/berlingske'),
        payload: {
          subscriber: true,
          tester: true,
          tester_text: 'hejsa'
        }
      }, function (err, response){
        console.log('setUserPermissions', err, response);
      });

    }
  });

  server.route({
    method: 'POST',
    path: '/anonymous/{auid}',
    config: {
      state: {
        parse: true,
        failAction: 'log'
      }
    },
    handler: function(request, reply) {
      bpc.request({
        method: 'POST',
        path: `/permissions/${request.params.auid}/anonymous`,
        payload: request.payload
      },
      null,
      reply);
    }
  });

  next();
};


module.exports.register.attributes = {
  name: 'resources',
  version: '1.0.0'
};
