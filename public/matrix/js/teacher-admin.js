const myApp = {
  FB: {
    matris: firebase.firestore().collection("matrix"),
    matrices_active: firebase
      .firestore()
      .collection("matrix")
      .doc("mMatrices")
      .collection("mMatrices--active"),
    matrices_archive: firebase
      .firestore()
      .collection("matrix")
      .doc("mMatrices")
      .collection("mMatrices--archive"),
    activeCourses: firebase
      .firestore()
      .collection("matrix")
      .doc("mCourses")
      .collection("mCourses--active"),
    archiveCourses: firebase
      .firestore()
      .collection("matrix")
      .doc("mCourses")
      .collection("mCourses--archive"),
    activeStudents: firebase
      .firestore()
      .collection("matrix")
      .doc("mStudents")
      .collection("mStudents--active"),
  },
};
// -- !! LOAD !! --
/*
██      ██████   █████  ██████  
██     ██    ██ ██   ██ ██   ██ 
██     ██    ██ ███████ ██   ██ 
██     ██    ██ ██   ██ ██   ██ 
███████ ██████  ██   ██ ██████  
*/

// window.addEventListener("load", () => {
//   let pathname = window.location.pathname;
//   let final_path = pathname.split("/").pop();
//   let sections = document.querySelectorAll(".mainSection");
//   let mainSections_array = Array.from(sections, (s) => s.id.split("-").pop().toString().toLowerCase());
//   // hide_all_except_id(sections, "section-matrices");

//   console.log(final_path);
//   if (final_path === "teacher-admin.html") {
//     console.log("No load preferences");
//   } else if (mainSections_array.includes(final_path)) {
//     console.log("yo");
//     hide_all_except_id(sections, `section-${final_path}`);
//   }
// });

function firebase_loaded() {
  // Loader.start();
  const user = getUserEmail();
  if (user) {
    onload_getUserDataFromFB(user);
  } else {
    Toast.show("Du är inte inloggad", "error");
  }
}

async function onload_getUserDataFromFB(user) {
  let prms = [];
  prms.push(myApp.FB.activeCourses.where("teacher_email", "==", user).get());
  prms.push(myApp.FB.archiveCourses.where("teacher_email", "==", user).get());
  Promise.all(prms)
    .then((result) => {
      const promises = [];
      result.forEach((courseState) => {
        courseState.forEach(async (course) => {
          if (course.exists) {
            promises.push(handle_gather_students(course));
          }
        });
      });

      Promise.all(promises).then((results) => {
        SESSIONSTORAGE.set("courses", results);
        results.forEach((x) => onload_listUserCourse(x));
        Loader.finish();
      });
    })
    .catch((_) => {
      print_error_message("no_permissions");
      Loader.finish();
      throw new Error(
        "User does not have permission to do this (access courses)"
      );
    });

  // -- FUNCS
  async function handle_gather_students(courseEntry) {
    let course = courseEntry.data();
    course.course_uid = courseEntry.id;
    course.students = [];

    const db = firebase.firestore();
    const queryStudents = await db
      .collectionGroup("studentCourseList")
      .where("course_uid", "==", course.course_uid)
      .orderBy("name")
      .get()
      .catch(() => {
        print_error_message("no_permissions");
        Loader.finish();
        throw Error("error querying students (no permission)");
      });

    queryStudents.forEach((studentEntry) => {
      if (studentEntry.exists) {
        let student = studentEntry.data();
        course.students.push(student);
      }
    });
    return course;
  }
}

function onload_listUserCourse(course) {
  const section = document.getElementById("section-myCourses");
  let container;
  if (course.state === "active") {
    container = section.querySelector(".myCourses__active ul");
  } else if (course.state === "archive") {
    container = section.querySelector(".myCourses__archive ul");
  }
  let li = document.createElement("li");
  let btn = document.createElement("button");
  btn.classList.add("bg-transparent", "cursor-pointer", "hover:underline");
  btn.textContent = `${course.course_id}`;
  btn.dataset.courseUid = course.course_uid;
  li.appendChild(btn);
  container.appendChild(li);

  btn.addEventListener("click", async (evt) => {
    Loader.start();
    let btn_element = evt.target;
    let course_uid = btn_element.dataset.courseUid;
    let courses = await SESSIONSTORAGE.get("courses");
    let this_course = courses.find((x) => x.course_uid === course_uid);
    handle_edit_course(this_course);
    Loader.finish();
  });
}

// -- !! GOOGLE CLASSROOM !! --

/** Körs från backend.js och levererar kurser från Classroom.
 *  Funktionen initieras när användaren trycker på knappen i header
 */
async function listClassroomCourses(courses) {
  // -- DECLARATIONS
  let courseList = document.getElementById("classroom-courseList");
  clear_element(courseList);

  for (let course of courses) {
    let li = document.createElement("li");
    courseList.appendChild(li);

    let label = document.createElement("label");
    // label.classList.add("ml-2");

    let radio_btn = document.createElement("input");
    radio_btn.type = "radio";
    radio_btn.classList.add("classroom_courseList");
    radio_btn.dataset.classroomId = course.id;
    radio_btn.name = `classroom_courseList`;
    radio_btn.dataset.title = course.name;
    radio_btn.dataset.section = course.section;
    label.appendChild(radio_btn);

    let labeltxt = course.name;
    if (course.section) {
      labeltxt += ` (${course.section})`;
    }
    li.appendChild(label);

    let text_element = document.createElement("span");
    text_element.textContent = labeltxt;
    text_element.classList.add("ml-2");
    label.appendChild(text_element);
  }

  // -- EVENT LISTENERS

  Modal.show("classroom");
  Loader.finish();
}

function handle_save_classroom_course() {
  let courseList = document.getElementById("classroom-courseList");
  let selected_radio = courseList.querySelector(
    'input[name="classroom_courseList"]:checked'
  );
  if (selected_radio) {
    let classroom_id = selected_radio.dataset.classroomId;
    getStudentsFromClassroom(
      {
        course_title: selected_radio.dataset.title,
        course_id: selected_radio.dataset.section,
        students: [],
      },
      classroom_id
    );
  }
}

function getStudentsFromClassroom(course, classroom_id) {
  Loader.start();
  const options = { pageSize: 50 }; // Behöver detta här för att genomföra do while loopen
  queryStudents(options);

  function queryStudents(options) {
    gapi.client.classroom.courses.students
      .list({ courseId: classroom_id }, options)
      .then((response) => {
        const students = response.result.students;
        if (students && students.length > 0) {
          for (let student of students) {
            let fullName, cls;
            let email = student.profile.emailAddress;
            let nameStr = student.profile.name.fullName.split(" ");
            let last_item = nameStr[nameStr.length - 1];
            if (last_item.toString().toLowerCase() == "gymnasiet") {
              nameStr.splice(-2, 2); // Ta bort 2 sista orden (dvs Östra gymnasiet)
              cls = nameStr.pop(); // detta är elevens klass
              fullName = nameStr.join(" ");
            } else {
              cls = "N/A";
              fullName = student.profile.name.fullName;
            }
            course.students.push({ name: fullName, class: cls, email: email });
          }
        }
        if (response.result.nextPageToken) {
          // Om nextpagetoken finns är inte alla elever hämtade. Kör funktionen igen!
          options.pageToken = response.result.nextPageToken;
          queryStudents(options);
        } else {
          // om alla pagetokens är klara så är alla elever hämtade
          handle_edit_course(course);
          Modal.hide();
        }
      });
  }
}

