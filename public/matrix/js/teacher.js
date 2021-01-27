// https://patorjk.com/software/taag/#p=display&h=2&v=1&f=ANSI%20Regular&t=localstorage*/
const myApp = {
  FB: {
    matris: firebase.firestore().collection("matrix"),
    activeCourses: firebase
      .firestore()
      .collection("matrix")
      .doc("mCourses")
      .collection("mCourses--active"),
    activeStudents: firebase
      .firestore()
      .collection("matrix")
      .doc("mStudents")
      .collection("mStudents--active"),
    users: firebase.firestore().collection("users").doc("admins"),
  },
};

// ██      ██████   █████  ██████
// ██     ██    ██ ██   ██ ██   ██
// ██     ██    ██ ███████ ██   ██
// ██     ██    ██ ██   ██ ██   ██
// ███████ ██████  ██   ██ ██████

// Körs onload. Kör egentligen bara handle_teacher_load och sen Onload
async function firebase_loaded(user, options) {
  Loader.start();
  handle_teacher_load(user, options);
}

// Hämtar kursdata från FB och kör sedan handle_course_creation
async function handle_teacher_load(user, options) {
  // LITE RÖRIGT men man hämtar kurs, sen hämtar man elever i kurs, sen hämtar man asmts i elever (därav nesting)
  let course_prms = [];

  if (options) {
    handle_load_options(options, user);
  }

  // HÄMTA KURSER
  let courses = await myApp.FB.activeCourses
    .where("teacher_email", "==", user)
    .get()
    .catch(() => {
      print_error_message("no_permissions");
      Loader.finish();
      throw new Error("User lacks permission to do this (query courses)");
    });
  if (courses.empty) {
    display_section("noCourses");
    Loader.finish();
  }

  await courses.forEach((course) => {
    if (course.exists) {
      // PROMISES: HÄMTA ELEVER TILL DENNA KURS
      course_prms.push(get_students(course));
    }
  });

  Promise.all(course_prms).then((data) => {
    let course_idx = 0;

    if (data && data.length > 0) {
      data.forEach((course) => {
        handle_course_creation(course, course_idx++);
      });
      LOCALSTORAGE.set("courses", data);
      load_teacher_ui();
    } else {
      display_section("noCourses");
    }
    Loader.finish();
  });

  // -- FUNCTIONS
  // HÄMTA ELEVERNA
  async function get_students(courseEntry) {
    return new Promise(async (res) => {
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
          throw new Error("User lacks permission to do this (query students)");
        });
      const asmt_prms = [];
      await queryStudents.forEach((studentEntry) => {
        if (studentEntry.exists) {
          // PROMISES: HÄMTA ASMTS FÖR DENNA ELEV
          asmt_prms.push(handle_gather_asmts_for_student(studentEntry, course));
        }
      });

      Promise.all(asmt_prms).then((asmts) => {
        asmts.forEach((asmt) => course.students.push(asmt));
        res(course); // resolva löftet
      });
    });
  }

  // HÄMTA ASMTS FÖR DENNA ELEV
  async function handle_gather_asmts_for_student(studentEntry, course) {
    let student = studentEntry.data();
    student.asmts = [];
    let queryAsmts = await myApp.FB.activeStudents
      .doc(student.student_uid)
      .collection("studentCourseList")
      .doc(course.course_uid)
      .collection("asmts")
      .orderBy("createdOn")
      .get()
      .catch((_) => {
        print_error_message("no_permissions");
        Loader.finish();
        throw new Error("User lacks permission to do this (get asmts)");
      });
    queryAsmts.forEach(async (asmtEntry) => {
      if (asmtEntry.exists) {
        student.asmts.push(asmtEntry.data());
      }
    });
    return student;
  }

  function handle_load_options(options, user) {
    if (options.impersonate) {
      add_impersonate_banner(user);
    }

    // -- FUNCTIONS
    function add_impersonate_banner(user) {
      let nav_container = document.querySelector(
        ".nav__container.nav__container--top"
      );
      let banner = document.createElement("div");
      banner.className = "text-sm italic text-center";
      let description = document.createElement("div");
      description.textContent = "Impersonating as";
      banner.appendChild(description);
      let user_element = document.createElement("div");
      user_element.textContent = user;
      user_element.classList.add("font-bold");
      banner.appendChild(user_element);
      let logo = nav_container.children[0];
      nav_container.insertBefore(banner, logo.nextSibling);
    }
  }
}

// Kör create_course_element & sedan loopar varje elev genom create_student_element
async function handle_course_creation(course, course_index) {
  const course_element = await create_course_element(course, course_index);

  let promises = [];
  for (let i = 0; i < course.students.length; i++) {
    promises.push(
      create_student_element(course.students[i], course, i, course_element)
    );
  }
  Promise.all(promises)
    .then(() => {})
    .catch((e) => console.error("Error creating course", e));
}

// Skapar kurssektion och lägger till
function create_course_element(course, course_index) {
  return new Promise((resolve) => {
    // Create option for the select in the header
    const content_container = document.getElementById("course-container");
    let new_option = document.createElement("option");
    new_option.textContent = course.course_id;
    new_option.dataset.course_id = course.course_id;
    new_option.dataset.course_title = course.course_title;
    new_option.dataset.courseUid = course.course_uid;
    new_option.dataset.forSection = course_index;
    document.getElementById("choose-course").appendChild(new_option);

    /** Copy course element and append to container */
    let course_container = clone_element(".course");
    course_container.id = "c-" + course.course_uid; // Varför c-? För att firebase IDs börjar ibland på siffror och det går inte att använda querySelector på ids med siffra först
    course_container.dataset.courseId = course.course_id;
    course_container.dataset.section = course_index;
    content_container.appendChild(course_container);
    course_container.querySelector(".courseIndex__caption").textContent =
      course.course_id;
    resolve(course_container);
  });
}

