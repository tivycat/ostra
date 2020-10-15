// Client ID and API key from the Developer Console
var CLIENT_ID = '870999322446-ig1mksnn29frbo3u5i5frhhb6qjcm7f2.apps.googleusercontent.com';
var API_KEY = 'AIzaSyAY5Z8tBPB8IbD4k9IgvF3ddqnMN4LT6EI';

// Array of API discovery doc URLs for APIs used by the quickstart
var DISCOVERY_DOCS = [
    "https://www.googleapis.com/discovery/v1/apis/people/v1/rest", 
    "https://sheets.googleapis.com/$discovery/rest?version=v4"
    ];

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
var SCOPES = "https://www.googleapis.com/auth/contacts.readonly https://www.googleapis.com/auth/spreadsheets";

var login_button = document.getElementById('login_button');
var logout_button = document.getElementById('logout_button');
var user_details = document.getElementById('user_details');

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
    }).then(function () {
        fetch_data_onload()
        // Listen for sign-in state changes.
        gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);

        // Handle the initial sign-in state.
        updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
        login_button.onclick = handleAuthClick;
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
    if (isSignedIn) {
        const current_user = gapi.auth2.getAuthInstance().currentUser.get().getBasicProfile().getEmail()
        user_details.value = current_user;
        login_button.style.display = 'none';
        logout_button.style.display = 'inline-block';
        check_user_credentials(current_user).then( status => { 
            if (status == 'ADMIN') { add_admin_functions('full') }
            if (status == 'TEACHER') { add_admin_functions()}
            if(status == 'UNFAM') { console.log('Unfamiliar user') } })
    } else {
        login_button.style.display = 'inline-block';
        logout_button.style.display = 'none';
        user_details.value = 'Ej inloggad';
    }
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
    var pre = document.getElementById('main_content_container');
    var textContent = document.createTextNode(message + '\n');
    pre.appendChild(textContent);
}

/** * * * * * * * * * * * * * * * * * * * * * * * **
 * * * * * * * * * * * * * * * * * * * * * * * * * *
 * END 
 * OF
 * GOOGLE
 * INIT
 * * * * * * * * * * * * * * * * * * * * * * * * * * 
** * * * * * * * * * * * * * * * * * * * * * * * * */

function fetch_data_onload() {
    let SS = SPREADSHEET_DETAILS();
    gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: SS.ID,
        range: `${SS.DB.TAB}!${SS.DB.RANGE}`,
    }).then(function(response) {
        let data = response.result.values;
        // console.log(data)
        for (let week of data) {
            let obj = {}
            // make managable object
            obj.details = JSON.parse(week[0]);
            obj.days = [
                JSON.parse(week[1]),
                JSON.parse(week[2]),
                JSON.parse(week[3]),
                JSON.parse(week[4]),
                JSON.parse(week[5])
            ]
        
            //populate calendar, week by week
        populate_calendar(obj)
        }
    display_active_weeks()
    
    });
    
}


/**
 * THESE FUNCTIONS ARE FOR MAKING A NEW DB
 * See formula_for_dates TAB NAME for how to actually get the right dates
 * without too much trouble
 */

function format_data_for_new_year() {
    const SS = SPREADSHEET_DETAILS();
    const unformatted_data = 'Formula_for_dates!A5:H47';

    gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: SS.ID,
        range: unformatted_data,
    }).then(function(response) {
        let data = response.result.values
        console.log(data)

        parse_unformatted_data(data);
    });
}

function parse_unformatted_data(data) {
    let parsed_data = {}

    let COL = {
        weeknum : 0,
        startdate : 1,
        enddate: 2,
        mon: 3,
        tue: 4,
        wed: 5,
        thu: 6,
        fri: 7
    }
    for (let i = 0; i<data.length; i++) {
        let row = data[i];
        let week_details = {
            weeknum : row[COL.weeknum],
            startdate : row[COL.startdate],
            enddate : row[COL.enddate],
            events: []
        }

        let mon = { id : row[COL.mon], events : [] }
        let tue = { id : row[COL.tue], events : [] }
        let wed = { id : row[COL.wed], events : [] }
        let thu = { id : row[COL.thu], events : [] }
        let fri = { id : row[COL.fri], events : [] }
    
        let arr = []
        const add_to_arr = (str) => { arr.push(JSON.stringify(str)) };
        add_to_arr(week_details);
        add_to_arr(mon)
        add_to_arr(tue)
        add_to_arr(wed)
        add_to_arr(thu)
        add_to_arr(fri)

        let range = `LA20/21!A${i + 1}`

        gapi.client.sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: range,
            valueInputOption: 'RAW',
            values : [ arr ]
        }).then(function(newResponse) {
            let result = newResponse.result;
            console.log(`${result.updatedCells} cells updated`)
        })
    }
}