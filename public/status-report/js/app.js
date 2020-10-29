async function handle_load_user(user) {
  firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
      let active_user = getUserEmail();
      let user_doc = firebase.firestore().collection("status-report").doc('HT20').collection('teachers').doc(active_user);

      user_doc.get().then((doc) => {
        if (doc.exists) {

          load_teacher(doc.data())
          Onload.signedIn();

        } else {
          // Data not found on db for this user
          document.querySelector('#no-data .user-email').textContent = active_user;
          Onload.noData();
        }
      })

    } else {
      // User is not logged in (is this even a possibility?)
      console.log('No one logged in ...')
      Onload.signedOut()
    }
  });
}
const Onload = {
  signedIn() {
    document.getElementById('content').classList.remove('hidden')
    loader_finish()

  },
  signedOut() {
    document.getElementById('before-login').classList.remove('hidden')

    //Hide and empty courses incase logged out while active session
    document.getElementById('content').classList.add('hidden')
    document.querySelectorAll('section .course').forEach(x => x.parentNode.removeChild(x))
    // Hide user details
    document.querySelector('.user-container .col1').classList.add('hidden')
    document.querySelector('.user-container .col2').classList.add('hidden')

    // Show sign-in button.
    signInButtonElement.classList.remove('hidden');
    signOutButtonElement.classList.add('hidden');
    loader_finish()

  },
  noData() {
    document.getElementById('no-user').classList.remove('hidden')
    loader_finish()
  }
}

async function load_teacher(data) {
  // Loopa igenom "courses".
  let numb_of_students = 0;
  for (let course of data.courses) {
    // Skapa ny option till select
    let select_course = document.getElementById('teacher-choose-course');
    let new_option = document.createElement('option');
    new_option.textContent = course.course_id;
    select_course.appendChild(new_option)

    // Skapa ny section för kurs
    let section = document.createElement('section');
    let main = document.querySelector('#content')
    section.classList.add('course', 'hidden')
    section.id = course.course_id;
    main.appendChild(section)

    // Loopa igenom "students".
    for (let s of course.students) {
      handle_row_creation_for_student(s, course.course_id)
      numb_of_students++
    }
  }

  populate_teacher_statistics(numb_of_students)
}

async function handle_row_creation_for_student(student, course) {
  let parent = ((stu) => {
    return new Promise((res) => {
      let data = firebase.firestore().collection("status-report").doc(CURRENT_TERM).collection('students').doc(stu).collection('courses').doc(course).get();
      res(data)
    })
  })

  let doc = await parent(student)
  if (doc.exists) {
    let result = doc.data()
    add_student_row(result)
  }

}

function add_student_row(data) {
  // Kopiera en elevrad template
  let row = document.querySelector('#clone .student').cloneNode(true)
  document.getElementById(data.course_id).appendChild(row)
  row.id = data.email + '-' + data.course_id;
  row.dataset.email = data.email;

  // Elevinfo 
  row.querySelector('.student-name').textContent = data.name;
  row.querySelector('.student-class').textContent = data.class;
  row.querySelector('.student-pnr').textContent = data.pnr.slice(0, 6) + '-xxxx';

  // ==== Omdöme =====
  // Möjliggör TEB för sprintkurser
  if (data.course_id.toLowerCase().substring(0, 6) === 'sprint') {
    let TEB_option = row.querySelector('.select-assessment .option-TEB');
    TEB_option.removeAttribute('disabled')
    TEB_option.classList.remove('hidden')
  }

  if ('assessment' in data) {
    row.querySelector('.select-assessment').value = data.assessment
    row.querySelector('.select-assessment').classList.add(`option-${data.assessment}`)
  }

  // Närvaro. Inte 100% säker på att det alltid finns
  try {
    row.querySelector('.attendance-total').textContent = data.attendance.total
    row.querySelector('.attendance-unreported').textContent = data.attendance.not_reported
  } catch (e) {
    console.error(e)
  }

  // Kommentar
  if ('comment' in data) {
    row.querySelector('.textarea-comment').value = data.comment;
  }
}