// Skapar elevelement med master tabell
async function create_student_element(student, course, idx, container) {
  let li = document.createElement("li");
  li.classList.add("courseIndex__item");
  li.dataset.course = course.course_id;
  li.dataset.courseUid = course.course_uid;
  li.dataset.studentUid = student.student_uid;
  li.dataset.forSection = idx;

  li.addEventListener("click", (evt) => {
    show_student(evt.target);
  });

  const student_name = document.createElement("span");
  student_name.classList.add("courseIndex__studentName");
  student_name.textContent = student.name;
  li.appendChild(student_name);

  let asmt_list = document.createElement("ul");
  li.append(asmt_list);
  asmt_list.classList.add("courseIndex__stuAsmts");
  asmt_list.dataset.studentUid = student.student_uid;
  asmt_list.dataset.course = course.course_id;
  asmt_list.dataset.courseUid = course.course_uid;

  container.querySelector(".courseIndex__list").append(li);

  let student_element = clone_element(".student");
  let asmt_container = student_element.querySelector(
    ".assessment__container--master"
  );
  // Master table måste vara populerad innan vi kan lägga till asmts, därav await
  await populate_master_asmt(asmt_container, course.matrix.asmt_areas);

  student_element.dataset.studentUid = student.student_uid;
  student_element.dataset.section = idx;
  student_element.id = "s-" + student.student_uid; // Varför -s först? För att queryselector inte fungerar på siffror som första karaktär (FB kan ha det)
  student_element.dataset.course = course.course_id;
  student_element.dataset.courseUid = course.course_uid;
  student_element.querySelector(".student__name").textContent = student.name;
  container.querySelector(".course__students").appendChild(student_element);

  // add ASMTs
  if ("asmts" in student && student.asmts.length > 0) {
    for await (let asmt of student.asmts) {
      create_asmt_element(asmt, student.student_uid, course);
    }
    let asmt_wrappers_in_master = student_element.querySelectorAll(
      ".asmt__wrapper--master"
    );
    let idx = 0;
    asmt_wrappers_in_master.forEach((el) => {
      calculate_feedback_sum_for_header(el);
      calculate_basis_sum_for_header(el);
    });
  } else {
    let accordion_btn = student_element.querySelector(".accordion__button");
    accordion_btn.click(); // activates it. Only if no asmts
  }

  // -- FUNCTIONS

  function populate_master_asmt(container, matrix) {
    for (let gradeArea of matrix) {
      let mainWrapper = document.createElement("div");
      mainWrapper.className = "asmt__wrapper asmt__wrapper--master";
      mainWrapper.dataset.area = gradeArea.area_name;
      container.appendChild(mainWrapper);

      let header = document.createElement("header");
      header.className = "bg-gray-200 py-1 px-2";
      mainWrapper.appendChild(header);

      let header_caption = document.createElement("span");
      header_caption.className = "text-xl";
      header_caption.textContent = gradeArea.area_name;
      header.appendChild(header_caption);

      let btn_group = document.createElement("div");
      header.appendChild(btn_group);
      btn_group.className = "ml-3 inline-block space-x-2";

      let toggleFeedback_btn = document.createElement("button");
      let toggleFeedback_caption = document.createElement("span");
      toggleFeedback_caption.textContent = "Visa feedback";
      toggleFeedback_caption.className = "pointer-events-none";
      toggleFeedback_btn.appendChild(toggleFeedback_caption);

      let toggleFeedback_amount = document.createElement("span");
      toggleFeedback_amount.className = "feedback-sum ml-1 pointer-events-none";
      toggleFeedback_btn.appendChild(toggleFeedback_amount);

      toggleFeedback_btn.className =
        "toggle-asmt-details outline-none cursor-pointer text-red-700 rounded py-1 px-2 bg-transparent hover:underline";
      toggleFeedback_btn.dataset.toggleType = "feedback";
      btn_group.appendChild(toggleFeedback_btn);

      let toggleBasis_btn = document.createElement("button");
      let toggleBasis_caption = document.createElement("span");
      toggleBasis_caption.textContent = "Visa underlag";
      toggleBasis_caption.className = "pointer-events-none";
      toggleBasis_btn.appendChild(toggleBasis_caption);

      let toggleBasis_amount = document.createElement("span");
      toggleBasis_amount.className = "basis-sum ml-1 pointer-events-none";
      toggleBasis_btn.appendChild(toggleBasis_amount);

      toggleBasis_btn.className =
        "toggle-asmt-details outline-none cursor-pointer rounded py-1 px-2 bg-transparent hover:underline";
      toggleBasis_btn.dataset.toggleType = "basis";
      btn_group.appendChild(toggleBasis_btn);

      let gradeLevels_wrapper = document.createElement("div");
      gradeLevels_wrapper.classList.add(
        "gradeLevel__wrapper",
        "flex",
        "flex-wrap"
      );
      mainWrapper.appendChild(gradeLevels_wrapper);

      for (let criteria of gradeArea.criteria) {
        const gradelvl_wrapper = document.createElement("div");
        gradelvl_wrapper.className =
          "gradeLevel master w-full md:w-3/12 md:flex-grow";
        gradelvl_wrapper.dataset.gradelvl = criteria.label;
        gradelvl_wrapper.dataset.area = gradeArea.area_name;
        gradeLevels_wrapper.appendChild(gradelvl_wrapper);
        let gradelvl_label = document.createElement("div");
        gradelvl_label.className = "gradeLevel__label";
        gradelvl_label.textContent = criteria.label;
        gradelvl_wrapper.appendChild(gradelvl_label);
        let gradelvl_criteria = document.createElement("div");
        gradelvl_criteria.className = "gradeLevel__criteria";
        gradelvl_criteria.innerHTML = criteria.text;
        gradelvl_wrapper.appendChild(gradelvl_criteria);
      }
      let feedbackWrapper = document.createElement("div");
      feedbackWrapper.className =
        "asmt__feedbackWrapper mt-2 border rounded px-1 py-1 hidden";
      feedbackWrapper.dataset.area = gradeArea.area_name;
      feedbackWrapper.dataset.toggleTarget = "feedback";
      mainWrapper.appendChild(feedbackWrapper);

      let feedbackHeader = document.createElement("div");
      feedbackHeader.textContent = "Feedback för detta område";
      feedbackHeader.className = "font-bold mb-1";
      feedbackWrapper.appendChild(feedbackHeader);

      let feedBack_container = document.createElement("ul");
      feedBack_container.className = "asmt__feedbackContainer list-none ml-0";
      feedbackWrapper.appendChild(feedBack_container);

      let basisWrapper = document.createElement("div");
      basisWrapper.className =
        "asmt__basisWrapper mt-1 mb-4 border rounded px-1 py-1 hidden";
      basisWrapper.dataset.area = gradeArea.area_name;
      basisWrapper.dataset.toggleTarget = "basis";
      mainWrapper.appendChild(basisWrapper);

      let basisHeader = document.createElement("div");
      basisHeader.textContent = "Underlag som utgör bedömningen";
      basisHeader.className = "font-bold mb-1";
      basisWrapper.appendChild(basisHeader);

      let basisContainer = document.createElement("ul");
      basisContainer.className = "asmt__basisContainer list-none ml-0";
      basisWrapper.appendChild(basisContainer);
    }
  }
}

// Visar elev i courseIndex listan. EVTListener från create_student_element
function show_student(el) {
  const course = el.closest(".course");
  const active_cls = {
    btn: "courseIndex__item--active",
    section: "student--active",
  };

  remove_previous_active(course, active_cls.btn);
  remove_previous_active(course, active_cls.section);

  el.classList.add(active_cls.btn); // btn
  const section_index = el.dataset.forSection;
  let all_sections_in_course = course.querySelectorAll(".student");
  let activeStudentSection = all_sections_in_course[section_index];
  activeStudentSection.classList.add(active_cls.section);
}

