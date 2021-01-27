/*
███████ ██    ██ ███████ ███    ██ ████████ ███████ 
██      ██    ██ ██      ████   ██    ██    ██      
█████   ██    ██ █████   ██ ██  ██    ██    ███████ 
██       ██  ██  ██      ██  ██ ██    ██         ██ 
███████   ████   ███████ ██   ████    ██    ███████ 
                                                    
                                                    
*/

// Hämta data från LocalStorage (detta för att undvika att behöva hämta ALL data varje gång. Det behövs inte.)
document.addEventListener("DOMContentLoaded", () => {
  (async () => {
    // populate the select in newUser-student
    let sel1 = document.getElementById("newStudent-coach");
    let sel2 = document.getElementById("editResult-coach--student");
    let teachers = await get_data_from_localStorage("teachers");

    for (let t of teachers) {
      let option1 = document.createElement("option1");
      option1.dataset.email = t.email;
      option1.value = t.email;
      option1.dataset.name = t.name;
      option1.textContent = t.name;
      sel1.appendChild(option1);

      let option2 = document.createElement("option");
      option2.dataset.email = t.email;
      option2.value = t.email;
      option2.dataset.name = t.name;
      option2.textContent = t.name;
      sel2.appendChild(option2);
    }
  })();

  loader_finish();

  // Radio buttons i modal "new-user" : change
  document.querySelectorAll('input[name="choose-user-type"]').forEach((radio) => {
    radio.addEventListener("change", (evt) => {
      let modal = evt.target.closest(".modal");
      let type = evt.target.value;
      modal.querySelectorAll(".inputFields").forEach((p) => {
        if (p.classList.contains(`inputFields--${type}`)) {
          p.classList.remove("hidden");
        } else {
          p.classList.add("hidden");
        }
      });
      modal.querySelector(".modal__footer").classList.remove("hidden");
    });
  });

  // Escape stänger modal
  document.addEventListener("keydown", function (evt) {
    if (evt.key === "Escape") {
      let active_modal = document.querySelector(".modal--active");
      if (active_modal) {
        Modal.hide();
      }
    }
  });

  // Clickevents i dokumentet
  document.addEventListener("click", (ev) => {
    let el = ev.target;

    if (el.classList.contains("ot__expandable")) {
      let activeRow = el.closest(".ot__row");
      let state;
      if (el.classList.contains("ot__btn--expanded")) {
        el.classList.remove("ot__btn--expanded");
        el.classList.add("ot__btn--collapsed");
        state = "collapsed";
      } else if (el.classList.contains("ot__btn--collapsed")) {
        el.classList.remove("ot__btn--collapsed");
        el.classList.add("ot__btn--expanded");
        state = "expanded";
      }
      collapseSubRows(activeRow, state);
    }

    if (el.classList.contains("modal-trigger")) {
      let type = el.dataset.forModal;
      let customType = el.dataset.modalType;
      Modal.show(type, customType);
    }

    if (el.classList.contains("modal__close")) {
      Modal.hide();
    }

    if (el.classList.contains("openCourse")) {
      let teacher = el.dataset.teacher;
      let course = el.dataset.course;
      let course_title = el.dataset.courseTitle;
      let teacher_name = el.dataset.teacherName;
      let students = JSON.parse(el.dataset.students);
      let modal = el.closest(".modal");

      if (modal.dataset.modal === "courses") {
        get_search_result_course({ teacher: teacher, course: course, course_title: course_title, students: students });
        document.querySelector(".interactionRow--courses").classList.remove("hidden");
        Modal.hide();
      }

      // Adding courses to a new student
      if (modal.dataset.modal === "users") {
        let section = el.closest(".modal__section");
        let type;
        let role = el.closest(".editResult").dataset.role;
        console.log;
        if (section.id === "edit-module") {
          type = "edit";
        } else if (section.id === "add-new-module") {
          type = "new";
        }

        add_course_to_courselist(
          {
            teacher: teacher,
            course: course,
            teacher_name: teacher_name,
            course_title: course_title,
          },
          type,
          role
        );
      }
    }

    if (el.classList.contains("openUserToEdit")) {
      edit_user_open({
        role: el.dataset.role,
        email: el.dataset.email,
        name: el.dataset.name,
      });
    }

    if (el.classList.contains("addStudentToCoachlist")) {
      let section = el.closest(".modal__section");
      let type;
      if (section.id == "edit-module") {
        type = "edit";
      } else if (section.id === "add-new-module") {
        type = "new";
      }
      add_student_to_coachlist({ name: el.dataset.name, email: el.dataset.email, class: el.dataset.class }, type);
    }

    if (el.id === "add-user") {
      document.getElementById("add-new-module").classList.remove("hidden");
      el.parentElement.classList.add("hidden");
      el.closest(".modal").querySelector(".modal__footer").classList.remove("hidden");
    }

    if (el.id === "edit-user") {
      reset_modal(el.closest(".modal"));
      let module = document.getElementById("edit-module");
      module.classList.remove("hidden");
      module.querySelector(".search").classList.remove("hidden");

      el.parentElement.classList.add("hidden");
    }

    if (el.id === "create-new-user") {
      let chosen_type = document.querySelector('input[name="choose-user-type"]:checked').value;
      handle_create_user(chosen_type);
    }

    if (el.classList.contains("close-modal")) {
      Modal.hide();
    }

    if (el.id === "confirm-edit-user") {
      let user = JSON.parse(sessionStorage.getItem("edit-user"));
      edit_user_save(user.role);
    }
  });
});

/**

██      ██████   ██████  █████  ██      ███████ ████████  ██████  ██████   █████   ██████  ███████ 
██     ██    ██ ██      ██   ██ ██      ██         ██    ██    ██ ██   ██ ██   ██ ██       ██      
██     ██    ██ ██      ███████ ██      ███████    ██    ██    ██ ██████  ███████ ██   ███ █████   
██     ██    ██ ██      ██   ██ ██           ██    ██    ██    ██ ██   ██ ██   ██ ██    ██ ██      
███████ ██████   ██████ ██   ██ ███████ ███████    ██     ██████  ██   ██ ██   ██  ██████  ███████ 
                                                                                                   
                                                                                                   

 * 
 */

// Hämta elever från LocalStorage. I framtiden kommer det behövs en parameter med en string, typ students eller teachers
function get_data_from_localStorage(type) {
  return new Promise((resolve, reject) => {
    let output;
    if (type === "all") {
      try {
        output = JSON.parse(localStorage.getItem("admin_data"));
      } catch (e) {}
    } else if (type === "students") {
      try {
        output = JSON.parse(localStorage.getItem("admin_students"));
      } catch (e) {}
    } else if (type === "courses") {
      try {
        output = JSON.parse(localStorage.getItem("admin_courses"));
      } catch (e) {}
    } else if (type === "teachers") {
      try {
        output = JSON.parse(localStorage.getItem("admin_teachers"));
      } catch (e) {}
    }
    resolve(output);
  });
}

/**

 ██████  ██████       ██ ███████  ██████ ████████     ████████ ██████  ███████ ███████ 
██    ██ ██   ██      ██ ██      ██         ██           ██    ██   ██ ██      ██      
██    ██ ██████       ██ █████   ██         ██           ██    ██████  █████   █████   
██    ██ ██   ██ ██   ██ ██      ██         ██           ██    ██   ██ ██      ██      
 ██████  ██████   █████  ███████  ██████    ██           ██    ██   ██ ███████ ███████ 
                                                                                       
                                                                                       
*/

