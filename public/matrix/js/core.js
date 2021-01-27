// https://patorjk.com/software/taag/#p=display&h=2&v=1&f=ANSI%20Regular&t=localstorage*/

document.body.setAttribute("spellcheck", false); // Stänger av spellcheck. Fungerar bara på engelska iaf.

document.addEventListener("DOMContentLoaded", () => {
  Loader.init();
  Toast.init();

  let toggleBtn = document.getElementById("toggle-main-menu");
  toggleBtn.addEventListener("click", (e) => {
    toggleMainMenu();
    e.stopPropagation();
  });

  const menuItems = document.querySelectorAll(".menu-item.has-subMenu");
  menuItems.forEach((el) => {
    el.addEventListener("click", toggleSubMenu, false);
    el.addEventListener("keypress", toggleSubMenu, false);
  });
});

const Toast = {
  init() {
    this.hideTimeout = null;
    this.el = document.createElement("div");
    this.el.classList.add("toast");
    document.body.appendChild(this.el);
  },
  show(message, state) {
    clearTimeout(this.hideTimeout);
    this.el.textContent = message;
    this.el.classList.add("toast-show");
    if (state) {
      this.el.classList.add("toast-" + state);
    }

    this.hideTimeout = setTimeout(() => {
      this.el.classList.remove("toast-show");
      if (state) {
        this.el.classList.remove("toast-" + state);
      }
    }, 3000);
  },
};

const Loader = {
  init() {
    this.hideTimeout = null;
    this.wrapper = document.createElement("div");
    this.wrapper.id = "loader-wrapper";
    this.loader = document.createElement("div");
    this.loader.id = "loader";
    this.wrapper.appendChild(this.loader);
    document.body.appendChild(this.wrapper);
  },
  start() {
    this.wrapper.classList.add("loader--active");
    document.body.classList.add("wait");
    this.hideTimeout = setTimeout(() => {
      if (this.wrapper.classList.contains("loader--active")) {
        console.error("Loader misslyckades");
        Loader.finish();
        Toast.show("Loader time-out. Något tog väldigt lång tid...", "error");
      } else {
      }
    }, 15000);
  },
  finish() {
    clearTimeout(this.hideTimeout);
    this.wrapper.classList.remove("loader--active");
    document.body.classList.remove("wait");
  },
};

const Modal = {
  async show(type) {
    let modal = document.querySelector(`[data-modal="${type}"]`);
    modal.classList.add("modal--active");
  },
  hide() {
    let active_modal = document.querySelector(".modal--active");
    if (active_modal) {
      active_modal.classList.remove("modal--active");
    }
  },
};

const LOCALSTORAGE = {
  set(type, data) {
    if (typeof data !== "string") {
      data = JSON.stringify(data);
    }
    localStorage.setItem(type, data);
  },
  async get(type) {
    let item = localStorage.getItem(type);
    try {
      item = JSON.parse(item);
    } catch (e) {
      console.log("error with LS", e);
    }
    return item;
  },
};

const SESSIONSTORAGE = {
  set(type, data) {
    if (typeof data !== "string") {
      data = JSON.stringify(data);
    }
    sessionStorage.setItem(type, data);
  },
  async get(type) {
    let item = sessionStorage.getItem(type);
    try {
      item = JSON.parse(item);
    } catch (e) {
      console.log("error with LS", e);
    }
    return item;
  },
};

// Användbart för typ index och sånt
const isEven = (num) => (num % 2 == 0 ? true : false);

// Eventlisteners för mainMenu
document.addEventListener("click", (evt) => {
  // Stäng mainmenu om man väljer något i den
  let mainMenu = document.getElementById("mainMenu");
  if (mainMenu.classList.contains("active")) {
    let pCl = evt.target.parentElement.classList;
    console.log(evt.target);
    if (
      (pCl.contains("menu-item") &&
        !pCl.contains("has-subMenu") &&
        evt.target.tagName !== "SELECT") ||
      pCl.contains("sub-item")
    ) {
      toggleMainMenu();
    }
  }
  closeSubMenu(evt);
});

function toggleMainMenu() {
  const toggle = document.getElementById("toggle-main-menu");
  const mainMenu = document.querySelector(".mainMenu");
  if (mainMenu.classList.contains("active")) {
    mainMenu.classList.remove("active");
    toggle.classList.remove("active");
  } else {
    mainMenu.classList.add("active");
    toggle.classList.add("active");
  }
}

function toggleSubMenu() {
  const mainMenu = document.querySelector(".mainMenu");

  if (this.classList.contains("subMenu-active")) {
    this.classList.remove("subMenu-active");
  } else if (mainMenu.querySelector(".subMenu-active")) {
    // Kolla om någon annan submenu är öppen
    mainMenu
      .querySelector(".subMenu-active")
      .classList.remove("subMenu-active");
    this.classList.add("subMenu-active");
  } else {
    this.classList.add("subMenu-active");
  }
}

function closeSubMenu(e) {
  const mainMenu = document.querySelector(".mainMenu");
  let isClickInside = mainMenu.contains(e.target);

  if (!isClickInside && mainMenu.querySelector(".subMenu-active")) {
    mainMenu
      .querySelector(".subMenu-active")
      .classList.remove("subMenu-active");
  }
}

function eventPathHasSelector(path, selector) {
  for (let i = 0; i < path.length; i++) {
    if (path[i].classList && path[i].classList.contains(selector)) {
      return true;
    }
  }
  return false;
}
