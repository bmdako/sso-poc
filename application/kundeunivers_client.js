/* jshint node: true */
'use strict';

const http = require('http');
const https = require('https');
const Boom = require('boom');
const Hawk = require('hawk');
const Url = require('url');
const KU_ADDRESS = process.env.KU_ADDRESS;
const KU_PORT = process.env.KU_PORT;
module.exports.KU_URL = null;

try {
  module.exports.KU_URL = Url.parse(process.env.KU_URL);
} catch (ex) {
  console.error('Env var KU_URL missing or invalid.');
  process.exit(1);
}

console.log('Connecting to KUNDEUNIVERS on host', KU_ADDRESS, 'and port', KU_PORT);

module.exports.KU_PORT = KU_PORT;


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
    hostname: KU_ADDRESS,
    port: KU_PORT,
    path: path.concat(parameters.length > 0 ? '?' : '', parameters.join('&')),
    method: method,
    headers: {
      // 'Authorization': 'Basic ' + authorization
    }
  };
  if (credentials !== undefined && credentials !== null && Object.keys(credentials).length > 1){
    options.headers = {
      'Authorization': Hawk.client.header(https.globalAgent.protocol.concat('//', options.hostname, ':', options.port, options.path), method, {credentials: credentials, app: credentials.app }).field
    };
  }


  var req = https.request(options, parseReponse(callback));

  if (method !== 'GET' && body !== null && typeof body === 'object'){
    console.log('stringify', JSON.stringify(body));
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

      console.log(data);

      if (res.statusCode > 300) {
        var err = Boom.wrap(new Error(data.error), res.statusCode);
        callback(err, null);
      }
      else
        callback(null, data);
    });
  };
}
