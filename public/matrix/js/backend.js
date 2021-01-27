// -- DOM SHORTCUTS
const userPicElement = document.getElementById("user-pic");
const userEmailElement = document.getElementById("user-email");
const signInButtonElement = document.getElementById("sign-in");
const signOutButtonElement = document.getElementById("sign-out");

// -- EVENT LISTENERS
signOutButtonElement.addEventListener("click", signOut);
signInButtonElement.addEventListener("click", signIn);

// -- DB SHORTCUTS

// -- FUNCTIONS

function signIn() {
  // Sign into Firebase using FORCED account-pick auth & Google as the identity provider.
  let googleAuthProvider = new firebase.auth.GoogleAuthProvider();
  googleAuthProvider.setCustomParameters({
    prompt: "select_account",
  });
  firebase.auth().signInWithRedirect(googleAuthProvider);
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
  return (
    firebase.auth().currentUser.photoURL ||
    "../../resources/images/profile_placeholder.png"
  );
}

// Returns the signed-in user's display name.
function getUserName() {
  return firebase.auth().currentUser.displayName;
}

let ACTIVE_USER;
// Returns the signed-in user's display name.
function getUserEmail() {
  return firebase.auth().currentUser.email;
}

function getUserUid() {
  return firebase.auth().currentUser.uid;
}

// Returns true if a user is signed-in.
function isUserSignedIn() {
  return !!firebase.auth().currentUser;
}

// Triggers when the auth state change for instance when the user signs-in or signs-out.
async function authStateObserver(user) {
  if (user) {
    // User is signed in!
    // Get the signed-in user's profile pic and name.
    var profilePicUrl = getProfilePicUrl();
    let userEmail = getUserEmail();
    // let userUid = getUserUid();

    // Set the user's profile pic and name.
    userPicElement.style.backgroundImage =
      "url(" + addSizeToGoogleProfilePic(profilePicUrl) + ")";
    userEmailElement.textContent = userEmail;

    // Show user's profile and sign-out button.
    toggleSignInVisibility("signedIn");

    let USP = new URLSearchParams(window.location.search);
    if (USP.has("impersonate")) {
      let imp_usr = USP.get("impersonate");
      if (imp_usr) {
        // Kolla om användaren är admin
        let adminDoc = await firebase
          .firestore()
          .collection("users")
          .doc("admins")
          .get();

        if (adminDoc.exists) {
          let admins = adminDoc.data().valid_ids;
          if (admins.includes(userEmail)) {
            console.log("Impersonating as admin ...");
            firebase_loaded(imp_usr, { impersonate: true });
          } else {
            console.log("Admin not found");
            firebase_loaded(userEmail);
          }
        }
      }
    } else {
      firebase_loaded(userEmail); // Runs for each of the relevant pages
    }
  } else {
    // User is signed out!
    // Hide sign-in button.
    toggleSignInVisibility("signedOut");
  }

  //-- FUNCTIONS
  // -- HELPER FUNCTIONS
}

function toggleSignInVisibility(status) {
  let signed_in_element = document.querySelector(".loginContainer .signedIn");
  let signed_out_element = document.querySelector(".loginContainer .signedOut");
  if (status === "signedIn") {
    signed_in_element.classList.add("flex");
    // Hide sign-in button.
    signed_out_element.classList.remove("flex");
  } else {
    signed_in_element.classList.remove("flex");
    signed_out_element.classList.add("flex");
  }
}

// Adds a size to Google Profile pics URLs.
function addSizeToGoogleProfilePic(url) {
  if (url.indexOf("googleusercontent.com") !== -1 && url.indexOf("?") === -1) {
    return url + "?sz=150";
  }
  return url;
}

async function breakoutFirebaseArray(query) {
  // För att undvika problem med kraven på .forEach som inte går att ha await på så kan man göra så här
  // Kom ihåg att man kan behöva använda ".shift()" om det endast är ett item
  let array = [];
  query.forEach((x) => array.push(x));
  return array;
}

// initialize Firebase
initFirebaseAuth();

/**
 * GOOGLE INITIATION
 */

const config = {
  google: {
    apiKey: "AIzaSyBhCyThOlc7kZaUvbKULj-Ild79hXkZFGQ",
    clientId:
      "600946156467-u917k64v5nh9api6idc3a97v6l4dmc47.apps.googleusercontent.com",
    discoveryDocs: [
      "https://www.googleapis.com/discovery/v1/apis/classroom/v1/rest",
    ],
    scopes:
      "https://www.googleapis.com/auth/classroom.courses.readonly" +
      " https://www.googleapis.com/auth/classroom.rosters.readonly" +
      " https://www.googleapis.com/auth/classroom.profile.emails" +
      " https://www.googleapis.com/auth/classroom.profile.photos",
  },
};

let googleApiInitiated = false;
function init_Google() {
  Loader.start();
  const script = document.createElement("script");
  script.type = "text/javascript";
  script.src = "https://apis.google.com/js/api.js";
  script.onload = (e) => {
    handleClientLoad();
  };
  document.getElementsByTagName("head")[0].appendChild(script); // append to head
  googleApiInitiated = true;
}

function handleClientLoad() {
  gapi.load("client:auth2", initClient);
}

/**
 *  Initializes the API client library and sets up sign-in state
 *  listeners.
 */
function initClient() {
  gapi.client
    .init({
      apiKey: config.google.apiKey,
      clientId: config.google.clientId,
      discoveryDocs: config.google.discoveryDocs,
      scope: config.google.scopes,
    })
    .then(
      function () {
        // Listen for sign-in state changes.
        gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);
        // Handle the initial sign-in state.
        updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
      },
      function (error) {
        console.error(JSON.stringify(error, null, 2));
      }
    );
}

function signIntoGoogle(event) {
  gapi.auth2.getAuthInstance().signIn();
}

/**
 *  Called when the signed in status changes, to update the UI
 *  appropriately. After a sign-in, the API is called.
 */
function updateSigninStatus(isSignedIn) {
  const getCourses_button = document.getElementById("get-courses");
  if (isSignedIn) {
    getCourses_button.addEventListener("click", () => {
      getCourses();
    });
  } else {
    getCourses_button.addEventListener("click", () => {
      signIntoGoogle();
    });
  }
  Loader.finish();
}

function isSignedInToGoogle() {
  return gapi.auth2.getAuthInstance().isSignedIn.get();
}

function getCourses() {
  Loader.start();
  if (!isSignedInToGoogle) {
    console.log("User not signed in");
    Toast.show(
      "Du är inte inloggad ordentligt. Kontakta Viktor om oklart vad felet är.",
      "error"
    );
    return;
  }

  gapi.client.classroom.courses
    .list({
      teacherId: "me",
      courseStates: "ACTIVE",
    })
    .then(async function (response) {
      const courses = response.result.courses;
      let course_array = [];
      if (courses && courses.length > 0) {
        for (i = 0; i < courses.length; i++) {
          const course = courses[i];
          course_array.push({
            name: course.name,
            id: course.id,
            section: course.section,
          });
        }
        listClassroomCourses(course_array);
      } else {
        console.log("No courses found.");
        Toast.show(
          "Inga kurser finns att tillgå. Kontakta Viktor om detta inte stämmer.",
          "error"
        );
        Loader.finish();
      }
    });
}
