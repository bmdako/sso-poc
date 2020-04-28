/*jshint node: true */
'use strict';

const log = require('util').log;
const Hapi = require('@hapi/hapi');
const Inert = require('@hapi/inert');
const HapiBpc = require('hapi-bpc');
const Resources = require('./resources');
// const Newsletters = require('./newsletters');
// const Kundeunivers = require('./kundeunivers');

const server = Hapi.server({
  port: process.env.PORT || 8000
});


const init = async () => {

  await server.register(Inert);
  await server.register(HapiBpc);


  await server.register(Resources, { routes: { prefix: '/resources' } });
  // await server.register(Newsletters, { routes: { prefix: '/newsletters' } });
  // await server.register(Kundeunivers, { routes: { prefix: '/kundeunivers' } });


  server.route({
    method: 'GET',
    path: '/favicon.ico',
    handler: function(request, h){
      return 'OK';
    }
  });

  server.route({
    method: 'GET',
    path: '/bpc_env',
    handler: async (request, h) => {
      return h.bpc.env;
    }
  });

  server.route({
    method: 'GET',
    path: '/{param*}',
    handler: {
      directory: {
        path: './client',
        redirectToSlash: true,
        index: true
      }
    }
  });

  await server.start();
  log(`Server running at: ${server.info.uri}`);
};

process.on('unhandledRejection', (err) => {
  console.log(err);
  process.exit(1);
});

init();
