function handle_load_admin(data) {
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
    document.querySelector('#no-data .user-email').textContent = getUserEmail();
    Onload.noData();
    return;
  }
 
  data = data.data();
  populate_statistics(data)
  localStorage.setItem('students', JSON.stringify(data.student_array))

  Onload.signedIn()
}



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
  console.log(data.classes)
  let stuStat_container = document.getElementById('student_statistics');
  
  for (let c of data.classes) {
    // Clone row
    let row = document.querySelector('#clone .classRow').cloneNode(true);
    row.querySelector('.classRow__col--header').textContent = c.class;
    row.querySelector('.classRow__col-T').textContent = `${c.sum.T}`
    row.querySelector('.classRow__col-IT').textContent = `${c.sum.IT}`
    row.querySelector('.classRow__col-UB').textContent = `${c.sum.UB}`
    stuStat_container.appendChild(row)
    for (let s of c.students) {
      let student_row = document.createElement('div');
      student_row.classList.add('classRow__studentRow');

      row.querySelector('.accordion__content').appendChild(student_row)
      
    }

  }
}

document.getElementById('search-student').addEventListener('input', (ev) => {
  search_students(ev.target.value)
})

async function search_students(search_text) {
  const matchList = document.getElementById('matchList');

  // get data from localstorage
  let data;
  try {
    data = await JSON.parse(localStorage.getItem('students'))
  } catch (e) {
    console.log(e)
  }

  // if localstorage was found, and data was successfully parsed...
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
  let output = document.querySelector('.search__result');
  output.classList.remove('hidden');

  // clear searchbox
  document.getElementById('search-student').value = ''

  // clear matchlist
  const matchList = document.getElementById('matchList');
  matchList.innerHTML = ''

  DB.collection('status-report').doc(CURRENT_TERM).collection('students').doc(email).collection('courses').get().then( (querySnapshot) => {
    querySnapshot.forEach( (doc) => {
      if (doc.exists) {
        add_course_row(doc.data())
      }
      
    })
    
  }).catch(e => {
    console.error(e)
    output.innerHTML = 
    `<h2>ERROR</h2> <p>Problem uppstod vid hämtning av data för elev ${email}</p>
    <p>Ladda om sidan och försök igen. Kvarstår problemet så var vänlig kontakta Viktor Tysk</p>`
    loading_finish()
  }).then( () => {
    document.querySelectorAll(`textarea`).forEach((TA) => {
        TA.style.height = 'auto';
        TA.style.height = TA.scrollHeight + 'px'
    })
    loader_finish()
  })

}


// Lägg till kursrad
function add_course_row(data) {
  let section = document.querySelector('.search__student')
  section.querySelector('.student__currentTerm').textContent = CURRENT_TERM;
  section.querySelector('.student__name').textContent = data.name;
  section.querySelector('.student__class').textContent = data.class;
  section.querySelector('.student__coach').textContent = data.coach_name;

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
  td_cmt.classList.add('td')

  let comment = document.createElement('textarea')
  comment.classList.add('sReport__textarea')
  comment.setAttribute('disabled', '')
  td_cmt.appendChild(comment)
  comment.textContent = data.comment;

  document.querySelector('.sReport__tbody').appendChild(tr)
}

async function handle_update_statistics() {
  console.log('INITIATING STATISTICS UPDATE')
  // Querya alla kurser
  let get_all_students = (() => {
    return new Promise((resolve, reject) => {
      const db = firebase.firestore();
      const query = db.collectionGroup('courses').where('course_id', '!=', '').get();
      resolve(query)
      // reject('Something is wroong')
    })
  })

  get_all_students().then((querySnapshot) => {
    // console.log(querySnapshot.exists)
    let a_total = 0;
    let a_T = 0;
    let a_IT = 0;
    let a_UB = 0;
    let a_empty = 0;
    let all_students = [];
    let classes = [];
    let active_class;
    let active_student;
    let a_empty_teachers = {};

      querySnapshot.forEach((doc) => {
      if (doc.exists) {
        let c = doc.data();
        
        if (active_student === c.email) {
          // Gör inget (loopen behöver tidigare värden)
        } else {
          // skapa ny kurs
          let active_class_index = classes.findIndex((i) => {return i.class === c.class});
          if (active_class_index === -1) {
            classes.push( {
              class : c.class,
              sum : {
                T : 0,
                IT : 0,
                UB : 0
              },
              students : [
              ]
            })
            active_class = classes[classes.length - 1]
          } else {
            active_class = classes[active_class_index];
          }

          let active_student_index = active_class.students.findIndex((i) => { return i.email === c.email })
          if (active_student_index === -1) {
            active_class.students.push({
              email : c.email,
              name : c.name,
              a : {
                T : 0,
                IT : 0,
                UB : 0
              }
            })
            active_student = active_class.students[active_class.students.length - 1];

            // LÄGG TILL I all_students också
            all_students.push({
              class: c.class,
              coach: c.coach_name,
              email : c.email,
              name : c.name
            })
          } else {
            active_student = active_class.students[active_student_index]
          }
        }

        // ASSESSMENTS
        a_total++ // Oavsett vad så är det en ny kurs så öka på antal omdömen
        switch (c.assessment) {
          case 'T':
            active_student.a.T++
            active_class.sum.T++
            a_T++
            break;

          case 'TEB':
            active_student.a.T++
            active_class.sum.T++
            a_T++
            break;

          case 'IT':
            active_student.a.IT++
            active_class.sum.IT++
            a_IT++
            break;

          case 'UB':
            active_student.a.UB++
            active_class.sum.UB++
            a_UB++
            break;

          default: // default blir '' eller att assessment inte är definerad
            a_empty++
            // Öka för aktuell lärare
            if (!([c.teacher_email] in a_empty_teachers)) {
              a_empty_teachers[c.teacher_email] = 0
            }
            a_empty_teachers[c.teacher_email]++
            break;
            
        }
      }
    })
    set_statistics({
      classes : classes,
      sum : {
        total: a_total,
        T : a_T,
        IT : a_IT,
        UB : a_UB,
        unreported : {
          sum : a_empty,
          teachers : a_empty_teachers
        }
      },
      student_array : all_students
    })
  })

}

// handle_update_statistics()

function set_statistics(data) {
  DB.collection('status-report').doc(CURRENT_TERM).collection('statistics').doc('general').set({
    classes : data.classes,
    sum : data.sum,
    student_array : data.student_array
  }, { merge: true }).catch( (e) => {
    console.log(' -==- ERROR caught while UPDATING statistics -==-')
    console.error(e)
  }).then( () => {
    console.log('Statistics updated successfully!')
  })
}

// Switch Tab
document.addEventListener('click', (ev) => {
  const tar = ev.target;

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

})