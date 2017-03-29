

// The function to run on the gigya onLogin event
function onLoginEventHandler(response) {
  console.log('onLoginEventHandler', response);
  bpcSignin();
}

// The function to run on the gigya onLogout event
function onLogoutEventHandler(response){
  console.log('onLogoutEventHandler', response);
  deleteUserTicket(); // Also reloads the page
}

function bpcSigninEventHandler(ticket){
  var returnUrl = getUrlVar('returnUrl');
  if (returnUrl) {
    window.location.href = returnUrl;
    return;
  }

  getNewsletters();
  getSignups();
}


$( document ).ready(function() {
  var pwrt = getUrlVar('pwrt');

  if (pwrt) {
    $('#resetPasswordContainer').show();
  } else {
    bpcSignin();
  }
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
          requestBpc('GET', '/rsvp?app=test_sso_app&provider=gigya'.concat('&UID=', response.UID, '&UIDSignature=', response.UIDSignature, '&signatureTimestamp=', response.signatureTimestamp, '&email=', response.profile.email), {}, function(rsvp){
            console.log('RSVP', rsvp);
            getUserTicket(rsvp, callback);
          });
        } else if(isTicketExpired()){
          console.log('Refreshing ticket');
          refreshUserTicket(callback);
        } else {
          requestBpc('GET', '/me', null, function(me){
            console.log('bpc.me', me);
            callback(readTicket());
            if (me && me.statusCode === 401){
            } else {
            }
          });
        }

        $('#loginContainer').hide();
        $('#profileContainer').show();

        $('#profileEmail').val(response.profile.email);
        $('#firstName').val(response.profile.firstName);
        $('#lastName').val(response.profile.lastName);

      } else if (response.status === 'FAIL') {
        $('#loginContainer').show();
        $('#profileContainer').hide();

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


function login(event){
  event.preventDefault()

  var email = $('#loginEmail').val();
  var password = $('#loginPassword').val();

  // TODO: Log user in Drupal-SSO too

  gigya.accounts.login({
    loginID: email,
    password: password,
    callback: function(response){
      console.log('login', response);
    }
  });
}



function forgotPasswordSendEmail(event){
  event.preventDefault();

  var email = $('#loginEmail').val();
  if (email.length === 0){
    // TODO: use http://getbootstrap.com/css/#forms-control-validation
    alert('Indtast email.');
    return;
  }

  // TODO: If we use the Gigya email-flow, which we propably don't, we must change the password in Drupal/SSO too!!!

  // $('.forgotFormInput').hide();

  $('.loginForm').attr("disabled", true);
  $('.forgotFormLink').hide();

  gigya.accounts.resetPassword({
    loginID: email,
    callback: function(response){
      console.log('resetPassword', response);

      if(response.status === 'OK'){
        $('.forgotFormDone').show();
      } else {
        console.error(response);
        $('.forgotFormError').show();
      }
    }
  });
}

function resetPassword(event){
  event.preventDefault();

  var pwrt = getUrlVar('pwrt');
  var newPassword = $('#newPasswordReset').val();

  if(newPassword !== $('#newPasswordResetRepeat').val()){
    // TODO: use http://getbootstrap.com/css/#forms-control-validation
    alert('Kodeord stemmer ikke overens.');
    return;
  }

  gigya.accounts.resetPassword({
    passwordResetToken: pwrt,
    newPassword: newPassword,
    callback: function(response){
      console.log('resetPassword', response);

      if(response.status === 'OK'){
        location = location.origin;
      } else {
        console.error(response);
        alert('Der skete en fejl.');
        // TODO
      }
    }
  });
}


function changePassword(event){
  event.preventDefault();
  var email;
  var newPassword = $('#newPassword').val();
  var existingPassword = $('#existingPassword').val();

  if(newPassword !== $('#newPasswordRepeat').val()){
    // TODO: use http://getbootstrap.com/css/#forms-control-validation
    alert('Kodeord stemmer ikke overens.');
    return;
  }

  // TODO: We must change the password in Drupal/SSO too!!!

  gigya.accounts.setAccountInfo({
    newPassword: newPassword,
    password: existingPassword,
    callback: function (response) {
      console.log('setAccountInfo', response);
      if (response.status === 'OK'){
        // TODO: Show that it went well
      } else {
        // TODO: Show an error
      }
    }
  });
}



function requestBpc(type, path, payload, callback){
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


function getNewsletters(callback){

  var options = {
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
  };

  $.ajax(options);
}


function getSignups(callback){
  var mdbSignups = $('#mdb-signups');
  mdbSignups.text('');

  var options = {
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
  };

  $.ajax(options);
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
