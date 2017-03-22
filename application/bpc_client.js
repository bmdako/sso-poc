/* jshint node: true */
'use strict';

const http = require('http');
const https = require('https');
const Boom = require('boom');
const Hawk = require('hawk');
var appTicket = {};

module.exports.getAppTicket = function () {
  return appTicket
};

const POC_APPLICATION_APP_ID = process.env.POC_APPLICATION_APP_ID;
const POC_APPLICATION_APP_SECRET = process.env.POC_APPLICATION_APP_SECRET;
const POC_APPLICATION_SSO_URL = process.env.POC_APPLICATION_SSO_URL;
const POC_APPLICATION_SSO_PORT = process.env.POC_APPLICATION_SSO_PORT;


function getAppTicket(callback) {
  var app = {
    id: POC_APPLICATION_APP_ID,
    key: POC_APPLICATION_APP_SECRET,
    algorithm: 'sha256'
  };
  callSsoServer('POST', '/ticket/app', {}, app, function(err, result){
    if (err){
      console.error(err);
      process.exit(1);
    } else {
      console.log('Got the appTicket', result);
      appTicket = result;

      setTimeout(refreshAppTicket, result.exp - Date.now() - 10000)
    }
  });
};

getAppTicket();

function refreshAppTicket(){
  // callSsoServer('POST', '/ticket/reissue', null, appTicket, function(err, result){
  reissueTicket(null, appTicket, function(err, result){
    if (err){
      console.error('refreshAppTicket:', err);
    } else {
      appTicket = result;
      setTimeout(refreshAppTicket, result.exp - Date.now() - 10000);
    }
  });
};

function reissueTicket(payload, ticket, callback){
  callSsoServer('POST', '/ticket/reissue', payload, ticket, callback);
};
module.exports.reissueTicket = reissueTicket;


module.exports.getUserTicket = function(rsvp, callback) {
  callSsoServer('POST', '/ticket/user', {rsvp: rsvp}, appTicket, callback);
};


module.exports.refreshUserTicket = function(userTicket, callback){
  // callSsoServer('POST', '/ticket/reissue', null, userTicket, callback);
  reissueTicket(null, userTicket, callback)
};


module.exports.me = function(userTicket, callback){
  callSsoServer('GET', '/me', null, userTicket, callback);
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



function callSsoServer(method, path, body, credentials, callback) {
  if (callback === undefined && typeof body === 'function') {
    callback = body;
    body = null;
  }

  var agent;
  if(true){
    agent =  http;
  } else {
    agent =  https;
  }

  var parameters = [];

  if (method === 'GET' && body !== null && typeof body === 'object'){
    var temp = [];
    Object.keys(body).forEach(function (k){
      parameters.push(k.concat('=', body[k]));
    });
  }

  var options = {
    hostname: POC_APPLICATION_SSO_URL,
    port: POC_APPLICATION_SSO_PORT,
    // path: path.concat('?apiKey=', GIGYA_APP_KEY, '&userKey=', GIGYA_USER_KEY, '&secret=', GIGYA_SECRET_KEY, parameters),
    path: path.concat(parameters.length > 0 ? '?' : '', parameters.join('&')),
    method: method,
    headers: {
      // 'Authorization': 'Basic ' + authorization
    }
  };

  if (credentials !== undefined && credentials !== null && Object.keys(credentials).length > 1){
    options.headers = {
      'Authorization': Hawk.client.header(agent.globalAgent.protocol.concat('//', options.hostname, ':', options.port, options.path), method, {credentials: credentials, app: credentials.app }).field
    };
  }

  var req = agent.request(options, parseReponse(callback));

  if (method !== 'GET' && body !== null && typeof body === 'object'){
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
        var err = Boom.wrap(new Error(data.error), data.statusCode);
        callback(err, null);
      }
      else
        callback(null, data);
    });
  };
}
