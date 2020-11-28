document.addEventListener('DOMContentLoaded', () => {

  // Select för coachelever
  document.getElementById('select_coach_student').addEventListener('change', (el) => {
    let s = el.target;
    let o = s.options[s.selectedIndex];
    let index = o.dataset.forSection;

    let sections = document.querySelectorAll('.report');

    sections.forEach((s) => {
      s.classList.add('hidden')
    })

    sections[index].classList.remove('hidden')

  })

  document.getElementById('btn-print').addEventListener('click', () => {
    print_coach_students()
  })

})




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
        // Eftersom kurserna kommer en och en så måste vi vara säker på att det är rätt elev som får kursen
        if (active_student === s.email) {
          // Gör inget (loopen behöver tidigare värden)
        } else {
          el = create_student_section(s, i) // index för select
          document.getElementById('content').appendChild(el)
          active_student = s.email;
          i++ // öka i för nästa elev
        }
        // Lägg till kurs till sektion
        add_grid_row(s, el)
      }
    })
  }).then(() => {
    Onload.signedIn();
  })
}


// Onload. Skapar en sektion som sen ska populeras med kurserna
function create_student_section(student, index) {
  let section = document.querySelector('#clone .report').cloneNode(true);
  section.dataset.section = index;
  section.id = student.email;

  let el_name = section.querySelectorAll('.report__studentName') // 2 places, 1 for each page
  let el_coach = section.querySelector('.report__studentCoach')
  let el_class = section.querySelectorAll('.report__studentClass') // 2 places, 1 for each page
  let el_term = section.querySelector('.report__term');

  el_term.textContent = CURRENT_TERM;
  el_name.forEach(x => x.textContent = student.name)
  el_coach.textContent = student.coach_name;
  el_class.forEach(x => x.textContent = student.class)

  // Skapa option i select
  let select = document.getElementById('select_coach_student');
  let option = document.createElement('option');
  select.appendChild(option)
  option.textContent = student.name;
  option.dataset.forSection = index;

  // Lägg till reflektions om de finns
  if ('reflections' in student) {
    populate_reflections(student.reflections, section)
  }

  return section;
}

function add_grid_row(data, parent) {
  let tr = document.createElement('div');
  tr.classList.add('row', 'py-1', 'mb-2')

  let col_course = document.createElement('div');
  col_course.classList.add('col-3', 'mr-2')
  tr.appendChild(col_course)

  let course_title = document.createElement('div')
  col_course.appendChild(course_title)
  course_title.classList.add('sGrid__courseTitle', 'text-bold')
  course_title.textContent = data.course_title;

  let teacher_wrapper = document.createElement('div')
  col_course.appendChild(teacher_wrapper)

  let teacher_img = document.createElement('img');
  teacher_img.setAttribute('src', '/../resources/images/s-teacher.png');
  teacher_img.setAttribute('alt', 'teacher')
  teacher_img.classList.add('teacher-img')
  teacher_wrapper.appendChild(teacher_img);

  let mobile_teacher_title = document.createElement('span');
  teacher_wrapper.appendChild(mobile_teacher_title)
  mobile_teacher_title.textContent = 'Lärare:'
  mobile_teacher_title.style.marginRight = '15px'
  mobile_teacher_title.classList.add('mobile-only--inline', 'text-bold', 'my-2')


  let teacher_name = document.createElement('span');
  teacher_wrapper.appendChild(teacher_name)
  teacher_name.classList.add('sGrid__teacher')
  teacher_name.textContent = data.teacher_name

  if ('attendance' in data) {
    let attendance = 'N/A'
    if (typeof data.attendance.total !== Boolean || data.attendance.total !== undefined || data.attendance.total !== "") {
      attendance = data.attendance.total;
    }
    let absence = document.createElement('div');
    col_course.appendChild(absence);
    absence.textContent = `Elevens frånvaro: ${attendance}%`
  }

  // Omdöme
  let col_asmt = document.createElement('div');
  col_asmt.classList.add('col-2', 'mr-2')
  tr.appendChild(col_asmt)

  let mobile_asmt_title = document.createElement('span');
  col_asmt.appendChild(mobile_asmt_title)
  mobile_asmt_title.textContent = 'Omdöme:'
  mobile_asmt_title.style.marginRight = '15px'
  mobile_asmt_title.classList.add('mobile-only--inline', 'text-bold', 'my-2')

  let asmt = document.createElement('div')
  col_asmt.appendChild(asmt)

  let asmt_spelled_out;
  let class_to_add = `option-${data.assessment}`
  switch (data.assessment) {
    case 'T':
      asmt_spelled_out = 'Tillfredsställande'
      break;
    case 'TEB':
      asmt_spelled_out = 'Tillfredsställande (ej betyg)'
      break;
    case 'IT':
      asmt_spelled_out = 'Icke tillfredsställande'
      break;
    case 'UB':
      asmt_spelled_out = 'Underlag bristfälligt'
      break;
    default:
      asmt_spelled_out = 'Ej rapporterad av lärare'
      class_to_add = 'text-small'
      break;
  }
  asmt.textContent = asmt_spelled_out;
  asmt.classList.add('asmt-box', class_to_add, 'mt-2')

  // Kommentar
  let col_comment = document.createElement('div');
  tr.appendChild(col_comment)
  col_comment.classList.add('col', 'mr-2')

  let mobile_comment_title = document.createElement('span');
  col_comment.appendChild(mobile_comment_title)
  mobile_comment_title.textContent = 'Lärarens kommentar:'
  mobile_comment_title.style.marginRight = '15px'
  mobile_comment_title.classList.add('mobile-only--block', 'text-bold', 'mt-2')

  let comment = document.createElement('div')
  comment.classList.add('comment-text')
  col_comment.appendChild(comment)

  if ('comment' in data) {
    if (data.comment.length !== 0) {
      comment.textContent = data.comment;
      // Ja det här är lite puckat, men det fungerar
      comment.innerHTML = comment.innerHTML.replace(/\r?\n/g, '<br>')
    }
  }
  parent.querySelector('.sGrid__body').appendChild(tr)
}