function populate_teacher_statistics(numb_of_students) {
  document.querySelectorAll('.amount-total').forEach(x => x.textContent = numb_of_students)

  let assessments = document.querySelectorAll('.select-assesment');
  let numb_of_assessments = 0;
  for (let a of assessments) {
    if (a.value) {
      numb_of_assessments++;
    }
  }

  document.querySelector('.amount-assessment').textContent = numb_of_assessments;

  let comments = document.querySelectorAll('.select-assesment');
  let numb_of_comments = 0;
  for (let c of comments) {
    if (c.length > 0) {
      numb_of_comments++;
    }
  }
  document.querySelector('.amount-comments').textContent = numb_of_comments;
}

function register_student_change(email, course) {
  // sessionStorage used because if session is reset, no data will be available anyway
  let get_item = sessionStorage.getItem('changelist');
  let set_item;
  let arr;
  if (get_item == null) {
    arr = new Array();
  } else {
    arr = JSON.parse(get_item)
    let already_exists = arr.find(x => x.email === email)
    if (already_exists) { return }
  }
  arr.push({ email: email, course: course });
  set_item = JSON.stringify(arr);
  sessionStorage.setItem('changelist', set_item)
}

/**************************************
 * ===================================
 *  E V E N T    L I S T E N E R S
 * ===================================
 ************************************ */

document.querySelector('.hamburger-menu-container').addEventListener('click', () => {
  // This is for toggling the hamburger nav
  const nav = document.querySelector('.nav-links')
  const navLinks = document.querySelectorAll('.nav-links li')

  // Toggle Nav
  nav.classList.toggle('nav-burger-active')


  // Animate Links
  navLinks.forEach((link, index) => {
    if (link.style.animation) {
      link.style.animation = '';

    } else {
      link.style.animation = `navLinkFade 0.5s ease forwards ${index / 7 + 0.3}s`;
    }
  })

  // Burger Animation
  document.querySelector('.hamburger-menu-container').classList.toggle('toggle')
})

document.getElementById('teacher-choose-course').addEventListener('change', (event) => {
  // Select in the teacher <main> header
  const all_sections = document.querySelectorAll('#content section');
  for (let s of all_sections) {
    if (s.id === event.target.value) {
      s.classList.remove('hidden')
    } else {
      s.classList.add('hidden')
    }
  }
})

document.querySelector('#btn-save').addEventListener('click', () => {
  let changelist = sessionStorage.getItem('changelist');
  try {
    changelist = JSON.parse(changelist)
  } catch (e) {
    Toast.show('Inga ändringar registrerade', 'error')
    return;
  }

  let promises = []
  if (changelist && changelist.length) {
    for (let student of changelist) {
      let el = document.getElementById(`${student.email}-${student.course}`)
      student['assessment'] = el.querySelector('.select-assessment').value;
      student['comment'] = el.querySelector('.textarea-comment').value
      let p = save_changes_to_firebase(student)
      promises.push(p) // Yes this returns a promise
    }
  } else {
    Toast.show('Inga ändringar registrerade', 'error')
    return;
  }

  Promise.all(promises).then((response) => {
    // console.log(response)
    sessionStorage.removeItem('changelist')
    Toast.show('Ändringar sparade!', 'success')
  }).catch((error) => {
    console.error(error)
    Toast.show('Något gick fel vid sparning..', 'error')
  })
})

document.addEventListener('change', (ev) => {
  let tar = ev.target;

  /* ============================================
  * Changes made to a student row
  * ============================================= */
  if (tar.classList.contains('select-assessment')) {
    // Omdöme changed
    ['option-T', 'option-UB', 'option-IT'].forEach((c) => { tar.classList.remove(c) })
    if (tar.value !== '') { // "Välj omdöme" har value ''
      tar.classList.add(`option-${tar.value}`)

      // Add to storage that a change has been made:
      let student = tar.closest('.student.row');
      let email = student.dataset.email;
      let course = student.parentNode.id;
      register_student_change(email, course)
    }
  }
  if (tar.classList.contains('textarea-comment')) {
    // Add to storage that a change has been made:
    let student = tar.closest('.student.row');
    let email = student.dataset.email;
    let course = student.parentNode.id;
    register_student_change(email, course)

  }
})


/** =======================
  * Auto-grow textarea
  * ===================== */
function auto_grow(textarea) {
  textarea.style.height = 'auto';
  textarea.style.height = textarea.scrollHeight + 'px'
}


/** =======================
 * Loading
 * ===================== */
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