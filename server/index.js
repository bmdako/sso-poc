/*jshint node: true */
'use strict';

const Hapi = require('hapi');
const Inert = require('inert');
const Bpc = require('./bpc_client');
const Resources = require('./resources');
const Newsletters = require('./newsletters');
const Tickets = require('./tickets');
const Kundeunivers = require('./kundeunivers');

const application = new Hapi.Server();
application.connection({ port: process.env.PORT ? process.env.PORT : 8000 });

application.register(Inert, () => {});
application.register(Resources, { routes: { prefix: '/resources' } }, cb);
application.register(Newsletters, { routes: { prefix: '/newsletters' } }, cb);
application.register(Tickets, { routes: { prefix: '/tickets' } }, cb);
application.register(Kundeunivers, { routes: { prefix: '/kundeunivers' } }, cb);


application.route({
  method: 'GET',
  path: '/favicon.ico',
  handler: function(request, reply){
    reply();
  }
});

application.route({
  method: 'GET',
  path: '/bpc_env',
  handler: function(request, reply){
    reply(Bpc.env());
  }
});

application.route({
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

application.start((err) => {
  if (err) {
    throw err;
  }
  console.log(`Application running at: ${application.info.uri}`);

  try {
    // Running the init-script
    require('./init');
  } catch(ex){}
});

function cb (err) {
  if (err) {
    console.log('Error when loading plugin', err);
    application.stop();
  }
}