// -- !! APPLY STATUS !! --
// EVTListener för om .minion knappar (togglar status)
document.addEventListener("click", (evt) => {
  let tgt = evt.target;
  if (tgt.classList.contains("minion")) {
    handle_apply_status(tgt);
  }
});

// Hanterar statusapplikation - bedömmer status och applicerar på minion
async function handle_apply_status(el) {
  const asmt_element = el.closest(".asmt");
  let status = el.dataset.status;
  let next_status = calc_next_status(status);
  let siblings = el.parentElement.children;
  let idx = Array.from(siblings).indexOf(el);

  let x;
  for (let i = 0; i < siblings.length; i++) {
    if (next_status === "met") {
      if (i <= idx) {
        apply_status_to_minion(siblings[i], next_status);
      }
    } else if (next_status === "unmet") {
      if (i === 0) {
        apply_status_to_minion(siblings[i], "unmet");
      } else {
        apply_status_to_minion(siblings[i], null);
      }
    } else if (next_status === null) {
      apply_status_to_minion(siblings[i], null);
    }
  }

  // -- FUNCTIONS
  function calc_next_status(status) {
    if (!status) {
      return "met";
    } else if (status === "met") {
      return "unmet";
    } else if (status === "unmet") {
      return null;
    }
  }

  let asmt_prop = {
    asmt_uid: asmt_element.dataset.asmtUid,
    student_uid: asmt_element.dataset.studentUid,
    course_uid: asmt_element.dataset.courseUid,
  };
  register_student_change(asmt_prop);
}

// Applicerar status på .minion element och kör sedan apply_status_to_master
function apply_status_to_minion(el, status) {
  let student_element = el.closest(".student");
  let master_element = student_element.querySelector(
    `.gradeLevel.master[data-gradelvl="${el.dataset.gradelvl}"][data-area="${el.dataset.area}"]`
  );
  if (status) {
    el.dataset.status = status;
    // Apply to Master as well
  } else {
    el.removeAttribute("data-status");
  }
  apply_status_to_master(master_element);
}

// Räknar ut vad för status .master ska ha och applicerar
function apply_status_to_master(master_element) {
  // -- ELEMENTS
  let student_element = master_element.closest(".student");
  let gradelvl = master_element.dataset.gradelvl;
  let area = master_element.dataset.area;
  let this_from_all_minion = student_element.querySelectorAll(
    `.gradeLevel.minion[data-gradelvl="${gradelvl}"][data-area="${area}"]`
  );

  let val;
  let number_of_met = 0;
  let number_of_unmet = 0;

  for (let asmt of this_from_all_minion) {
    if (!asmt.dataset.status) {
      continue;
    }
    if (asmt.dataset.status === "met") {
      number_of_met++;
    }
    if (asmt.dataset.status === "unmet") {
      number_of_unmet++;
    }
  }

  if (number_of_met > 0) {
    val = "met";
    let tally = calculate_met_level(number_of_met, number_of_unmet);
    val += tally;
  } else if (number_of_unmet > 0) {
    val = "unmet";
  } else {
    // Inga statuses = ta bort data-status
    master_element.removeAttribute("data-status");
    return;
  }

  master_element.dataset.status = val;
  // -- HELPER FUNCTIONS
  function calculate_met_level(met, unmet) {
    let calc = met - unmet;
    if (calc > 3) {
      calc = 3;
    }
    if (calc < 1) {
      calc = 1;
    }
    return calc;
  }
}

