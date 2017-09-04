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
        method: 'PATCH',
        path: '/permissions/'.concat(request.state.test_app_ticket.user, '/berlingske'),
        payload: {
          // '$inc': { 'tester_tal': 1 }
          // '$mul': { 'tester_tal': 2 }
          // '$addToSet': { 'tester_array': 'foerstevaerdi' }
          // '$push': { 'tester_array': 'nyvaerdi' }
          // '$pop': { 'tester_array': -1 }
        }
      }, function (err, response){
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
      bpc.getUserPermissions(request.state.test_app_ticket, 'berlingske', function (err, response){
        console.log('cc', err, response);
        if (err || !response.subscriber){

          // return reply(err);
          reply({message: 'public resource'});

        } else {


          bpc.request({
            method: 'PATCH',
            path: '/permissions/'.concat(request.state.test_app_ticket.user, '/berlingske'),
            payload: {
              '$inc': { 'resourceViewCounter': 1 }
              // '$mul': { 'resourceViewCounter': 2 }
            }
          }, function (err, response){
            console.log('incResourceCounterRequest', err, response);
            reply({message: 'protected resource', resourceViewCounter: response.resourceViewCounter});
          });

        }
      });

      bpc.setUserPermissions(request.state.test_app_ticket.user, 'berlingske', {subscriber: true, tester: true }, function (err, response){
      // bpc.setUserPermissions('gigya/dako@berlingskemedia.dk', 'berlingske', {subscriber: true, tester2: true }, function (err, response){
        console.log('setUserPermissions', err, response);
      });
    }
  });

  next();
};


module.exports.register.attributes = {
  name: 'resources',
  version: '1.0.0'
};