// -- !! CREATE AND MANAGE COURSES !! --
async function handle_edit_course(course) {
  // -- Sopar banan för att visa kurs eller skapa ny, sen sätter den igång en relevant funktion baserat på om param course finns eller inte

  // Visa rätt element
  const sections = document.querySelectorAll(".mainSection");
  hide_all_except_id(sections, "section-editCourse");

  const section_element = document.getElementById("section-editCourse");
  const courseMatrix_select = document.getElementById(
    "editCourse-selectMatrix"
  );

  // Nollställ element
  sessionStorage.removeItem("this_course");
  section_element.querySelectorAll("[data-reset]").forEach((el) => {
    if (el.dataset.reset === "value") {
      el.value = "";
    }
    if (el.dataset.reset === "children") {
      clear_element(el);
    }
  });

  // Lägg till matriser i <select>
  let user = getUserEmail();
  let matrixQuery = await myApp.FB.matrices_active
    .where("owner", "==", user)
    .get();
  let matrixArray = await breakoutFirebaseArray(matrixQuery);
  let i = 0;

  if (matrixArray.length == 0) {
    let selectedMatrix_element = document.getElementById(
      "editCourse-selectedMatrix"
    );
    selectedMatrix_element.classList.add("bg-red-300");
    Toast.show(
      "Du har inte lagt till några matriser. Det måste du göra först",
      "error"
    );
    setTimeout(() => {
      let userMatrix_btn = document.getElementById("list-user-matrices");
      userMatrix_btn.click();
    }, 3000);
    selectedMatrix_element.innerHTML = "Inga matriser funna.. Du dirigeras om ";
  }
  for (let matrixDoc of matrixArray) {
    let mtx = matrixDoc.data();
    let container, input;
    container = document.createElement("div");
    container.classList.add("cSelect__option");

    let topRow = document.createElement("div");
    topRow.classList.add("flex");
    container.appendChild(topRow);

    let h4 = document.createElement("h4");
    h4.classList.add("col");
    h4.textContent = mtx.name;
    topRow.appendChild(h4);

    let owner = document.createElement("div");
    owner.classList.add(
      "col",
      "italic",
      "text-xs",
      "text-gray-700",
      "text-right"
    );
    owner.textContent = `Ägare: ${mtx.owner}`;
    topRow.appendChild(owner);

    let bottomRow = document.createElement("div");
    bottomRow.classList.add("overflow-ellipsis", "text-xs");
    bottomRow.textContent = mtx.description;
    container.appendChild(bottomRow);

    input = document.createElement("input");
    input.id = `cSelect-idx-${i}`;
    input.name = "matrices";
    input.type = "radio";
    input.dataset.matrixDetails = JSON.stringify(mtx);

    container.appendChild(input);
    courseMatrix_select.appendChild(container);
    i++;
  }

  if (course) {
    // Om course_uid finns så kommer kursen från firebase
    if ("course_uid" in course) {
      SESSIONSTORAGE.set("this_course", course);
    }
    edit_existing_course(course);
  } else {
    edit_new_course();
  }
  Loader.finish();
}

function edit_existing_course(course) {
  // -- DECLARATIONS
  const courseId_element = document.getElementById("editCourse-courseId");
  const courseMatrix_element = document.getElementById(
    "editCourse-selectedMatrix"
  );
  const studentList_element = document.getElementById("editCourse-studentList");
  const courseState_activeBtn = document.getElementById("courseState-active");
  const courseState_archiveBtn = document.getElementById("courseState-archive");

  // Namn
  courseId_element.value = course.course_id;
  // Matris
  if (course.matrix) {
    courseMatrix_element.innerHTML = course.matrix.name;
    courseMatrix_element.dataset.matrixDetails = JSON.stringify(course.matrix);
    // Dum idé att låta användaren byta matris efter att uppgifter kan ha skapats
    courseMatrix_element.disabled = true;
  }

  if (course.state === "archive") {
    courseState_archiveBtn.checked = true;
    const footer_element = document.getElementById("editCourse-footer");
    add_delete_btn(footer_element);
  }

  // Lägg till elever
  let sorted_student_array = sort_object(course.students, "name");
  for (let student of sorted_student_array) {
    let li = document.createElement("li");
    li.classList.add("mb-2");
    li.textContent = `${student.name} (${student.class})`;
    li.dataset.email = student.email;
    li.dataset.name = student.name;
    li.dataset.class = student.class;
    if (student.student_uid) {
      li.dataset.studentUid = student.student_uid;
    }
    li.dataset.courseUid = course.course_uid;

    let button = document.createElement("button");
    button.classList.add(
      "text-xs",
      "bg-red-500",
      "shadow-sm",
      "px-1",
      "py-1",
      "ml-2",
      "hover:shadow-md",
      "cursor-pointer",
      "hover:bg-red-700",
      "hover:text-white"
    );
    button.textContent = "Ta bort";
    button.addEventListener("click", async (evt) => {
      let li = evt.target.closest("li");
      const student_uid = li.dataset.studentUid;
      if (student_uid) {
        let confirm_delete = window.confirm(
          "Är du helt säker på att du vill ta bort denna elev från din kurs? All bedömning försvinner."
        );
        if (confirm_delete) {
          const course_uid = li.dataset.courseUid;
          console.log(
            `- - attempt removing course ${course_uid} from student ${student_uid}`
          );
          let studentRef = myApp.FB.activeStudents
            .doc(student_uid)
            .collection("studentCourseList")
            .doc(course_uid);

          await delete_asmts_in_docRef(studentRef);
          await delete_docRef(studentRef);

          let parentElement = li.parentElement;
          parentElement.removeChild(li);
        }
      } else {
        let parentElement = li.parentElement;
        parentElement.removeChild(li);
      }
    });
    li.appendChild(button);
    studentList_element.appendChild(li);
  }

  // -- FUNCTIONS
  function add_delete_btn(element) {
    let delete_course_btn = document.createElement("button");
    delete_course_btn.textContent = "Ta bort kurs";
    delete_course_btn.className =
      "bg-red-500 text-sm mr-auto rounded px-2 py-1 hover:bg-red-700 hover:text-white";

    delete_course_btn.addEventListener("click", () => {
      let confirm_delete = window.confirm(
        "Är du helt säker på att du vill ta bort denna kurs? All bedömning försvinner och det är oåterkalleligt."
      );
      if (confirm_delete) {
        const studentList_element = document.getElementById(
          "editCourse-studentList"
        );
        const students = gatherAllStudentsFromContainer(studentList_element);
        delete_course(course.course_uid, students);
      }
    });

    element.insertBefore(delete_course_btn, element.firstChild);
  }
}

