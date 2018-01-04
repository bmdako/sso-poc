
var bpc_env;
getBpcEnv();

// The function to run on the gigya onLogin event
function onLoginEventHandler(response) {
  console.log('onLoginEventHandler', response);
  showProfileContainer(response);
  bpcSignin(response);
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
}


$( document ).ready(function() {
  var pwrt = getUrlVar('pwrt');

  if (pwrt) {
    $('#resetPasswordContainer').show();
  } else {
    gigya.accounts.getAccountInfo({
      callback: function(response){
        console.log('accounts.getAccountInfo', response);

        if (response.status === 'OK') {
          showProfileContainer(response);
          bpcSignin(response);

          $('#loginContainer').hide();
        } else if (response.status === 'FAIL') {
          $('#loginContainer').show();

          // if (Fingerprint2) {
          //   new Fingerprint2().get(function(result, components){
          //     console.log(result); //a hash, representing your device fingerprint
          //     console.log(components); // an array of FP components
          //   });
          // }

          // anonymous.getPermissions()
          // .done(function (data) {
          //   console.log('getPermissions', data);
          // });
        }
      }
    });
  }
});

// Add the event handler
gigya.accounts.addEventHandlers({ onLogin: onLoginEventHandler});
gigya.accounts.addEventHandlers({ onLogout: onLogoutEventHandler});



// It's a pretty messy code. But it shows the flow.


function getBpcEnv(){
  return $.ajax({
    type: 'GET',
    url: '/bpc_env',
    success: function(data, status, jqXHR) {
      console.log('bpc_env', data);
      bpc_env = data;
      $('#bpc_env').text(JSON.stringify(bpc_env));
    },
    error: function(jqXHR, textStatus, err) {
      console.error(textStatus, err.toString());
    }
  });
}


function showProfileContainer(accountInfo) {
  $('#loginContainer').hide();
  $('#profileContainer').show();

  $('#profileEmail').val(accountInfo.profile.email);
  $('#firstName').val(accountInfo.profile.firstName);
  $('#lastName').val(accountInfo.profile.lastName);
}


function bpcSignin(accountInfo, callback) {
  if (callback === undefined || typeof callback !== 'function'){
    callback = bpcSigninEventHandler;
  }

  var rsvp = getUrlVar('rsvp');

  if (rsvp){
    getUserTicket(rsvp, function(ticket){
      removeUrlVar('rsvp');
      callback(ticket);
    });
  } else if(missingTicket()){
    requestBpc('GET', '/rsvp?'.concat('app=', bpc_env.app_id, '&UID=', accountInfo.UID, '&UIDSignature=', encodeURIComponent(accountInfo.UIDSignature), '&signatureTimestamp=', accountInfo.signatureTimestamp, '&email=', accountInfo.profile.email), {}, function(response){
      console.log('RSVP', response);
      if (typeof response === 'string') {
        getUserTicket(response, callback);
      } else if (response.rsvp) {
        getUserTicket(response.rsvp, callback);
      }
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

  return;
}


function getUserTicket(rsvp, callback){
  return $.ajax({
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
  return $.ajax({
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
  return $.ajax({
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
    path = ''; // <- We don't need a slash (/) here
  }

  if (callback === undefined) {
    callback = function(){};
  }

  if (path.startsWith('/')){
    path = path.substring(1);
  }

  var options = {
    type: type,
    url: bpc_env.href.concat(path),
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

  var ticket = readTicket();
  if (ticket !== null){
    options.headers['Authorization'] = hawk.client.header(options.url, options.type, {credentials: ticket, app: ticket.app}).field
  }

  return $.ajax(options);
}



function getResources(callback){
  var resource = $('#public-resource');
  resource.text('');
  return $.ajax({
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
  var protectedResourceViewcounter = $('#protected-resource-viewcounter');
  protectedResource.text('');
  return $.ajax({
    type: 'GET',
    url: '/resources/protected',
    contentType: 'application/json; charset=utf-8',
    // data: JSON.stringify(userTicket),
    success: [
      function(data, status, jqXHR) {
        console.log('getProtectedResource', data, status);
        protectedResource.text(data.message);
        protectedResourceViewcounter.text(data.resourceViewCounter);
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

  // options.url = 'http://localhost:8000/nyhedsbreve';

  // var ticket = readTicket('ticket');
  // if (ticket !== null){
  //   if (options.headers === undefined){
  //     options.headers = {};
  //   }
  //   options.headers['Authorization'] = hawk.client.header(options.url, options.type, {credentials: ticket, app: ticket.app}).field
  // }

  return $.ajax(options);
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

  // options.url = 'http://localhost:8000/users/me';

  // var ticket = readTicket('ticket');
  // if (ticket !== null){
  //   if (options.headers === undefined){
  //     options.headers = {};
  //   }
  //   options.headers['Authorization'] = hawk.client.header(options.url, options.type, {credentials: ticket, app: ticket.app}).field
  // }

  return $.ajax(options);
}


function createSignup(nyhedsbrev_id, callback) {
  var mdbSignups = $('#mdb-signups');

  var payload = {
    nyhedsbrev_id: nyhedsbrev_id !== undefined ? nyhedsbrev_id : parseInt($('#nyhedsbrev_id').val(), 10)
  };

  return $.ajax({
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


function validateAgainstKU(callback){
  var options = {
    type: 'GET',
    url: '/kundeunivers',
    contentType: 'application/json; charset=utf-8',
    success: [
      function(data, status, jqXHR) {
        console.log('validateAgainstKU', data, status);
      },
      callback
    ],
    error: function(jqXHR, textStatus, err) {
      console.error(textStatus, err.toString());
    }
  };

  return $.ajax(options);
}


function setAccountInfo(){
  gigya.accounts.setAccountInfo({
    profile: {
      firstName: 'Danny'
    },
    callback: function(res){
      console.log('setAccountInfo', res);
    }
  });
}

function setAnonymousData() {

  const auid = $('#auid').val();
  const auidField = $('#auidField').val();
  const auidValue = $('#auidValue').val();
  let data = {};
  data[auidField] = auidValue;

  var options = {
    type: 'POST',
    url: `/resources/anonymous/${auid}`,
    contentType: 'application/json; charset=utf-8',
    data: JSON.stringify(data),
    success: [
      function(data, status, jqXHR) {
        console.log('setAnonymousData', data, status);
      }
    ],
    error: function(jqXHR, textStatus, err) {
      console.error(textStatus, err.toString());
    }
  };

  return $.ajax(options);
}
