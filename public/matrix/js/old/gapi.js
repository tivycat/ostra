// All auths and functions related to sending the emails
// Client ID and API key from the Developer Console
var CLIENT_ID = '870999322446-ig1mksnn29frbo3u5i5frhhb6qjcm7f2.apps.googleusercontent.com';
var API_KEY = 'AIzaSyAY5Z8tBPB8IbD4k9IgvF3ddqnMN4LT6EI';

// Array of API discovery doc URLs for APIs used by the quickstart
var DISCOVERY_DOCS = [
    "https://www.googleapis.com/discovery/v1/apis/people/v1/rest",
    "https://sheets.googleapis.com/$discovery/rest?version=v4",
    "https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest"
];

// Authorization scopes required by the API; multiple scopes can be included, separated by spaces.
var SCOPES = "https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/gmail.send";

var login_button = document.getElementById('login_button');
var login_button2 = document.getElementById('login_button2')
var logout_button = document.getElementById('logout_button');
var user_id_input = document.getElementById('user_id');

/**
 *  On load, called to load the auth2 library and API client library.
 */
function handleClientLoad() {
    gapi.load('client:auth2', initClient);
}
/**
 *  Initializes the API client library and sets up sign-in state
 *  listeners.
 */
function initClient() {
    gapi.client.init({
        apiKey: API_KEY,
        clientId: CLIENT_ID,
        discoveryDocs: DISCOVERY_DOCS,
        scope: SCOPES
    }).then(function (response) {
        // Listen for sign-in state changes.
        gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);

        // Handle the initial sign-in state.
        updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
        login_button.onclick = handleAuthClick;
        login_button2.onclick = handleAuthClick;
        logout_button.onclick = handleSignoutClick;
    }, function (error) {
        appendPre(JSON.stringify(error, null, 2));
    });
}

/**
 *  Called when the signed in status changes, to update the UI
 *  appropriately. After a sign-in, the API is called.
 */
function updateSigninStatus(isSignedIn) {
    loading_start()
    if (isSignedIn) {
        const current_user = gapi.auth2.getAuthInstance().currentUser.get().getBasicProfile().getEmail()
        user_id_input.textContent = current_user;
        login_button.classList.add('hidden')
        logout_button.classList.remove('hidden')

        // do this here as there is no data to get if not logged in
        fetch_user_data_from_db(current_user);

    } else {
        login_button.classList.remove('hidden')
        logout_button.classList.add('hidden')
        user_id_input.textContent = null;
        onload_finished(false)
    }
    loading_end();
}

/**
 *  Sign in the user upon button click.
 */
function handleAuthClick(event) {
    gapi.auth2.getAuthInstance().signIn();
}

/**
 *  Sign out the user upon button click.
 */
function handleSignoutClick(event) {
    gapi.auth2.getAuthInstance().signOut();

}

/**
 * Append a pre element to the body containing the given message
 * as its text node. Used to display the results of the API call.
 *
 * @param {string} message Text to be placed in pre element.
 */
function appendPre(message) {
    var pre = document.getElementById('main_table_container');
    var textContent = document.createTextNode(message + '\n');
    pre.appendChild(textContent);
}


function send_email(content, is_example) {
  let course = document.getElementById('header_select_course').value;
  const user = 'me'
  const To = gapi.auth2.getAuthInstance().currentUser.get().getBasicProfile().getEmail();
  let Subject = get_todays_date() + ' Uppdaterad bedömning i kursen ' + course
  let callback_toast;
  if (is_example) {
      Subject += ' (exempel)'
      callback_toast = `Exempelmail skickat till din epost (${To})`
  } else { callback_toast = `Epost skickad till valda elever (${course})`}
  const Message = content;
  var message_base64_encoded = btoa("To: " + To + "\nSubject: " + Subject + "\nContent-Type: text/html; charset=UTF-8\n\n\n" + Message + "").replace(/\+/g, '-').replace(/\//g, '_');
  gapi.client.gmail.users.messages.send({
      'userId': user,
      'resource': {
          'raw': message_base64_encoded
      }
  }).then(() => display_toast(callback_toast))
}