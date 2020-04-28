
const bpc_env = {
  app: 'test_sso_app',
  // href: 'https://bpc.berlingskemedia-testing.net/'
  href: 'http://bpc.local:8085/'
};

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

// function bpcSigninEventHandler(ticket){
//   var returnUrl = getUrlVar('returnUrl');
//   if (returnUrl) {
//     window.location.href = returnUrl;
//     return;
//   }
// }


$( document ).ready(function() {
  var pwrt = getUrlVar('pwrt');

  if (pwrt) {

    $('#resetPasswordContainer').show();

  } else {


    runAnonymous();

    reissueUserTicket();

    gigya.accounts.getAccountInfo({
      callback: function(response) {
        console.log('accounts.getAccountInfo', response);
        
        if (response.status === 'OK') {
          
          gigya.accounts.getJWT({
            callback: function(response) {
              console.log('accounts.getJWT', response);
              bpcSigninJWT(response);
            }
          });

          showProfileContainer(response);
          bpcSignin(response);

          $('#loginContainer').hide();
        } else if (response.status === 'FAIL') {
          $('#loginContainer').show();

        }
      }
    });
  }
});

// Add the event handler
gigya.accounts.addEventHandlers({ onLogin: onLoginEventHandler});
gigya.accounts.addEventHandlers({ onLogout: onLogoutEventHandler});



function runAnonymous() {

  // fetch(new Request(`https://bpc.berlingskemedia-testing.net/au/ticket?app=aiu_test`), {
  // fetch(new Request(`${ bpc_env.href }au/ticket?app=aiu_test`), {
  fetch(new Request(`${ bpc_env.href }au/ticket`), {
    // credentials: 'include',
    // mode: 'cors'
  })
  .then(response => {
    return response.json()
    .then(ticket => {
      console.log('aiu_test ticket', ticket)
      var expiresDate = new Date();
      expiresDate.setMonth(expiresDate.getMonth() + (12)); // One year
      // document.cookie = `${ ticket.app }_auti=${ window.btoa(JSON.stringify(ticket)) };expires=${ expiresDate }`
      document.cookie = `${ ticket.app }_ticket=${ window.btoa(JSON.stringify(ticket)) };expires=${ expiresDate }`
    });
  })
  .then(() => {
    console.log('reqwuest fdsfds')
    fetch(new Request('/resources'))
    .then(response => response.json())
    .then(json => {
      console.log('a', json)
    });
  })
  .catch(error => {
    console.error(error);
  });
}


function showProfileContainer(accountInfo) {
  $('#loginContainer').hide();
  $('#profileContainer').show();

  $('#profileEmail').val(accountInfo.profile.email);
  $('#firstName').val(accountInfo.profile.firstName);
  $('#lastName').val(accountInfo.profile.lastName);
}


