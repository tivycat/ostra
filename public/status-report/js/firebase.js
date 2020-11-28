/**
 * Global Variables!
 */

const CURRENT_TERM = 'HT20'
const DB = firebase.firestore();
const DB__STUDENTS = DB.collection('status-report').doc(CURRENT_TERM).collection('students');
const DB__TEACHERS = DB.collection('status-report').doc(CURRENT_TERM).collection('teachers');

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
  let signed_in_element = document.querySelector('.nav__signedIn')
  let signed_out_element = document.querySelector('.nav__signedOut')
  if (user) { // User is signed in!

    // Get the signed-in user's profile pic and name.
    var profilePicUrl = getProfilePicUrl();
    let userEmail = getUserEmail();

    // Set the user's profile pic and name.
    userPicElement.style.backgroundImage = 'url(' + addSizeToGoogleProfilePic(profilePicUrl) + ')';
    userEmailElement.textContent = userEmail;

    // Show user's profile and sign-out button.
    signed_in_element.classList.remove('hidden')
    // Hide sign-in button.
    signed_out_element.classList.add('hidden');

    // Initiate load
    let active_page = document.body.dataset.page;
    if (active_page == 'teacher') {
      let user_doc = firebase.firestore().collection("status-report").doc(CURRENT_TERM).collection('teachers').doc(userEmail);
      user_doc.get().then((response) => {
        handle_load_teacher(response)
      }).catch((error) => {
        console.error('Error loading teacher ... ')
        console.error(error)
        handle_load_teacher('noCredentials')
      })
    }
    if (active_page == 'coach') {
      let user_doc = firebase.firestore().collection("status-report").doc(CURRENT_TERM).collection('teachers').doc(userEmail);
      user_doc.get().then((response) => {
        handle_load_coach(response)
      }).catch((error) => {
        console.error('Error loading coach ... ')
        console.error(error)
        handle_load_coach('noCredentials')
      })
    }
    if (active_page == 'statistics') {
      let user_doc = firebase.firestore().collection("status-report").doc(CURRENT_TERM).collection('statistics').doc('general');
      user_doc.get().then((response) => {
        handle_load_statistics(response)
      }).catch((error) => {
        console.error('Error loading statistics ... ')
        console.error(error)
        handle_load_statistics('noCredentials')
      })
    } if (active_page == 'student') {
      let student_c = [];
      DB.collection('status-report').doc(CURRENT_TERM).collection('students').doc(userEmail).collection('courses').get().then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
          if (doc.exists) {
            student_c.push(doc.data())
          }
        })
        handle_load_student(student_c)

      }).catch((error) => {
        console.error('Error loading student ...')
        console.error(error)
        handle_load_student('noCredentials')
      })
    } if (active_page == 'admin') {

    }

  } else { // User is signed out!
    Onload.signedOut()
    // Hide sign-in button.
    signed_in_element.classList.add('hidden');
    signed_out_element.classList.remove('hidden');
  }
}

// Adds a size to Google Profile pics URLs.
function addSizeToGoogleProfilePic(url) {
  if (url.indexOf('googleusercontent.com') !== -1 && url.indexOf('?') === -1) {
    return url + '?sz=150';
  }
  return url;
}

// function save_changes_to_firebase(student) {
//   return new Promise( (resolve, reject) => {
//       let docRef = firebase.firestore().collection("status-report").doc(CURRENT_TERM).collection('students').doc(student.email).collection('courses').doc(student.course);
//       docRef.update({
//         assessment : student.assessment,
//         comment: student.comment
//       }).then(() => {
//         resolve(student.email)
//       })
//   }) 
// }





// Shortcuts to DOM Elements.
var userPicElement = document.getElementById('user-pic');
var userEmailElement = document.getElementById('user-email');
var signInButtonElement = document.getElementById('sign-in');
var signOutButtonElement = document.getElementById('sign-out');

signOutButtonElement.addEventListener('click', signOut);
signInButtonElement.addEventListener('click', signIn);


// initialize Firebase
initFirebaseAuth();