// -- !! ASSESSMENTS !! --
async function handle_edit_asmt(asmt_uid, course_uid) {
  const LS = await LOCALSTORAGE.get("courses");
  const course = LS.find((x) => x.course_uid === course_uid);
  // Hämta asmt listan från första eleven
  const modal = document.querySelector('.modal[data-modal="asmt"]');
  kill_children(modal).then(() => {
    populate_asmt_modal(modal, course, asmt_uid);
    Modal.show("asmt");
  });

  // -- FUNCTIONS
  async function populate_asmt_modal(modal, course, asmt_uid) {
    // modal elements
    const content = clone_element(".modal__content--editAsmt");
    const modal_title = content.querySelector(".modal__title");
    const caption_element = content.querySelector(
      'input[data-alias="caption"]'
    );
    const description_element = content.querySelector(
      '[data-alias="description"]'
    );
    const courseSelect_element = content.querySelector(
      'select[data-alias="course"]'
    );
    const reqTable_element = content.querySelector(
      'table[data-alias="table-reqs"]'
    );
    const save_btn = content.querySelector(
      'button[data-function="save-event"]'
    );
    const delete_btn = content.querySelector(
      'button[data-function="delete-event"]'
    );
    const knowReq_section = content.querySelector(
      'section[data-alias="know-reqs"]'
    );

    // asmt elements to copy from
    const course_container = document.getElementById("c-" + course.course_uid);
    const asmt_container = course_container.querySelector(
      `.asmt[data-asmt-uid="${asmt_uid}"]`
    );
    const { asmt_caption, asmt_description, asmt_reqs } = getDataFromElements(
      asmt_container
    );

    modal.appendChild(content);
    knowReq_section.classList.remove("hidden");
    content.dataset.asmtUid = asmt_uid;
    // Add the active course to select
    let option = document.createElement("option");
    option.textContent = course.course_id;
    option.dataset.courseUid = course.course_uid;
    courseSelect_element.appendChild(option);
    courseSelect_element.options.selectedIndex = 1; // 0 är "välj kurs"
    courseSelect_element.disabled = true; // Man ska inte kunna byta kurs för vald asmt

    // Lägg till kunskapskrav och klicka för de valda
    add_grade_areas_to_asmt_modal(course, reqTable_element, 0);
    select_previous_kreqs(reqTable_element, asmt_reqs);

    modal_title.textContent = "Ändra existerande bedömning";
    caption_element.value = asmt_caption;
    description_element.value = asmt_description;

    delete_btn.classList.remove("hidden");
    delete_btn.addEventListener("click", async () => {
      Loader.start();
      let asmt_uid = content.dataset.asmtUid;
      let course_option =
        courseSelect_element.options[courseSelect_element.selectedIndex];

      const LS = await LOCALSTORAGE.get("courses");
      const course = LS.find(
        (x) => x.course_uid === course_option.dataset.courseUid
      );
      delete_asmt(course, asmt_uid).then(() => {
        Loader.finish();
        Toast.show("Uppgift borttagen! Sidan laddas om ...", "success");
        reloadPage(2000);
      });
    });
    save_btn.addEventListener("click", async () => {
      let saved_data = gather_data_for_save(content);
      if (typeof saved_data == "object") {
        console.log(saved_data);
      }

      const LS = await LOCALSTORAGE.get("courses");
      const course = LS.find((x) => x.course_uid === saved_data.course_uid);
      update_asmt(saved_data, course);
    });
  }

  // -- HELPER FUNCS
  function getDataFromElements(container) {
    const caption_element = container.querySelector(".asmt__caption");
    const description_element = container.querySelector(".asmt__description");
    const reqTable_element = container.querySelector(".asmt__tbody");

    return {
      asmt_caption: caption_element.textContent,
      asmt_description: description_element.textContent,
      asmt_reqs: get_reqs(reqTable_element),
    };

    function get_reqs(table) {
      let paragraphs = [];
      let td = table.querySelectorAll(`td[data-paragraph]`);
      td.forEach((td) => {
        paragraphs.push(td.dataset.paragraph);
      });
      return [...new Set(paragraphs)];
    }
  }
  function select_previous_kreqs(table, reqs) {
    let tbody = table.querySelector("tbody");
    tbody.classList.add("reqTable__body--active");
    for (let req of reqs) {
      let cb = tbody.querySelector(`input[data-paragraph="${req}"]`);
      cb.checked = true;
      cb.disabled = true;
    }
  }

  function gather_data_for_save(content) {
    const caption_element = content.querySelector('[data-alias="caption"]');
    const description_element = content.querySelector(
      '[data-alias="description"]'
    );
    const course_element = content.querySelector('[data-alias="course"]');
    const chosen_course = course_element.selectedIndex;
    const reqTable_element = content.querySelector(
      'table[data-alias="table-reqs"]'
    );

    let data = {
      asmt_uid: content.dataset.asmtUid,
      caption: caption_element.value,
      description: description_element.value,
      course_id: course_element.value,
      course_uid: course_element.options[chosen_course].dataset.courseUid,
      reqs: [],
    };

    const course_tbody = reqTable_element.querySelector(`tbody`);
    let all_chosen_reqs = course_tbody.querySelectorAll(
      "input[data-paragraph]:checked"
    );
    for (let req of all_chosen_reqs) {
      data.reqs.push(req.dataset.paragraph);
    }

    if (data.caption === "") {
      Toast.show("Din uppgift saknar titel!", "error");
      return;
    }
    if (data.reqs.length == 0) {
      Toast.show("Du har inte valt några kunskapskrav!", "error");
      return;
    }
    return data;
  }

  function delete_asmt(course, asmt_uid) {
    return new Promise((res) => {
      let prms = [];
      for (let student of course.students) {
        let studentRef = myApp.FB.activeStudents
          .doc(student.student_uid)
          .collection("studentCourseList")
          .doc(course.course_uid)
          .collection("asmts")
          .doc(asmt_uid);
        prms.push(
          studentRef
            .delete()
            .catch((e) => console.error("Error deleting asmt (student)", e))
        );
      }
      let courseRef = myApp.FB.activeCourses
        .doc(course.course_uid)
        .collection("asmts")
        .doc(asmt_uid);
      prms.push(
        courseRef
          .delete()
          .catch((e) => console.error("Error deleting course (course)", e))
      );

      Promise.all(prms).then(() => {
        Toast.show("Uppgift borttagen", "success");
        Modal.hide();
        Loader.finish();
      });
      res();
    });
  }

  function update_asmt(asmt, course) {
    let prms = [];
    for (let student of course.students) {
      let studentRef = myApp.FB.activeStudents
        .doc(student.student_uid)
        .collection("studentCourseList")
        .doc(course.course_uid)
        .collection("asmts")
        .doc(asmt.asmt_uid);
      prms.push(
        studentRef
          .update(asmt)
          .catch((e) => console.error("Error updating asmt (student)", e))
      );
    }
    let courseRef = myApp.FB.activeCourses
      .doc(course.course_uid)
      .collection("asmts")
      .doc(asmt.asmt_uid);
    prms.push(
      courseRef
        .update(asmt)
        .catch((e) => console.error("Error updating asmt (course)", e))
    );

    Promise.all(prms).then(() => {
      Toast.show("Uppgift uppdaterad! Sidan laddas om ...", "success");
      Modal.hide();
      setInterval(() => {
        location.reload();
        return false;
      }, 2000);
    });
  }
}

function add_grade_areas_to_asmt_modal(course, container, sectionIndex) {
  let mainWrapper = document.createElement("div");
  mainWrapper.dataset.body = sectionIndex;
  mainWrapper.dataset.forCourse = course.course_uid;
  mainWrapper.className = "asmtArea__forModal rounded border-gray-200 my-1";
  container.appendChild(mainWrapper);

  let areaIdx = 1;
  for (let gradeArea of course.matrix.asmt_areas) {
    let areaWrapper = document.createElement("div");
    areaWrapper.className = "flex border rounded border-gray-300 mb-1";
    mainWrapper.appendChild(areaWrapper);

    let inputWrapper = document.createElement("div");
    inputWrapper.className = "px-1 py-1 border-r border-gray-300";
    areaWrapper.appendChild(inputWrapper);

    let input = document.createElement("input");
    input.type = "checkbox";
    input.dataset.area = gradeArea.area_name;
    inputWrapper.appendChild(input);

    let area_label = document.createElement("div");
    area_label.className = "px-1 py-1";
    areaWrapper.appendChild(area_label);
    area_label.textContent = gradeArea.area_name;
    if (isEven(areaIdx)) {
      areaWrapper.classList.add("bg-gray-200");
    }
    areaIdx++;
  }
}