function edit_new_course() {
  const courseState_activeBtn = document.getElementById("courseState-active");
  courseState_activeBtn.checked = true;
}

async function handle_save_course() {
  let earlier_entry = await SESSIONSTORAGE.get("this_course");
  console.log(earlier_entry);

  const courseId_element = document.getElementById("editCourse-courseId");
  const courseMatrix_container = document.getElementById(
    "editCourse-selectedMatrix"
  );
  const courseState_element = document.querySelector(
    'input[name="courseState"]:checked'
  );
  const students_wrapper = document.getElementById("editCourse-studentList");
  const chosen_matrix = courseMatrix_container.dataset.matrixDetails;

  if (courseId_element.value == "") {
    Toast.show("Du har inte angett ett kursid", "error");
    return;
  } else if (!chosen_matrix) {
    Toast.show("Du har inte valt en matris", "error");
    return;
  }

  let students = gatherAllStudentsFromContainer(students_wrapper);

  let course = {
    course_id: courseId_element.value,
    matrix: JSON.parse(chosen_matrix),
    state: courseState_element.dataset.state,
    teacher_email: getUserEmail(),
    teacher_name: getUserName(),
  };
  if (earlier_entry && "course_uid" in earlier_entry) {
    console.log("SAVING: Previously existing course");
    course.course_uid = earlier_entry.course_uid;
    sendToFirebase(course, students, earlier_entry);
  } else {
    console.log("SAVING: new course");
    sendToFirebase(course, students);
  }
}

function gatherAllStudentsFromContainer(container) {
  let students = container.children;
  let array = [];
  for (let i = 0; i < students.length; i++) {
    let x = students[i];
    let val = {
      email: x.dataset.email,
      name: x.dataset.name,
      class: x.dataset.class,
    };
    if (x.dataset.studentUid) {
      val.student_uid = x.dataset.studentUid;
    }

    array.push(val);
  }
  return array;
}

async function getAllStudentsFromDB() {
  Loader.start();
  let collectionRef = myApp.FB.activeStudents;
  let query = await collectionRef.get().catch((_) => {
    throw new Error("getAllStudentsFromDB failed. Why?");
  });
  let array = await breakoutFirebaseArray(query);

  let stds = [];
  for await (let studentDoc of array) {
    if (studentDoc.exists) {
      let student = studentDoc.data();
      stds.push(student);
    }
  }

  Loader.finish();
  Toast.show("Elevlista inhämtad", "success");
  LOCALSTORAGE.set("matrix_students_db", stds);
  return stds;
}

async function sendToFirebase(course, students, earlierVersionOfCourse) {
  console.log("Init: Uploading changes to FB", course);
  Loader.start();

  let today = new Date();
  course.lastUpdated = formatDate(today);

  if (earlierVersionOfCourse && "course_uid" in earlierVersionOfCourse) {
    // DVS kursen fanns tidigare
    console.log("- Course previously exists");

    if (course.state !== earlierVersionOfCourse.state) {
      // DVS kursens status har förändrats
      console.log(" - - Updating course state");
      console.log("Old state -->", earlierVersionOfCourse.state);
      console.log("New state -->", course.state);
      changeCourseState(course); // uppdaterar också
    } else {
      console.log(" - - Updating course (no state changes)");
      update_course(course);
    }
  } else {
    console.log(" - Adding new course");
    myApp.FB.activeCourses
      .add(course)
      .then(async (newCourse) => {
        course.course_uid = newCourse.id; // Lägg till uid för elevernas skull
        let promises = [];
        for (let student of students) {
          let copyCourse = copyCourseObject(course, student);
          if (student.student_uid) {
            // Dvs eleven finns i DB sedan innan
            console.log("- - Adding course to pre-existing student");
            promises.push(
              myApp.FB.activeStudents
                .doc(copyCourse.student_uid)
                .collection("studentCourseList")
                .doc(copyCourse.course_uid)
                .set(copyCourse)
                .catch((_) => {
                  throw new Error("setting course #1");
                })
            );
          } else {
            console.log(" - - Searching for student in db..");
            let queryForStudent = await myApp.FB.activeStudents
              .where("email", "==", student.email)
              .limit(1)
              .get()
              .catch((_) => {
                throw new Error("getting students");
              });
            let studentArray = await breakoutFirebaseArray(queryForStudent);
            if (studentArray.length > 0) {
              let studentDoc = studentArray[0].data(); // Returnerar en array, men finns bara ett item i den i alla fall
              console.log("- - - Found student in db --> ", studentDoc);
              copyCourse.student_uid = studentDoc.student_uid;
              promises.push(
                myApp.FB.activeStudents
                  .doc(copyCourse.student_uid)
                  .collection("studentCourseList")
                  .doc(copyCourse.course_uid)
                  .set(copyCourse)
                  .catch((_) => {
                    throw new Error("setting course #2");
                  })
              );
            } else {
              console.log("- - - Adding new user :", student.email);
              let newStudent = await myApp.FB.activeStudents.add(student);
              student.student_uid = newStudent.id;
              myApp.FB.activeStudents.doc(newStudent.id).set(student); // Skriver dokumentet igen med uid så att det är klart

              copyCourse.student_uid = newStudent.id;
              promises.push(
                myApp.FB.activeStudents
                  .doc(copyCourse.student_uid)
                  .collection("studentCourseList")
                  .doc(copyCourse.course_uid)
                  .set(copyCourse)
              );
            }
          }
        }

        Promise.all(promises)
          .then(() => {
            Toast.show("Kurs tillagd! Sidan laddas om...", "success");
            Loader.finish();
            reloadPage(2000);
          })
          .catch((e) =>
            console.error(
              "Error adding course to student (could also be to create new student)",
              e
            )
          );
      })
      .catch((err) => {
        print_error_message("no_permissions");
        Loader.finish();
        throw new Error(
          "User does not have permission to do this (adding new course)"
        );
      });
  }

  // -- FUNCTIONS
  async function changeCourseState(course) {
    // OBS. Ändrar inte längre course_uid

    let old_docRef, new_docRef, toastMessage;
    if (course.state === "archive") {
      old_docRef = myApp.FB.activeCourses.doc(course.course_uid);
      new_docRef = myApp.FB.archiveCourses.doc(course.course_uid);
      toastMessage = "Kurs arkiverad! Sidan laddas om ...";
    } else if (course.state === "active") {
      old_docRef = myApp.FB.archiveCourses.doc(course.course_uid);
      new_docRef = myApp.FB.activeCourses.doc(course.course_uid);
      toastMessage = "Kurs återaktiverad! Sidan laddas om ...";
    }

    // Set course
    new_docRef.set(course).catch((_) => {
      throw new Error("Error setting course");
    });
    // Copy assignments
    let courseAsmt_query = await old_docRef
      .collection("asmts")
      .get()
      .catch((_) => {
        throw new Error("Error querying asmts in old course");
      });
    let courseAsmt_array = await breakoutFirebaseArray(courseAsmt_query);
    if (courseAsmt_array && courseAsmt_array.length > 0) {
      for (let asmtDoc of courseAsmt_array) {
        if (asmtDoc.exists) {
          let asmt = asmtDoc.data();
          new_docRef
            .collection("asmts")
            .doc(asmtDoc.id)
            .set(asmt)
            .catch((_) => {
              throw new Error("Error setting asmt in new course");
            });
          asmtDoc.ref.delete().catch((_) => {
            throw new Error("Error deleting asmt in old course");
          });
        }
      }
    }

    // Delete course
    old_docRef.delete().catch((_) => {
      throw new Error("Error deleting old course");
    });

    for (let student of students) {
      let copyCourse = copyCourseObject(course, student);
      myApp.FB.activeStudents
        .doc(student.student_uid)
        .collection("studentCourseList")
        .doc(course.course_uid)
        .update(copyCourse)
        .catch((_) => {
          throw new Error("Error updating asmt in student");
        });
    }

    Loader.finish();
    console.log("- - - Course state successfuly updated");
    Toast.show(toastMessage, "success");
    reloadPage(2000);
  }

  function update_course(course) {
    let promises = [];
    let courseRef;
    if (course.state === "active") {
      courseRef = myApp.FB.activeCourses.doc(course.course_uid);
    } else if (course.state === "archive") {
      courseRef = myApp.FB.archiveCourses.doc(course.course_uid);
    }
    promises.push(courseRef.set(course));
    for (let student of students) {
      let copyCourse = copyCourseObject(course, student);
      let courseRefInStudent = myApp.FB.activeStudents
        .doc(student.student_uid)
        .collection("studentCourseList")
        .doc(course.course_uid);
      promises.push(courseRefInStudent.set(copyCourse));
    }

    Promise.all(promises).then(() => {
      Toast.show("Kurs uppdaterad! Sidan laddas om...", "success");
      Loader.finish();
      reloadPage(2000);
    });
  }
}

