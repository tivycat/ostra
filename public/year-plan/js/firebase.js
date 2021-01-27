// -- DOM SHORTCUTS
const userPicElement = document.getElementById("user-pic");
const userEmailElement = document.getElementById("user-email");
const signInButtonElement = document.getElementById("sign-in");
const signOutButtonElement = document.getElementById("sign-out");

// -- EVENT LISTENERS
signOutButtonElement.addEventListener("click", signOut);
signInButtonElement.addEventListener("click", signIn);

// -- DB SHORTCUTS
const CURRENT_SCHOOLYEAR = "20-21";
const DB = firebase.firestore();
const PLANNING_DB = firebase
  .firestore()
  .collection("planning")
  .doc(CURRENT_SCHOOLYEAR);

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

// Returns the signed-in user's display name.
function getUserEmail() {
  return firebase.auth().currentUser.email;
}

// Returns true if a user is signed-in.
function isUserSignedIn() {
  return !!firebase.auth().currentUser;
}

// Triggers when the auth state change for instance when the user signs-in or signs-out.
async function authStateObserver(user) {
  const admin_element = document.getElementById("admin-content");
  let signed_in_element = document.querySelector(".nav__signedIn");
  let signed_out_element = document.querySelector(".nav__signedOut");
  if (user) {
    // User is signed in!

    // Get the signed-in user's profile pic and name.
    var profilePicUrl = getProfilePicUrl();
    let userEmail = getUserEmail();

    // Set the user's profile pic and name.
    userPicElement.style.backgroundImage =
      "url(" + addSizeToGoogleProfilePic(profilePicUrl) + ")";
    userEmailElement.textContent = userEmail;

    // Show user's profile and sign-out button.
    signed_in_element.classList.remove("hidden");
    // Hide sign-in button.
    signed_out_element.classList.add("hidden");

    // Initiate admin load (if successful shows admin, else does nothing)
    let admin = await isUserAdmin(userEmail);
    if (admin) {
      admin_element.classList.remove("hidden");
    } else {
      remove_admin_funcs();
    }
  } else {
    // User is signed out!
    remove_admin_funcs();
    // Hide sign-in button.
    signed_in_element.classList.add("hidden");
    signed_out_element.classList.remove("hidden");
  }

  // -- HELPER FUNCTIONS
  function isUserAdmin(user) {
    return new Promise((res) => {
      let adminRef = DB.collection("users").doc("super_admins");
      adminRef.get().then((doc) => {
        if (doc.exists) {
          let response = doc.data();
          let admins = response.valid_ids;
          if (admins.includes(user)) {
            res(true);
          } else {
            res(false);
          }
        }
      });
    });
  }
  function remove_admin_funcs() {
    // -- ELEMENTS
    const removeEvent_btn = document.querySelectorAll(
      "#clone .modal-removeEvent"
    );
    const saveEvent_btn = document.querySelectorAll(
      "#clone .modal-saveChanges"
    );
    const allowChanges_btn = document.querySelectorAll(
      "#clone .modal-makeChanges"
    );

    admin_element.parentElement.removeChild(admin_element);
    remove_buttons(removeEvent_btn);
    remove_buttons(saveEvent_btn);
    remove_buttons(allowChanges_btn);

    // -- FUNCTIONS
    function remove_buttons(btn) {
      btn.forEach((x) => x.parentElement.removeChild(x));
    }
  }
}

// Adds a size to Google Profile pics URLs.
function addSizeToGoogleProfilePic(url) {
  if (url.indexOf("googleusercontent.com") !== -1 && url.indexOf("?") === -1) {
    return url + "?sz=150";
  }
  return url;
}

// initialize Firebase
initFirebaseAuth();