function handle_new_asmt() {
  const modal = document.querySelector('.modal[data-modal="asmt"]');
  kill_children(modal).then(() => {
    populate_asmt_modal(modal);
    Modal.show("asmt");
  });

  // -- FUNCTIONS
  async function populate_asmt_modal(modal) {
    const content = clone_element(".modal__content--editAsmt");
    const courseSelect_element = content.querySelector(
      'select[data-alias="course"]'
    );
    const save_btn = content.querySelector(
      'button[data-function="save-event"]'
    );
    const asmtArea_section = content.querySelector(
      '[data-alias="asmtAreas-section"]'
    );
    const asmtArea_container = content.querySelector(
      '[data-alias="asmtAreas-container"]'
    );
    modal.appendChild(content);

    // Fill select with courses
    let courses = await LOCALSTORAGE.get("courses");
    let i = 0;
    for (i; i < courses.length; i++) {
      const course = courses[i];
      let option = document.createElement("option");
      option.textContent = course.course_id;
      option.dataset.forBody = i;
      option.dataset.courseUid = course.course_uid;
      courseSelect_element.appendChild(option);

      add_grade_areas_to_asmt_modal(course, asmtArea_container, i);
    }

    // -- EVENT LISTN
    courseSelect_element.addEventListener("change", () => {
      let sel_index = courseSelect_element.selectedIndex;
      let body_idx = courseSelect_element[sel_index].dataset.forBody;
      if (sel_index == 0) {
        asmtArea_section.classList.add("hidden");
      } else {
        asmtArea_section.classList.remove("hidden");
      }

      let asmtArea_list = asmtArea_container.querySelectorAll(
        ".asmtArea__forModal"
      );
      for (let i = 0; i < asmtArea_list.length; i++) {
        let asmtArea = asmtArea_list[i];
        if (asmtArea.dataset.body == body_idx) {
          asmtArea.classList.add("asmtArea__forModal--active");
        } else {
          asmtArea.classList.remove("asmtArea__forModal--active");
        }
      }
    });

    save_btn.addEventListener("click", () => {
      Loader.start();
      const caption_element = content.querySelector('[data-alias="caption"]');
      const description_element = content.querySelector(
        '[data-alias="description"]'
      );
      const course_element = content.querySelector('[data-alias="course"]');
      const chosen_course = course_element.selectedIndex;

      const course_uid =
        course_element.options[chosen_course].dataset.courseUid;

      let data = {
        caption: caption_element.value,
        description: description_element.value,
        areas: [],
      };

      const course_tbody = asmtArea_container.querySelector(
        `[data-for-course="${course_uid}"]`
      );
      let all_chosen_areas = course_tbody.querySelectorAll(
        "input[data-area]:checked"
      );
      for (let input of all_chosen_areas) {
        data.areas.push(input.dataset.area);
      }

      if (data.caption === "") {
        Toast.show("Din uppgift saknar titel!", "error");
        return;
      }
      if (data.areas.length == 0) {
        Toast.show("Du har inte valt några kunskapskrav!", "error");
        return;
      }
      handle_asmt_creation(data, false, course_uid);
    });
  }
}

async function handle_asmt_creation(data, updateOnly, course_uid) {
  const LS = await LOCALSTORAGE.get("courses");
  const course = LS.find((x) => x.course_uid === course_uid);
  const course_element = document.getElementById("c-" + course.course_uid);
  let all_students = course_element.querySelectorAll(".student");

  if (updateOnly) {
  } else {
    let now = new Date();
    data.createdOn = formatDateAndTime(now);
  }

  if (!course) {
    console.log("course not located in LS!");
    return;
  }
  let asmt_with_id = await pass_new_asmt_to_db(data);

  // Add to students:
  for await (let student_element of all_students) {
    let student_uid = student_element.dataset.studentUid;
    create_asmt_element(asmt_with_id, student_uid, course);
    let accordion = student_element.querySelector(".accordion__button");
    if (accordion.classList.contains("accordion__button--active")) {
      accordion.classList.remove("accordion__button--active");
    }
  }

  Loader.finish();
  Toast.show("Ny uppgift tillagd!", "success");
  Modal.hide();

  async function pass_new_asmt_to_db(asmt) {
    // Lägg till i kursen och hämta ID
    let newAsmt = await myApp.FB.activeCourses
      .doc(course.course_uid)
      .collection("asmts")
      .add(asmt)
      .catch((e) => {
        console.error("error adding new asmt", e);
        return;
      });

    asmt.asmt_uid = newAsmt.id;
    // Lägg till för varje elev
    for (student of course.students) {
      let asmtRef = myApp.FB.activeStudents
        .doc(student.student_uid)
        .collection("studentCourseList")
        .doc(course.course_uid)
        .collection("asmts")
        .doc(asmt.asmt_uid);
      asmtRef
        .set(asmt)
        .catch((e) => console.error("Error appending asmt to student", e));
    }
    return asmt;
  }
}

