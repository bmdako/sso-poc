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
      reply({message: 'non-protected resource'});
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

      if(request.state.ticket === undefined || request.state.ticket === null){
        return reply(Boom.unauthorized());
      }

      if (request.state.ticket.exp < Hawk.utils.now()){
        return reply(Boom.forbidden('Ticket has expired'));
      }

      // Different examples on how to validate the userTicket
      bpc.getUserPermissions(request.state.ticket, 'berlingske', function (err, response){
        console.log('cc', err, response);
        if (err || !response.subscriber){
          // return reply(err);
          reply({message: 'public resource'});
        } else {
          reply({message: 'protected resource'});
        }
      });

      bpc.setUserPermissions(request.state.ticket.user, 'berlingske', {subscriber: true, tester: true }, function (err, response){
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
