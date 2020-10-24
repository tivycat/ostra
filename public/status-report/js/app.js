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
      console.log(member)
      
      // Skapa en egen rad för eleven
      let row = document.createElement('div');
      row.classList.add('row');
      section.appendChild(row)

      // Elevinfo  
      let student_details_container = document.createElement('div');
      row.appendChild(student_details_container)
      student_details_container.classList.add('student-details-container')
      
      let student_portrait = document.createElement('div');
      student_details_container.appendChild(student_portrait)
      student_portrait.classList.add('student-portrait')
      
      let img = document.createElement('img')
      student_portrait.appendChild(img)
      img.setAttribute('src', '../resources/images/profile_placeholder.png');
      img.setAttribute('alt', 'portrait')

      let student_personal_info = document.createElement('div')
      student_details_container.appendChild(student_personal_info)
      student_personal_info.classList.add('student-personal-info')

      let student_name = document.createElement('div');
      student_personal_info.appendChild(student_name)
      student_name.classList.add('student-name')
      student_name.textContent = member
      // Omdöme

      // Kommentar
    }
    

  }
  
  {/* <section class="course hidden" id="EN6SABE19">
      <div class="row">
        <div class="student-details">
          <div class="student-portrait">
            <img src="" alt="portrait">
          </div>
          <div class="student-personal-info">
            <div class="student-name">
              Viktor Tysk
            </div>
            <div class="student-class">
              SABE19
            </div>
            <div class="student-pnr">
              871109-xxxx
            </div>
          </div>

        </div>
        <div class="student-report-assessment">
          <select class="select-css select-assessment">
            <option selected disabled>Välj omdöme</option>
            <option value="T" class="option-T">Tillfredsställande</option>
            <option value="IT" class="option-IT">Icke tillfredsställande</option>
            <option value="UB" class="option-UB">Underlag bristfälligt</option>

          </select>
        </div>
        <div class="student-report-comment">
          <textarea rows=5></textarea>

        </div>
      </div>

    </section> */}


  

  // ???


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
