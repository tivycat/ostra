document.addEventListener('DOMContentLoaded', () => {
    // Escape stänger modal
    document.addEventListener('keydown', function (evt) {
      if (evt.key === 'Escape') {
        let active_modal = document.querySelector('.modal--active');
        if (active_modal) {
          Modal.hide()
        }
      }
    })

  document.addEventListener('click', (ev) => {
    const tar = ev.target;
  
    // Tabs
    if (tar.classList.contains('tabs__btn')) {
      const menu = document.querySelectorAll('.tabs__btn');
      const tabs = document.querySelectorAll('.tabs__section')
      menu.forEach(btn => {
        btn.classList.remove('tabs__btn--active')
      })
  
      tabs.forEach(block => {
        block.classList.remove('tabs__section--active')
      })
  
      tar.classList.add('tabs__btn--active')
      const tabIndex = tar.dataset.forTab;
      tabs[tabIndex].classList.add('tabs__section--active')
    }
  
    if (tar.classList.contains('openStudent')) {
      let email = tar.dataset.email;
      get_and_display_search_result(email)
    }
  
    if (tar.classList.contains('accordion__button')) {
      tar.classList.toggle('accordion__button--active')
    }
  
    if (tar.classList.contains('modal-trigger')) {
      let type = tar.dataset.forModal;
      let student = tar.dataset.id;
      handle_student_to_modal(type, student)

    }
    
    if (tar.classList.contains('modal__close')) {
      Modal.hide()
    }

    if (tar.classList.contains('print-student')) {
      let type = tar.dataset.printType
      print_student(type)
    }
  })

  document.getElementById('search-student').addEventListener('input', (ev) => {
    search_students(ev.target.value)
  })
})



function handle_load_statistics(data) {
  let user_email = getUserEmail();
  if (data.length === 0) {
    Onload.noData(user_email);
    return;
  }

  if (data === 'noCredentials') {
    Onload.noCredentials(user_email)      
      return;
  }
  
  if (!data.exists) {
    Onload.noData(user_email);
    return;
  }
 
  data = data.data();
  populate_statistics(data)
  sessionStorage.setItem('students', JSON.stringify(data.student_array))

  Onload.signedIn()
}



