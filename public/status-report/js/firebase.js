const CURRENT_TERM = 'HT20'

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
  return firebase.auth().currentUser.photoURL || '../../resources/images/profile_placeholder.png';
}

// Returns the signed-in user's display name.
function getUserName() {
  return firebase.auth().currentUser.displayName;
}

// Returns the signed-in user's display name.
function getUserEmail() {
  return firebase.auth().currentUser.email;
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
    let userEmail = getUserEmail();

    // Set the user's profile pic and name.
    userPicElement.style.backgroundImage = 'url(' + addSizeToGoogleProfilePic(profilePicUrl) + ')';
    userEmailElement.textContent = userEmail;

    // Show user's profile and sign-out button.
    document.querySelector('.user-container .col1').classList.remove('hidden')
    document.querySelector('.user-container .col2').classList.remove('hidden')

    // Hide sign-in button.
    signInButtonElement.classList.add('hidden');

    // Initiate load
    handle_load_user(userEmail)

  } else { // User is signed out!
    Onload.signedOut()
  }
}

// Adds a size to Google Profile pics URLs.
function addSizeToGoogleProfilePic(url) {
  if (url.indexOf('googleusercontent.com') !== -1 && url.indexOf('?') === -1) {
    return url + '?sz=150';
  }
  return url;
}


function save_changes_to_firebase(student) {
  return new Promise( (resolve, reject) => {
      let docRef = firebase.firestore().collection("status-report").doc(CURRENT_TERM).collection('students').doc(student.email).collection('courses').doc(student.course);
      docRef.update({
        assessment : student.assessment,
        comment: student.comment
      }).then(() => {
        resolve(student.email)
      })
  }) 
}


function save_changes_to_firebase(student) {
  return new Promise( (resolve, reject) => {
      let docRef = firebase.firestore().collection("status-report").doc(CURRENT_TERM).collection('students').doc(student.email).collection('courses').doc(student.course);
      docRef.update({
        assessment : student.assessment,
        comment: student.comment
      }).then(() => {
        resolve(student.email)
      })
  }) 
}





// Shortcuts to DOM Elements.
var userPicElement = document.getElementById('user-pic');
var userEmailElement = document.getElementById('user-email');
var signInButtonElement = document.getElementById('sign-in');
var signOutButtonElement = document.getElementById('sign-out');

signOutButtonElement.addEventListener('click', signOut);
signInButtonElement.addEventListener('click', signIn);


// initialize Firebase
initFirebaseAuth();