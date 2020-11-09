// Körs från firebase.js onload. Datan innehåller metafiler så att vi kan köra teacher.exists!
async function handle_load_teacher(teacher) {
  const no_data = () => {
    document.querySelector('#no-data .user-email').textContent = getUserEmail();
    Onload.noData();
  }
  if (teacher == null) {
      // user lacks credentials
      no_data()
      return;
  }

  if (!teacher.exists) {
    // Data not found on this doc
    no_data()
    return;
  }

  let promises = [];
  let statistics = {
    comments: 0,
    assessments: 0,
    total: 0
  }

  teacher = teacher.data();
  // Töm containern där kurserna ska placeras ifall funktion körs på en session med tidigare inloggad
  document.querySelectorAll('.course').forEach(x => x.parentNode.removeChild(x))
  // Loopa igenom alla existerande kurser
  for (let c of teacher.courses) {
    create_course_section(c) // Skapa kurser

    // Querya alla elever som har kursidn och sortera efter efternamn
    let get_students = ((course_id) => {
      return new Promise((resolve) => {
        const db = firebase.firestore();
        const query = db.collectionGroup('courses').where('course_id', '==', course_id).orderBy('name').get()
        resolve(query)
      })
    })
    promises.push(get_students(c.course_id))
  }
  Promise.all(promises).then((all_courses) => {
    for (let course of all_courses) {
      course.forEach( (student) => {
        let data = student.data()
        create_student_row(data)
        statistics.total++
        // denna statistik är för statistiken i navReport
        if ('assessment' in data) {
          if (data.assessment.length > 0) {
            statistics.assessments++
          }
        }
        if ('comment' in data) {
          if (data.comment.length > 0) {
            statistics.comments++
          }
        }
      })
    }
  }).then(() => {
    // Efter allt om och men så är vi äntligen redo att visa statistik :o)
    populate_teacher_statistics(statistics)
    document.querySelector('.report_greetTeacher').classList.remove('hidden')
    Onload.signedIn();
  })
}

function create_course_section(course) {
  // Skapa ny option till select
  let select_course = document.getElementById('reportNav__selectCourse');
  let new_option = document.createElement('option');
  new_option.textContent = course.course_id;
  select_course.appendChild(new_option)

  // Skapa ny section för kurs
  let section = document.createElement('section');
  let main = document.querySelector('#data')
  section.classList.add('course', 'hidden')
  section.id = course.course_id;
  main.appendChild(section)
  return section
}

function create_student_row(data) {
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
  if ('attendance' in data) {
    if (data.attendance.total === false) {
      data.attendance.total = 'X'
      data.attendance.not_reported = 'X'
    }
    row.querySelector('.attendance-total').textContent = data.attendance.total
    row.querySelector('.attendance-unreported').textContent = data.attendance.not_reported
  }

  // Kommentar
  if ('comment' in data) {
    let textarea = row.querySelector('.textarea-comment')
    textarea.value = data.comment;
  }
}

function populate_teacher_statistics(statistics) {
  document.querySelectorAll('.reportNav__totalStudents').forEach(x => x.textContent = statistics.total)
  document.querySelector('.reportNav__asmtsReported').textContent = statistics.assessments;
  document.querySelector('.reportNav__commentsReported').textContent = statistics.comments;
  let asmt_pct = Number(statistics.assessments) / Number(statistics.total) * 100
  let cmt_pct = Number(statistics.comments) / Number(statistics.total) * 100
  asmt_pct = asmt_pct.toFixed(1) // 1 decimal
  cmt_pct = cmt_pct.toFixed(1)
  document.querySelector('.reportNav__asmtsReportedPCT').textContent = asmt_pct;
  document.getElementById('asmt_progressBar').style.width = asmt_pct + '%'
  document.querySelector('.reportNav__commentsReportedPCT').textContent = cmt_pct;
  document.getElementById('cmt_progressBar').style.width = cmt_pct + '%'

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

function save_changes_to_firebase(student) {
  return new Promise((resolve, reject) => {
    let docRef = firebase.firestore().collection("status-report").doc(CURRENT_TERM).collection('students').doc(student.email).collection('courses').doc(student.course);
    docRef.update({
      assessment: student.assessment,
      comment: student.comment
    }).then(() => {
      resolve(student.email)
    })
  })
}

document.getElementById('reportNav__selectCourse').addEventListener('change', (event) => {
  // Select in the teacher <main> header
  const all_sections = document.querySelectorAll('#data section');
  for (let s of all_sections) {
    if (s.id === event.target.value) {
      s.classList.remove('hidden')

      // Körs här för att textareas måste resizas efter load och det här verkar seriöst
      // som första tillfället när scrollHeight inte returnar 0. Weird men okej.. 
      document.querySelectorAll(`#${s.id} .textarea-comment`).forEach((TA) => {
        auto_grow(TA)
      })
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