async function delete_course(course_uid, students) {
  const courseRef = myApp.FB.archiveCourses.doc(course_uid);
  // Delete course (börja med asmts, annars har man inte längre permission)
  await delete_asmts_in_docRef(courseRef);
  await delete_docRef(courseRef);

  // Delete students in course
  for (const s of students) {
    if (s.student_uid || course_uid) {
      let studentRef = myApp.FB.activeStudents
        .doc(s.student_uid)
        .collection("studentCourseList")
        .doc(course_uid);

      await delete_asmts_in_docRef(studentRef);
      await delete_docRef(studentRef);
    }
  }

  Toast.show("Kurs borttagen! Sidan laddas om ...", "success");
  // reloadPage(2000);
  Loader.finish();
}

function delete_docRef(docRef) {
  docRef.delete().catch((e) => {
    console.error(e);
    throw new Error("error deleting document");
  });
}

async function delete_asmts_in_docRef(docRef) {
  let asmts = await docRef
    .collection("asmts")
    .get()
    .catch((e) => {
      console.error(e);
      throw new Error("error getting asmts from doc");
    });

  asmts.forEach((asmtDoc) => {
    if (asmtDoc.exists) {
      asmtDoc.ref.delete();
    }
  });
}

// -- !! CREATE AND MANAGE MATRICES !! --
function add_new_grade_level(container, value) {
  let li = document.createElement("li");
  li.classList.add("flex", "space-x-1", "mt-2");
  let input = document.createElement("input");
  input.classList.add("w-10", "form-text");
  input.setAttribute("maxlength", "10");
  input.name = "gradelevels";
  input.dataset.input = "gradeLevel";
  input.type = "text";
  if (value) {
    input.value = value;
  }

  li.appendChild(input);

  let btn = document.createElement("button");
  btn.className =
    "text-sm bg-red-500 border-none shadow-sm h-4 ml-1 hover:shadow-md cursor-pointer hover:bg-red-700 hover:text-white";
  btn.textContent = "×";
  btn.dataset.delete = "gradeLevel";
  li.appendChild(btn);
  container.appendChild(li);

  // -- EVENT LISTENERS
  if (container.id === "editMatrix_gradeLevels") {
    let section = container.closest("section");
    let all_containers = section.querySelectorAll(
      '[data-container-for="gradeLevels"]'
    );
    if (all_containers.length > 0) {
      for (let c of all_containers) {
        // null eftersom inget value
        add_gradeLevel_to_gradeArea(null, c);
      }
    }
  }
}

function delete_this_grade_level(btn) {
  let parent = btn.parentElement;
  let grandparent = parent.parentElement;
  // ordna vkt idx det här är i listan på gradelevels
  let idx = Array.from(grandparent.children).indexOf(parent);

  // Sök efter andra instanser av denna grade-level (om edit)
  let sctn = btn.closest("section");
  if (sctn.id == "section-editMatrix") {
    let all_containers = sctn.querySelectorAll(
      '[data-container-for="gradeLevels"]'
    );
    for (let c of all_containers) {
      let corresponding_element = c.children[idx];
      if (corresponding_element) {
        corresponding_element.parentElement.removeChild(corresponding_element);
      }
    }
  }

  grandparent.removeChild(parent);
}

function assemble_new_matrix() {
  Loader.start();
  // Name
  const name_element = document.getElementById("newMatrix-name");
  let name = name_element.value;
  if (name.length == 0) {
    Toast.show("Du behöver ett namn för din matris", "error");
    Loader.finish();
    return;
  }

  // Description
  const description_element = document.getElementById("newMatrix-description");

  // Grade levels
  const grade_container = document.getElementById("newMatrix_gradeLevels");
  const grade_inputs = grade_container.querySelectorAll(
    '[data-input="gradeLevel"]'
  );
  let gradeLevels = [];
  for (let inp of grade_inputs) {
    if (inp.value.length > 0) {
      gradeLevels.push({ label: inp.value, text: null });
    }
  }
  // Resettar matris för att säkerställa att tidigare matris inte ligger där
  SESSIONSTORAGE.set("matrix", null);

  edit_matrix({
    name: name,
    description: description_element.value,
    gradeLevels: gradeLevels,
  });
}