// Objektträdsfunktionen
function populate_object_tree(prop, altHeader) {
  let row_header = {
    depth: 0,
    expandable: true,
    key: {
      editable: false,
    },
    value: {
      editable: false,
    },
  };

  if (typeof prop === "object" && !Array.isArray(prop)) {
    row_header.key["text"] = "Object";
    row_header.value["type"] = "object";
    row_header.value["text"] = Object.keys(prop).length;
  } else if (Array.isArray(prop)) {
    row_header.key["text"] = "Array";
    row_header.value["type"] = "array";
    row_header.value["text"] = prop.length;
  }

  let title;
  if (altHeader) {
    title = altHeader;
  } else {
    title = row_header.key.text;
  }

  handle_row_creation(prop, 0, title);
}

// Ordningen för objektträdsskapande
let handle_row_creation = (prop, depth, keyText) => {
  if (typeof prop === "object") {
    // Header for the object
    let param = {
      depth: depth,
      expandable: true,
      key: {
        editable: false,
        text: keyText,
      },
      value: {
        editable: false,
      },
    };
    if (Array.isArray(prop)) {
      param.value["type"] = "array";
      param.value["text"] = prop.length;

      create_row_elements(param);
      depth++; // After a header, we increase the depth

      let index = 0;
      for (let item of prop) {
        handle_row_creation(item, depth, index++);
      }
    } else {
      param.value["type"] = "object";
      param.value["text"] = Object.keys(prop).length;

      create_row_elements(param);
      depth++; // After a header, we increase the depth

      for (let key in prop) {
        handle_row_creation(prop[key], depth, key);
      }
    }
  } else {
    // i.e. this is a string
    create_row_elements({
      depth: depth,
      expandable: false,
      key: {
        editable: true,
        text: keyText,
      },
      value: {
        editable: true,
        type: "string",
        text: prop,
      },
    });
  }
};

// Själva DOM-skapandet för objektträd
function create_row_elements(p) {
  let row = document.createElement("tr");
  row.classList.add("ot__row");
  row.dataset.depth = p.depth;
  document.getElementById("main-tbody").appendChild(row);

  let td_drag = document.createElement("td");
  td_drag.classList.add("ot__drag");
  row.appendChild(td_drag);

  let btn_drag = document.createElement("button");
  btn_drag.classList.add("ot__button", "ot__dragArea");
  btn_drag.title = "Dra för att flytta till annan plats";
  td_drag.appendChild(btn_drag);

  let td_actionMenu = document.createElement("td");
  td_actionMenu.classList.add("ot__action-menu");
  row.appendChild(td_actionMenu);

  let btn_actionMenu = document.createElement("button");
  btn_actionMenu.classList.add("ot__button", "ot__menuButton");
  btn_actionMenu.title = "Tryck för att öppna meny";
  td_actionMenu.appendChild(btn_actionMenu);

  let td_valueContainer = document.createElement("td");
  td_valueContainer.classList.add("ot__values-container");
  row.appendChild(td_valueContainer);

  let valuesTable = document.createElement("table");
  valuesTable.classList.add("ot__valuesTable");
  let marginLeft = p.depth * 24 + "px";
  valuesTable.style.marginLeft = marginLeft;
  valuesTable.dataset.depth = p.depth;
  td_valueContainer.appendChild(valuesTable);

  let valuesTbody = document.createElement("tbody");
  valuesTable.appendChild(valuesTbody);
  let valuesRow = document.createElement("tr");
  valuesTbody.appendChild(valuesRow);

  let td_expand = document.createElement("td");
  td_expand.classList.add("ot__expand");
  valuesRow.appendChild(td_expand);

  let btn_expand = document.createElement("button");
  btn_expand.classList.add("ot__button");
  if (p.expandable) {
    btn_expand.classList.add("ot__expandable", "ot__btn--expanded");
  } else {
    btn_expand.classList.add("ot__button--invisible");
  }
  td_expand.appendChild(btn_expand);

  let td_key = document.createElement("td");
  td_key.classList.add("ot__key");
  valuesRow.appendChild(td_key);

  let key_div = document.createElement("div");
  // key_div.setAttribute('contenteditable', p.key.editable)
  key_div.classList.add("ot__textformatting");
  key_div.textContent = p.key.text;
  td_key.appendChild(key_div);

  let td_separator = document.createElement("td");
  td_separator.classList.add("ot__separator");
  if (p.value.type !== "string") {
    td_separator.classList.add("hidden");
  }
  valuesRow.appendChild(td_separator);

  let td_valueOrLen = document.createElement("td");
  td_valueOrLen.classList.add("ot__valueOrLen");
  valuesRow.appendChild(td_valueOrLen);

  let valueOrLen_div = document.createElement("div");
  // valueOrLen_div.setAttribute('contenteditable', p.value.editable)
  valueOrLen_div.classList.add("ot__textformatting", `ot__value--${p.value.type}`);
  valueOrLen_div.textContent = p.value.text;
  td_valueOrLen.appendChild(valueOrLen_div);
}

// För att kollapsa underliggande rader i objektträdet
function collapseSubRows(row, state) {
  const depth = row.dataset.depth;
  while (row.nextElementSibling) {
    row = row.nextElementSibling;
    if (row.dataset.depth > depth) {
      if (state === "expanded") {
        row.classList.remove("hidden");
      } else if (state === "collapsed") {
        row.classList.add("hidden");
      }
    } else {
      break;
    }
  }
}
/*
 █████  ██    ██ ████████  ██████   ██████  ██████  ███    ███ ██████  ██      ███████ ████████ ███████ 
██   ██ ██    ██    ██    ██    ██ ██      ██    ██ ████  ████ ██   ██ ██      ██         ██    ██      
███████ ██    ██    ██    ██    ██ ██      ██    ██ ██ ████ ██ ██████  ██      █████      ██    █████   
██   ██ ██    ██    ██    ██    ██ ██      ██    ██ ██  ██  ██ ██      ██      ██         ██    ██      
██   ██  ██████     ██     ██████   ██████  ██████  ██      ██ ██      ███████ ███████    ██    ███████ 
                                                                                                        
                                                                                                        
*/

