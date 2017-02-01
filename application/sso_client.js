/*jshint node: true */
'use strict';

const Boom = require('boom');
const Hawk = require('hawk');
const http = require('http');
const https = require('https');
var appTicket = {};

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
  callSsoServer('POST', '/oz/app', {}, app, callback);
};


getAppTicket(function(err, result){
  if (err){
    console.error(err);
    process.exit(1);
  } else {
    console.log('Got the appTicket');
    appTicket = result;
  }
});


module.exports.getAppTicket = getAppTicket;


module.exports.refreshAppTicket = function(callback){
  callSsoServer('POST', '/oz/reissue', {}, appTicket, function(err, result){
    if (err){
      console.error('refreshAppTicket:', err);
      callback(err);
    } else {
      console.log('refreshAppTicket (app)', result);
      appTicket = result;
      callback(null, {});
    }
  });
};


module.exports.validateAppTicket = function(appTicket, callback){
  callSsoServer('POST', '/tickets/validateappticket', {}, appTicket, callback);
};


module.exports.getUserTicket = function(rsvp, callback) {
  callSsoServer('POST', '/oz/rsvp', {rsvp: rsvp}, appTicket, callback);
};


module.exports.refreshUserTicket = function(userTicket, callback){
  callSsoServer('POST', '/oz/reissue', {}, userTicket, callback);
};


module.exports.validateUserTicket = function(userTicket, scope, callback){
  callSsoServer('POST', '/tickets/validateuserticket', {scope: scope}, userTicket, callback);
};


module.exports.validateUserPermissions = function(userTicket, permissions, callback){
  callSsoServer('POST', '/tickets/validateuserpermissions', {permissions: permissions}, userTicket, callback);
};


module.exports.getUserProfile = function(userTicket, callback){
  callSsoServer('GET', '/tickets/userprofile', {}, userTicket, callback);
};


function callSsoServer(method, path, body, credentials, callback) {
  if (callback === undefined && typeof body === 'function') {
    callback = body;
    body = null;
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
      'Authorization': Hawk.client.header('http://'.concat(options.hostname, ':', options.port, options.path), method, {credentials: credentials, app: POC_APPLICATION_APP_ID}).field
    };
  }

  var req = http.request(options, parseReponse(callback));

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
