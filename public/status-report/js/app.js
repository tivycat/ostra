const navSlide = () => {
  const burger = document.querySelector('.burger')
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




const STUDENT_DATA = {
  'anna.andersson@edu.huddinge.se': {
    email: 'anna.andersson@edu.huddinge.se',
    name: 'Anna Andersson',
    class: 'SABE19',
    courses: [
      {
        course_id: 'EN6SABE19',
        course_title: 'Engelska 6',
        assessment: 'T',
        comment: 'Mycket bra'
      }
    ]
  },
  'bertil.bertilsson@edu.huddinge.se': {
    email: 'bertil.bertilsson@edu.huddinge.se',
    name: 'Bertil Bertilsson',
    class: 'SABE19',
    courses: [
      {
        course_id: 'EN6SABE19',
        course_title: 'Engelska 6',
        assessment: 'IT',
        comment: 'Inte så bra'
      }
    ]
  },
  'cecil.citron@edu.huddinge.se': {
    email: 'cecil.citron@edu.huddinge.se',
    name: 'Cecil Citron',
    class: 'SABE20',
    courses: [
      {
        course_id: 'DIGSABE20',
        course_title: 'Digitalt Skapande 1',
        assessment: 'T',
        comment: 'Mycket bra'
      }
    ]
  },
  'david.dagolad@edu.huddinge.se': {
    email: 'david.dagolad@edu.huddinge.se',
    name: 'David Dagolad',
    class: 'SABE20',
    courses: [
      {
        course_id: 'DIGSABE20',
        course_title: 'Digitalt Skapande 1',
        assessment: 'T',
        comment: 'Mycket bra'
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
          'anna.andersson@edu.huddinge.se',
          'bertil.bertilsson@edu.huddinge.se'
        ]
      },
      {
        course_id: 'DIGSABE20',
        course_title: 'Digitalt Skapande 1',
        members: [
          'cecil.citron@edu.huddinge.se',
          'david.dagolad@edu.huddinge.se'
        ]
      }
    ]
  }
]

function sign_in() {
  load_teacher()

}

function sign_out() {

}

function load_teacher() {
  let temp_teacher = 'viktor.tysk@edu.huddinge.se'
  console.log(TEACHER_DATA)
  let get_teacher_data = get_teacher_data(temp_teacher)
  console.log(get_teacher_data)


}

function get_teacher_data(teacher) {
  /* return new Promise ((resolve, reject) => { */
    let active_teacher = TEACHER_DATA.find( t => t.email == teacher)
    return active_teacher
    /* if (typeof active_teacher === 'string') {
      resolve(active_teacher)
    } else {
      reject()
    }
  }) */
}


var userPicElement = document.getElementById('user-pic');
var userNameElement = document.getElementById('user-name');
var sign_in_button = document.getElementById('sign-in');
var sign_out_button = document.getElementById('sign-out');

sign_out_button.addEventListener('click', sign_out);
sign_in_button.addEventListener('click', sign_in);