/*jshint node: true */
'use strict';

const Boom = require('boom');
const Hawk = require('hawk');
const http = require('http');
const https = require('https');
const url = require('url');
var appTicket = {};
var BPC_URL;

try {
  BPC_URL = url.parse(process.env.BPC_URL);
} catch (ex) {
  console.error('Env var BPC_URL missing or invalid.');
  process.exit(1);
}

const BPC_APP_ID = process.env.BPC_APP_ID;
const BPC_APP_SECRET = process.env.BPC_APP_SECRET;

console.log('Connecting to BPC on', BPC_URL.host, 'AS', BPC_APP_ID);

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

  callSsoServer({path: '/ticket/app', method: 'POST'}, {}, app, function(err, result){
    if (err){
      console.error(err);
      process.exit(1);
    } else {
      console.log('Got the appTicket');
      appTicket = result;
      setTimeout(refreshAppTicket, result.exp - Date.now() - 10000);
    }
  });
};

module.exports.getAppTicket = getAppTicket;

getAppTicket();

function refreshAppTicket(){
  callSsoServer({path: '/ticket/reissue', method: 'POST'}, payload, appTicket, function(err, result){
    if (err){
      console.error('refreshAppTicket:', err);
    } else {
      console.log('refreshAppTicket (console)', result);
      appTicket = result;
      setTimeout(refreshAppTicket, result.exp - Date.now() - 10000);
    }
  });
};

module.exports.reissueTicket = function (payload, ticket, callback){
  callSsoServer({path: '/ticket/reissue', method: 'POST'}, payload, ticket, callback);
};


module.exports.getUserTicket = function(rsvp, callback) {
  callSsoServer({path: '/ticket/user', method: 'POST'}, {rsvp: rsvp}, appTicket, callback);
};


module.exports.refreshUserTicket = function(userTicket, callback){
  callSsoServer({path: '/ticket/refresh', method: 'POST'}, null, userTicket, callback);
};


module.exports.getUserPermissions = function(userTicket, permission, callback){
  // Example using appTicket
  // callSsoServer('GET', '/permissions/'.concat(userTicket.user, '/', permission), null, appTicket, callback);
  // Example using userTicket
  callSsoServer('GET', '/permissions/'.concat(permission), null, userTicket, callback);
};


module.exports.setUserPermissions = function(user, permission, payload, callback){
  callSsoServer('POST', '/permissions/'.concat(user, '/', permission), payload, appTicket, callback);
};


module.exports.bewit = function(uri, credentials){
  const duration = 60 * 5;      // 5 Minutes
  const bewit = Hawk.uri.getBewit(uri, { credentials: credentials, ttlSec: duration, ext: 'dd' });
  // const uri = uri + '&bewit=' + bewit;
  return bewit;
};


function callSsoServer(options, body, credentials, callback) {
  if (callback === undefined && typeof body === 'function') {
    callback = body;
    body = null;
  }

  options.protocol = BPC_URL.protocol;
  options.hostname = BPC_URL.hostname;
  if (BPC_URL.port){
    options.port = BPC_URL.port;
  }

  var parameters = [];

  if ((options.method === null || options.method === 'GET') && body !== null && typeof body === 'object'){
    var temp = [];
    Object.keys(body).forEach(function (k){
      parameters.push(k.concat('=', body[k]));
    });

    if (parameters.length > 0) {
      options.path = options.path.concat('?', parameters.join('&'));
    }
  }

  if (credentials !== undefined && credentials !== null && Object.keys(credentials).length > 1){
    var requestHref = url.resolve(BPC_URL.href, options.path)
    options.headers = {
      'Authorization': Hawk.client.header(requestHref, options.method, {credentials: credentials, app: BPC_APP_ID}).field
    };
  }

  var reqHandler = https;
  if (options.protocol === 'http:') {
    reqHandler = http;
  }

  var req = reqHandler.request(options, parseReponse(callback));

  if (options.method !== null && options.method !== 'GET' && body !== null && typeof body === 'object'){
    req.write(JSON.stringify(body));
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
        callback(err, null);
      }
      else
        callback(null, data);
    });
  };
}
