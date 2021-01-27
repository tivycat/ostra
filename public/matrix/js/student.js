// https://patorjk.com/software/taag/#p=display&h=2&v=1&f=ANSI%20Regular&t=localstorage*/
const myApp = {
  elements: {
    load: {
      userOnly: document.getElementById("userOnly-main"),
      preSignIn: document.getElementById("preSignIn"),
      hasCourses: [
        document.getElementById("userOnly-main_start"),
        document.getElementById("userOnly-nav"),
      ],
      noCourses: document.getElementById("userOnly-main_noCourses"),
    },
  },
  FB: {
    matris: firebase.firestore().collection("matrix"),
    studentRef: firebase
      .firestore()
      .collection("matrix")
      .doc("mStudents")
      .collection("mStudents--active"),
  },
};

const ONLOAD = {
  signedIn(hasCourses, user) {
    myApp.elements.load.userOnly.classList.remove("hidden");
    myApp.elements.load.preSignIn.classList.add("hidden");
    if (hasCourses) {
      myApp.elements.load.hasCourses.forEach((x) =>
        x.classList.remove("hidden")
      );
      myApp.elements.load.noCourses.classList.add("hidden");
    } else {
      myApp.elements.load.hasCourses.forEach((x) => x.classList.add("hidden"));
      myApp.elements.load.noCourses.classList.remove("hidden");
      myApp.elements.load.noCourses.querySelector(
        ".user__email"
      ).textContent = user;
    }
    Loader.finish();
  },
};

// Körs onload. Hanterar load-flödet (handle_student_load & append_load_data)
async function firebase_loaded(user, options) {
  Loader.start();
  let loadData = await handle_student_load(user, options);
  if (loadData === "noStudent") {
    ONLOAD.signedIn(false, user);
  } else if (loadData === "noCourses") {
    ONLOAD.signedIn(false, user);
  } else {
    append_load_data(loadData);
    ONLOAD.signedIn(true, user);
  }
}

// Hämtar data från FB och sedan returnerar data till firebase_loaded
async function handle_student_load(user, options) {
  if (options) {
    handle_load_options(options, user);
  }

  // querya användarens epost
  let studentQuery = await myApp.FB.studentRef
    .where("email", "==", user)
    .limit(1)
    .get();
  if (studentQuery.empty) {
    return "noStudent"; // Elevdokument gick inte att finna
  }

  let student = await breakoutFirebaseArray(studentQuery);
  student = student.shift(); // funktionen ovan returnerar array (som är 1 item i)
  // Hämta kurser
  let courseQuery = await student.ref
    .collection("studentCourseList")
    .get()
    .catch((_) => {
      throw new Error("User lacks permission to do this (list students");
    });
  if (courseQuery.empty) {
    return "noCourses"; // elevdokument finns men inga kurser
  }

  let courseArray = await breakoutFirebaseArray(courseQuery);
  let all_courses = [];

  for await (const courseDoc of courseArray) {
    if (courseDoc.exists) {
      let course = courseDoc.data();
      course.course_uid = courseDoc.id;
      course = await gather_asmts_for_course(courseDoc, course);
      all_courses.push(course);
    }
  }
  // OM DET HÄR INTE FUNGERAR SEDAN, TÄNK PÅ ATT MAN KAN GÖRA PROMISE.ALL()
  return all_courses;

  // -- FUNCTIONS
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

  async function breakoutFirebaseArray(query) {
    let array = [];
    query.forEach((x) => array.push(x));
    return array;
  }

  async function gather_asmts_for_course(courseDoc, course) {
    course.asmts = [];
    let asmtQuery = await courseDoc.ref.collection("asmts").get();
    if (asmtQuery.empty) {
      console.log(course.course_id, " --> ", "no asmts");
    } else {
      let asmtArray = await breakoutFirebaseArray(asmtQuery);
      for await (const asmtDoc of asmtArray) {
        if (asmtDoc.exists) {
          let asmt = asmtDoc.data();
          asmt.asmt_uid = asmtDoc.id;
          course.asmts.push(asmt);
        }
      }
    }
    return course;
  }
}

