const navSlide = () => {
  const burger = document.querySelector('.hamburger-menu-container')
  const nav = document.querySelector('.nav-links')
  const navLinks = document.querySelectorAll('.nav-links li')

  burger.addEventListener('click', () => {
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
    burger.classList.toggle('toggle')
  })
}

navSlide();

document.getElementById('teacher-choose-course').addEventListener('change', (event) => {
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
  if (tar.classList.contains('select-assessment')) {
    ['option-T', 'option-UB', 'option-IT'].forEach((c) => { tar.classList.remove(c) })
    tar.classList.add(`option-${tar.value}`)
  }
})


function sign_in() {
  load_teacher()

}

function sign_out() {

}

function load_teacher() {
  let temp_teacher = 'viktor.tysk@edu.huddinge.se';
  let active_teacher = TEACHER_DATA.find(t => t.email == temp_teacher)
  console.log(active_teacher)

  // Loopa igenom "members".

  // Skapa kurs. Om kurs finns, lägg till elev i kurs

  // ??


}




const STUDENT_DATA = {
  'edna.aga@edu.huddinge.se' : {
    name: "Aga Edna",
    pnr : "031130-0040",
    email:"edna.aga@edu.huddinge.se",
    class: "SABE19",
    coach_name: "Tysk, Viktor",
    coach_email: "viktor.tysk@edu.huddinge.se",
    courses: [
      {
        course_id: "EN6SABE19",
        course_title: "Engelska 6",
        teacher_email: "viktor.tysk@edu.huddinge.se", 
        teacher_name: "Tysk, Viktor",
        attendance :
          {total: 0,
          not_reported: 0,
          reported: ""
        }
      }
    ]
  },
  "elif.akdeve@edu.huddinge.se" : {
    name: "Akdeve Elif",
    pnr: "031223-3489",
    email: "elif.akdeve@edu.huddinge.se",
    class: "SABE19",
    coach_name: "Tysk, Viktor",
    coach_email: "viktor.tysk@edu.huddinge.se",
    courses : [
      {
        course_id: "EN6SABE19",
        course_title: "Engelska 6",
        teacher_email: "viktor.tysk@edu.huddinge.se", 
        teacher_name: "Tysk, Viktor",
        attendance :
          {
            total: 12,
            not_reported: 6,
            reported: 6
          }
      }
    ]
  },
  "elev.elevsson@edu.huddinge.se" : {
    name: "Elev Elevsson",
    pnr: "031223-3489",
    email: "elev.elevsson@edu.huddinge.se",
    class: "SABE20",
    coach_name: "Nån Annan",
    coach_email: "nan.annan@edu.huddinge.se",
    courses : [
      {
        course_id: "DIGSABE19",
        course_title: "Digitalt Skapande 1",
        teacher_email: "viktor.tysk@edu.huddinge.se", 
        teacher_name: "Tysk, Viktor",
        attendance :
          {
            total: 34,
            not_reported: 6,
            reported: 28
          }
      }
    ]
  },
  "anna.andersson@edu.huddinge.se" : {
    name: "Anna Andersson",
    pnr: "031223-3489",
    email: "anna.andersson@edu.huddinge.se",
    class: "SABE20",
    coach_name: "Nån Annan",
    coach_email: "nan.annan@edu.huddinge.se",
    courses : [
      {
        course_id: "DIGSABE19",
        course_title: "Digitalt Skapande 1",
        teacher_email: "viktor.tysk@edu.huddinge.se", 
        teacher_name: "Tysk, Viktor",
        attendance :
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
          "anna.andersson@edu.huddinge.se",
          "elev.elevsson@edu.huddinge.se"
        ]
      },
      {
        course_id: 'DIGSABE20',
        course_title: 'Digitalt Skapande 1',
        members: [
          "elif.akdeve@edu.huddinge.se",
          'edna.aga@edu.huddinge.se'
        ]
      }
    ]
  }
]


var userPicElement = document.getElementById('user-pic');
var userNameElement = document.getElementById('user-name');
var sign_in_button = document.getElementById('sign-in');
var sign_out_button = document.getElementById('sign-out');

sign_out_button.addEventListener('click', sign_out);
sign_in_button.addEventListener('click', sign_in);