async function edit_matrix(matrix) {
  const sections = document.querySelectorAll(".mainSection");
  hide_all_except_id(sections, "section-editMatrix");
  const name_element = document.getElementById("editMatrix-name");
  const description_element = document.getElementById("editMatrix-description");
  const gradeLevel_container = document.getElementById(
    "editMatrix_gradeLevels"
  );
  const gradeAreas_container = document.getElementById("editMatrix-gradeAreas");
  const preview_container = document.getElementById("editMatrix-preview");
  const addArea_btn = document.getElementById("editMatrix-addArea");

  // Empty previous entries
  name_element.value = "";
  description_element.value = "";
  await clear_element(gradeLevel_container);
  await clear_element(gradeAreas_container);
  await clear_element(preview_container);

  name_element.value = matrix.name;
  description_element.value = matrix.description;

  // Dvs datan kommer från en "lägg till ny"
  if ("gradeLevels" in matrix) {
    let i = 0;
    for (i; i < matrix.gradeLevels.length; i++) {
      add_new_grade_level(gradeLevel_container, matrix.gradeLevels[i].label); // container, value
    }

    // Lägg till en gradearea som starter
    add_gradearea(matrix.gradeLevels, gradeAreas_container);
  } else {
    // Dvs datan kommer från en tidigare existernade matrix
    await add_gradeLevels_from_previous(matrix.asmt_areas); // Lägg till gradelevels från första nyckeln
    for (let gradeArea of matrix.asmt_areas) {
      add_gradearea(
        gradeArea.criteria,
        gradeAreas_container,
        gradeArea.area_name
      );
    }
    // Lägg till "kopiera matris"
  }

  Loader.finish();

  addArea_btn.addEventListener("click", () => {
    // Behöver färska upp listan på gradelevels
    let all_gradeLevel_inputs = gradeLevel_container.querySelectorAll(
      '[data-input="gradeLevel"]'
    );
    let criteria_array = [];

    for (let i = 0; i < all_gradeLevel_inputs.length; i++) {
      let inp = all_gradeLevel_inputs[i];
      if (inp.value.length === 0) {
        Toast.show("Du har en bedömningsnivå utan benämning", "error");
        return;
      }
      criteria_array.push({ label: inp.value, text: "" });
    }
    add_gradearea(criteria_array, gradeAreas_container);
  });

  // -- FUNCTIONS
  function add_gradeLevels_from_previous(areas) {
    return new Promise((res) => {
      for (let area of areas) {
        for (let criteria of area.criteria) {
          add_new_grade_level(gradeLevel_container, criteria.label);
        }
        break; // behöver bara gradelevels som finns i varje key, så kan bryta ut efter första nyckeln
      }
      res();
    });
  }
}

function add_gradearea(criteria_array, container, area_name) {
  // Add grade-details
  let wrapper = document.createElement("div");
  wrapper.classList.add("gradeArea__wrapper");
  let corner_icon = document.createElement("span");
  corner_icon.classList.add("gradeArea__corner");
  corner_icon.textContent = "✋";
  corner_icon.title = "Dra för att ändra ordning på bedömningsområdena";
  corner_icon.setAttribute("ondragstart", "dragStart(event)");
  corner_icon.setAttribute("draggable", "true");
  wrapper.appendChild(corner_icon);

  let form_group = document.createElement("div");
  form_group.classList.add("mb-2");
  wrapper.appendChild(form_group);

  let areaTitle_lbl = document.createElement("label");
  areaTitle_lbl.classList.add("block", "py-2", "font-bold");
  form_group.appendChild(areaTitle_lbl);
  areaTitle_lbl.textContent = "Bedömningsområde";

  let areaTitle_inp = document.createElement("input");
  form_group.appendChild(areaTitle_inp);
  areaTitle_inp.className =
    "gradeArea-title w-full md:w-4/12 py-1 px-2 border-2 rounded focus:ring";
  if (area_name) {
    areaTitle_inp.value = area_name;
  }

  let list_element = document.createElement("div");
  list_element.dataset.containerFor = "gradeLevels";
  list_element.classList.add("flex", "flex-wrap");

  let list_header = document.createElement("div");
  list_header.textContent = "Bedömningskriterier";
  list_header.classList.add("my-2", "font-bold");
  wrapper.appendChild(list_header);
  wrapper.appendChild(list_element);

  const previewContainer = document.getElementById("editMatrix-preview");
  let preview_element = add_gradearea_to_preview(criteria_array);

  for (let criteria of criteria_array) {
    add_gradeLevel_to_gradeArea(criteria, list_element);
    add_gradeLevel_to_preview(criteria, preview_element);
  }

  let remove_btn = document.createElement("button");
  remove_btn.className =
    "gradeArea-delete px-2 py-2 rounded bg-red-300 hover:bg-red-500 text-sm mt-2";
  remove_btn.textContent = "Ta bort område";
  wrapper.appendChild(remove_btn);
  container.appendChild(wrapper);
  remove_btn.addEventListener("click", (evt) => {
    let el = evt.target.parentElement;
    el.parentElement.removeChild(el);
    const cur = evt.target.closest(".gradeArea__wrapper");
    const previewContainer = document.getElementById("editMatrix-preview");
    const sister = previewContainer.children[cur.dataset.currentOrder];
    previewContainer.removeChild(sister);
    reSyncPreview();
  });

  reSyncPreview();

  // Ordna så att alla textareas resizas ordentligt
  const all_textareas = document
    .getElementById("section-editMatrix")
    .querySelectorAll("textarea");
  all_textareas.forEach((TA) => {
    auto_grow(TA);
  });
}

function add_gradeLevel_to_gradeArea(value, container) {
  let li = document.createElement("li");
  li.classList.add(
    "w-full",
    "md:w-auto",
    "md:flex-grow",
    "flex",
    "mb-1",
    "mr-1"
  );
  let label = document.createElement("label");
  label.classList.add("w-2/12", "text-center", "adjustableLabel");
  label.style.overflowWrap = "anywhere";
  let criteria_textarea = document.createElement("textarea");
  criteria_textarea.dataset.criteria = "input";
  criteria_textarea.className = "form-text flex-grow whitespace-pre-wrap";
  criteria_textarea.addEventListener("input", (evt) => auto_grow(evt.target));
  if (value) {
    label.textContent = value.label;
    criteria_textarea.value = translate_text_to_markup(value.text);
  }
  li.appendChild(label);
  li.appendChild(criteria_textarea);
  container.appendChild(li);

  function translate_text_to_markup(text) {
    let frag = document.createElement("div");
    frag.innerHTML = text;
    let formated_text = "";
    for (let i = 0; i < frag.childNodes.length; i++) {
      let el = frag.childNodes[i];
      console.log(el);
      if (el.tagName === "P" && i !== 0) {
        formated_text += "\n\n";
      }
      for (let node of el.childNodes) {
        if (node.tagName === "STRONG") {
          formated_text += `**${node.textContent}**`;
        } else {
          formated_text += node.textContent;
        }
      }
    }
    return formated_text.trim();
    // text.replace(/</, "", />/g, "");
    // text = "<p>" + text.replace(/\n\n/g, "</p><p>") + "</p>";
    // text = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>"); // dollar är tydligen #1 capture group. Huh.
    // return text
  }
}

function add_gradearea_to_preview() {
  const container = document.getElementById("editMatrix-preview");
  const wrapper = document.createElement("div");
  wrapper.className = "gradeArea";
  container.appendChild(wrapper);

  let header = document.createElement("header");
  header.className = "gradeArea-title bg-gray-200 py-1 px-2 text-xl";
  wrapper.appendChild(header);

  let gradeLevels_wrapper = document.createElement("div");
  gradeLevels_wrapper.classList.add("gradeLevels", "flex", "flex-wrap");
  gradeLevels_wrapper.dataset.containerFor = "gradeLevels";
  wrapper.appendChild(gradeLevels_wrapper);
  return gradeLevels_wrapper;
}