function bpcSigninJWT(response) {

  // console.log(response.id_token);
  // console.log(window.atob(response.id_token))

  function sanitizeAndBase64Decode(input)
  {
    // $str = str_replace(['-','_'], ['+','/'], $str);
    // const temp = input.replace(new RegExp('-', 'g'), '_').replace(new RegExp('+', 'g'), '/');
    // console.log('input', input)
    const temp = input.replace(/-/g, '_');
    // console.log('temp', temp)
    const temp2 = temp.replace(/\+/g, '/');
    // console.log('temp2', temp2)
    return temp2;
    // return window.atob(temp2);
    // return JSON.parse(window.atob(temp));
  }

  const temp = response.id_token.split(".");

  const header = temp[0];
  const payload = temp[1];
  const tokenData = header + payload;
  const keySignature = temp[2].replace(/-/g, '_').replace(/\+/g, '/');
  console.log('tokenData', tokenData)
  console.log('keySignature', keySignature)
  
  const k2 = sanitizeAndBase64Decode(keySignature);
  const n = "qoQah4MFGYedrbWwFc3UkC1hpZlnB2_E922yRJfHqpq2tTHL_NvjYmssVdJBgSKi36cptKqUJ0Phui9Z_kk8zMPrPfV16h0ZfBzKsvIy6_d7cWnn163BMz46kAHtZXqXhNuj19IZRCDfNoqVVxxCIYvbsgInbzZM82CB86iYPAS7piijYn1S6hueVHGAzQorOetZevKIAvbH3kJXZ4KdY6Ffz5SFDJBxC3bycN4q2JM1qnyD53vcc0MitxyIUF7a06iJb5_xXBiA-3xnTI0FU5hw_k6x-sdB5Rglx13_2aNzdWBSBAnxs1XXtZUt9_2RAUxP1XORkrBGlPg9D7cBtQ";
  const n2 = sanitizeAndBase64Decode(n);
  const e = "AQAB";
  const e2 = sanitizeAndBase64Decode(e);
  console.log('k2', k2)
  console.log('n2', n2)
  console.log('e2', e2)



  console.log(window.atob(tokenData))
  console.log('keySignature', keySignature)
  // console.log(window.atob(a[1]))
  // console.log(window.atob(a[2]))

  return;

  // const payload = {
  //   id_token: input.id_token,
  //   UIDSignature: accountInfo.UIDSignature,
  //   signatureTimestamp: accountInfo.signatureTimestamp,
  // };

  // return fetch(new Request('/authenticate',
  //   {
  //     method: 'POST',
  //     body: JSON.stringify(payload)
  //   }
  // ))
  // .then(response => console.log('JWT auth', response));

}


function bpcSignin(accountInfo) {

  const payload = {
    UID: accountInfo.UID,
    UIDSignature: accountInfo.UIDSignature,
    signatureTimestamp: accountInfo.signatureTimestamp,
  };

  return fetch(new Request('/authenticate',
    {
      method: 'POST',
      body: JSON.stringify(payload)
    }
  ))
  .then(response => userTicketReponseHandler(response));

}


function reissueUserTicket(){
  return fetch(new Request('/authenticate',
    {
      method: 'GET'
    }
  ))
  .then(response => userTicketReponseHandler(response))
  .catch(err => {

  });
}


function userTicketReponseHandler(response) {
  if(response.ok) {
    response
    .json()
    .then(userTicket => {
      setTimeout(reissueUserTicket, userTicket.exp - Date.now() - 1000);
      return Promise.resolve(userTicket);
    });
  } else {
    setTimeout(reissueUserTicket, 10 * 1000); // Ten seconds
    return Promise.reject()
  }
}



// This is not a global signout.
function deleteUserTicket(){
  return fetch(new Request('/authenticate',
    {
      method: 'DELETE'
    }
  ))
  .then(response => {
    if (response.error){
      console.error(response.error);
    } else {
      location.reload();
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



// function requestBpc(type, path, payload, callback){
//   if (callback === undefined && typeof path === 'function'){
//     callback = path;
//     path = ''; // <- We don't need a slash (/) here
//   }

//   if (callback === undefined) {
//     callback = function(){};
//   }

//   if (path.startsWith('/')){
//     path = path.substring(1);
//   }

//   var options = {
//     type: type,
//     url: bpc_env.href.concat(path),
//     headers: {},
//     contentType: 'application/json; charset=utf-8',
//     data: ['POST', 'PUT'].indexOf(type) > -1 && payload !== null ? JSON.stringify(payload) : null,
//     xhrFields: {
//       withCredentials: true
//     },
//     success: [
//       callback
//     ],
//     error: function(jqXHR, textStatus, err) {
//       console.error(textStatus, err.toString());
//       callback(jqXHR.responseJSON);
//     }
//   };

//   var ticket = readTicket();
//   if (ticket !== null){
//     options.headers['Authorization'] = hawk.client.header(options.url, options.type, {credentials: ticket, app: ticket.app}).field
//   }

//   return $.ajax(options);
// }



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
        // $('#auidField').val('');
        $('#auidValue').val('');
      }
    ],
    error: function(jqXHR, textStatus, err) {
      console.error(textStatus, err.toString());
    }
  };

  return $.ajax(options);
}
