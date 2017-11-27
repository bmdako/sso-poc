'use strict';

var anonymous = anonymous || (function(){

  if (!window.jQuery){
    console.error('jQuery missing');
    return;
  }

  if (!hawk){
    console.error('hawk missing');
    // $.getScript('https://s3-eu-west-1.amazonaws.com/nlstatic.berlingskemedia.dk/anon_test/hawk/browser.js');
  }

  var env = 'prod';
  var _bpc_url = 'https://bpc.berlingskemedia.net';
  var _app = 'datalake_anonymous';

  const lib = {

    setUrl(url){
      _bpc_url = url;
      var lastIndexOfSlash = _bpc_url.lastIndexOf('/');
      if (lastIndexOfSlash === _bpc_url.length - 1) {
        _bpc_url = _bpc_url.substring(0, lastIndexOfSlash);
      }
    },

    setApp(app_id){
      _app = app_id;
    },

    set(input){
      if(input.url){
        this.setUrl(input.url)
      }
      if(input.app){
        this.setApp(input.app)
      }
    },

    getPermissions: function(callback){
      var req;
      getTicket()
      .done(function(ticket){
        req = requestPermissions(ticket)
        .done(callback)
        .done(function(permissions){
          console.log('Anonymous permissions', permissions);
        });
      });
      return req;
    }
  };

  return lib;

  function readCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for(var i=0;i < ca.length;i++) {
      var c = ca[i];
      while (c.charAt(0)==' ') c = c.substring(1,c.length);
      if (c.indexOf(nameEQ) == 0) {
        return c.substring(nameEQ.length,c.length);
      }
    }
    return null;
  }

  function getTicket() {
    try {

      let bpc_auti = readCookie('bpc_auti');
      if (bpc_auti === null) {
        return requestTicket()
      }

      var ticket = JSON.parse(window.atob(bpc_auti));
      if (ticket.exp < hawk.utils.now()) {
        return requestTicket();
      } else {
        return $.when(ticket);
      }


    } catch(err) {
      console.error('Error when getting ticket', err);
      return;
    };
  }


  function requestTicket(app_id){
    const _id_app = app_id || _app;

    if (_id_app === undefined) {
      console.error('App not set');
      return;
    }

    var options = {
      type: 'GET',
      url: _bpc_url.concat('/ticket/anonymous', '?app=', _id_app),
      headers: {},
      contentType: 'application/json; charset=utf-8',
      xhrFields: {
        withCredentials: true
      }
    };

    return $.ajax(options)
    .done(function(ticket, status, jqXHR) {
      var expiresDate = new Date();
      expiresDate.setMonth(expiresDate.getMonth() + (12 * 15));
      document.cookie = "bpc_auid=" + ticket.user + ";expires=" + expiresDate
                      + ";domain=." + document.domain + ";path=/";
      document.cookie = "bpc_auti=" + window.btoa(JSON.stringify(ticket)) + ";expires=" + expiresDate
                      + ";domain=." + document.domain + ";path=/";
    })
    .fail(function(jqXHR, textStatus, err) {
      console.error(textStatus, err.toString());
    });
    return req;
  }

  function requestPermissions(ticket) {

    var options = {
      type: 'GET',
      url: _bpc_url.concat('/permissions/anonymous'),
      // url: _bpc_url.concat('/me'),
      headers: {},
      contentType: 'application/json; charset=utf-8'
    };

    let hawkHeader = hawk.client.header(options.url, options.type, {credentials: ticket, app: ticket.app});
    if (hawkHeader.err) {
      console.error(hawkHeader.err);
      return;
    }

    options.headers['Authorization'] = hawkHeader.field;

    return $.ajax(options);
  }


}());
