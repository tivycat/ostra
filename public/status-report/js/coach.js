function handle_load_coach(data) {
  if (!data.exists) {
    document.querySelector('#no-data .user-email').textContent = getUserEmail();
    Onload.noData();
    return;
  }

  data = data.data();
  let promises = [];

  for (let s of data.coach_students) {
    let get_coach_student_data = ((email) => {
      return new Promise((res) => {
        let data = firebase.firestore().collection("status-report").doc(CURRENT_TERM).collection('students').doc(email).collection('courses');
        let values = data.get();
        res(values)
      })
    })
    promises.push(get_coach_student_data(s))
  }

  Promise.all(promises).then((all_students) => {
    let i = 0;
    for (i; i < all_students.length; i++) {
      let stu = all_students[i];

      // Ta först bästa och skapa section med detaljer
      // Skicka med coachnamn men även i som ska göra det lättare att hitta med select
      let section = create_student_section(stu.docs[0].data(), data.name, i)
      document.getElementById('content').appendChild(section)

      //Lägg till kurser
      let j = 0;
      for (j; j < stu.docs.length; j++) {
        let course = stu.docs[j].data();
        add_course_to_section(course, section);
      }
    }
  }).then(() => {
    Onload.signedIn()
  })
}

function create_student_section(student, coach, index) {
  let section = document.querySelector('#clone .student').cloneNode(true);
  section.dataset.section = index;
  section.querySelector('.student__currentTerm').textContent = CURRENT_TERM;
  section.querySelector('.student__name').textContent = student.name;
  section.querySelector('.student__class').textContent = student.class;
  section.querySelector('.student__coach').textContent = coach;

  // Skapa option i select
  let select = document.getElementById('select_coach_student');
  let option = document.createElement('option');
  select.appendChild(option)
  option.textContent = student.name;
  option.dataset.forSection = index;

  return section;
}

function add_course_to_section(data, section) {
  let tr = document.createElement('tr');

  // Personlig info
  let td_info = document.createElement('td')
  tr.appendChild(td_info)
  td_info.classList.add('sReport__td', 'sReport__td--leftAligned')

  let course_title = document.createElement('div')
  td_info.appendChild(course_title)
  course_title.classList.add('sReport__courseTitle')
  course_title.textContent = data.course_title;


  let teacher = document.createElement('div')
  td_info.appendChild(teacher)
  teacher.classList.add('sReport__teacher')
  teacher.textContent = data.teacher_name

  // Omdöme
  let td_asmt = document.createElement('td')
  tr.appendChild(td_asmt)
  td_asmt.classList.add('sReport__td')

  let asmt = document.createElement('div')
  asmt.classList.add('sReport__asmt', `option-${data.assessment}`)
  td_asmt.appendChild(asmt)

  let asmt_spelled_out;
  switch (data.assessment) {
    case 'T':
      asmt_spelled_out = 'Tillfredsställande'
      break;
    case 'IT':
      asmt_spelled_out = 'Icke tillfredsställande'
      break;
    case 'UB':
      asmt_spelled_out = 'Underlag bristfälligt'
      break;
    default: 
    asmt_spelled_out = 'Ej rapporterad av lärare'
      break;
  }
  asmt.textContent = asmt_spelled_out;

  // Kommentar
  let td_cmt = document.createElement('td')
  tr.appendChild(td_cmt)
  td_cmt.classList.add('sReport__td')

  let comment = document.createElement('textarea')
  comment.classList.add('sReport__textarea')
  comment.setAttribute('disabled', '')
  td_cmt.appendChild(comment)
  comment.textContent = data.comment;

  section.querySelector('.sReport__tbody').appendChild(tr)

}

document.getElementById('select_coach_student').addEventListener('change', (el) => {
  let s = el.target;
  let o = s.options[s.selectedIndex];
  let index = o.dataset.forSection;

  let sections = document.querySelectorAll('.student');

  sections.forEach( (s) => {
    s.classList.add('hidden')
  })

  sections[index].classList.remove('hidden')

  // Körs här för att textareas måste resizas efter load och det här verkar seriöst
  // som första tillfället när scrollHeight inte returnar 0. Weird men okej.. 
  document.querySelectorAll(`.sReport__textarea`).forEach( (TA) => { 
    auto_grow(TA)
  })


})

document.getElementById('btn-print').addEventListener('click', () => {
  Toast.show('Utskriftsfunktionalitet kommer snart!', 'error')
})



/** =======================
  * Auto-grow textarea
  * ===================== */
 function auto_grow(textarea) {
  textarea.style.height = 'auto';
  textarea.style.height = textarea.scrollHeight + 'px'
}

