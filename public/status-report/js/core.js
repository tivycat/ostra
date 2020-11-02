/**
 * Global Variables!
 */

const CURRENT_TERM = 'HT20'

/** =======================
 * Loading
 * ===================== */
const Onload = {
  signedIn() {
    document.getElementById('data').classList.remove('hidden')
    loader_finish()

  },
  signedOut() {
    document.getElementById('before-login').classList.remove('hidden')
    // Hide data in case logged out during active session
    document.getElementById('data').classList.add('hidden')
    loader_finish()

  },
  noData() {
    document.getElementById('no-data').classList.remove('hidden')
    loader_finish()
  }
}


function loader_start() {
  document.getElementById('loader-wrapper').classList.remove('hidden')
}

function loader_finish() {
  document.getElementById('loader-wrapper').classList.add('hidden')
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
    }, 3000)
  }
}

document.addEventListener('DOMContentLoaded', () => { Toast.init() })


/**************************************
 * ===================================
 *  E V E N T    L I S T E N E R S
 * ===================================
 ************************************ */

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