function add_gradeLevel_to_preview(criteria, container) {
  const gradelvl_wrapper = document.createElement("div");
  gradelvl_wrapper.className = "gradeLevel w-full md:w-3/12 md:flex-grow";
  gradelvl_wrapper.dataset.gradelvl = criteria.label;
  container.appendChild(gradelvl_wrapper);
  let gradelvl_label = document.createElement("div");
  gradelvl_label.className = "gradeLevel__label adjustableLabel";

  gradelvl_label.textContent = criteria.label;
  gradelvl_wrapper.appendChild(gradelvl_label);
  let gradelvl_criteria = document.createElement("div");
  gradelvl_criteria.dataset.criteria = "output";
  gradelvl_criteria.className = "gradeLevel__criteria";
  gradelvl_criteria.innerHTML = criteria.text;
  gradelvl_wrapper.appendChild(gradelvl_criteria);
}

function input_HMTLd_text(text) {
  if (text.length > 0) {
    text = text.replace(/</g, "", />/g, "");
    text = "<p>" + text.replace(/\n\n/g, "</p><p>") + "</p>";
    text = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>"); // dollar är tydligen #1 capture group. Huh.
    text = text.replace(/<p>\s*<\/p>/g, "");
  }
  console.log(text);
  return text;
}

function reSyncPreview() {
  const section_element = document.getElementById("section-editMatrix");
  const areaContainer = document.getElementById("editMatrix-gradeAreas");
  const previewContainer = document.getElementById("editMatrix-preview");
  const master_gradelevel_container = document.getElementById(
    "editMatrix_gradeLevels"
  );

  for (let i = 0; i < master_gradelevel_container.children.length; i++) {
    let gradelevel = master_gradelevel_container.children[i];
    let input = gradelevel.querySelector("input");

    input.addEventListener("change", (evt) => {
      let lvl_containers = section_element.querySelectorAll(
        "[data-container-for='gradeLevels']"
      );
      for (let c of lvl_containers) {
        c.children[i].querySelector(".adjustableLabel").textContent =
          input.value;
      }
    });
  }

  for (let i = 0; i < areaContainer.children.length; i++) {
    let cur = areaContainer.children[i];
    let cur_sister = previewContainer.children[i];
    cur.dataset.currentOrder = i;
    cur_sister.dataset.currentOrder = i;

    // Title
    let title = cur.querySelector(".gradeArea-title");
    let title_sister = cur_sister.querySelector(".gradeArea-title");

    title.removeEventListener("input", copyTitleOnInput);
    title_sister.textContent = title.value;
    title.addEventListener("input", copyTitleOnInput);

    //Sync criterias
    let cur_gradeLevels = cur.querySelectorAll("textarea");
    let sister_gradeLevels = cur_sister.querySelectorAll(
      ".gradeLevel__criteria"
    );

    for (let j = 0; j < cur_gradeLevels.length; j++) {
      const TA = cur_gradeLevels[j];
      let TA_sister = sister_gradeLevels[j];
      TA.dataset.levelOrder = j;
      TA_sister.dataset.levelOrder = j;

      TA_sister.innerHTML = input_HMTLd_text(TA.value);
      TA.removeEventListener("input", copyHTMLOnInput);
      TA.addEventListener("input", copyHTMLOnInput);
    }
  }

  // Synka kriter
  function copyTitleOnInput(evt) {
    const cur = evt.target.closest(".gradeArea__wrapper");
    const previewContainer = document.getElementById("editMatrix-preview");
    const sister = previewContainer.children[cur.dataset.currentOrder];
    let sister_title = sister.querySelector(".gradeArea-title");

    sister_title.textContent = evt.target.value;
  }

  function copyHTMLOnInput(evt) {
    const cur = evt.target.closest(".gradeArea__wrapper");
    const previewContainer = document.getElementById("editMatrix-preview");
    const sister = previewContainer.children[cur.dataset.currentOrder];
    let sister_gradelevel = sister.querySelector(
      `[data-level-order="${evt.target.dataset.levelOrder}"]`
    );
    sister_gradelevel.innerHTML = input_HMTLd_text(evt.target.value);
  }
}

async function save_matrix() {
  Loader.start();
  // DECLARATIONS
  const name_element = document.getElementById("editMatrix-name");
  const description_element = document.getElementById("editMatrix-description");
  const gradeArea_container = document.getElementById("editMatrix-gradeAreas");
  const existsEarlier = await SESSIONSTORAGE.get("matrix");

  let save_object = {
    name: name_element.value,
    description: description_element.value,
    asmt_areas: [],
    owner: getUserEmail(),
  };

  if (existsEarlier) {
    save_object.matrix_uid = existsEarlier.matrix_uid;
  }

  for (let area_element of gradeArea_container.children) {
    // Namn
    let title_element = area_element.querySelector(".gradeArea-title");
    let area_name = title_element.value;
    if (title_element.value == "") {
      Toast.show("Du saknar titel på ett bedömningsområde", "error");
      Loader.finish();
      return;
    }

    let this_area = {
      area_name: area_name,
      criteria: [],
    };

    // Kriterier
    let criteria_container = area_element.querySelector(
      "[data-container-for='gradeLevels']"
    );
    for (let i = 0; i < criteria_container.children.length; i++) {
      let criteria = criteria_container.children[i];
      let label = criteria.querySelector("label").textContent;
      let text_element = criteria.querySelector("textarea");
      let text = input_HMTLd_text(text_element.value);

      if (label.length == 0) {
        Toast.show("Du har en bedömningsnivå utan namn", "error");
        Loader.finish();
        return;
      }

      if (text.length == 0) {
        text_element.classList.add("bg-red-300");
        Toast.show("Du har ett kriterie utan information i", "error");
        Loader.finish();
        return;
      }
      this_area.criteria.push({ label: label, text: text });
    }
    save_object.asmt_areas.push(this_area);
  }

  if (Object.keys(save_object.asmt_areas).length === 0) {
    Toast.show(
      "Du har inga bedömningsområden? Så kan vi ju inte ha det!",
      "error"
    );
    Loader.finish();
    return;
  }

  // Om UID finns så uppdatera UID
  let docRef;
  if (save_object.matrix_uid) {
    console.log("matrix_uid exists earlier");
    docRef = myApp.FB.matrices_active.doc(save_object.matrix_uid);
  } else {
    console.log("matrix_uid does not exist, creating new..");
    // Om inte UID finns så skapas nytt dokument, sen uppdateras det med IDt
    let { id } = await myApp.FB.matrices_active
      .add(save_object)
      .catch((err) => {
        console.log("error creating matrix --> ", err);
        print_error_message("no_permissions");
        Loader.finish();
      });
    save_object.matrix_uid = id;
    docRef = myApp.FB.matrices_active.doc(id);
  }

  docRef
    .update(save_object)
    .then((_) => {
      Toast.show("Matris sparad! Sidan laddas om ...", "success");
      reloadPage(2000);
      Loader.finish();
    })
    .catch((err) => console.error("Fel vid uppdatering av id --> ", err));
}