async function create_asmt_element(asmt, student_uid, course) {
  // -- DECLARATIONS
  let asmt_element = clone_element(".asmt");
  let caption = asmt_element.querySelector(".asmt__caption");
  let date_element = asmt_element.querySelector(".asmt__date");
  let description = asmt_element.querySelector(".asmt__description");
  let asmt_container = asmt_element.querySelector(".asmt__container");
  const gradingFinished_checkbox = asmt_element.querySelector(
    ".asmt__gradingFinished"
  );

  let course_element = document.getElementById("c-" + course.course_uid);
  let student_element = course_element.querySelector(
    `.student[data-student-uid="${student_uid}"]`
  );
  let courseIndex_container = course_element.querySelector(
    `.courseIndex__stuAsmts[data-student-uid="${student_uid}"]`
  );

  caption.textContent = asmt.caption;
  date_element.textContent = asmt.createdOn.substring(0, 10);
  description.textContent = asmt.description;
  asmt_element.dataset.asmtUid = asmt.asmt_uid;
  asmt_element.dataset.courseUid = course.course_uid;
  asmt_element.dataset.studentUid = student_uid;
  asmt_element.dataset.caption = asmt.caption;

  // Skapa <LI> i tablist och appenda elementet till  tabcontent.
  // OBS måste göras nu för att kunna lägga till grade_data senare.
  // Måste kunna åkalla detta då. Varför skapar vi dessa här ist för HTML?
  let tabContent_container = student_element.querySelector(
    ".asmtTab__container"
  );
  let tabList_container = student_element.querySelector(".asmtTab__list");
  let tabContent_list = student_element.querySelectorAll("[data-tab-content]");
  let currentIndex = tabContent_list.length; // Fungerar eftersom index startar på 0 och byggs på för varje så behöver inte ++

  let tabList_item = document.createElement("li");
  tabList_item.classList.add("asmtTab");
  tabList_item.dataset.asmtUid = asmt.asmt_uid;

  let tabList_anchor = document.createElement("a");
  tabList_anchor.classList.add("md:text-lg");
  tabList_anchor.dataset.tabTarget = currentIndex;
  tabList_anchor.textContent = asmt.caption;
  tabList_item.appendChild(tabList_anchor);
  tabList_container.appendChild(tabList_item);

  asmt_element.dataset.tabContent = currentIndex;
  tabContent_container.appendChild(asmt_element);

  // Skapa själva tabellen
  for (let asmtArea of asmt.areas) {
    // Hitta komplett data för gradearea i course.matrix
    let gradeArea = course.matrix.asmt_areas.find(
      (x) => x.area_name === asmtArea
    );
    let mainWrapper = document.createElement("div");
    mainWrapper.className = "asmt__wrapper asmt__wrapper--minion";
    mainWrapper.dataset.area = gradeArea.area_name;
    mainWrapper.dataset.asmtUid = asmt.asmt_uid;
    asmt_container.appendChild(mainWrapper);
    let header = document.createElement("header");
    header.className = "bg-gray-200 py-2 px-3 text-xl";
    header.textContent = gradeArea.area_name;
    mainWrapper.appendChild(header);

    let gradeLevels_wrapper = document.createElement("div");
    gradeLevels_wrapper.classList.add(
      "gradeLevel__wrapper",
      "flex",
      "flex-wrap"
    );
    mainWrapper.appendChild(gradeLevels_wrapper);
    for (let criteria of gradeArea.criteria) {
      const gradelvl_wrapper = document.createElement("div");
      gradelvl_wrapper.className =
        "gradeLevel minion  w-full md:w-3/12 md:flex-grow cursor-pointer hover:ring";
      gradelvl_wrapper.dataset.gradelvl = criteria.label;
      gradelvl_wrapper.dataset.area = gradeArea.area_name;
      gradeLevels_wrapper.appendChild(gradelvl_wrapper);
      let gradelvl_label = document.createElement("div");
      gradelvl_label.className = "gradeLevel__label";
      // Ifall label är lite längre så visas den vertikalt. Aldrig prövat iofs.
      if (criteria.label.length > 3) {
        gradelvl_label.classList.add("text-vertical");
      }
      gradelvl_label.textContent = criteria.label;
      gradelvl_wrapper.appendChild(gradelvl_label);
      let gradelvl_criteria = document.createElement("div");
      gradelvl_criteria.className = "gradeLevel__criteria";
      gradelvl_criteria.innerHTML = criteria.text;
      gradelvl_wrapper.appendChild(gradelvl_criteria);
      if (
        "grade_data" in asmt &&
        gradeArea.area_name in asmt.grade_data &&
        criteria.label in asmt.grade_data[gradeArea.area_name]
      ) {
        apply_status_to_minion(
          gradelvl_wrapper,
          asmt.grade_data[gradeArea.area_name][criteria.label]
        );
      }
    }

    // Lägg till feedback för detta område (även i master)
    let gradeArea_in_master = student_element.querySelector(
      `.asmt__wrapper--master[data-area="${gradeArea.area_name}"]`
    );
    let feedbackWrapper = document.createElement("div");
    mainWrapper.appendChild(feedbackWrapper);

    let feedbackHeader = document.createElement("h4");
    feedbackHeader.className = "font-bold my-2";
    feedbackHeader.textContent = "Feedback för detta område";
    feedbackWrapper.appendChild(feedbackHeader);

    let feedBackTextarea = document.createElement("textarea");
    feedBackTextarea.dataset.area = gradeArea.area_name;
    feedBackTextarea.className =
      "asmt__feedback rounded px-2 py-2 text-gray-800 border w-full whitespace-pre-line focus:outline-none focus:ring focus:ring-green-500";
    feedBackTextarea.addEventListener("input", (evt) => {
      auto_grow(evt.target);
    });
    feedbackWrapper.appendChild(feedBackTextarea);

    // add feedbackelement to master
    let feedbackLi_master = document.createElement("li");
    feedbackLi_master.classList.add("asmt__feedbackLi", "hidden");
    let feedbackLi_master_caption = document.createElement("span");
    feedbackLi_master_caption.className = "text-gray-700 underline mr-1";
    feedbackLi_master_caption.textContent = asmt.caption + ":";
    feedbackLi_master.appendChild(feedbackLi_master_caption);
    let feedbackLi_master_body = document.createElement("span");
    feedbackLi_master_body.className = "asmt__feedbackBody whitespace-pre-line";
    feedbackLi_master.appendChild(feedbackLi_master_body);

    let master_feedbackContainer = gradeArea_in_master.querySelector(
      `.asmt__feedbackWrapper[data-area="${gradeArea.area_name}"] ul`
    );
    master_feedbackContainer.appendChild(feedbackLi_master);

    feedBackTextarea.addEventListener("change", () => {
      if (feedBackTextarea.value.length > 0) {
        feedbackLi_master_body.textContent = feedBackTextarea.value;
        feedbackLi_master.classList.remove("hidden");
      }

      calculate_feedback_sum_for_header(gradeArea_in_master);
    });

    if (
      "grade_data" in asmt &&
      gradeArea.area_name in asmt.grade_data &&
      "feedback" in asmt.grade_data[gradeArea.area_name]
    ) {
      feedBackTextarea.value = asmt.grade_data[gradeArea.area_name].feedback;
      feedbackLi_master_body.textContent =
        asmt.grade_data[gradeArea.area_name].feedback;
      feedbackLi_master.classList.remove("hidden");
    }
  }

  let li = document.createElement("li");
  // li.classList.add("overflow-ellipsis");
  li.dataset.asmtUid = asmt.asmt_uid;
  let a = document.createElement("a");
  a.textContent = asmt.caption;
  a.title = asmt.caption;
  a.classList.add("text-xs", "courseIndex__asmt");
  a.dataset.courseUid = course.course_uid;
  a.dataset.forAsmt = asmt.asmt_uid;
  a.dataset.studentUid = student_uid;
  // a.addEventListener("click", show_asmt);
  li.appendChild(a);

  courseIndex_container.appendChild(li);

  // Toggle grade data
  if ("grade_data" in asmt && "grading_progress" in asmt.grade_data) {
    let progress = asmt.grade_data.grading_progress;
    if (progress === "finished") {
      gradingFinished_checkbox.checked = true;
    }

    // Status är antingen 'finished' eller 'started'. Båda går att toggla
    toggle_grading_status(
      {
        course_uid: course.course_uid,
        student_uid: student_uid,
        asmt_uid: asmt.asmt_uid,
      },
      progress
    );
  }
}

// Räknar ut och lägger till antal som fått feedback i varje gradearea
function calculate_feedback_sum_for_header(gradeArea_in_master) {
  let feedbackContainer = gradeArea_in_master.querySelector(
    ".asmt__feedbackContainer"
  );
  let items = feedbackContainer.children;
  let number_with_feedback = 0;
  for (let el of items) {
    if (el.querySelector(".asmt__feedbackBody").textContent.length > 0) {
      number_with_feedback++;
    }
  }
  let btn = gradeArea_in_master.querySelector(".feedback-sum");
  btn.textContent = `[${number_with_feedback}]`;
}

// Räknar ut
function calculate_basis_sum_for_header(gradeArea_in_master) {
  const area = gradeArea_in_master.dataset.area;
  const course_element = gradeArea_in_master.closest(".student");
  let all_area_minions = course_element.querySelectorAll(
    `.asmt__wrapper--minion[data-area="${area}"]`
  );
  let container = gradeArea_in_master.querySelector(".asmt__basisContainer");

  for (let el of all_area_minions) {
    let li = document.createElement("li");
    li.className = "mb-1";
    let asmt = el.closest(".asmt");

    let anchor = document.createElement("a");
    anchor.classList.add(
      "hover:underline",
      "cursor-pointer",
      "hover:font-bold"
    );
    li.appendChild(anchor);

    anchor.textContent = asmt.dataset.caption;
    container.appendChild(li);
  }

  let btn = gradeArea_in_master.querySelector(".basis-sum");
  btn.textContent = `[${all_area_minions.length}]`;
}