// körs onload
function populate_statistics(data) {
  // Teacher statistics
  let asmt_total = document.getElementById('asmts_total')
  let asmt_reported = document.getElementById('asmts_reported')
  let asmt_unreported = document.getElementById('asmts_unreported')
  let asmt_status_T = document.getElementById('asmts_T')
  let asmt_status_IT = document.getElementById('asmts_IT')
  let asmt_status_UB = document.getElementById('asmts_UB')

  let data_reported = Number(data.sum.T) + Number(data.sum.IT) + Number(data.sum.UB);
  let data_reported_pct = Number(data_reported) / Number(data.sum.total) * 100;
  let data_unreported_pct = (Number(data.sum.unreported.sum) / Number(data.sum.total) * 100).toFixed(1)
  data_reported_pct = data_reported_pct.toFixed(1) // 1 decimal
  asmt_total.textContent = `${data.sum.total} (100%)`;
  asmt_reported.textContent = `${data_reported} (${data_reported_pct}%)`

  let T_PCT = (Number(data.sum.T) / Number(data_reported) * 100).toFixed(1)
  let IT_PCT = (Number(data.sum.IT) / Number(data_reported) * 100).toFixed(1)
  let UB_PCT = (Number(data.sum.UB) / Number(data_reported) * 100).toFixed(1)
  asmt_status_T.textContent = `${data.sum.T} (${T_PCT}%)`;
  asmt_status_IT.textContent = `${data.sum.IT} (${IT_PCT}%)`;
  asmt_status_UB.textContent = `${data.sum.UB} (${UB_PCT}%)`;
  asmt_unreported.textContent = `${data.sum.unreported.sum} (${data_unreported_pct}%)`
  
  // Eftersom datan är osorterad (endast keys i ett object) så måste den först omvvandlas till array
  // därefter sorteras i descending order (email är 0, nummer är 1)
  const teachers_by_n = () => {
    return Object.entries(data.sum.unreported.teachers)
    .sort(function(a, b){return b[1] - a[1]}); // descending
  }

  // Skapa "Orapporterad" raderna
  let tbody = document.getElementById('tbody')
  for (let teacher of teachers_by_n()) {
    const email = teacher[0];
    const amount = teacher[1]

    let tr = document.createElement('tr');
    tr.classList.add('tr', 'tr--alternativeRows')

    let td_name = document.createElement('td');
    td_name.classList.add('td', 'td--overFlowEllipsis')
    td_name.textContent = email;
    let td_number = document.createElement('td');
    td_number.classList.add('td')
    td_number.textContent = amount;

    tr.appendChild(td_name)
    tr.appendChild(td_number)
    tbody.appendChild(tr)

  }

  // Student statistics
  let stuStat_container = document.getElementById('student_statistics');
  
  for (let c of data.classes) {
    // Clone row
    let row = document.querySelector('#clone .classRow').cloneNode(true);
    row.querySelector('.classRow__col--header').textContent = c.class;

    let class_tot = Number(c.sum.T) + Number(c.sum.IT) + Number(c.sum.UB);
    
    // inga satta omdömen
    let class_T_pct;
    let class_IT_pct;
    let class_UB_pct;
    
    if (class_tot === 0) {
      class_T_pct = 'N/A';
      class_IT_pct = 'N/A';
      class_UB_pct = 'N/A';
    } else {
      class_T_pct = ( Number(c.sum.T) / class_tot * 100).toFixed(1);
      class_IT_pct = ( Number(c.sum.IT) / class_tot * 100).toFixed(1);
      class_UB_pct = ( Number(c.sum.UB) / class_tot * 100).toFixed(1);

      if (class_T_pct > 85) { 
        row.querySelector('.accordion__button').style.backgroundColor = '#013220';
        } else if (class_T_pct > 50 && class_T_pct < 65) {
          row.querySelector('.accordion__button').style.backgroundColor = '#F6BE00';
        } else if (class_T_pct <= 50) { 
          row.querySelector('.accordion__button').style.backgroundColor ='#8b0000'
      }

      class_T_pct += '%'
      class_IT_pct += '%'
      class_UB_pct += '%'
    }

    row.querySelector('.classRow__col-T').textContent = `${c.sum.T} (${class_T_pct})`
    row.querySelector('.classRow__col-IT').textContent = `${c.sum.IT} (${class_IT_pct})`
    row.querySelector('.classRow__col-UB').textContent = `${c.sum.UB} (${class_UB_pct})`
    stuStat_container.appendChild(row)
    for (let s of c.students) {
      let student_row = document.createElement('div');
      student_row.classList.add('classRow__studentRow', 'modal-trigger');
      student_row.dataset.id = s.email;
      student_row.dataset.forModal = 'openStudent';

    
      // Sammanställning
      var tot = Number(s.a.T) + Number(s.a.IT) + Number(s.a.UB);
      
      let header = document.createElement('p');
      header.classList.add('classRow__col--header');
      header.textContent = s.name;
      student_row.appendChild(header);

      let col_T = document.createElement('div');
      col_T.classList.add('classRow__col');
      student_row.appendChild(col_T)

      let T_pct;
      let IT_pct;
      let UB_pct;
      // Inga omdömen är satta och procent kan alltså inte räknas
      if (tot === 0) {
        T_pct = 'N/A'
        IT_pct = 'N/A'
        UB_pct = 'N/A'

      } else { // Omdömen finns och procent kan räknas
        T_pct = ( Number(s.a.T) / tot * 100).toFixed(1);
        IT_pct = ( Number(s.a.IT) / tot * 100).toFixed(1);
        UB_pct = ( Number(s.a.UB) / tot  * 100).toFixed(1);

      if (T_pct > 85) { 
        col_T.classList.add('option-T');
        } else if (T_pct > 50 && T_pct < 65) {
          col_T.classList.add('option-UB');
        } else if (T_pct <= 50) { 
          col_T.classList.add('option-IT'); 
      } 
      T_pct += '%'
      IT_pct += '%'
      UB_pct += '%'
      }

      let col_IT = document.createElement('div');
      col_IT.classList.add('classRow__col');
      student_row.appendChild(col_IT)
      let col_UB = document.createElement('div');
      col_UB.classList.add('classRow__col');
      student_row.appendChild(col_UB)

      col_T.textContent = `${s.a.T} (${T_pct})`
      col_UB.textContent = `${s.a.UB} (${UB_pct})`
      col_IT.textContent = `${s.a.IT} (${IT_pct})`

      row.querySelector('.accordion__content').appendChild(student_row)
    }
  }
}


async function search_students(search_text) {
  const matchList = document.getElementById('matchList');

  // get data from sessionStorage
  let data;
  try {
    data = await JSON.parse(sessionStorage.getItem('students'))
  } catch (e) {
    console.log(e)
  }

  // if sessionStorage was found, and data was successfully parsed...
  if (typeof data == 'object') {

    // Get matches to current text input
    let matches = data.filter(student => {
      const regex = new RegExp(`^${search_text}`, 'gi'); // ^ = starts with, 'gi' global & case INsensitive
      return student.name.match(regex) || student.class.match(regex) || student.email.match(regex)
    });

    // if no text, clear the matches
    if (search_text.length === 0) {
      matches = [];
      matchList.innerHTML = '';
    }

    outputHtml(matches)

  }
}

// show searchresults in HTML
function outputHtml(matches) {
  const matchList = document.getElementById('matchList');
  if (matches.length > 0) {

    // array of html strings
    const html = matches.map(match => `
    <div class="card card__body openStudent" data-email="${match.email}">
      <h5>${match.name} <span class="card__text--alternative">(${match.class})</span></h5>
    </div>
    `).join(''); // puts all the arrays together

    matchList.innerHTML = html;
  }
}