function populate_reflections(ref, parent) {
  // Varje sektion har 4 st och alla har en data-form-index
  let i = 0;
  let len = ref.length;
  for (i; i < len; i++) {
    let active_TA = parent.querySelector(`.report__formToDiv[data-form-index="${i}"]`)
    active_TA.textContent = ref[i]
  }
}



function print_coach_students() {
  let divContents = document.getElementById('content').innerHTML;
  let printWindow = window.open('', '', 'height=600,width=1000');
  printWindow.document.write('<html><head><title>UTSKRIFT - Lägesrapport</title>');
  printWindow.document.write('\
  <style>\
    * { margin: 0px; padding: 0px; box-sizing: border-box; font-family: sans-serif; font-size: 16px}\
    @media print{ * {-webkit-print-color-adjust:exact;} } \
    @page {  size: a4 portrait; margin : 50px;} \
    .signatur { page-break-after: always; page-break-inside: avoid; } \
    .report { page-break-after: always; page-break-inside: avoid; } \
    .report__printOnly { display:block !important; float:right; font-style: italic; }\
    .report__header { margin-bottom: 1em; } \
    .report__studentName { font-weight: bold; font-size; font-size: 1.2rem; text-transform: uppercase; } \
    .report__courseTitle {font-weight: bold;} \
    .asmt-box { text-align: center; }\
    .comment-text { font-size: 0.85rem; white-space: pre-wrap; }\
    .mobile-only--inline, .mobile-only--block { display: none} \
    .row { display: flex; width: 100%; padding: 0.25rem 0; border-bottom: 1px dotted black}\
    .col-2 {  flex: 0 0 16.666666%; max-width: 16.666666%;} \
    .col-3 {  flex: 0 0 25%; max-width: 25%;} \
    .mr-2 { margin-right: .5rem; } \
    .mb-2 { margin-bottom: .5rem; } \
    .my-2 { margin-bottom: .5rem; margin-top: 0.5rem} \
    .col { flex-basis: 0; flex-grow: 1; min-width: 0; max-width: 100%;} \
    .teacher-img {display: none} \
    .sGrid__th { font-weight: 600; height: 2.5rem; background-color: #ed730a; color: white; display: flex; align-items: center; padding: 1em; } \
    .sGrid__courseTitle { font-weight: bold}\
    label { display: block; font-weight: bold; margin-top: 10px;} \
    .report__formToDiv { font-size: 0.85rem; white-space: pre-wrap; border: 1px solid black; padding: 0.33rem; margin: 10px 0; min-height: 10px;} \
    .option-IT { background-color: #ffd2cf !important; }\
    .option-T { background-color: #96f2af !important; }\
    .option-TEB { background-color: #6ec76e !important; }\
    .option-UB { background-color: #feffd9 !important; }\
  </style>');
  printWindow.document.write('</head><body >');
  printWindow.document.write(divContents);
  printWindow.document.write('</body></html>');
  printWindow.document.close();
  printWindow.print();
};
