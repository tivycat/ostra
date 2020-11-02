function handle_load_student(data) {
  if (!data.exists) {
    document.querySelector('#no-data .user-email').textContent = getUserEmail();
    Onload.noData();
    return;
  }

  data = data.data();
}

const Onload = {
  signedIn() {
    document.getElementById('summary').classList.remove('hidden')
    loader_finish()

  },
  signedOut() {
    document.getElementById('before-login').classList.remove('hidden')

    //Hide and empty courses incase logged out while active session
    document.getElementById('summary').classList.add('hidden')
    document.querySelectorAll('#summary .content').forEach(x => x.parentNode.removeChild(x))
    // Hide user details
    document.querySelector('.user-container .col1').classList.add('hidden')
    document.querySelector('.user-container .col2').classList.add('hidden')

    // Show sign-in button.
    signInButtonElement.classList.remove('hidden');
    signOutButtonElement.classList.add('hidden');
    loader_finish()

  },
  noData() {
    document.getElementById('no-data').classList.remove('hidden')
    loader_finish()
  }
}

loader_finish()

document.querySelectorAll('.accordion__button').forEach( (btn) => {
  btn.addEventListener('click', () => {
    btn.classList.toggle('accordion__button--active')
  })
})