function get_and_display_search_result(email) {
  loader_start()

  // clear the tbody
  let tbody = document.querySelector('.sGrid__body')
  while (tbody.firstChild) { tbody.removeChild(tbody.firstChild) }

  // Clear reflection forms
  let forms = document.querySelectorAll('.report__formToDiv');
  for (let form of forms) {
    form.innerHTML = ''
  }

  let output = document.querySelector('.search__result');
  output.classList.remove('hidden');

  // clear searchbox
  document.getElementById('search-student').value = ''

  // clear matchlist
  const matchList = document.getElementById('matchList');
  matchList.innerHTML = ''

  const sectionToAppendTo = document.querySelector('#search') // viktigt att göra för att jag vill använda samma funktion senare med annan sektion
  DB.collection('status-report').doc(CURRENT_TERM).collection('students').doc(email).collection('courses').get().then( (querySnapshot) => {
    querySnapshot.forEach( (doc) => {
      if (doc.exists) {
        tbody.appendChild(add_course_row(doc.data(), sectionToAppendTo))
      }
      
    })
    
  }).catch(e => {
    console.error(e)
    output.innerHTML = 
    `<h2>ERROR</h2> <p>Problem uppstod vid hämtning av data för elev ${email}</p>
    <p>Ladda om sidan och försök igen. Kvarstår problemet så var vänlig kontakta Viktor Tysk</p>`
    loader_finish()
  }).then( () => {
    loader_finish()
  })

}


// Lägg till kursrad
function add_course_row(data, sectionToAppendTo) {
  let section = sectionToAppendTo;
  let el_name = section.querySelectorAll('.report__studentName') // 2 places, 1 for each page
  let el_coach = section.querySelector('.report__studentCoach')
  let el_class = section.querySelectorAll('.report__studentClass') // 2 places, 1 for each page
  let el_term = section.querySelector('.report__term');

  el_term.textContent = CURRENT_TERM;
  el_name.forEach(x => x.textContent = data.name)
  el_coach.textContent = data.coach_name;
  el_class.forEach(x => x.textContent = data.class)

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

  if ('reflections' in data) {
    let i = 0;
    let len = data.reflections.length;
    for (i; i < len; i++) {
      let div = document.querySelector(`.report__formToDiv[data-form-index="${i}"]`)
      div.textContent = data.reflections[i]
    }
  }
  return tr
}

function print_student(type) {
  let divContents;
  if (type === 'search') {
    divContents = document.querySelector('#search .report').innerHTML;
  } else if (type === 'modal') {
    divContents = document.querySelector('.modal .report').innerHTML;
  }

  let printWindow = window.open('', '', 'height=600,width=1000');
  printWindow.document.write('<html><head><title>UTSKRIFT - Lägesrapport</title>');
  printWindow.document.write('\
  <style>\
    * { margin: 0px; padding: 0px; box-sizing: border-box; font-family: sans-serif; font-size: 16px}\
    @media print{ * {-webkit-print-color-adjust:exact;} } \
    @page {  size: a4 portrait; margin : 50px;} \
    .signatur { page-break-after: always; page-break-inside: avoid; } \
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



/*
███    ███  ██████  ██████   █████  ██      
████  ████ ██    ██ ██   ██ ██   ██ ██      
██ ████ ██ ██    ██ ██   ██ ███████ ██      
██  ██  ██ ██    ██ ██   ██ ██   ██ ██      
██      ██  ██████  ██████  ██   ██ ███████ 
                                            
                                            
*/

// Modal - Öppna och stäng
const Modal = {
  async show(type) {
    let modal = document.querySelector(`[data-modal="${type}"]`)
    modal.classList.add('modal--active')
  },
  hide() {
    let active_modal = document.querySelector('.modal--active');
    if (active_modal) {
      active_modal.classList.remove('modal--active')
    }
  }
}


// Körs när man trycker på en elev i accordion-listan
function handle_student_to_modal(type, studentID) {
  let modal = document.querySelector(`[data-modal="${type}"]`)
  let title = modal.querySelector('.modal__title');
  



  // Återställ elementen;
  let tbody = modal.querySelector('.sGrid__body')
  while (tbody.firstChild) { tbody.removeChild(tbody.firstChild) }

  // Hämta fullständig elevdata från DB
  let docRef = DB__STUDENTS.doc(studentID).collection('courses').get();
  docRef.then( (querySnapshot) => {
    querySnapshot.forEach( (doc) => {
      if (doc.exists) {
        tbody.appendChild(add_course_row(doc.data(), modal))
      }
    })
  }).catch(e => {
    console.error(e)
    loader_finish()
  }).then( () => {
    loader_finish()
  })

  // Populera modal

  // Skriv ut knapp?

  
  Modal.show(type) // Visa modal
}