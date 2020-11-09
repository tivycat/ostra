const DB_ALL_TEACHERS = ''
const DB_ALL_STUDENTS = ''

function update_teachers() {
  // Full update and yeeees it works :)
  let db = firebase.firestore().collection("status-report").doc('HT20').collection('teachers');
  let data = JSON.parse(DB_ALL_TEACHERS)
  for (let t of data) {
    for (let key in t) {
      db.doc(t.email).set({
        [key]: t[key]
      }, { merge: true }).then(function () { console.log("Teacher successfully written!"); })
        .catch(function (error) { console.error("Error writing document: ", error); });
    }
  }
}

function add_teacher_roles() {
  let db = firebase.firestore().collection('users');
  let data = JSON.parse(DB_ALL_TEACHERS)
  for (let teacher of data) {
    if (teacher.email == 'viktor.tysk@edu.huddinge.se') {
      continue;
    }

    if (teacher.email !== "#N/A") {
      try {


        db.doc(teacher.email).set({
          role : 'isTeacher'
        }).then (()=> {
          console.log(teacher.email + 'lagt till: isTeacher')
        })

      } catch (e) {
        console.log('Misslyckat försök för ' + teacher.email)
      }


    }

  }
}
// add_teacher_roles()
// update_teachers()

// Lägg till elever till DB. Jepp, omständigt att skriva ut alla keys och values, men kan inte gärna loopa utan att göra 10000 skrivningar extra

function update_students() {
  let db = firebase.firestore().collection("status-report").doc('HT20').collection('students');
  let data = JSON.parse(DB_ALL_STUDENTS)
  let i = 0;
  for (let s of data) {
    let student_data = {
      class : s.class,
      coach_email : s.coach_email,
      coach_name : s.coach_name,
      name : s.name,
      pnr : s.pnr,
      email : s.email
    }

    console.log('Attempting ' + s.email)

    db.doc(s.email).set(student_data, {merge: true})
    .then( (a) => {
      console.log('Student added')
      console.log(a)
    })
    .catch( (e) => {
      console.log(` ======= > Student set FAIL < ===========`)
      console.log(` ============ ${s.email} ================`)
      console.error(e)
      console.log(` ========================================`)
    })
    for (let c of s.courses) {
      let complete_course = {
        class : s.class,
        coach_email : s.coach_email,
        coach_name : s.coach_name,
        name : s.name,
        pnr : s.pnr,
        email : s.email,
        course_id : c.course_id,
        course_title : c.course_title,
        teacher_name : c.teacher_name,
        teacher_email : c.teacher_email,
        attendance : {
          reported : false,
          not_reported: false,
          total: false
        }
      }
      i++
      if ('attendance' in c) {
        try {
          complete_course.attendance['reported'] = c.attendance.reported,
          complete_course.attendance['not_reported'] = c.attendance.not_reported,
          complete_course.attendance['total']  = c.attendance.total
        } catch(e) {
          console.log(`====> This comes from trying to add attendance to ${s.email} (${c.course_id}) <=====`)
          console.error(e)
          console.log(`====================================================================================`)
        }
      }
      db.doc(s.email).collection('courses').doc(c.course_id).set(complete_course, {merge: true})
      .then( () => {console.log(`==> ${c.course_id} added to ${s.email}`)})
      .catch ((e2) => {
        console.log(`=============> Error adding course to ${s.email} <================`)
        console.error(e2)
        console.log('==================================================================')
      })
    }
  }
}

function add_students_to_array() {
  DB.collection('status-report').doc('HT20').collection('students').get().then( (querySnapshot) => {
    querySnapshot.forEach( doc => {
      console.log(doc.id + ' => '+ doc.data())
      let student = doc.data();
      let doc_ref = DB.collection('status-report').doc('HT20');
      doc_ref.update({
        student_array :  firebase.firestore.FieldValue.arrayUnion({
          email : student.email,
          name : student.name,
          class: student.class,
          coach: student.coach_name
        })
      })
      .then( () => {
        console.log(`${student.email} added to array`)
      })
      .catch( error => {
        console.log (`ERROR writing ${student.email}`)
        console.error(error)
        console.log('===============================================')
      })

    })
  })
}

// add_students_to_array()

// update_students()
