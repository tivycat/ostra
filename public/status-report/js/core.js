/** =======================
 * Loading
 * ===================== */
const Onload = {
  signedIn() {
    handle_load_sections('data')
    loader_finish()

  },
  signedOut() {
    handle_load_sections('before-login')
    loader_finish()

  },
  noData(user) {
    handle_load_sections('no-data', user)
    loader_finish()
  },
  noCredentials(user) {
    handle_load_sections('no-credentials', user)
    loader_finish()

  }
}

function handle_load_sections(toLoad, user) {
  let sections = [
    document.getElementById('before-login'),
    document.getElementById('data'),
    document.getElementById('no-data'),
    document.getElementById('no-credentials')
  ]

  for (let s of sections) {
    if (s.id === toLoad) {
      s.classList.remove('hidden')
      if (user) {
        s.querySelector('.user-email').textContent = user
      }
    } else {
      s.classList.add('hidden')
    }
  }
}


function loader_start() {
  document.getElementById('loader-wrapper').classList.remove('hidden')
  document.body.classList.add('wait')
}

function loader_finish() {
  document.getElementById('loader-wrapper').classList.add('hidden')
  document.body.classList.remove('wait')
}

/** =======================
 * Toast
 * ===================== */
const Toast = {
  init() {
    this.hideTimeout = null;

    this.el = document.createElement('div')
    this.el.classList.add('toast')
    document.body.appendChild(this.el)
  },
  show(message, state) {
    clearTimeout(this.hideTimeout);
    this.el.textContent = message;
    this.el.classList.add('toast-show')
    if (state) {
      this.el.classList.add('toast-' + state)
    }

    this.hideTimeout = setTimeout(() => {
      this.el.classList.remove('toast-show')
      if (state) {
        this.el.classList.remove('toast-' + state)
      }
    }, 3000)
  }
}

document.addEventListener('DOMContentLoaded', () => { Toast.init() })


/**************************************
 * ===================================
 *  E V E N T    L I S T E N E R S
 * ===================================
 ************************************ */

 if (document.body.dataset.page !== 'student') {
  document.querySelector('.nav__hamburger').addEventListener('click', () => {
    // This is for toggling the hamburger nav
    const nav = document.querySelector('.nav__menu')
    const navLinks = document.querySelectorAll('.nav__li')
  
    // Toggle Nav
    nav.classList.toggle('nav__hamburger--active')
  
  
    // Animate Links
    navLinks.forEach((link, index) => {
      if (link.style.animation) {
        link.style.animation = '';
  
      } else {
        link.style.animation = `navLinkFade 0.5s ease forwards ${index / 7 + 0.3}s`;
      }
    })
  
    // Burger Animation
    document.querySelector('.nav__hamburger').classList.toggle('toggle')
  })
 }



function emptyElement(element) {
  while (element.firstChild) {
    element.removeChild(element.firstChild)
  }
}