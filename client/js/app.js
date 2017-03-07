

// The function to run on the gigya onLogin event
function onLoginEventHandler(response) {
  console.log('onLoginEventHandler', response);
  bpcSignin();
}

// The function to run on the gigya onLogout event
function onLogoutEventHandler(response){
  console.log('onLogoutEventHandler', response);
  deleteUserTicket(); // Also reloads the page
  // $('#gigya-loginButton').show();
  // $('#gigya-logoutButton').hide();
}

function bpcSigninEventHandler(ticket){
  getNewsletters();
  getSignups();
}


$( document ).ready(function() {
  bpcSignin();
});

// Add the event handler
gigya.accounts.addEventHandlers({ onLogin: onLoginEventHandler});
gigya.accounts.addEventHandlers({ onLogout: onLogoutEventHandler});



// It's a pretty messy code. But it shows the flow.

function bpcSignin(callback){
  if (callback === undefined || typeof callback !== 'function'){
    callback = bpcSigninEventHandler;
  }

  gigya.accounts.getAccountInfo({
    callback: function(response){

      console.log('accounts.getAccountInfo', response);

      if (response.status === 'OK') {

        var rsvp = getUrlVar('rsvp');

        if (rsvp){
          getUserTicket(rsvp, function(ticket){
            removeUrlVar('rsvp');
            callback(ticket);
          });
        } else if(missingTicket()){
          requestSso('GET', '/rsvp?app=test_sso_app&provider=gigya'.concat('&UID=', response.UID, '&UIDSignature=', response.UIDSignature, '&signatureTimestamp=', response.signatureTimestamp, '&email=', response.profile.email), {}, function(rsvp){
            console.log('RSVP', rsvp);
            getUserTicket(rsvp, callback);
          });
        } else if(isTicketExpired()){
          console.log('Refreshing ticket');
          refreshUserTicket(callback);
        } else {
          requestSso('GET', '/me', null, function(me){
            console.log('bpc.me', me);
            callback(readTicket());
            if (me.statusCode === 401){
            } else {
            }
          });
        }

        $('#gigya-email').val(response.profile.email);
        $('#gigya-firstName').val(response.profile.firstName);
        $('#gigya-lastName').val(response.profile.lastName);
        $('#gigya-loginButton').hide();
        $('#gigya-logoutButton').show();

      } else if (response.status === 'FAIL') {
        $('#gigya-logoutButton').hide();
        callback(response);
      }
    }
  });
}


function getUserTicket(rsvp, callback){
  $.ajax({
    type: 'POST',
    url: '/tickets',
    contentType: 'application/json; charset=utf-8',
    data: JSON.stringify({rsvp: rsvp}),
    success: [
      function(userTicket, status, jqXHR) {
        console.log('POST ticket sucess', userTicket, status);
      },
      callback
    ],
    error: function(jqXHR, textStatus, err) {
      console.error(textStatus, err.toString());
    }
  });
}


function refreshUserTicket(callback){
  $.ajax({
    type: 'GET',
    url: '/tickets',
    success: [
      function(data, status, jqXHR) {
        console.log('reissue', data, status);
        location.reload();
      },
      callback
    ],
    error: function(jqXHR, textStatus, err) {
      console.log('Refresh user ticket failed');
      console.error(textStatus, err.toString());
      // deleteTicket();
    }
  });
}


function deleteUserTicket(callback){
  // This is not a global signout.
  $.ajax({
    type: 'DELETE',
    url: '/tickets',
    success: [
      function(data, status, jqXHR) {
        console.log('DELETE ticket sucess', data, status);
        location.reload();
      },
      callback
    ],
    error: function(jqXHR, textStatus, err) {
      console.error(textStatus, err.toString());
    }
  });
}


function getResources(callback){
  var resource = $('#public-resource');
  resource.text('');
  $.ajax({
    type: 'GET',
    url: '/resources',
    contentType: 'application/json; charset=utf-8',
    success: [
      function(data, status, jqXHR) {
        console.log('getResources', data, status);
        resource.text(data.message);
      },
      callback
    ],
    error: function(jqXHR, textStatus, err) {
      console.error(textStatus, err.toString());
    }
  });
}


function getProtectedResource(callback){
  var protectedResource = $('#protected-resource');
  protectedResource.text('');
  $.ajax({
    type: 'GET',
    url: '/resources/protected',
    contentType: 'application/json; charset=utf-8',
    // data: JSON.stringify(userTicket),
    success: [
      function(data, status, jqXHR) {
        console.log('getProtectedResource', data, status);
        protectedResource.text(data.message);
      },
      callback
    ],
    error: function(jqXHR, textStatus, err) {
      console.error(textStatus, err.toString());
      protectedResource.text('Ingen adgang');
    }
  });
}


function requestSso(type, path, payload, callback){
  if (callback === undefined && typeof path === 'function'){
    callback = path;
    path = '';
  }

  if (path === '/'){
    path = '';
  }

  var options = {
    type: type,
    url: 'http://localhost:8085'.concat(path),
    headers: {},
    contentType: 'application/json; charset=utf-8',
    data: ['POST', 'PUT'].indexOf(type) > -1 && payload !== null ? JSON.stringify(payload) : null,
    xhrFields: {
      withCredentials: true
    },
    success: [
      callback
    ],
    error: function(jqXHR, textStatus, err) {
      console.error(textStatus, err.toString());
      callback(jqXHR.responseJSON);
    }
  };

  var ticket = readTicket('ticket');
  if (ticket !== null){
    options.headers['Authorization'] = hawk.client.header(options.url, options.type, {credentials: ticket, app: ticket.app}).field
  }

  $.ajax(options);
}


function getNewsletters(callback){
  $.ajax({
    type: 'GET',
    url: '/newsletters',
    contentType: 'application/json; charset=utf-8',
    success: [
      function(data, status, jqXHR) {
        console.log('getNewsletters', data, status);
      },
      callback
    ],
    error: function(jqXHR, textStatus, err) {
      console.error(textStatus, err.toString());
    }
  });
}


function getSignups(callback){
  var mdbSignups = $('#mdb-signups');
  mdbSignups.text('');
  $.ajax({
    type: 'GET',
    url: '/newsletters/signups',
    contentType: 'application/json; charset=utf-8',
    success: [
      function(data, status, jqXHR) {
        console.log('getSignups', data, status);
        mdbSignups.text(data.nyhedsbreve.join(', '));
      },
      callback
    ],
    error: function(jqXHR, textStatus, err) {
      console.error(textStatus, err.toString());
    }
  });
}


function createSignup(nyhedsbrev_id, callback) {
  var mdbSignups = $('#mdb-signups');

  var payload = {
    nyhedsbrev_id: nyhedsbrev_id !== undefined ? nyhedsbrev_id : parseInt($('#nyhedsbrev_id').val(), 10)
  };

  $.ajax({
    type: 'POST',
    url: '/newsletters/signups',
    contentType: 'application/json; charset=utf-8',
    data: JSON.stringify(payload),
    success: [
      function(data, status, jqXHR) {
        console.log('createSignup', data, status);
        mdbSignups.text(data.join(', '));
      },
      callback
    ],
    error: function(jqXHR, textStatus, err) {
      console.error(textStatus, err.toString());
    }
  });
}