// -- !! SPAR-FUNKTIONER !! --
async function register_student_change(prop) {
  toggle_grading_status(prop, "started");
  restartSaveCountdown("restart");
  let list = await SESSIONSTORAGE.get("saveList");
  if (list == null) {
    list = new Array();
  }

  let listedAlready = list.find((x) => {
    if (
      x.course_uid === prop.course_uid &&
      x.student_uid === prop.student_uid &&
      x.asmt_uid === prop.asmt_uid
    ) {
      return x;
    }
  });

  if (listedAlready) {
    return;
  } else {
    list.push(prop);
  }

  SESSIONSTORAGE.set("saveList", list);
}

async function save_changes() {
  restartSaveCountdown("stop");
  console.log("Saving changes ...");
  let saveList = await SESSIONSTORAGE.get("saveList");
  if (saveList && saveList.length > 0) {
    displaySaveDialogue();
    saveList.forEach((prop) => {
      get_stuff_for_this_combination(prop).then((result) => {
        send_saved_data_to_FB(prop, result);
        Toast.show("Sparat!", "success");
      });
    });
  } else {
    Toast.show("Allting är sparat!", "success");
  }

  function get_stuff_for_this_combination(prop) {
    return new Promise((res) => {
      // Elements
      const asmt_element = document.querySelector(
        `.asmt[data-asmt-uid="${prop.asmt_uid}"][data-student-uid="${prop.student_uid}"]`
      );
      const feedback_elements = asmt_element.querySelectorAll(
        ".asmt__feedback"
      );
      const gradingFinished_checkbox = asmt_element.querySelector(
        ".asmt__gradingFinished"
      );

      let gradeLevels = asmt_element.querySelectorAll(
        `.gradeLevel.minion[data-gradelvl][data-area][data-status]`
      );

      // Varför en nestlad object? JO, för vill ha allt i "grade_data" i db och kan inte bara pusha allt fritt
      let OBJ = {
        grade_data: {},
      };
      for (let el of gradeLevels) {
        let gradelvl = el.dataset.gradelvl;
        let area = el.dataset.area;
        let status = el.dataset.status;
        if (!(area in OBJ.grade_data)) {
          OBJ.grade_data[area] = {};
        }
        OBJ.grade_data[area][gradelvl] = status;
      }

      for (let el of feedback_elements) {
        if (el.value.length > 0) {
          let area = el.dataset.area;
          // Ifall det bara är feedback så behövs det även här.
          if (!(area in OBJ.grade_data)) {
            OBJ.grade_data[area] = {};
          }
          OBJ.grade_data[area]["feedback"] = el.value;
        }
      }

      // Uppdatera grading progress baserat på om ifylld cb eller om OBJ har någon data
      if (gradingFinished_checkbox.checked) {
        OBJ.grade_data.grading_progress = "finished";
      } else {
        let keys_in_data = Object.keys(OBJ.grade_data);
        if (keys_in_data.length > 0) {
          OBJ.grade_data.grading_progress = "started";
        }
      }

      res(OBJ);
    });
  }

  // Clear savelist
  sessionStorage.removeItem("saveList");

  function displaySaveDialogue() {
    let el = document.getElementById("saveDialogue");
    let cls = "saveDialogue--active";
    el.classList.add(cls);
    setTimeout(() => {
      el.classList.remove(cls);
    }, 3000);
  }

  function send_saved_data_to_FB(prop, result) {
    let studentDocRef = myApp.FB.activeStudents
      .doc(prop.student_uid)
      .collection("studentCourseList")
      .doc(prop.course_uid)
      .collection("asmts")
      .doc(prop.asmt_uid);
    studentDocRef.update(result).catch((_) => {
      print_error_message("no_permissions");
      Loader.finish();
      throw new Error("User lacks permission to do this");
    });
  }
}
// global variable för sparning
let saveTimeOut;

function restartSaveCountdown(param) {
  // Kolla om aktiv nedräkning finns, annars starta den (den sparar efter 15 sek)
  if (saveTimeOut) {
    clearTimeout(saveTimeOut);
  }

  if (param === "restart") {
    console.log("~~ Restarting saveCountdown");
    restart_countdown();
  } else if (param === "stop") {
    console.log("saveCountdown stopped");
  }

  function restart_countdown() {
    saveTimeOut = window.setTimeout(function () {
      console.log("~~~ saveCountdown finished. Saving ...");
      save_changes();
    }, 15000);
  }
}

function toggle_grading_status(p, progress) {
  let el = document.querySelector(
    `.courseIndex__asmt[data-course-uid="${p.course_uid}"][data-student-uid="${p.student_uid}"][data-for-asmt="${p.asmt_uid}"]`
  );
  const finished_class = "courseIndex__asmt--finished";
  const started_class = "courseIndex__asmt--started";
  if (progress === "finished") {
    el.classList.toggle(finished_class);
  } else if (progress === "started") {
    el.classList.add(started_class);
  }
}

// -- !! EVENT LISTENERS !! --
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("new-asmt").addEventListener("click", () => {
    handle_new_asmt();
  });
  document.getElementById("saveChanges-btn").addEventListener("click", () => {
    save_changes();
  });

  document
    .getElementById("studentExample-btn")
    .addEventListener("click", () => {
      display_section("example");
      const course_selection = document.getElementById("choose-course");
      course_selection.selectedIndex = 0;
    });
});

document.addEventListener("keydown", function (evt) {
  if (evt.key === "Escape") {
    let active_modal = document.querySelector(".modal--active");
    if (active_modal) {
      Modal.hide();
    }
  }

  let tgt = evt.target;
  if (tgt.classList.contains("asmt__feedback")) {
    const asmt_element = tgt.closest(".asmt");
    let asmt_prop = {
      asmt_uid: asmt_element.dataset.asmtUid,
      student_uid: asmt_element.dataset.studentUid,
      course_uid: asmt_element.dataset.courseUid,
    };
    register_student_change(asmt_prop);
  }
});

document.addEventListener("change", (evt) => {
  let tgt = evt.target;
  if (tgt.classList.contains("asmt__gradingFinished")) {
    const asmt_element = tgt.closest(".asmt");
    let asmt_prop = {
      asmt_uid: asmt_element.dataset.asmtUid,
      student_uid: asmt_element.dataset.studentUid,
      course_uid: asmt_element.dataset.courseUid,
    };
    register_student_change(asmt_prop);
    toggle_grading_status(asmt_prop, "finished");
  }
});