// Körs onload och hanterar datan from FB. Kopierar kurselement och lägger till
async function append_load_data(courses) {
  let course_idx = 0;
  for (let course of courses) {
    // -- DECLARATIONS
    const course_container = document.getElementById("course-container");
    const course_element = clone_element(".course");
    const courseId_element = course_element.querySelector(".course__courseId");
    const courseTitle_element = course_element.querySelector(
      ".course__courseTitle"
    );
    const master_container = course_element.querySelector(
      ".assessment__container--master"
    );

    // -- EXEC
    add_option_to_course_select(course, course_idx);
    populate_master(master_container, course.matrix.asmt_areas);

    courseId_element.textContent = course.course_id;
    courseTitle_element.textContent = course.course_title;

    course_element.dataset.courseId = course.course_id;
    course_element.id = `c-${course.course_uid}`;
    course_element.dataset.section = course_idx;
    course_container.appendChild(course_element);
    course_idx++;

    // // Lägg till asmts
    if ("asmts" in course && course.asmts.length > 0) {
      for await (let asmt of course.asmts) {
        create_asmt_element(asmt, course);
      }
      let asmt_wrappers_in_master = course_element.querySelectorAll(
        ".asmt__wrapper--master"
      );
      asmt_wrappers_in_master.forEach((el) => {
        calculate_feedback_sum_for_header(el);
        calculate_basis_sum_for_header(el);
      });
    }
  }

  // -- FUNCTIONS
  function add_option_to_course_select(course) {
    let new_option = document.createElement("option");
    new_option.textContent = course.course_id;
    new_option.dataset.course_id = course.course_id;
    new_option.dataset.course_title = course.course_title;
    new_option.dataset.courseUid = course.course_uid;
    new_option.dataset.forSection = course_idx;
    document.getElementById("choose-course").appendChild(new_option);
  }
}