async function search_with_autocomplete(search_text, searchType, matchList) {
  let data;
  if (searchType == "students") {
    try {
      data = await get_data_from_localStorage("students");
    } catch (e) {
      console.log(e);
      Toast.show("Ingen data i LS. Hämta ny statistik", "error");
    }

    if (typeof data == "object") {
      // Get matches to current text input
      let matches = data.filter((student) => {
        const regex = new RegExp(`^${search_text}`, "gi"); // ^ = starts with, 'gi' global & case INsensitive
        return student.name.match(regex) || student.email.match(regex);
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
      <div class="card card__body addStudentToCoachlist" data-class="${match.class}" data-name="${match.name}" data-email="${match.email}"'>
      <h5>${match.name} <span class="card__text--alternative">(${match.class})</span></h5>
      </div>
      `
          )
          .join(""); // puts all the arrays together
        matchList.innerHTML = html;
      }
    }
  } else if (searchType == "all_users") {
    let data2;
    try {
      data = await get_data_from_localStorage("students");
      data2 = await get_data_from_localStorage("teachers");
    } catch (e) {
      console.log(e);
      Toast.show("Ingen data i LS. Hämta ny statistik", "error");
    }

    // Lägg ihop elever och lärare
    data = data.concat(data2);

    if (typeof data == "object") {
      // Get matches to current text input
      let matches = data.filter((user) => {
        const regex = new RegExp(`^${search_text}`, "gi"); // ^ = starts with, 'gi' global & case INsensitive
        return user.name.match(regex) || user.email.match(regex);
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
      <div class="card card__body openUserToEdit" data-role="${match.role}"data-name="${match.name}" data-email="${match.email}"'>
      <h5>${match.name} <span class="card__text--alternative">(${match.email})</span></h5>
      </div>
      `
          )
          .join(""); // puts all the arrays together
        matchList.innerHTML = html;
      }
    }
  } else if (searchType == "courses") {
    try {
      data = await get_data_from_localStorage("courses");
    } catch (e) {
      console.log(e);
      Toast.show("Ingen data i LS. Hämta ny statistik", "error");
    }

    if (typeof data == "object") {
      // Get matches to current text input
      let matches = data.filter((course) => {
        const regex = new RegExp(`^${search_text}`, "gi"); // ^ = starts with, 'gi' global & case INsensitive
        return course.course_id.match(regex) || course.teacher_name.match(regex);
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
      <div class="card card__body openCourse" data-teacher-name="${match.teacher_name}"data-teacher="${match.teacher_email}" data-course="${
              match.course_id
            }" data-course-title="${match.course_title}" data-students='${JSON.stringify(match.students)}'>
      <h5>${match.course_id} <span class="card__text--alternative">(${match.teacher_name})</span></h5>
      </div>
      `
          )
          .join(""); // puts all the arrays together
        matchList.innerHTML = html;
      }
    }
  }
}

function add_student_to_coachlist(p, type) {
  let student_list;
  if (type == "new") {
    student_list = document.getElementById("newTeacher-coachStudents");
  } else if (type === "edit") {
    student_list = document.getElementById("editResult-coachstudents");
  }

  let existsEarlier = student_list.querySelector(`[data-email="${p.email}"]`);
  if (existsEarlier) {
    Toast.show("Eleven finns redan i listan", "error");
    return;
  }

  let li = document.createElement("li");
  li.textContent = `${p.name} (${p.class})`;
  li.dataset.email = p.email;
  li.dataset.name = p.name;

  // Only use hyperlinks for navigation, not to have something to click on. Any element can be clicked
  let button = document.createElement("button");
  button.classList.add("button--small", "button--red", "ml-2");
  button.textContent = "Ta bort";
  button.addEventListener("click", remove_student_from_coachlist);
  li.appendChild(button);
  student_list.appendChild(li);

  function remove_student_from_coachlist() {
    // Just remove the closest <li> ancestor to the <span> that got clicked
    student_list.removeChild(this.closest("li"));
  }
}

function clear_tbody() {
  return new Promise((resolve) => {
    let tbody = document.getElementById("main-tbody");
    emptyElement(tbody);
    resolve("done");
  });
}

async function get_search_result_course(p) {
  // set active element to main tbody so we have something to get that data from
  document.getElementById("main-tbody").dataset.activeCourse = p.course;
  document.getElementById("main-tbody").dataset.activeCourseTitle = p.course_title;
  document.getElementById("main-tbody").dataset.activeOriginalTeacher = p.teacher;

  clear_tbody().then(populate_object_tree(p, p.course));
}

/*
███    ███  ██████  ██████   █████  ██      
████  ████ ██    ██ ██   ██ ██   ██ ██      
██ ████ ██ ██    ██ ██   ██ ███████ ██      
██  ██  ██ ██    ██ ██   ██ ██   ██ ██      
██      ██  ██████  ██████  ██   ██ ███████ 
                                            
                                            
*/

// Modal - Öppna och stäng
const Modal = {
  async show(type, customType) {
    let modal = document.querySelector(`[data-modal="${type}"]`);
    reset_modal(modal);

    if (type == "custom") {
      create_elements_for_custom(customType, modal);
    }
    modal.classList.add("modal--active");
  },
  hide() {
    let active_modal = document.querySelector(".modal--active");
    if (active_modal) {
      active_modal.classList.remove("modal--active");
    }
  },
};

function reset_modal(el) {
  let type = el.dataset.modal;

  if (type === "custom") {
    let title = el.querySelector(".modal__title");
    let body = el.querySelector(".modal__body");
    let footer = el.querySelector(".modal__footer");

    title.innerHTML = "";
    body.innerHTML = "";
    footer.innerHTML = "";
  } else if (type === "users") {
    // hide sections
    el.querySelectorAll(".modal__section").forEach((section) => {
      section.classList.add("hidden");
    });

    el.querySelectorAll("[data-reset]").forEach((x) => {
      if (x.dataset.reset === "children") {
        emptyElement(x);
      }
      if (x.dataset.reset === "value") {
        x.value = "";
      }
    });

    // show button row
    document.getElementById("modal-users-chooseType").classList.remove("hidden");
  }
}

async function create_elements_for_custom(customType, modal) {
  let title = modal.querySelector(".modal__title");
  let body = modal.querySelector(".modal__body");
  let footer = modal.querySelector(".modal__footer");

  let active_course = document.getElementById("main-tbody").dataset.activeCourse;
  let active_course_title = document.getElementById("main-tbody").dataset.activeCourseTitle;
  let original_teacher = document.getElementById("main-tbody").dataset.activeOriginalTeacher;

  if (customType === "update_stats") {
    title.textContent = "Bekräfta uppdatera statistik";
    let p = document.createElement("p");
    body.appendChild(p);
    p.textContent = "Uppdatering av statistiken innebär en läsning av samtliga elevdokument. Det kan ta några sekunder...";

    let confirm_btn = document.createElement("button");
    confirm_btn.classList.add("button", "button--green");
    confirm_btn.textContent = "Bekräfta";
    confirm_btn.addEventListener("click", () => {
      handle_update_statistics();
    });
    footer.appendChild(confirm_btn);

    let cancel_btn = document.createElement("button");
    cancel_btn.classList.add("button", "button--red", "modal__close");
    cancel_btn.textContent = "Avbryt";
    cancel_btn.addEventListener("click", () => {
      Modal.hide();
    });
    footer.appendChild(cancel_btn);
  }
  if (customType === "delete_course") {
    title.textContent = `Bekräfta borttagning av ${active_course}`;

    let confirm_btn = document.createElement("button");
    confirm_btn.classList.add("button", "button--green");
    confirm_btn.textContent = "Bekräfta";
    confirm_btn.addEventListener("click", () => {
      click_delete_course(active_course);
    });
    footer.appendChild(confirm_btn);

    let cancel_btn = document.createElement("button");
    cancel_btn.classList.add("button", "button--red", "modal__close");
    cancel_btn.textContent = "Avbryt";
    cancel_btn.addEventListener("click", () => {
      Modal.hide();
    });
    footer.appendChild(cancel_btn);
  }

  if (customType === "change_teacher") {
    title.textContent = `Välj ny lärare för ${active_course}`;

    let select = document.createElement("select");
    select.classList.add("select-css", "select__teacher");
    let fake_option = document.createElement("option");
    fake_option.textContent = "Välj ny lärare";
    fake_option.disabled = true;
    select.appendChild(fake_option);
    body.appendChild(select);

    let teacher_array = await get_data_from_localStorage("teachers");
    for (let t of teacher_array) {
      let option = document.createElement("option");
      option.textContent = `${t.name} (${t.email})`;
      option.dataset.email = t.email;
      option.dataset.name = t.name;
      select.appendChild(option);
    }

    select.selectedIndex = 0; // Sätt till 0

    let p = document.createElement("p");
    body.appendChild(p);
    p.classList.add("my-4");
    p.textContent = "Om lärare saknas i listan så kan du skriva namn och email i fälten nedan istället";

    let label_n = document.createElement("label");
    body.appendChild(label_n);
    label_n.classList.add("d-block");
    label_n.textContent = "Namn (Efternamn, Förnamn)";
    let input_n = document.createElement("input");
    label_n.appendChild(input_n);
    input_n.classList.add("inputText", "d-block");
    input_n.type = "text";
    input_n.id = "change-teacher-name";

    let label_e = document.createElement("label");
    body.appendChild(label_e);
    label_e.classList.add("d-block");
    label_e.textContent = "Email";
    let input_e = document.createElement("input");
    label_e.appendChild(input_e);
    input_e.classList.add("inputText", "d-block");
    input_e.type = "email";
    input_e.id = "change-teacher-email";

    select.addEventListener("change", () => {
      let i = select.selectedIndex;
      let option = select.options[i];

      input_n.value = option.dataset.name;
      input_e.value = option.dataset.email;
    });

    let confirm_btn = document.createElement("button");
    confirm_btn.classList.add("button", "button--green");
    confirm_btn.textContent = "Bekräfta";
    confirm_btn.addEventListener("click", () => {
      if (input_e.value === original_teacher) {
        Toast.show("..Samma lärare som innan? Välj en annan om du ska byta", "error");
        return;
      }

      click_change_teacher_for_course({
        course: active_course,
        course_title: active_course_title,
        name: input_n.value,
        email: input_e.value,
        original_teacher: original_teacher,
      });
    });
    footer.appendChild(confirm_btn);

    let cancel_btn = document.createElement("button");
    cancel_btn.classList.add("button", "button--red", "modal__close");
    cancel_btn.textContent = "Avbryt";
    cancel_btn.addEventListener("click", () => {
      Modal.hide();
    });
    footer.appendChild(cancel_btn);
  }
}

/**
 █████  ██████  ██████      ██ ███████ ██████  ██ ████████     ██    ██ ███████ ███████ ██████  
██   ██ ██   ██ ██   ██    ██  ██      ██   ██ ██    ██        ██    ██ ██      ██      ██   ██ 
███████ ██   ██ ██   ██   ██   █████   ██   ██ ██    ██        ██    ██ ███████ █████   ██████  
██   ██ ██   ██ ██   ██  ██    ██      ██   ██ ██    ██        ██    ██      ██ ██      ██   ██ 
██   ██ ██████  ██████  ██     ███████ ██████  ██    ██         ██████  ███████ ███████ ██   ██ 
                                                                                                
 */

// Körs när du trycker på en användare via autocomplete
async function edit_user_open(p) {
  let module = document.getElementById("edit-module");
  module.querySelector(".search").classList.add("hidden");
  module.querySelector(".modal__footer").classList.remove("hidden");

  // show teacher/student depending on role
  document.querySelectorAll("#edit-module .editResult").forEach((m) => {
    if (m.classList.contains(`editResult--${p.role}`)) {
      m.classList.remove("hidden");
    } else {
      m.classList.add("hidden");
    }
  });

  if (p.role === "teacher") {
    let coach_students = [];
    let el = {
      id: document.getElementById("editResult-id--teacher"),
      name: document.getElementById("editResult-name--teacher"),
      email: document.getElementById("editResult-email--teacher"),
      students: document.getElementById("editResult-coachstudents"),
      courses: document.getElementById("editResult-courses--teacher"),
    };

    // Sätt lärarens email som header
    el.id.textContent = p.email;

    let get_teacher_doc = (email) => {
      return new Promise((resolve) => {
        let query = DB.collection("status-report").doc(CURRENT_TERM).collection("teachers").doc(email).get();
        resolve(query);
      });
    };
    let get_coach_students = (email) => {
      return new Promise((resolve) => {
        const query = DB.collectionGroup("courses").where("coach_email", "==", email).orderBy("name").get();
        resolve(query);
      });
    };

    Promise.all([get_teacher_doc(p.email), get_coach_students(p.email)])
      .then((result) => {
        let data_to_sessionStorage = {
          coach_students: [],
        };

        // Result 0 är lärardata
        let user = result[0];
        if (user.exists) {
          let teacher = user.data();
          el.name.value = teacher.name;
          el.email.value = teacher.email;

          data_to_sessionStorage.role = "teacher";
          data_to_sessionStorage.email = teacher.email;
          data_to_sessionStorage.name = teacher.name;
          data_to_sessionStorage.courses = teacher.courses;

          teacher.courses.forEach((c) => {
            let li = document.createElement("li");
            li.textContent = `${c.course_id} (${c.teacher_name})`;
            li.dataset.course = c.course_id;
            li.dataset.teacher = c.teacher_email;
            li.dataset.teacherName = c.teacher_name;
            li.dataset.courseTitle = c.course_title;

            let button = document.createElement("button");
            button.classList.add("button--small", "button--red", "ml-2");
            button.textContent = "Ta bort";
            button.addEventListener("click", (evt) => {
              let item = evt.target.closest("li");
              let list = document.getElementById("editResult-courses--teacher");
              list.removeChild(item);
            });
            li.appendChild(button);
            el.courses.appendChild(li);
          });
        }

        // Resultat 1 är coachelever
        result[1].forEach((snapshot) => {
          let stu = snapshot.data();
          let i = coach_students.findIndex((x) => x.email === stu.email);
          if (i === -1) {
            coach_students.push({ email: stu.email, name: stu.name, class: stu.class });
            data_to_sessionStorage.coach_students.push({ email: stu.email, name: stu.name, class: stu.class });
          }
        });

        for (let s of coach_students) {
          let li = document.createElement("li");
          li.textContent = `${s.name} (${s.class})`;
          li.dataset.email = s.email;
          li.dataset.name = s.name;

          let button = document.createElement("button");
          button.classList.add("button--small", "button--red", "ml-2");
          button.textContent = "Ta bort";
          button.addEventListener("click", (evt) => {
            let item = evt.target.closest("li");
            let list = document.getElementById("editResult-coachstudents");
            list.removeChild(item);
          });
          li.appendChild(button);
          el.students.appendChild(li);
        }

        return data_to_sessionStorage;
      })
      .then((item) => {
        sessionStorage.setItem("edit-user", JSON.stringify(item));
      });
  }

  if (p.role === "student") {
    let el = {
      id: document.getElementById("editResult-id--student"),
      pnr: document.getElementById("editResult-pnr--student"),
      name: document.getElementById("editResult-name--student"),
      class: document.getElementById("editResult-class--student"),
      email: document.getElementById("editResult-email--student"),
      coach: document.getElementById("editResult-coach--student"),
      courses: document.getElementById("editResult-courses--student"),
    };

    // Sätt email som header
    el.id.textContent = p.email;

    // hämta elevers kurser (måste hämta alla för behöver KURSERNA)
    let get_student_courses = (email) => {
      return new Promise((resolve) => {
        let query = DB.collection("status-report").doc(CURRENT_TERM).collection("students").doc(email).collection("courses").get();
        resolve(query);
      });
    };

    get_student_courses(p.email)
      .then((querySnapshot) => {
        let data_to_sessionStorage = { courses: [] };
        querySnapshot.forEach((doc) => {
          if (doc.exists) {
            let student = doc.data();
            el.id.textContent = student.email;
            el.email.value = student.email;
            el.pnr.value = student.pnr;
            el.name.value = student.name;
            el.class.value = student.class;
            el.coach.value = student.coach_email;

            let li = document.createElement("li");
            li.textContent = `${student.course_id} (${student.teacher_name})`;
            li.dataset.course = student.course_id;
            li.dataset.teacher = student.teacher_email;
            li.dataset.teacherName = student.teacher_name;
            li.dataset.courseTitle = student.course_title;

            let button = document.createElement("button");
            button.classList.add("button--small", "button--red", "ml-2");
            button.textContent = "Ta bort";
            button.addEventListener("click", (evt) => {
              let item = evt.target.closest("li");
              let list = document.getElementById("editResult-courses--student");
              list.removeChild(item);
            });
            li.appendChild(button);
            el.courses.appendChild(li);

            // data to sessionStorage
            data_to_sessionStorage.email = student.email;
            data_to_sessionStorage.name = student.name;
            data_to_sessionStorage.class = student.class;
            data_to_sessionStorage.coach_name = student.coach_name;
            data_to_sessionStorage.coach_email = student.coach_email;
            data_to_sessionStorage.role = "student";

            data_to_sessionStorage.courses.push({
              course_id: student.course_id,
              course_title: student.course_title,
              teacher_email: student.teacher_email,
              teacher_name: student.teacher_name,
            });
          }
        });
        return data_to_sessionStorage;
      })
      .then((item) => {
        sessionStorage.setItem("edit-user", JSON.stringify(item));
      });
  }
}

function add_course_to_courselist(p, type, role) {
  let output;
  if (type === "new") {
    if (role === "student") {
      output = document.getElementById("newStudent-courses");
    } else if (role === "teacher") {
      // Ej tillagd än!
      // output = document.getElementById('newStudent-courses');
    }
  } else if (type === "edit") {
    if (role === "student") {
      output = document.getElementById("editResult-courses--student");
    } else if (role === "teacher") {
      output = document.getElementById("editResult-courses--teacher");
    }
  }

  let existsEarlier = output.querySelector(`[data-course="${p.course}"]`);
  if (existsEarlier) {
    Toast.show("Kursen finns redan i listan", "error");
    return;
  }

  let li = document.createElement("li");
  li.textContent = `${p.course} (${p.teacher_name})`;

  li.dataset.course = p.course;
  li.dataset.teacher = p.teacher;
  li.dataset.teacherName = p.teacher_name;
  li.dataset.courseTitle = p.course_title;

  let button = document.createElement("button");
  button.classList.add("button--small", "button--red", "ml-2");
  button.textContent = "Ta bort";
  button.addEventListener("click", (evt) => {
    let item = evt.target.closest("li");
    let list = output;
    list.removeChild(item);
  });

  li.appendChild(button);
  output.appendChild(li);
}

function edit_user_save(role) {
  if (role === "teacher") {
    const DB_TEACHERS = DB.collection("status-report").doc(CURRENT_TERM).collection("teachers");

    let el_name = document.getElementById("editResult-name--teacher");
    let el_email = document.getElementById("editResult-email--teacher");
    let el_coachStudents = document.getElementById("editResult-coachstudents");
    let el_courses = document.getElementById("editResult-courses--teacher");

    let OG_user = sessionStorage.getItem("edit-user");
    OG_user = JSON.parse(OG_user);

    let upd_user = {
      name: el_name.value,
      email: el_email.value,
      courses: [],
      coach_students: [],
    };

    let transfered_courses = [];
    // Hämta kurserna, fast lägg till ny info i dem (spelar iofs noll roll för använder nog aldrig den)
    for (let item of el_courses.children) {
      upd_user.courses.push({
        course_id: item.dataset.course,
        course_title: item.dataset.courseTitle,
        teacher_email: upd_user.email, // nytt
        teacher_name: upd_user.name, // nytt
      });

      // Jämför om lärare är annorlunda än ursprungsemail (varför ursprung? För om vi bytt epost så blir det fel annars)
      if (item.dataset.teacher !== OG_user.email) {
        transfered_courses.push({ course_id: item.dataset.course, teacher: item.dataset.teacher });
      }
    }

    for (let item of el_coachStudents.children) {
      upd_user.coach_students.push(item.dataset.email);
    }

    // Om email inte ändras så ska alla bara som påverkas (läraren, coachelever,  kurselever) bara uppdateras.
    if (OG_user.email === upd_user.email) {
      // Uppdatera läraren
      const update_teacher = (doc) => {
        return new Promise((res) => {
          DB_TEACHERS.doc(doc.email)
            .set(doc, { merge: true })
            .then(() => {
              console.log(doc.email + " base doc uppdaterad!");
              res();
            });
        });
      };

      // Ta bort kurser från ursprungslärare
      const delete_courses_from_prev_teacher_doc = (courseList) => {
        return new Promise((res) => {
          for (let c of courseList) {
            DB_TEACHERS.doc(c.teacher)
              .get()
              .then((doc) => {
                if (doc.exists) {
                  let data = doc.data();

                  // VA? Nej det är logiskt. Returnera alla kurser som inte ska tas bort. Ja, man hade kunnat splica men det här är snyggare!
                  let filtered_data = data.courses.filter((item) => item.course_id !== c.course_id);
                  doc.ref
                    .update({ courses: filtered_data })
                    .then(() => {
                      console.log(`${c.course_id} borttagen från ${c.teacher}`);
                      res();
                    })
                    .catch((e) => console.error(e));
                }
              });
          }
        });
      };

      // Ändra för elever
      const update_students = (updatedUser) => {
        return new Promise((res) => {
          for (let course of updatedUser.courses) {
            DB.collectionGroup("courses")
              .where("course_id", "==", course.course_id)
              .get()
              .then((querySnapshot) => {
                querySnapshot.forEach((doc) => {
                  if (doc.exists) {
                    doc.ref.update({ teacher_email: course.teacher_email, teacher_name: course.teacher_name }).catch((e) => {
                      console.log(e);
                    });
                  }
                });
              })
              .catch((e) => {
                console.error(e);
              });
          }
          res();
        });
      };

      Promise.all([update_teacher(upd_user), delete_courses_from_prev_teacher_doc(transfered_courses), update_students(upd_user)]).then(() => {
        Toast.show(upd_user.email + "uppdaterad!");
        Modal.hide();
      });

      // Coachstudents ska bara uppdateras. Det behövs inte att man tar bort något. Coachelever förflyttas till en annan lärare. Skapa en vakantlärare i värsta fall
      for (let stu of upd_user.coach_students) {
        update_coach_for_student(stu, upd_user); // endast name och email behövs egentligen
      }
    } else {
      Toast.show("Email har ändrats! Denna funktion är inte implementerad för lärare än!", "error");
    }
  } else if (role === "student") {
    const DB_STUDENTS = DB.collection("status-report").doc(CURRENT_TERM).collection("students");

    let el_name = document.getElementById("editResult-name--student");
    let el_pnr = document.getElementById("editResult-pnr--student");
    let el_class = document.getElementById("editResult-class--student");
    let el_email = document.getElementById("editResult-email--student");
    let sel = document.getElementById("editResult-coach--student");
    let sel_i = sel.selectedIndex;
    let coach = sel.options[sel_i];
    let el_courses = document.getElementById("editResult-courses--student");

    let OG_user = sessionStorage.getItem("edit-user");
    OG_user = JSON.parse(OG_user);

    let upd_user = {
      pnr: el_pnr.value,
      email: el_email.value, // not like this matters as you can't change email without making a new user. TODO: new user and delete this user if new email
      class: el_class.value,
      name: el_name.value,
      coach_name: coach.dataset.name,
      coach_email: coach.dataset.email,
      courses: [],
    };

    for (let item of el_courses.children) {
      upd_user.courses.push({
        course_id: item.dataset.course,
        course_title: item.dataset.courseTitle,
        teacher_email: item.dataset.teacher,
        teacher_name: item.dataset.teacherName,
      });
    }

    if (OG_user.email === upd_user.email) {
      // Om samma epost så ska allt uppdateras och eventullt måste kurser tas bort.

      // Loopa igenom OG_users kurser och se om någon av dem inte finns i det nya objektet. Om borttaget måste de tas bort ur db också
      let removed_courses = [];
      for (let course of OG_user.courses) {
        let index = upd_user.courses.findIndex((x) => x.course_id === course.course_id);
        if (index === -1) {
          removed_courses.push(course.course_id);
        }
      }

      let this_db = DB_STUDENTS.doc(upd_user.email);
      // basdokument med all generell data
      let base_doc = {
        class: upd_user.class,
        name: upd_user.name,
        coach_name: upd_user.coach_name,
        coach_email: upd_user.coach_email,
        pnr: upd_user.pnr,
        email: upd_user.email,
      };

      // Böra med att ta bort de kurser som INTE finns med i den nya användaren (jämfört med tidigare)
      let remove_courses = (course_list) => {
        return new Promise((res) => {
          for (let c of course_list) {
            this_db
              .collection("courses")
              .doc(c)
              .delete()
              .then(() => {
                Toast.show(`${c} borttagen från ${upd_user.email}`, "success");
                res();
              })
              .catch((e) => console.error(e));
          }
        });
      };

      // Används ju aldrig men varför inte. En extra write
      let update_base_doc = (doc) => {
        new Promise((res) => {
          this_db.update(doc);
          res();
        });
      };

      // Skapa nya kurser
      let update_courses = (course_list, doc_to_hardcopy) => {
        return new Promise((res) => {
          for (let c of course_list) {
            // hard copy för jag vill skriva om objektet varje loop
            let hardCopy = JSON.parse(JSON.stringify(doc_to_hardcopy));
            if (OG_user.courses.some((x) => x.course_id === c.course_id)) {
              // Om kursen finns sen tidigare så behövs inte course_id m.m.
            } else {
              hardCopy["teacher_name"] = c.teacher_name;
              hardCopy["teacher_email"] = c.teacher_email;
              hardCopy["course_id"] = c.course_id;
              hardCopy["course_title"] = c.course_title;
            }
            this_db
              .collection("courses")
              .doc(c.course_id)
              .set(hardCopy, { merge: true })
              .catch((e) => console.error(e));
          }
          res();
        });
      };

      Promise.all([remove_courses(removed_courses), update_base_doc(base_doc), update_courses(upd_user.courses, base_doc)])
        .then(() => {
          console.log("Student updated - success");
          Toast.show(`${upd_user.email} uppdaterad!`, "success");
          Modal.hide();
        })
        .catch((e) => {
          console.log("Error in promise.all resolution");
          console.error(e);
        });
    } else {
      // Om ny epost behövs så måste allt kopieras och läggas på en ny användare. Tidigare användare tas bort

      // Måste hämta kurserna för att hämta ALL data i dem (inte bara course_id etc som finns i localStorage)
      DB_STUDENTS.doc(OG_user.email)
        .collection("courses")
        .get()
        .then((querySnapshot) => {
          querySnapshot.forEach((doc) => {
            if (doc.exists) {
              let course = doc.data();

              // Uppdatera alla värden. Ingen idé att slösa effort på att kolla om ändringar gjorts
              // console.log(doc.id, ' => ',doc.data())
              course.name = upd_user.name;
              course.pnr = upd_user.pnr;
              course.email = upd_user.email;
              course.class = upd_user.class;
              course.coach_name = upd_user.coach_name;
              course.coach_email = upd_user.coach_email;

              // ta bort kurs från upd_user.courses eftersom den redan täcks här
              let i;
              let len = upd_user.courses.length;
              // Loopa baklänges för att slippa problem med index när du tar bort med splice
              for (i = len - 1; i >= 0; i--) {
                let active = upd_user.courses[i];
                // console.log('db_course',course.course_id)
                if (active.course_id == course.course_id) {
                  upd_user.courses.splice(i, 1);
                }
              }

              DB_STUDENTS.doc(upd_user.email)
                .collection("courses")
                .doc(doc.id)
                .set(course, { merge: true })
                .then(() => {
                  console.log(upd_user.email, " kurs tillagd: ", doc.id);
                })
                .catch((e) => console.error(e));
            }
          });

          // Lägg till nya kurser också
          for (let c of upd_user.courses) {
            DB_STUDENTS.doc(upd_user.email)
              .collection("courses")
              .doc(c.course_id)
              .set(
                {
                  class: upd_user.class,
                  name: upd_user.name,
                  coach_name: upd_user.coach_name,
                  coach_email: upd_user.coach_email,
                  pnr: upd_user.pnr,
                  email: upd_user.email,
                  teacher_name: c.teacher_name,
                  teacher_email: c.teacher_email,
                  course_id: c.course_id,
                  course_title: c.course_title,
                },
                { merge: true }
              )
              .then(() => {
                console.log(upd_user.email, " kurs tillagd: ", c.course_id);
              })
              .catch((e) => console.error(e));
          }
        })
        .then(() => {
          // Avslutningsvis, ta bort gamla användaren

          // Omständligt att man måste först hämta varje kurs, men finns ingen api för att ta bort hel collection
          DB_STUDENTS.doc(OG_user.email)
            .collection("courses")
            .get()
            .then((querySnapshot) => {
              querySnapshot.forEach((doc) => {
                if (doc.exists) {
                  doc.ref.delete().catch((e) => console.error(e));
                }
              });
            });

          // Ta även bort basdokument
          DB_STUDENTS.doc(OG_user.email)
            .delete()
            .then(() => {
              console.log(OG_user.email, "borttagen!");

              Toast.show(`${OG_user.email} är nu ${upd_user.email}!`, "success");
              Modal.hide();
            });
        });
    }

    // function delete_course(course_id) {
    //   let teacher_deleted = false;
    //   // delete from students
    //   DB.collectionGroup('courses').where('course_id', '==', course_id)
    //     .get().then((snapshot) => {
    //       snapshot.forEach((doc) => {
    //         if (doc.exists) {
    //           let teacher_email = doc.data().teacher_email;
    //           delete_course_from_teacher(course_id, teacher_email)
    //           let email = doc.data().email;
    //           DB.collection('status-report').doc(CURRENT_TERM).collection('students').doc(email)
    //             .delete().then(() => {
    //               console.log(`Kursen ${course_id} borttagen från ${email}`);
    //             }).catch(function (error) {
    //               console.error("Error removing document: ", error);
    //             });;

    //         }

    //       })
    //     })

    //   function delete_course_from_teacher(id, email) {
    //     // DB.collection('status-report').doc(CURRENT_TERM).collection('teachers').doc(email);
    //   }
    // }

    // Compare courses. Find if there are any REMOVED from original. If not, then write to all. If there is, you need to remove that course
  }
}

// Körs efter att man trycker på bekräfta i modal. Hämtar all data
function handle_create_user(type) {
  let p = {};

  if (type === "teacher") {
    let name = document.getElementById("newTeacher-name").value;
    if (!name.includes(",")) {
      Toast.show("Namn måste vara formaterat enligt Efternamn, Förnamn", "error");
      return;
    }
    p.name = name;
    let email = document.getElementById("newTeacher-email").value;
    if (email.includes("@") || email.length < 1) {
      Toast.show("Email ska inte inkludera @ eller domännamn", "error");
      return;
    }
    p.email = email;
    p.email += "@edu.huddinge.se";

    p["coach_students"] = new Array();
    let coachstudents_list = document.getElementById("newTeacher-coachStudents");
    for (let li of coachstudents_list.children) {
      p.coach_students.push(li.dataset.email);
    }

    create_new_teacher(p);
  }

  if (type === "student") {
    let name = document.getElementById("newStudent-name").value;
    if (name.includes(",")) {
      Toast.show("Namn måste vara formaterat enligt Förnamn Efternamn. Utan komma.", "error");
      return;
    }

    let klass = document.getElementById("newStudent-class").value;

    let email = document.getElementById("newStudent-email").value;
    if (email.includes("@") || email.length < 1) {
      Toast.show("Email ska inte inkludera @ eller domännamn", "error");
      return;
    }

    let select = document.getElementById("newStudent-coach");
    if (select.selectedIndex > 0) {
      let sel_i = select.selectedIndex;
      p.coach_name = select.options[sel_i].dataset.name;
      p.coach_email = select.options[sel_i].dataset.email;
    } else {
      p.coach = "";
    }

    p.class = klass;
    p.name = name;
    p.email = email;
    p.email += "@edu.huddinge.se";

    p["courses"] = new Array();
    let course_list = document.getElementById("newStudent-courses");
    for (let li of course_list.children) {
      p.courses.push({
        course_id: li.dataset.course,
        course_title: li.dataset.courseTitle,
        teacher_name: li.dataset.teacherName,
        teacher_email: li.dataset.teacher,
      });
    }
    create_new_student(p);
  }
}

function create_new_teacher(p) {
  // Skapa lärare
  DB.collection("status-report")
    .doc(CURRENT_TERM)
    .collection("teachers")
    .doc(p.email)
    .set({
      name: p.name,
      email: p.email,
      courses: [],
    })
    .catch((error) => console.error(error));

  // Lägg till i permissions
  let docRef = DB.collection("users").doc("teachers");
  docRef
    .update({
      valid_ids: firebase.firestore.FieldValue.arrayUnion(p.email),
    })
    .catch((error) => console.error(error));

  // Ändra coachstudents
  if (p.coach_students.length > 0) {
    p.coach_students
      .forEach((stu) => {
        update_coach_for_student(stu, p);
      })
      .catch((error) => console.error(error));
  }

  Toast.show(`${p.email} tillagd som lärare!`, "success");
  Modal.hide();
}

function create_new_student(p) {
  let db = DB.collection("status-report").doc(CURRENT_TERM).collection("students");
  // Skapa elev
  console.log(p);
  let student_to_pass = {
    name: p.name,
    class: p.class,
    email: p.email,
    coach_name: "",
    coach_email: "",
    pnr: "N/A",
  };

  if ("coach_name" in p) {
    student_to_pass["coach_name"] = p.coach_name;
    student_to_pass["coach_email"] = p.coach_email;
  }

  // Skapa huvuddokument
  let create_main_doc = (o) => {
    return new Promise((res) => {
      db.doc(o.email).set(student_to_pass).then(res());
    });
  };

  let create_course = (o) => {
    return new Promise((res) => {
      db.doc(o.email).collection("courses").doc(o.course_id).set(o).then(res());
    });
  };

  let promises = [];
  promises.push(create_main_doc(student_to_pass));
  // Skapa collection av klasser
  for (let c of p.courses) {
    let complete_course = {
      class: p.class,
      coach_email: p.coach_email,
      coach_name: p.coach_name,
      name: p.name,
      pnr: "N/A",
      email: p.email,
      course_id: c.course_id,
      course_title: c.course_title,
      teacher_name: c.teacher_name,
      teacher_email: c.teacher_email,
    };

    promises.push(create_course(complete_course));
  }

  Promise.all(promises).then(() => {
    Toast.show(`${p.email} tillagd som elev!`, "success");
    Modal.hide();
  });
}

function update_coach_for_student(stu, coach) {
  // Uppdatera "basdokumentet"
  let update_doc_base = (stu_email, c) => {
    return new Promise((res, rej) => {
      DB.collection("status-report")
        .doc(CURRENT_TERM)
        .collection("students")
        .doc(stu_email)
        .update({
          coach_email: c.email,
          coach_name: c.name,
        })
        .then(() => {
          console.log(stu, "updated coach to => ", coach.email);
          res("done");
        })
        .catch((e) => {
          console.log(stu, " ------ error updating coach");
          console.error(e);
          rej(e);
        });
    });
  };

  // Uppdatera varje kurs
  let update_each_course = (stu_email, c) => {
    return new Promise((res, rej) => {
      DB.collectionGroup("courses")
        .where("email", "==", stu_email)
        .get()
        .then((querySnapshot) => {
          querySnapshot.forEach((doc) => {
            if (doc.exists) {
              doc.ref.update({ coach_email: c.email, coach_name: c.name }).catch((e) => {
                console.log(e);
              });
            }
          });
        })
        .then(() => {
          res();
        })
        .catch((e) => {
          console.error(e);
          rej();
        });
    });
  };
  Promise.all([update_doc_base(stu, coach), update_each_course(stu, coach)]).then(() => {
    Toast.show(`Uppdateringar gjorda för ${coach.email}`, "success");
    Modal.hide();
  });
}

/*
██   ██ ████████ ████████ ██████      ██   ██ ███████  █████  ██████  ███████ ██████  ███████ 
██   ██    ██       ██    ██   ██     ██   ██ ██      ██   ██ ██   ██ ██      ██   ██ ██      
███████    ██       ██    ██████      ███████ █████   ███████ ██   ██ █████   ██████  ███████ 
██   ██    ██       ██    ██          ██   ██ ██      ██   ██ ██   ██ ██      ██   ██      ██ 
██   ██    ██       ██    ██          ██   ██ ███████ ██   ██ ██████  ███████ ██   ██ ███████ 
                                                                                              
                                                                                              
*/

// var httpRequestObserver =
// {
//   observe: function(subject, topic, data)
//   {
//     if (topic == "http-on-modify-request") {
//       var httpChannel = subject.QueryInterface(Ci.nsIHttpChannel);
//       httpChannel.setRequestHeader("X-Hello", "World", false);
//     }
//   },

//   get observerService() {
//     return Cc["@mozilla.org/observer-service;1"]
//                      .getService(Ci.nsIObserverService);
//   },

//   register: function()
//   {
//     this.observerService.addObserver(this, "http-on-modify-request", false);
//   },

//   unregister: function()
//   {
//     this.observerService.removeObserver(this, "http-on-modify-request");
//   }
// };

// httpRequestObserver.register();

/*

███████ ████████  █████ ████████ ███████ 
██         ██    ██   ██   ██    ██      
███████    ██    ███████   ██    ███████ 
     ██    ██    ██   ██   ██         ██ 
███████    ██    ██   ██   ██    ███████ 
                                         
                                         
*/

async function handle_update_statistics() {
  console.log("INITIATING STATISTICS UPDATE");
  loader_start();
  // Querya alla kurser
  let get_all_students = () => {
    return new Promise((resolve, reject) => {
      const db = firebase.firestore();
      const query = db.collectionGroup("courses").where("course_id", "!=", "").get();
      resolve(query);
    });
  };

  get_all_students().then((querySnapshot) => {
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

    let all_data_for_localStorage = [];

    querySnapshot.forEach((doc) => {
      if (doc.exists) {
        let c = doc.data();
        all_data_for_localStorage.push(c);

        if (active_student === c.email) {
          // Gör inget (loopen behöver tidigare värden)
        } else {
          // skapa ny kurs
          let active_class_index = classes.findIndex((i) => {
            return i.class === c.class;
          });
          if (active_class_index === -1) {
            classes.push({
              class: c.class,
              sum: {
                T: 0,
                IT: 0,
                UB: 0,
              },
              students: [],
            });
            active_class = classes[classes.length - 1];
          } else {
            active_class = classes[active_class_index];
          }

          let active_student_index = active_class.students.findIndex((i) => {
            return i.email === c.email;
          });
          if (active_student_index === -1) {
            active_class.students.push({
              email: c.email,
              name: c.name,
              a: {
                T: 0,
                IT: 0,
                UB: 0,
              },
            });
            active_student = active_class.students[active_class.students.length - 1];

            // LÄGG TILL I all_students också
            all_students.push({
              class: c.class,
              coach: c.coach_name,
              email: c.email,
              name: c.name,
            });
          } else {
            active_student = active_class.students[active_student_index];
          }
        }

        // ASSESSMENTS
        a_total++; // Oavsett vad så är det en ny kurs så öka på antal omdömen
        switch (c.assessment) {
          case "T":
            active_student.a.T++;
            active_class.sum.T++;
            a_T++;
            break;

          case "TEB":
            active_student.a.T++;
            active_class.sum.T++;
            a_T++;
            break;

          case "IT":
            active_student.a.IT++;
            active_class.sum.IT++;
            a_IT++;
            break;

          case "UB":
            active_student.a.UB++;
            active_class.sum.UB++;
            a_UB++;
            break;

          default:
            // default blir '' eller att assessment inte är definerad
            a_empty++;
            // Öka för aktuell lärare
            if (!([c.teacher_email] in a_empty_teachers)) {
              a_empty_teachers[c.teacher_email] = 0;
            }
            a_empty_teachers[c.teacher_email]++;
            break;
        }
      }
    });
    set_statistics({
      classes: classes,
      sum: {
        total: a_total,
        T: a_T,
        IT: a_IT,
        UB: a_UB,
        unreported: {
          sum: a_empty,
          teachers: a_empty_teachers,
        },
      },
      student_array: all_students,
    });

    systematize_localStorage(all_data_for_localStorage);
  });
}

function set_statistics(data) {
  DB.collection("status-report")
    .doc(CURRENT_TERM)
    .collection("statistics")
    .doc("general")
    .set({
      classes: data.classes,
      sum: data.sum,
      student_array: data.student_array,
    })
    .catch((e) => {
      console.log(" -==- ERROR caught while UPDATING statistics -==-");
      console.error(e);
      loader_finish();
    })
    .then(() => {
      loader_finish();
      Modal.hide();
      Toast.show("Statistik uppdaterad!", "success");
      console.log("Statistics updated successfully!");
    });
}

function systematize_localStorage(Data) {
  let get_courses = async (all_data) => {
    return new Promise((resolve) => {
      let courses = [];
      for (let c of all_data) {
        let i = courses.findIndex((x) => x.course_id === c.course_id);
        if (i === -1) {
          courses.push({
            course_id: c.course_id,
            course_title: c.course_title,
            teacher_name: c.teacher_name,
            teacher_email: c.teacher_email,
            students: [{ name: c.name, email: c.email, class: c.class }],
          });
        } else {
          courses[i].students.push({ name: c.name, email: c.email, class: c.class });
        }
      }
      resolve(courses);
    });
  };

  get_courses(Data).then((unique_courses) => {
    localStorage.setItem("admin_courses", JSON.stringify(unique_courses));
  });

  let get_teachers = async (all_data) => {
    return new Promise((resolve) => {
      let teachers = [];
      for (let c of all_data) {
        let i = teachers.findIndex((x) => x.email === c.teacher_email);
        if (i === -1) {
          teachers.push({
            role: "teacher",
            name: c.teacher_name,
            email: c.teacher_email,
          });
        }
      }
      resolve(teachers);
    });
  };

  get_teachers(Data).then((unique_teachers) => {
    localStorage.setItem("admin_teachers", JSON.stringify(unique_teachers));
  });

  let get_students = async (all_data) => {
    return new Promise((resolve) => {
      let students = [];
      for (let c of all_data) {
        let i = students.findIndex((x) => x.email === c.email);
        if (i === -1) {
          students.push({
            role: "student",
            name: c.name,
            class: c.class,
            email: c.email,
            coach: c.coach_name,
            coach_email: c.coach_email,
            courses: [{ course_id: c.course_id, teacher: c.teacher_name, teacher_email: c.teacher_email }],
          });
        } else {
          students[i].courses.push({ course_id: c.course_id, teacher: c.teacher_name, teacher_email: c.teacher_email });
        }
      }
      resolve(students);
    });
  };

  get_students(Data).then((student_arr) => {
    localStorage.setItem("admin_students", JSON.stringify(student_arr));
  });
}

function click_delete_course(course_id) {
  console.log(course_id);
  Toast.show("Funktionen avstängd tills behov finns", "error");
}

function click_change_teacher_for_course(p) {
  let course = {
    teacher_email: p.email,
    teacher_name: p.name,
    course_id: p.course,
    course_title: p.course_title,
  };
  // Ändra för lärare
  DB.collection("status-report")
    .doc(CURRENT_TERM)
    .collection("teachers")
    .doc(p.email)
    .get()
    .then((doc) => {
      if (doc.exists) {
        console.log(doc.data());
        let data = doc.data();
        data.courses.push(course);

        doc.ref.update({
          courses: firebase.firestore.FieldValue.arrayUnion(course),
        });
      }
    });

  //Ta bort från ursprungslärare
  DB.collection("status-report")
    .doc(CURRENT_TERM)
    .collection("teachers")
    .doc(p.original_teacher)
    .get()
    .then((doc) => {
      if (doc.exists) {
        let data = doc.data();
        let filtered_data = data.courses.filter((item) => item.course_id !== course.course_id);
        doc.ref
          .update({ courses: filtered_data })
          .then(() => {
            console.log(`${course.course_id} borttagen från ${p.original_teacher}`);
          })
          .catch((e) => console.error(e));
      }
    });

  // Ändra för elever
  DB.collectionGroup("courses")
    .where("course_id", "==", course.course_id)
    .get()
    .then((querySnapshot) => {
      querySnapshot.forEach((doc) => {
        if (doc.exists) {
          doc.ref.update({ teacher_email: course.teacher_email, teacher_name: course.teacher_name }).catch((e) => {
            console.log(e);
          });
        }
      });
    })
    .catch((e) => {
      console.error(e);
    });

  Modal.hide();
  Toast.show(`${p.course} har ny lärare: ${p.email}`, "success");
}