document.getElementById("choose-course").addEventListener("change", () => {
  const course_selection = document.getElementById("choose-course");
  display_section("content");
  const idx = course_selection.selectedIndex;
  const section = course_selection[idx].dataset.forSection;
  let start_section = document.getElementById("content-start");
  if (idx !== 0) {
    // Göm introsektionen nu när en kurs är vald
    start_section.classList.add("hidden");
  } else {
    start_section.classList.remove("hidden");
  }

  // remove previous active
  const course_container = document.getElementById("course-container");
  let activeExists = course_container.querySelector(".course--active");
  if (activeExists) {
    activeExists.classList.remove("course--active");
  }

  let course_to_display = course_container.querySelector(
    `.course[data-section="${section}"]`
  );

  let asmts_list = course_to_display.querySelector(".asmtTab__container")
    .children;

  let starting_div;
  if (asmts_list.length > 0) {
    starting_div = course_to_display.querySelector(".course-data");
  } else {
    starting_div = course_to_display.querySelector(".no-assessments");
  }
  starting_div.classList.add("student--active");
  course_to_display.classList.add("course--active");
});

document.addEventListener("click", (evt) => {
  const t = evt.target;
  if (t.dataset.dismiss === "modal") {
    Modal.hide();
  }

  if (t.classList.contains("accordion__button")) {
    t.classList.toggle("accordion__button--active");
  }

  if (t.dataset.tabTarget) {
    changeTab(t);
  }

  if (t.classList.contains("toggle-asmt-details")) {
    toggle_asmt_details(t);
  }

  if (t.classList.contains("show-asmt")) {
    show_asmt(t);
  }

  if (t.classList.contains("toggle-courseIndex")) {
    toggle_courseIndex(t);
  }
});

// document.querySelector('.nav__hamburger').addEventListener('click', () => {
//   // This is for toggling the hamburger nav
//   const nav = document.querySelector('.nav__menu')
//   const navLinks = document.querySelectorAll('.nav__li')

//   // Toggle Nav
//   nav.classList.toggle('nav__hamburger--active')

//   // Animate Links
//   navLinks.forEach((link, index) => {
//     if (link.style.animation) {
//       link.style.animation = '';

//     } else {
//       link.style.animation = `navLinkFade 0.5s ease forwards ${index / 7 + 0.3}s`;
//     }
//   })

//   // Burger Animation
//   document.querySelector('.nav__hamburger').classList.toggle('toggle')
// })

function toggle_courseIndex(btn) {
  btn.classList.toggle("toggle");
  let course_element = btn.parentElement;
  let sidebar = course_element.querySelector(".course__col--left");
  sidebar.classList.toggle("hidden");
}

function changeTab(tab_btn) {
  const asmts_container = tab_btn.closest(".tabContainer");
  const tab_btns = asmts_container.querySelectorAll("[data-tab-target]");
  const tab_contents = asmts_container.querySelectorAll("[data-tab-content]");

  let tab_index = tab_btn.dataset.tabTarget;
  let target = asmts_container.querySelector(
    `[data-tab-content="${tab_index}"]`
  );

  // remove active
  tab_contents.forEach((tab) => tab.classList.remove("active", "in"));
  tab_btns.forEach((btn) => btn.classList.remove("active"));

  // add to requested
  tab_btn.classList.add("active");
  target.classList.add("in", "active");

  // Resiza textareas nu när all data lagts in ordentligt
  target.querySelectorAll(`textarea`).forEach((TA) => {
    auto_grow(TA);
  });
}

/** !! HELPER FUNCTIONS !! */

function auto_grow(element) {
  element.style.height = "auto";
  element.style.height = element.scrollHeight + "px";
}

Element.prototype.spanify_text = function (text) {
  for (let word of text) {
    let word_span = document.createElement("span");
    word_span.textContent = word.w + " ";
    word_span.classList.add("word");
    word_span.dataset.word = word.n;
    if ("b" in word) {
      word_span.classList.add("word--emphasized");
    }
    this.append(word_span);
  }
};

function kill_children(parent) {
  return new Promise((res) => {
    while (parent.firstChild) {
      parent.removeChild(parent.firstChild);
    }
    res(parent);
  });
}
function clone_element(selector) {
  return document
    .getElementById("clone")
    .querySelector(selector)
    .cloneNode(true);
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

function formatDateAndTime(D) {
  let day, month, year, hours, minutes, seconds;

  day = addZero(D.getDate());
  month = addZero(D.getMonth() + 1); // offset zero index
  year = D.getFullYear();
  hours = addZero(D.getHours());
  minutes = addZero(D.getMinutes());
  seconds = addZero(D.getSeconds());

  return (
    year + "-" + month + "-" + day + " " + hours + ":" + minutes + ":" + seconds
  );

  // -- HELPER FUNC
  function addZero(i) {
    if (i < 10) {
      i = "0" + i;
    }
    return i;
  }
}

function remove_previous_active(course, cls) {
  const list = course.querySelectorAll(`.${cls}`);
  if (list) {
    for (let item of list) {
      item.classList.remove(cls);
    }
  }
}

function reloadPage(timeUntil) {
  setInterval(() => {
    location.reload();
    return false;
  }, timeUntil);
}

function print_error_message(message_type) {
  display_section("error");
  let error_section = document.getElementById("error-section");
  error_section
    .querySelector(`[data-error-type="${message_type}"]`)
    .classList.remove("hidden");
}

function load_teacher_ui() {
  display_section("content");
  // let navbar = document.getElementById("userOnly-nav");
  // navbar.classList.remove("hidden");
}

function display_section(requested_section) {
  let all_sections = document.querySelectorAll(".mainSection[data-section]");
  for (let s of all_sections) {
    if (s.dataset.section === requested_section) {
      s.classList.remove("hidden");
    } else {
      s.classList.add("hidden");
    }
  }
}

function toggle_asmt_details(btn) {
  let wrapper = btn.closest(".asmt__wrapper");
  let type = btn.dataset.toggleType;
  btn.classList.toggle("font-bold");
  wrapper
    .querySelector(`[data-toggle-target="${type}"]`)
    .classList.toggle("hidden");
}

function show_asmt(anchor) {
  let asmt_uid = anchor.dataset.asmtUid;
  let tabContainer = anchor.closest(".tabContainer");
  tabContainer.querySelector('[data-tab-target="1"]').click();
  let tab = tabContainer.querySelector(`.asmtTab[data-asmt-uid="${asmt_uid}"]`);
  tab.click();
  window.scrollTo({ top: 0, behavior: "smooth" });
}