async function delete_matrix() {
  let isSure = confirm(
    "Är du säker på att du vill ta bort matris? Detta är oåterkalleligt just nu..."
  );
  if (isSure) {
    let active_matrix = await SESSIONSTORAGE.get("matrix");
    myApp.FB.matrices_active.doc(active_matrix.matrix_uid).delete();
    Toast.show("Matris borttagen. Sidan laddas om ..", "success");
    reloadPage(2000);
  }
}

let userMatricesRetrieved = false;

async function handle_list_user_matrixes() {
  let list_container = document.getElementById("userMatrices-list");

  // Titta om matriser redan hämtats. Behöver global variabel för det
  if (userMatricesRetrieved === true) {
    return;
  }
  // Sätt global variabel till true för att undvika upprepning
  userMatricesRetrieved = true;

  let user = getUserEmail();
  if (!user) {
    Toast.show("Du är inte inloggad. Allt är feel!", "error");
    print_error_message("not_logged_in");
    return;
  }

  try {
    let matrixQuery = await myApp.FB.matrices_active
      .where("owner", "==", user)
      .get();
    let matrixArray = await breakoutFirebaseArray(matrixQuery);
    for (let matrixDoc of matrixArray) {
      let mtx = matrixDoc.data();
      append_matrix_to_list(mtx, list_container);
    }
  } catch (err) {
    console.error("Error retrieving matrices from FB (permissions) -->", err);
    print_error_message("no_permissions");
    Loader.finish();
    return;
  }
}

function append_matrix_to_list(mtx, container) {
  let row = document.createElement("div");
  container.appendChild(row);
  row.className =
    "userMatrix-row md:flex hover:bg-gray-500 hover:text-white cursor-pointer";
  row.dataset.matrixDetails = JSON.stringify(mtx);

  let col_name = document.createElement("div");
  col_name.classList.add("md:w-4/12", "font-bold", "pointer-events-none");
  col_name.textContent = mtx.name;

  let col_description = document.createElement("div");
  col_description.classList.add("md:w-6/12", "text-sm", "pointer-events-none");
  col_description.textContent = mtx.description;

  let col_owner = document.createElement("div");
  col_owner.classList.add(
    "md:w-2/12",
    "overflow-ellipsis",
    "italic",
    "text-sm",
    "pointer-events-none"
  );
  col_owner.textContent = mtx.owner;

  row.appendChild(col_name);
  row.appendChild(col_description);
  row.appendChild(col_owner);

  // Om raden är jämn så lägg till lite kolör
  let row_idx = Array.from(container.children).indexOf(row);
  if (!isEven(row_idx)) {
    row.classList.add("bg-gray-100");
  }

  row.addEventListener("click", (evt) => {
    const row = evt.target;
    let matrix_object = JSON.parse(row.dataset.matrixDetails);
    SESSIONSTORAGE.set("matrix", matrix_object);
    edit_matrix(matrix_object);
  });
}

// -- !! HELPER FUNCTIONS !! --
function auto_grow(element) {
  element.style.height = "auto";
  element.style.height = element.scrollHeight + "px";
}

function clear_element(DOMelement) {
  return new Promise((res) => {
    while (DOMelement.firstChild) {
      DOMelement.removeChild(DOMelement.firstChild);
    }
    res(DOMelement);
  });
}

function clone_element(selector, id) {
  let el = document
    .getElementById("clone")
    .querySelector(selector)
    .cloneNode(true);
  if (id) {
    el.id = id;
  }
  return el;
}

function copyCourseObject(course, student) {
  // Helper func för sendDataToFirebase
  let cc = JSON.parse(JSON.stringify(course));
  for (let key in student) {
    cc[key] = student[key];
  }
  return cc;
}

function formatDate(D) {
  let day = D.getDate();
  if (day < 10) {
    day = "0" + day;
  }
  let month = D.getMonth() + 1; // offset zero index
  if (month < 10) {
    month = "0" + month;
  }
  let year = D.getFullYear();
  return year + "-" + month + "-" + day;
}

function reloadPage(timeUntil) {
  setInterval(() => {
    location.reload();
    return false;
  }, timeUntil);
}

function hide_all_except_id(elements, id) {
  for (let el of elements) {
    if (el.id === id) {
      el.classList.remove("hidden");
    } else {
      el.classList.add("hidden");
    }
  }
}

function sort_object(list, prop) {
  return list.sort((a, b) => (a[prop] > b[prop] ? 1 : -1));
}

function print_error_message(message_type) {
  const sections = document.querySelectorAll(".mainSection");
  hide_all_except_id(sections, "section-error");

  let error_section = document.getElementById("section-error");
  error_section
    .querySelector(`[data-error-type="${message_type}"]`)
    .classList.remove("hidden");
}

// ███████ ██    ██ ███████ ███    ██ ████████     ██      ██ ███████ ████████ ███████ ███    ██ ███████ ██████  ███████
// ██      ██    ██ ██      ████   ██    ██        ██      ██ ██         ██    ██      ████   ██ ██      ██   ██ ██
// █████   ██    ██ █████   ██ ██  ██    ██        ██      ██ ███████    ██    █████   ██ ██  ██ █████   ██████  ███████
// ██       ██  ██  ██      ██  ██ ██    ██        ██      ██      ██    ██    ██      ██  ██ ██ ██      ██   ██      ██
// ███████   ████   ███████ ██   ████    ██        ███████ ██ ███████    ██    ███████ ██   ████ ███████ ██   ██ ███████

document.addEventListener("DOMContentLoaded", () => {
  init_Google(); // Initiate google

  // Custom select (matris)
  const selected_option = document.querySelector(".cSelect__selected");
  const optionsContainer = document.querySelector(".cSelect__optionsContainer");

  selected_option.addEventListener("click", () => {
    optionsContainer.classList.toggle("active");
    custom_select_add_eventListeners(optionsContainer);
  });

  function custom_select_add_eventListeners(container) {
    const optionsList = container.querySelectorAll(".cSelect__option");
    optionsList.forEach((option) => {
      option.addEventListener("click", (_) => {
        selected_option.innerHTML = option.querySelector("h4").innerHTML;
        selected_option.dataset.matrixDetails = option.querySelector(
          'input[name="matrices"]'
        ).dataset.matrixDetails;
        optionsContainer.classList.remove("active");
      });
    });
  }

  // -- EVENT LISTENERS
  let mainSection_btns = document.querySelectorAll(
    '[data-toggle="mainSection"]'
  );
  mainSection_btns.forEach((btn) => {
    btn.addEventListener("click", (evt) => {
      const mainSections = document.querySelectorAll(".mainSection");
      let target = evt.target.dataset.toggleTarget;
      hide_all_except_id(mainSections, `section-${target}`);
    });
  });

  // MATRIX TABS
  const navtab_btns = document.querySelectorAll("[data-tab-target]");
  navtab_btns.forEach((btn) => {
    btn.addEventListener("click", (evt) => {
      change_matrix_tab(evt.target);
    });
  });

  // COURSES SECTION
  const createNewCourse_btn = document.getElementById("create-new-course");
  const saveCourse_btn = document.getElementById("newCourse-saveCourse");
  const getStudents_btn = document.getElementById("getStudentList");
  const edit_saveCourse_btn = document.getElementById("editCourse-saveCourse");
  const addCourse_btn = document.getElementById("classroom-addCourse");

  createNewCourse_btn.addEventListener("click", () => {
    handle_edit_course();
  });

  getStudents_btn.addEventListener("click", () => {
    getAllStudentsFromDB();
  });

  edit_saveCourse_btn.addEventListener("click", () => {
    handle_save_course();
  });

  addCourse_btn.addEventListener("click", () => {
    handle_save_classroom_course();
  });
  // Autocomplete (editCourse section)
  const searchStudents_input = document.getElementById(
    "editcourse-searchStudents"
  );
  searchStudents_input.addEventListener("input", (evt) => {
    let matchList = evt.target.nextElementSibling;
    search_with_autocomplete(evt.target.value, matchList);
  });
});

