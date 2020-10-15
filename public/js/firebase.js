
function signIn() {
  // Sign into Firebase using FORCED account-pick auth & Google as the identity provider.
  let googleAuthProvider = new firebase.auth.GoogleAuthProvider();
  googleAuthProvider.setCustomParameters({
    prompt: 'select_account'
  });
  firebase.auth().signInWithRedirect(googleAuthProvider)
}



function signOut() {
  // Sign out of Firebase.
  firebase.auth().signOut();
}

// Initiate Firebase Auth.
function initFirebaseAuth() {
  // Listen to auth state changes.
  firebase.auth().onAuthStateChanged(authStateObserver);
}

// Returns the signed-in user's profile pic URL.
function getProfilePicUrl() {
  return firebase.auth().currentUser.photoURL || '/images/profile_placeholder.png';
}

// Returns the signed-in user's display name.
function getUserName() {
  return firebase.auth().currentUser.displayName;
}

// Returns the signed-in user's display name.
function getUserEmail() {
  return firebase.auth().currentUser.displayName;
}


// Returns true if a user is signed-in.
function isUserSignedIn() {
  return !!firebase.auth().currentUser;
}


// Triggers when the auth state change for instance when the user signs-in or signs-out.
function authStateObserver(user) {
  if (user) { // User is signed in!
    // Get the signed-in user's profile pic and name.
    var profilePicUrl = getProfilePicUrl();
    var userName = getUserName();

    // Set the user's profile pic and name.
    userPicElement.style.backgroundImage = 'url(' + addSizeToGoogleProfilePic(profilePicUrl) + ')';
    userNameElement.textContent = userName;

    // Show user's profile and sign-out button.
    userNameElement.removeAttribute('hidden');
    userPicElement.removeAttribute('hidden');
    signOutButtonElement.removeAttribute('hidden');

    // Hide sign-in button.
    signInButtonElement.setAttribute('hidden', 'true');

    // Check user credentials to unlock functions
    let cred = check_user_credentials(firebase.auth().currentUser.email)
    cred.then((result) => {
      add_admin_functions(result)
    })
  } else { // User is signed out!
    // Hide user's profile and sign-out button.
    userNameElement.setAttribute('hidden', 'true');
    userPicElement.setAttribute('hidden', 'true');
    signOutButtonElement.setAttribute('hidden', 'true');

    // Show sign-in button.
    signInButtonElement.removeAttribute('hidden');
  }
}

// Returns true if user is signed-in. Otherwise false and displays a message.
function checkSignedInWithMessage() {
  // Return true if the user is signed in Firebase
  if (isUserSignedIn()) {
    return true;
  }

  // Display a message to the user using a Toast.
  display_toast('Du måste logga in först!')
  // signInSnackbarElement.MaterialSnackbar.showSnackbar(data);
  return false;
}

// Adds a size to Google Profile pics URLs.
function addSizeToGoogleProfilePic(url) {
  if (url.indexOf('googleusercontent.com') !== -1 && url.indexOf('?') === -1) {
    return url + '?sz=150';
  }
  return url;
}

function get_load_data() {
  firebase.auth().onAuthStateChanged(function () {
    let weeks = firebase.firestore().collection('weeks');
    weeks.get().then((snapshot) => {
      snapshot.forEach((doc) => {
        add_week_to_calendar(doc.data())

      })
    }).then(() => {
      let events = firebase.firestore().collection('events');
      events.get().then((e_snapshot) => {
        e_snapshot.forEach((doc) => {
          add_event_to_calendar(doc.id, doc.data())
        })
      })
    }).then(() => display_active_weeks())
  });
}

function check_user_credentials(user) {
  // <button class="btn btn-primary ml-1" id="add_test" type="button">Lägg till prov/större inlämning</button>
  return new Promise(function (resolve, reject) {
    let docRef = firebase.firestore().collection('users').doc(user)
    docRef.get().then((doc) => {
      if (doc.exists) {
        let data = doc.data()
        resolve(data.role)
      } else { // No role found for user
        resolve('None')
      }
    });
  })
}

function create_event_firebase(event) {
  return new Promise( (resolve, reject) => {

    firebase.auth().onAuthStateChanged(function (user) {
      event.creator = firebase.auth().currentUser.email
      
      let docRef = firebase.firestore().collection("events");
      docRef.add(event).then((doc) => {
        event.event_id = doc.id;
        resolve({id: doc.id, event: event})  
      })
    })
  }) 
}

function delete_event_firebase(id) {
  let db = firebase.firestore();
  db.collection("events").doc(id).delete()
  .catch(function (error) {
    console.error("Error removing document: ", error);
  });

}


function save_edit_event_firebase(id, ev_details) {
  return new Promise ((resolve, reject) => {
    let db = firebase.firestore();
    db.collection("events").doc(id).set(ev_details).catch(function (error) {
      console.error("Error removing document: ", error);
    });
    resolve()

  })
 

}





// A loading image URL.
var LOADING_IMAGE_URL = 'https://www.google.com/images/spin-32.gif?a';

// Checks that the Firebase SDK has been correctly setup and configured.
// function checkSetup() {
//   if (!window.firebase || !(firebase.app instanceof Function) || !firebase.app().options) {
//     window.alert('You have not configured and imported the Firebase SDK. ' +
//         'Make sure you go through the codelab setup instructions and make ' +
//         'sure you are running the codelab using `firebase serve`');
//   }
// }

// // Checks that Firebase has been imported.
// checkSetup();

// Shortcuts to DOM Elements.
var userPicElement = document.getElementById('user-pic');
var userNameElement = document.getElementById('user-name');
var signInButtonElement = document.getElementById('sign-in');
var signOutButtonElement = document.getElementById('sign-out');

signOutButtonElement.addEventListener('click', signOut);
signInButtonElement.addEventListener('click', signIn);


// initialize Firebase
initFirebaseAuth();
get_load_data();