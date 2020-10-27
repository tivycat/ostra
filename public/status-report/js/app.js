
function sign_in() {
  load_teacher()
  user_name_element.textContent = 'Viktor Tysk';
  user_name_element.classList.remove('hidden');
  user_pic_element.classList.remove('hidden');
  sign_out_button.classList.remove('hidden');

  // Hide sign-in button.
  sign_in_button.classList.add('hidden');
}

function sign_out() {
  // Hide user's profile and sign-out button.
  user_name_element.classList.add('hidden');
  user_pic_element.classList.add('hidden');
  sign_out_button.classList.add('hidden');

  // Show sign-in button.
  sign_in_button.classList.remove('hidden');
}

function handle_load_teacher() {
  // Loading start
  // Promises and shiz
}

function load_teacher() {
  let temp_teacher = 'viktor.tysk@edu.huddinge.se';
  let active_teacher = TEACHER_DATA.find(t => t.email == temp_teacher)

  // Loopa igenom "courses".
  for (let course of active_teacher.courses) {
    // Skapa ny option till select
    let select_course = document.getElementById('teacher-choose-course');
    let new_option = document.createElement('option');
    new_option.textContent = course.course_id;
    select_course.appendChild(new_option)

    // Skapa ny section för kurs
    let section = document.createElement('section');
    let main = document.querySelector('main')
    section.classList.add('course', 'hidden')
    section.id = course.course_id;
    main.appendChild(section)

    // Loopa igenom "members".
    for (let member of course.members) {
      // Hämta elevens riktiga data
      let student = STUDENT_DATA[member];
      console.log(student)
      console.log(course)

      // Kopiera en elevrad template
      let row = document.querySelector('#clone .student').cloneNode(true)
      section.appendChild(row)
      row.id = member;

      // Elevinfo 
      row.querySelector('.student-name').textContent = student.name;
      row.querySelector('.student-class').textContent = student.class;
      row.querySelector('.student-pnr').textContent = student.pnr.slice(0, 6) + '-xxxx';
      // = pnr.toString().slice(2, 8) + "-" + pnr.toString().slice(8) 
      // 871109-0137

      // Omdöme
      let active_course = student.courses.find(x => x.course_id === course.course_id);
      console.log(active_course)
      if ('assessment' in active_course) {
        row.querySelector('.select-assessment').value = active_course.assessment
      }

      // Närvaro. Inte 100% säker på att det alltid finns
      try {
        row.querySelector('.attendance-total').textContent = active_course.attendance.total
        row.querySelector('.attendance-unreported').textContent = active_course.attendance.not_reported
      } catch (e) {
        console.error(e)
      }

      // Kommentar
      if ('comment' in active_course) {
        row.querySelector('.textarea-comment').value = active_course.comment;
      }
    }


  }
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




const STUDENT_DATA = {
  'edna.aga@edu.huddinge.se': {
    name: "Aga Edna",
    pnr: "031130-0040",
    email: "edna.aga@edu.huddinge.se",
    class: "SABE19",
    coach_name: "Tysk, Viktor",
    coach_email: "viktor.tysk@edu.huddinge.se",
    courses: [
      {
        course_id: "EN6SABE19",
        course_title: "Engelska 6",
        teacher_email: "viktor.tysk@edu.huddinge.se",
        teacher_name: "Tysk, Viktor",
        attendance:
        {
          total: 0,
          not_reported: 0,
          reported: ""
        }
      }
    ]
  },
  "elif.akdeve@edu.huddinge.se": {
    name: "Akdeve Elif",
    pnr: "031223-3489",
    email: "elif.akdeve@edu.huddinge.se",
    class: "SABE19",
    coach_name: "Tysk, Viktor",
    coach_email: "viktor.tysk@edu.huddinge.se",
    courses: [
      {
        course_id: "EN6SABE19",
        course_title: "Engelska 6",
        teacher_email: "viktor.tysk@edu.huddinge.se",
        teacher_name: "Tysk, Viktor",
        attendance:
        {
          total: 12,
          not_reported: 6,
          reported: 6
        }
      }
    ]
  },
  "elev.elevsson@edu.huddinge.se": {
    name: "Elev Elevsson",
    pnr: "031223-3489",
    email: "elev.elevsson@edu.huddinge.se",
    class: "SABE20",
    coach_name: "Nån Annan",
    coach_email: "nan.annan@edu.huddinge.se",
    courses: [
      {
        course_id: "DIGSABE20",
        course_title: "Digitalt Skapande 1",
        teacher_email: "viktor.tysk@edu.huddinge.se",
        teacher_name: "Tysk, Viktor",
        attendance:
        {
          total: 34,
          not_reported: 6,
          reported: 28
        }
      }
    ]
  },
  "anna.andersson@edu.huddinge.se": {
    name: "Anna Andersson",
    pnr: "031223-3489",
    email: "anna.andersson@edu.huddinge.se",
    class: "SABE20",
    coach_name: "Nån Annan",
    coach_email: "nan.annan@edu.huddinge.se",
    courses: [
      {
        course_id: "DIGSABE20",
        course_title: "Digitalt Skapande 1",
        teacher_email: "viktor.tysk@edu.huddinge.se",
        teacher_name: "Tysk, Viktor",
        attendance:
        {
          total: 0,
          not_reported: 0,
          reported: 0
        }
      }
    ]

  }
}



const TEACHER_DATA = [
  {
    email: 'viktor.tysk@edu.huddinge.se',
    name: 'Viktor Tysk',
    courses: [
      {
        course_id: 'EN6SABE19',
        course_title: 'Engelska 6',
        members: [
          "elif.akdeve@edu.huddinge.se",
          'edna.aga@edu.huddinge.se'

        ]
      },
      {
        course_id: 'DIGSABE20',
        course_title: 'Digitalt Skapande 1',
        members: [
          "anna.andersson@edu.huddinge.se",
          "elev.elevsson@edu.huddinge.se"
        ]
      }
    ]
  }
]


let user_pic_element = document.getElementById('user-pic');
let user_name_element = document.getElementById('user-name');
let sign_in_button = document.getElementById('sign-in');
let sign_out_button = document.getElementById('sign-out');

sign_out_button.addEventListener('click', sign_out);
sign_in_button.addEventListener('click', sign_in);


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
  const all_sections = document.querySelectorAll('section');
  for (let s of all_sections) {
    if (s.id === event.target.value) {
      s.classList.remove('hidden')
    } else {
      s.classList.add('hidden')
    }
  }
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
      let email = student.id;
      let course = student.parentNode.id;
      register_student_change(email, course)
    }
  }
  if (tar.classList.contains('textarea-comment')) {
    // TODO: ALSO RESIZE HERE!

    // Add to storage that a change has been made:
      let student = tar.closest('.student.row');
      let email = student.id;
      let course = student.parentNode.id;
      register_student_change(email, course)

  }
})