document.addEventListener("keydown", function (evt) {
  if (evt.key === "Escape") {
    let active_modal = document.querySelector(".modal--active");
    if (active_modal) {
      Modal.hide();
    }
  }
});

document.addEventListener("click", (evt) => {
  let tgt = evt.target;

  if (tgt.dataset.dismiss == "modal") {
    Modal.hide();
  }

  if (tgt.id === "create-course") {
    newCourse();
  }

  if (tgt.classList.contains("addStudentToCourseList")) {
    addStudentToCourseList({
      name: tgt.dataset.name,
      email: tgt.dataset.email,
      class: tgt.dataset.class,
      student_uid: tgt.dataset.studentUid,
    });
  }
  if (tgt.dataset.delete == "gradeLevel") {
    delete_this_grade_level(tgt);
  }

  if (tgt.id === "newMatrix-addGradelevel") {
    add_new_grade_level(document.getElementById("newMatrix_gradeLevels"), null);
  }
  if (tgt.id === "editMatrix-addGradelevel") {
    add_new_grade_level(
      document.getElementById("editMatrix_gradeLevels"),
      null
    );
  }
  if (tgt.id === "newMatrix-confirmCreate") {
    assemble_new_matrix();
  }

  if (tgt.id === "editMatrix-saveEdit") {
    save_matrix();
  }
  if (tgt.id === "editMatrix-removeMatrix") {
    delete_matrix();
  }
  if (tgt.id === "list-user-matrices") {
    handle_list_user_matrixes();
  }
  if (tgt.id === "boldSelection_btn") {
    apply_bold_to_selection();
  }
  if (tgt.id === "resetSelection_btn") {
    reset_selection_format();
  }
});

// -- !! AUTO COMPLETE !! --
async function search_with_autocomplete(search_text, matchList) {
  let data;

  try {
    data = await LOCALSTORAGE.get("matrix_students_db");
  } catch (e) {
    console.log(e);
    return;
  }

  if (!data || typeof data !== "object") {
    Toast.show("Elevlista tom. Tryck på hämta-knappen", "error");
    return;
  }

  // Get matches to current text input
  let matches = data.filter((student) => {
    const regex = new RegExp(`^${search_text}`, "gi"); // ^ = starts with, 'gi' global & case INsensitive
    return (
      student.name.match(regex) ||
      student.email.match(regex) ||
      student.class.match(regex)
    );
  });

  // if no text, clear the matches
  if (search_text.length === 0) {
    matches = [];
    matchList.innerHTML = "";
  }
  // show searchresults in HTML
  if (matches.length > 0) {
    // array of html strings
    const html = matches
      .map(
        (match) => `
    <div class="card card__body addStudentToCourseList" data-class="${match.class}" data-name="${match.name}" data-email="${match.email}" data-student-uid="${match.student_uid}"'>
    <h5>${match.name} <span class="card__text--alternative">(${match.class})</span></h5>
    </div>
    `
      )
      .join(""); // puts all the arrays together
    matchList.innerHTML = html;
  }
}

function addStudentToCourseList(p) {
  const studentList_element = document.getElementById("editCourse-studentList");

  let existsEarlier = studentList_element.querySelector(
    `[data-email="${p.email}"]`
  );
  if (existsEarlier) {
    Toast.show("Eleven finns redan i listan", "error");
    return;
  }

  let li = document.createElement("li");
  li.textContent = `${p.name} (${p.class})`;
  li.dataset.email = p.email;
  li.dataset.name = p.name;
  li.dataset.class = p.class;
  li.dataset.studentUid = p.student_uid;

  // Only use hyperlinks for navigation, not to have something to click on. Any element can be clicked
  let button = document.createElement("button");
  button.className =
    "text-xs px-1 py-1 rounded bg-red-500 text-white hover:bg-red-700 ml-2";
  button.textContent = "Ta bort";
  button.addEventListener("click", remove_student_from_coachlist);
  li.appendChild(button);
  studentList_element.appendChild(li);

  function remove_student_from_coachlist() {
    // Just remove the closest <li> ancestor to the <span> that got clicked
    studentList_element.removeChild(this.closest("li"));
  }
}

function change_matrix_tab(tab_btn) {
  const tab_btns = document.querySelectorAll("[data-tab-target]");
  const tab_contents = document.querySelectorAll("[data-tab-content]");

  let tab_index = tab_btn.dataset.tabTarget;
  let target = document.querySelector(`[data-tab-content="${tab_index}"]`);

  // remove active
  tab_contents.forEach((tab) => tab.classList.remove("active", "in"));
  tab_btns.forEach((btn) => btn.classList.remove("active"));

  // add to requested
  tab_btn.classList.add("active");
  target.classList.add("in", "active");
}

// -- !! DRAG AND DROP !! --
let currently_being_dragged = null;
function dragOver(e) {
  if (!e.target.classList.contains("gradeArea__wrapper")) {
    return;
  }
  let dropContainer = document.getElementById("editMatrix-gradeAreas");
  if (isBefore(currently_being_dragged, e.target)) {
    dropContainer.insertBefore(currently_being_dragged, e.target);
  } else {
    dropContainer.insertBefore(currently_being_dragged, e.target.nextSibling);
  }
  reSyncPreview(true);
}

function dragEnd() {
  currently_being_dragged.classList.remove("isBeingDragged");
  currently_being_dragged = null;
}

function dragStart(e) {
  e.dataTransfer.effectAllowed = "move";
  e.dataTransfer.setData("text/plain", null);
  currently_being_dragged = e.target.parentElement;
  e.target.parentElement.classList.add("isBeingDragged");
}

function isBefore(el1, el2) {
  let cur;
  if (el2.parentNode === el1.parentNode) {
    for (cur = el1.previousSibling; cur; cur = cur.previousSibling) {
      if (cur === el2) return true;
    }
  }
  return false;
}

function cancelDefaultBehavior(e) {
  e.preventDefault();
  e.stopPropagation();
  return false;
}