function populate_master(container, matrix) {
  for (let gradeArea of matrix) {
    let mainWrapper = document.createElement("div");
    mainWrapper.className = "asmt__wrapper asmt__wrapper--master";
    mainWrapper.dataset.area = gradeArea.area_name;
    container.appendChild(mainWrapper);

    let header = document.createElement("header");
    header.className = "bg-neutral-200 py-2 px-3";
    mainWrapper.appendChild(header);

    let header_caption = document.createElement("span");
    header_caption.className = "text-xl";
    header_caption.textContent = gradeArea.area_name;
    header.appendChild(header_caption);

    let btn_group = document.createElement("div");
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
    toggleBasis_caption.className = "pointer-events-none";
    toggleBasis_caption.textContent = "Visa underlag";
    toggleBasis_btn.appendChild(toggleBasis_caption);

    let toggleBasis_amount = document.createElement("span");
    toggleBasis_amount.className = "basis-sum ml-1 pointer-events-none";
    toggleBasis_btn.appendChild(toggleBasis_amount);

    toggleBasis_btn.className =
      "toggle-asmt-details outline-none cursor-pointer rounded py-1 px-2 bg-transparent hover:underline";
    toggleBasis_btn.dataset.toggleType = "basis";
    btn_group.appendChild(toggleBasis_btn);
    header.appendChild(btn_group);

    let gradeLevels_wrapper = document.createElement("div");
    gradeLevels_wrapper.classList.add(
      "gradeLevel__wrapper",
      "flex",
      "flex-wrap"
    );
    mainWrapper.appendChild(gradeLevels_wrapper);

    for (let criteria of gradeArea.criteria) {
      const gradelvl_wrapper = document.createElement("div");
      gradelvl_wrapper.className = "gradeLevel master w-4/12 md:w-full";
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
      "asmt__feedbackWrapper mt-1 mb-4 border border-neutral-900 rounded px-1 py-1 hidden";
    feedbackWrapper.dataset.area = gradeArea.area_name;
    feedbackWrapper.dataset.toggleTarget = "feedback";
    mainWrapper.appendChild(feedbackWrapper);

    let feedbackHeader = document.createElement("h3");
    feedbackHeader.textContent = "Feedback för detta område";
    feedbackHeader.className = "font-bold mb-1";
    feedbackWrapper.appendChild(feedbackHeader);

    let feedBack_container = document.createElement("ul");
    feedBack_container.className = "asmt__feedbackContainer list-none ml-0";
    feedbackWrapper.appendChild(feedBack_container);

    let basisWrapper = document.createElement("div");
    basisWrapper.className =
      "asmt__basisWrapper mt-1 mb-4 border border-neutral-900 rounded px-1 py-1 hidden";
    basisWrapper.dataset.area = gradeArea.area_name;
    basisWrapper.dataset.toggleTarget = "basis";
    mainWrapper.appendChild(basisWrapper);

    let basisHeader = document.createElement("h3");
    basisHeader.textContent = "Underlag som utgör bedömningen";
    basisHeader.className = "font-bold mb-1";
    basisWrapper.appendChild(basisHeader);

    let basisContainer = document.createElement("ul");
    basisContainer.className = "asmt__basisContainer list-none ml-0";
    basisWrapper.appendChild(basisContainer);
  }
}

async function create_asmt_element(asmt, course) {
  // -- DECLARATIONS
  const asmt_element = clone_element(".asmt");
  const caption_element = asmt_element.querySelector(".asmt__caption");
  const date_element = asmt_element.querySelector(".asmt__date");
  const description_element = asmt_element.querySelector(".asmt__description");
  const asmt_container = asmt_element.querySelector(
    ".assessment__container--minion"
  );
  const course_element = document.getElementById("c-" + course.course_uid);
  caption_element.textContent = asmt.caption;
  date_element.textContent = asmt.createdOn.substring(0, 10);
  description_element.textContent = asmt.description;
  asmt_element.dataset.caption = asmt.caption;
  asmt_element.dataset.asmtUid = asmt.asmt_uid;
  asmt_element.dataset.courseUid = course.course_uid;

  // Skapa <LI> i tablist och appenda elementet till  tabcontent.
  // OBS måste göras nu för att kunna lägga till grade_data senare.
  // Måste kunna åkalla detta då. Varför skapar vi dessa här ist för HTML?
  // Måste ju ändå göra
  let tabContent_container = course_element.querySelector(
    ".asmtTab__container"
  );
  let tabList_container = course_element.querySelector(".asmtTab__list");
  let tabContent_list = course_element.querySelectorAll("[data-tab-content]");
  let currentIndex = tabContent_list.length; // Fungerar eftersom index startar på 0 och byggs på för varje så behöver inte ++

  let tabList_item = document.createElement("li");
  tabList_item.classList.add("asmtTab", "hover:bg-neutral-900");
  tabList_item.dataset.tabTarget = currentIndex;
  tabList_item.dataset.asmtUid = asmt.asmt_uid;

  let tabList_label = document.createElement("span");
  tabList_label.classList.add("py-2", "px-2", "pointer-events-none");
  tabList_label.textContent = asmt.caption;
  tabList_item.appendChild(tabList_label);
  tabList_container.appendChild(tabList_item);

  asmt_element.dataset.tabContent = currentIndex;
  tabContent_container.appendChild(asmt_element);

  // // Skapa själva tabellen
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
    header.className = "bg-neutral-200 py-2 px-3 text-xl";
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
      gradelvl_wrapper.className = "gradeLevel minion w-4/12 md:w-full";
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

    // Om feedback finns i asmt, lägg till i minion, sedan i master.,
    let gradeArea_in_master = course_element.querySelector(
      `.asmt__wrapper--master[data-area="${gradeArea.area_name}"]`
    );
    if (
      "grade_data" in asmt &&
      gradeArea.area_name in asmt.grade_data &&
      "feedback" in asmt.grade_data[gradeArea.area_name]
    ) {
      // Lägg till feedback för detta område
      let feedbackWrapper = document.createElement("div");
      feedbackWrapper.className = "hidden";
      mainWrapper.appendChild(feedbackWrapper);

      let feedbackHeader = document.createElement("h4");
      feedbackHeader.className = "font-bold my-2";
      feedbackHeader.textContent = "Feedback för detta område";
      feedbackWrapper.appendChild(feedbackHeader);

      let feedbackBody = document.createElement("div");
      feedbackBody.dataset.area = gradeArea.area_name;
      feedbackBody.className =
        "asmt__feedback rounded px-2 py-1 text-neutral-800 border";
      feedbackWrapper.appendChild(feedbackBody);

      let feedbackLi_master = document.createElement("li");
      feedbackLi_master.classList.add("asmt__feedbackLi", "mb-3");

      let feedbackLi_master_caption = document.createElement("span");
      feedbackLi_master_caption.className =
        "text-neutral-700 underline mr-1 font-lg font-bold";
      feedbackLi_master_caption.textContent = asmt.caption + ":";
      feedbackLi_master.appendChild(feedbackLi_master_caption);

      let feedbackLi_master_body = document.createElement("span");
      feedbackLi_master_body.className =
        "asmt__feedbackBody whitespace-pre-wrap";
      feedbackLi_master.appendChild(feedbackLi_master_body);

      let master_feedbackWrapper = gradeArea_in_master.querySelector(
        `.asmt__feedbackWrapper[data-area="${gradeArea.area_name}"]`
      );
      // Om feedback finns i asmt, lägg till feedbackLi_master i master-containern
      let master_feedback_container = master_feedbackWrapper.querySelector(
        "ul"
      );
      master_feedback_container.appendChild(feedbackLi_master);

      feedbackBody.textContent = asmt.grade_data[gradeArea.area_name].feedback;
      feedbackWrapper.classList.remove("hidden");
      feedbackLi_master_body.textContent =
        asmt.grade_data[gradeArea.area_name].feedback;
    }
  }
}

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
  // Om feedback inte finns så ta bort "visa feedback"-knappen helt och hållet
  if (number_with_feedback === 0) {
    let entire_btn = btn.parentElement;
    entire_btn.parentElement.removeChild(entire_btn);
  } else {
    btn.textContent = `[${number_with_feedback}]`;
  }
}

