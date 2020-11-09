function handle_load_coach(data) {
  const no_data = () => {
    document.querySelector('#no-data .user-email').textContent = getUserEmail();
    Onload.noData();
  }

  if (data == null) {
    // user lacks credentials
    no_data()
    return;
  }

  if (!data.exists) {
    no_data()
    return;
  }

  // Töm containern där kurserna ska placeras ifall funktion körs på en session med tidigare inloggad
  let container = document.getElementById('content');
  while (container.firstChild) { container.parentElement.removeChild(container.firstChild) }

  let coach = data.data();
  // Querya alla elever som har aktiv lärare som coach_email och sortera efter efternamn
  let get_coach_students = ((coach) => {
    return new Promise((resolve) => {
      const db = firebase.firestore();
      const query = db.collectionGroup('courses').where('coach_email', '==', coach).orderBy('name').get()
      resolve(query)
    })
  })

  get_coach_students(coach.email).then((querySnapshot) => {
    // Det som returneras är ju en lista av alla kurser (typ 100+) alltså inte en array med elever
    // Därför måste vi loopa igenom varje kurs och först se vilken elev den ska adderas till
    let i = 0;
    let active_student;
    let el;

    querySnapshot.forEach((doc) => {
      if (doc.exists) {
        let s = doc.data();
        if (active_student === s.email) {
          // Gör inget (loopen behöver tidigare värden)
        } else {
          el = create_student_section(s, coach.name, i) // index för select
          document.getElementById('content').appendChild(el)
          active_student = s.email;
          i++ // öka i för nästa elev
        }
        // Lägg till kurs till sektion
        add_course_to_section(s, el)
      }
    })
  }).then(() => {
    Onload.signedIn();
  })
}

function create_student_section(student, coach, index) {
  let section = document.querySelector('#clone .student').cloneNode(true);
  section.dataset.section = index;
  section.id = student.email;
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
  tr.classList.add('tr', 'tr--alternativeRows')

  // Personlig info
  let td_info = document.createElement('td')
  tr.appendChild(td_info)
  td_info.classList.add('td', 'text-left')

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
  td_asmt.classList.add('td')

  let asmt = document.createElement('div')
  asmt.classList.add('sReport__asmt', `option-${data.assessment}`) // undefined if none
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
  td_cmt.classList.add('td')

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

  sections.forEach((s) => {
    s.classList.add('hidden')
  })

  sections[index].classList.remove('hidden')

  // Körs här för att textareas måste resizas efter load och det här verkar seriöst
  // som första tillfället när scrollHeight inte returnar 0. Weird men okej.. 
  document.querySelectorAll(`.sReport__textarea`).forEach((TA) => {
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

