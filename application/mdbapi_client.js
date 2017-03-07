/* jshint node: true */
'use strict';

const http = require('http');
const Boom = require('boom');
const MDBAPI_ADDRESS = process.env.MDBAPI_ADDRESS;
const MDBAPI_PORT = process.env.MDBAPI_PORT;
const MDBAPI_LOCATION = process.env.MDBAPI_LOCATION;

console.log('Connecting to MDBAPI on host', MDBAPI_ADDRESS, 'and port', MDBAPI_PORT);


module.exports.getNewsletters = function(query, callback) {
  callMdbapi('GET', '/nyhedsbreve', query, null, callback);
};


module.exports.getUser = function(ekstern_id, callback) {
  callMdbapi('GET', '/users/'.concat(ekstern_id), null, null, callback);
};


module.exports.createSignup = function(ekstern_id, nyhedsbrev_id, callback) {
  doSignup('POST', ekstern_id, nyhedsbrev_id, callback);
};


module.exports.deleteSignup = function(ekstern_id, nyhedsbrev_id, callback) {
  doSignup('DELETE', ekstern_id, nyhedsbrev_id, callback);
};


function doSignup(method, ekstern_id, nyhedsbrev_id, callback) {
  var payload = {
    location_id: MDBAPI_LOCATION,
    nyhedsbreve: [nyhedsbrev_id]
  };
  callMdbapi(method, '/users/'.concat(ekstern_id, '/nyhedsbreve'), payload, null, callback);
};


function callMdbapi(method, path, body, credentials, callback) {
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
    hostname: MDBAPI_ADDRESS,
    port: MDBAPI_PORT,
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
module.exports.request = callMdbapi;


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