function calculate_basis_sum_for_header(gradeArea_in_master) {
  const area = gradeArea_in_master.dataset.area;
  const course_element = gradeArea_in_master.closest(".course");
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
      "show-asmt",
      "hover:underline",
      "cursor-pointer",
      "hover:font-bold"
    );
    li.appendChild(anchor);

    anchor.textContent = asmt.dataset.caption;
    anchor.dataset.asmtUid = asmt.dataset.asmtUid;
    container.appendChild(li);
  }

  let btn = gradeArea_in_master.querySelector(".basis-sum");
  btn.textContent = `[${all_area_minions.length}]`;
}

// Applicerar status på .minion element och kör sedan apply_status_to_master
function apply_status_to_minion(el, status) {
  let course_element = el.closest(".course");
  let master_element = course_element.querySelector(
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
  let course_element = master_element.closest(".course");
  let gradelvl = master_element.dataset.gradelvl;
  let area = master_element.dataset.area;
  let this_from_all_minion = course_element.querySelectorAll(
    `.gradeLevel.minion[data-gradelvl="${gradelvl}"][data-area="${area}"]`
  );

  let val;
  let number_of_met = 0;
  let number_of_unmet = 0;

  for (let asmt of this_from_all_minion) {
    console.log();
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
}

/*
██   ██ ███████ ██      ██████  ███████ ██████      ███████ ██    ██ ███    ██  ██████ ███████ 
██   ██ ██      ██      ██   ██ ██      ██   ██     ██      ██    ██ ████   ██ ██      ██      
███████ █████   ██      ██████  █████   ██████      █████   ██    ██ ██ ██  ██ ██      ███████ 
██   ██ ██      ██      ██      ██      ██   ██     ██      ██    ██ ██  ██ ██ ██           ██ 
██   ██ ███████ ███████ ██      ███████ ██   ██     ██       ██████  ██   ████  ██████ ███████ 
*/

function clone_element(selector) {
  let el = document.getElementById("clone");
  return el.querySelector(`${selector}`).cloneNode(true);
}

function kill_children(parent) {
  return new Promise((res) => {
    while (parent.firstChild) {
      parent.removeChild(parent.firstChild);
    }
    res(parent);
  });
}

Element.prototype.insertableElement = function (selector) {
  return this.querySelector(`[data-insert="${selector}"]`);
};

/*
███████ ██    ██ ████████     ██      ██ ███████ ████████ ███████ ███    ██ ███████ ██████  ███████ 
██      ██    ██    ██        ██      ██ ██         ██    ██      ████   ██ ██      ██   ██ ██      
█████   ██    ██    ██        ██      ██ ███████    ██    █████   ██ ██  ██ █████   ██████  ███████ 
██       ██  ██     ██        ██      ██      ██    ██    ██      ██  ██ ██ ██      ██   ██      ██ 
███████   ████      ██        ███████ ██ ███████    ██    ███████ ██   ████ ███████ ██   ██ ███████ 
*/

document.getElementById("choose-course").addEventListener("change", () => {
  const course_selection = document.getElementById("choose-course");
  const idx = course_selection.selectedIndex;
  const section = course_selection[idx].dataset.forSection;
  if (idx !== 0) {
    // Göm introsektionen nu när en kurs är vald
    document.getElementById("userOnly-main_start").classList.add("hidden");
  }

  // remove previous active
  const course_container = document.getElementById("course-container");
  let activeExists = course_container.querySelector(".course--active");
  if (activeExists) {
    activeExists.classList.remove("course--active");
  }
  course_container
    .querySelector(`.course[data-section="${section}"]`)
    .classList.add("course--active");
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
  const t = evt.target;

  if (t.dataset.dismiss === "modal") {
    Modal.hide();
  }

  if (t.classList.contains("accordion__button")) {
    t.classList.toggle("accordion__button--active");
  }

  if (
    t.classList.contains("word") &&
    t.dataset.status &&
    t.parentElement.classList.contains("td--master")
  ) {
    let asmtList = t.dataset.asmtList;
    display_feedback_modal(asmtList);
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
});

function toggle_asmt_details(btn) {
  let wrapper = btn.closest(".asmt__wrapper");
  let type = btn.dataset.toggleType;
  console.log(type);
  btn.classList.toggle("font-bold");
  console.log(wrapper);
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
