/*jshint node: true */
'use strict';

const Boom = require('boom');
const Hawk = require('hawk');
const http = require('http');
const EventEmitter = require('events');
const https = require('https');
const Url = require('url');
var appTicket = {};
var BPC_URL;

try {
  BPC_URL = Url.parse(process.env.BPC_URL);
} catch (ex) {
  console.error('Env var BPC_URL missing or invalid.');
}

const BPC_APP_ID = process.env.BPC_APP_ID;
const BPC_APP_SECRET = process.env.BPC_APP_SECRET;

console.log('Connecting to BPC on', BPC_URL.host, 'AS', BPC_APP_ID);

module.exports.events = new EventEmitter();

module.exports.env = function() {
  return {
    href: BPC_URL.href,
    app_id: BPC_APP_ID,
  };
};

function getAppTicket() {
  var app = {
    id: BPC_APP_ID,
    key: BPC_APP_SECRET,
    algorithm: 'sha256'
  };

  callSsoServer({path: '/ticket/app', method: 'POST'}, app, function(err, result){
    if (err){
      console.error(err);
      setTimeout(getAppTicket, 1000 * 60 * 5);
    } else {
      console.log('Got the appTicket');
      appTicket = result;
      module.exports.events.emit('ready');
      setTimeout(refreshAppTicket, result.exp - Date.now() - 10000);
    }
  });
};

getAppTicket();

function refreshAppTicket(){
  callSsoServer({path: '/ticket/reissue', method: 'POST'}, appTicket, function(err, result){
    if (err){
      console.error('refreshAppTicket:', err);
    } else {
      console.log('refreshAppTicket', result);
      appTicket = result;
      setTimeout(refreshAppTicket, result.exp - Date.now() - 10000);
    }
  });
};


module.exports.reissueTicket = function (payload, ticket, callback){
  callSsoServer({path: '/ticket/reissue', method: 'POST', payload: payload}, ticket, callback);
};


module.exports.getUserTicket = function(rsvp, callback) {
  callSsoServer({path: '/ticket/user', method: 'POST', payload: {rsvp: rsvp}}, appTicket, callback);
};


module.exports.refreshUserTicket = function(userTicket, callback){
  callSsoServer({path: '/ticket/reissue', method: 'POST'}, userTicket, callback);
};


module.exports.getUserPermissions = function(userTicket, permission, callback){
  // Example using appTicket
  // callSsoServer('GET', '/permissions/'.concat(userTicket.user, '/', permission), null, appTicket, callback);
  // Example using userTicket
  callSsoServer({path: '/permissions/'.concat(permission)}, userTicket, callback);
};


module.exports.setUserPermissions = function(user, permission, payload, callback){
  callSsoServer({path: '/permissions/'.concat(user, '/', permission), method: 'POST', payload: payload}, appTicket, callback);
};


module.exports.me = function(userTicket, callback){
  callSsoServer({path: '/me', method: 'GET'}, userTicket, callback);
};

module.exports.bewit = function(uri, credentials){
  const duration = 60 * 5;      // 5 Minutes
  const bewit = Hawk.uri.getBewit(uri, { credentials: credentials, ttlSec: duration, ext: 'dd' });
  // const uri = uri + '&bewit=' + bewit;
  return bewit;
};


function callSsoServer(options, credentials, callback) {

  Object.assign(options, {
    protocol: BPC_URL.protocol,
    hostname: BPC_URL.hostname
  });

  if (BPC_URL.port){
    options.port = BPC_URL.port;
  }

  if (callback === undefined && typeof credentials === 'function') {
    callback = credentials;
    credentials = null;
  }

  if (callback === undefined) {
    callback = function(err) {
      if (err) {
        console.error(err);;
      }
    }
  }

  // In case we want a request completely without any credentials, use {} as the credentials parameter to this function
  if (credentials === undefined || credentials === null){
    credentials = appTicket;
  }

  if (credentials !== undefined && credentials !== null && Object.keys(credentials).length > 1){
    var requestHref = Url.resolve(BPC_URL.href, options.path);

    var hawkHeader = Hawk.client.header(requestHref, options.method || 'GET', {credentials: credentials, app: BPC_APP_ID});
    if (hawkHeader.err) {
      console.error(hawkHeader.err);
      return callback(new Error('Hawk header: ' + hawkHeader.err));
    }

    options.headers = {
      'Authorization': hawkHeader.field
    };
  }

  var reqHandler = https;
  if (options.protocol === 'http:') {
    reqHandler = http;
  }

  var req = reqHandler.request(options, parseReponse(callback));

  if (options.payload !== undefined && options.payload !== null){
    if (typeof options.payload === 'object'){
      req.write(JSON.stringify(options.payload));
    } else {
      req.write(options.payload);
    }
  }

  req.end();

  req.on('error', function (e) {
    callback(e);
  });
}
module.exports.request = callSsoServer;


function parseReponse (callback) {
  return function (res) {
    var data = '';

    res.on('data', function(d) {
      data = data + d;
    });

    res.on('end', function () {
      try {
        if (data.length > 0){
          data = JSON.parse(data);
        }
      } catch (ex) {
        console.error('JSON parse error on: ', data);
        throw ex;
      }


      if (res.statusCode > 300) {
        var err = Boom.wrap(new Error(data.error), data.statusCode, data.message);
        err.data = data;

        if (res.statusCode === 401 && data.message === 'Expired ticket'){
          getAppTicket();
        }

        callback(err, null);
      }
      else
        callback(null, data);
    });
  };
}
