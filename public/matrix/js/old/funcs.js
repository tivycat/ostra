function change_active_course(selection) {
  document.getElementById("teacher_onload").classList.add("hidden");
  let all_courses = document.querySelectorAll(".course");
  for (let c of all_courses) {
    if (c.id == selection) {
      c.classList.remove("hidden");
      c.querySelector(".no_student_selected").classList.remove("hidden");
    } else {
      c.classList.add("hidden");
    }
  }
  document.getElementById("share_with_students").addEventListener("click", () => display_share_asmt_modal(selection));
}

function new_asmt_modal_display(val) {
  /** @param {object} val: val is a complete assignment. The existence of val means it is an old event being edited. If no val = new event. */
  let elem = {
    header: document.getElementById("new_modal_title"),
    caption: document.getElementById("new_asmt_caption"),
    course: document.getElementById("new_asmt_course_select"),
    desc: document.getElementById("new_asmt_description"),
    btn: document.getElementById("new_asmt_save"),
  };
  if (!val) {
    elem.header.textContent = "Lägg till ny bedömning";
    elem.btn.dataset.state = "save_new";
    elem.btn.textContent = "Spara ny uppgift";
    elem.btn.dataset.asmt = null;
  } else {
    elem.header.textContent = "Ändra uppgift";
    elem.btn.dataset.state = "edit_old";
    elem.btn.dataset.asmt = val.asmt_id;
    elem.btn.textContent = "Bekräfta ändring";
  }

  let selected_course = document.getElementById("header_select_course").value;
  elem.course.value = selected_course;
  let arr_of_tbody = document.getElementById("new_asmt_modal_tbl").querySelectorAll("tbody");
  for (let tbody of arr_of_tbody) {
    if (tbody.id == `modal-body-${selected_course}`) {
      tbody.classList.remove("hidden");
    } else {
      tbody.classList.add("hidden");
    }
  }
  if (val) {
    elem.caption.value = val.caption;
    elem.desc.value = val.desc;
    for (let req of val.reqs) {
      let chosen_req = document.getElementById(`modal-body-${selected_course}`).querySelector(`[data-paragraph="${req}"]`);
      chosen_req.checked = true;
      chosen_req.disabled = true; // why? we don't want user to remove previously enabled reqs. It may muddy up the db
    }
  } else {
    let checkboxes = document.getElementById(`modal-body-${selected_course}`).querySelectorAll("input[data-paragraph]");
    for (let e of [elem.desc, elem.caption]) {
      e.value = "";
    } // resets all values
    for (let cb of checkboxes) {
      // Resets all checkboxes
      cb.checked = false;
      cb.disabled = false;
    }
  }
  $("#new_asmt_modal").modal();
}

function new_asmt_save(btn) {
  /**
   * @param {element} btn: the 'save' button at the bottom of the modal. Depending on what state it is set to,
   * this is either a new asmt or an old which is being edited
   */
  loading_start();
  let elem = {
    caption: document.getElementById("new_asmt_caption"),
    course: document.getElementById("new_asmt_course_select"),
    desc: document.getElementById("new_asmt_description"),
  };
  elem.tbody = document.getElementById(`modal-body-${elem.course.value}`); // has to be added subsequently cannot fetch value within object. apparently
  let data = {
    caption: elem.caption.value,
    course: elem.course.value,
    desc: elem.desc.value,
    reqs: [],
  };

  let all_chosen_reqs = elem.tbody.querySelectorAll("input[data-paragraph]:checked");
  for (let req of all_chosen_reqs) {
    data.reqs.push(req.dataset.paragraph);
  }

  if (data.caption === "") {
    display_toast("Din uppgift saknar titel!");
    return;
  }
  if (data.reqs.length == 0) {
    display_toast("Du har inte valt några kunskapskrav!");
    return;
  }

  /** If this is a change, rather than a new, deal with it accordingly */
  if (btn.dataset.state === "edit_old") {
    data.id = btn.dataset.asmt;
    update_asmt(data);
  } else {
    data.id = `${data.course}-asmt${create_new_asmt_id(data.course)}`;
    new Promise((resolve, reject) => {
      append_new_asmt(data);
      resolve(true);
    }).then((result) => {
      if (result == true) {
        console.log("ASMT added successfully");
      }
      pass_new_asmt_to_db(data);
      display_toast(`Ny uppgift tillagd i kursen ${data.course}`);
      console.log("ASMT passed to DB");
    });
  }

  $("#new_asmt_modal").modal("hide");
  loading_end();
}

function create_new_asmt_element(asmt, reqs) {
  let asmt_element = document.getElementById("copy").querySelector(".asmt").cloneNode(true);
  let caption = asmt_element.querySelector(".caption");
  let description = asmt_element.querySelector(".description");
  let tbody = asmt_element.querySelector("tbody");
  let grade_levels = ["E", "C", "A"];

  caption.textContent = asmt.caption;
  description.textContent = asmt.desc;
  asmt_element.dataset.asmt = asmt.id;

  for (let paragraph of asmt.reqs) {
    let tr = document.createElement("tr");
    for (let i = 0; i < reqs[paragraph].length; i++) {
      let grade = reqs[paragraph][i];
      let td = document.createElement("td");
      td.classList.add("minion");
      td.dataset.grade = grade_levels[i];
      td.dataset.paragraph = paragraph;
      tr.append(td);
      td.spanify_text(grade);
    }
    tbody.append(tr);
  }

  let li = document.createElement("li");
  li.dataset.asmt = asmt.id; // put this here so that if asmt is deleted, the whole list item is deleted and not just the anchor
  let a = document.createElement("a");
  li.appendChild(a);
  a.textContent = asmt.caption;
  a.classList.add("show_asmt");
  a.dataset.course = asmt.course;

  return { element: asmt_element, li: li };
}

function append_new_asmt(asmt) {
  /**
   * @param {object} asmt includes caption, course, desc, reqs, id
   */
  let LS = JSON.parse(localstorage_course_data("get"));
  let course = LS.find((c) => c.id == asmt.course);

  let asmt_section = create_new_asmt_element(asmt, JSON.parse(course.reqs));
  let course_element = document.getElementById(asmt.course);
  let all_students = course_element.querySelectorAll(".student");
  for (let student of all_students) {
    let li = asmt_section.li.cloneNode(true);
    let li_a = li.querySelector("a");
    li_a.dataset.id = student.id;
    li_a.href = `${student.id}-${asmt.id}`;
    document.querySelector(`.asmt_list [data-id="${student.id}"]`).appendChild(li);

    let asmt_element = asmt_section.element.cloneNode(true);
    asmt_element.id = `${student.id}-${asmt.id}`;
    student.querySelector(".assessments").appendChild(asmt_element);
  }
}

function update_asmt(data) {
  let all_asmt = document.querySelectorAll(`[data-asmt="${data.id}"]`);
  /** Clientside */
  for (let asmt of all_asmt) {
    if (asmt.tagName == "LI") {
      asmt.firstChild.textContent = data.caption;
    } else if (asmt.tagName == "DIV") {
      asmt.querySelector(".caption").textContent = data.caption;
      asmt.querySelector(".description").textContent = data.desc;
      /** Start by checking if this req already exists, else import them */
      let tbody = asmt.querySelector("tbody");
      for (let chosen_req of data.reqs) {
        if (!tbody.querySelector(`[data-paragraph="${chosen_req}"]`)) {
          // if it can't find any, do stuff
          let LS = JSON.parse(localstorage_course_data("get"));
          let course = LS.find((c) => c.id == data.course);
          for (let paragraph in course.reqs) {
            if (chosen_req == paragraph) {
              let tr = document.createElement("tr");
              for (grade in course.reqs[paragraph]) {
                let td = document.createElement("td");
                td.classList.add("minion");
                td.dataset.grade = grade;
                td.dataset.paragraph = paragraph;
                tr.append(td);
                td.spanify_text(course.reqs[paragraph][grade]);
              }
              tbody.append(tr);
            }
          }
        }
      }
    }
  }
  pass_updated_asmt_to_db(data);

  // three cheers
  display_toast("Uppgift uppdaterad!");
}

function handle_save_changes() {
  loading_start();
  let changelist = localStorage.getItem("changelist");
  if (changelist == null) {
    display_toast("Inga ändringar har registrerats");
    loading_end();
    return;
  } else {
    changelist = JSON.parse(changelist);
  }
  let all_changes = [];
  for (let student of changelist) {
    let data = new Array();
    let stu_elem = document.getElementById(student.id);
    let all_asmts = stu_elem.querySelector(".assessments").children;
    for (let asmt of all_asmts) {
      let id = asmt.dataset.asmt;
      let this_asmt = {
        id: id,
        fb: asmt.querySelector(".feedback").value,
        reqs: {},
      };
      let words_with_status = asmt.querySelectorAll(".minion [data-status]");
      for (let word of words_with_status) {
        let parent = word.parentNode;
        let p = { pg: parent.dataset.paragraph, gr: parent.dataset.grade, stat: word.dataset.status };
        if (!(p.pg in this_asmt.reqs)) {
          this_asmt.reqs[p.pg] = {};
        }
        if (!(p.gr in this_asmt.reqs[p.pg])) {
          this_asmt.reqs[p.pg][p.gr] = { met: [], unmet: [] };
        }
        this_asmt.reqs[p.pg][p.gr][p.stat].push(word.dataset.word);
      }
      data.push(this_asmt);
      add_modified_handle_to_asmt_list(this_asmt, student.id, student.course);
    }
    all_changes.push({ student: student, data: data });
  }
  send_student_changes_to_db(all_changes);
  display_toast("Ändringar sparade!");
  /** Clear local storage for future use */
  localStorage.removeItem("changelist");
  loading_end();
}

function add_modified_handle_to_asmt_list(asmt, student_id, course) {
  /** Check if there are any items in the asmt. If there are, add bold to the asmt list to indicate it has been 'finished' */
  if (Object.keys(asmt.reqs).length !== 0 || asmt.fb.length !== 0) {
    let anchor = document.getElementById(course).querySelector(`.asmt_list[data-id="${student_id}"] li`).firstChild;
    anchor.classList.add("emphasized");
  }
}

function handle_apply_class(attr) {
  if (window.getSelection) {
    // non-IE
    userSelection = window.getSelection();
    rangeObject = userSelection.getRangeAt(0);
    let start_container = rangeObject.startContainer.parentNode;
    let end_container = rangeObject.endContainer.parentNode;
    if (start_container.closest(".master")) {
      display_toast("Denna tabell visar en sammanställning av din gjorda bedömning. Bedömning görs i individuella uppgifter.");
      return;
    }
    if (start_container.classList.contains("word") && start_container.closest(".minion") && end_container.classList.contains("word")) {
      const start_cell = start_container.closest(".minion");
      const end_cell = end_container.closest(".minion");

      let first_word = Number(start_container.dataset.word);
      let last_word = Number(end_container.dataset.word) + 1; // even if there is only 1 word, loop needs to be 0-1 and not 0-0
      let start_cell_words = start_cell.querySelectorAll(`[data-word]`);

      if (first_word == last_word) {
        apply_selection_to_cell(first_word, start_cell, attr);
      }

      if (start_cell == end_cell) {
        let list = [];
        for (let i = first_word; i < last_word; i++) {
          list.push(i);
        }
        apply_selection_to_cell(list, start_cell, attr);
      } else if (start_cell.nextElementSibling == end_cell) {
        let start_cell_list = [];

        for (let i = first_word; i < start_cell_words.length; i++) {
          start_cell_list.push(i);
        }
        apply_selection_to_cell(start_cell_list, start_cell, attr);

        let end_cell_list = [];
        for (let i = 0; i < last_word; i++) {
          end_cell_list.push(i);
        }
        apply_selection_to_cell(end_cell_list, end_cell, attr);
      } else if (start_cell.nextElementSibling.nextElementSibling == end_cell) {
        let start_cell_list = [];
        for (let i = first_word; i < start_cell_words.length; i++) {
          start_cell_list.push(i);
        }
        apply_selection_to_cell(start_cell_list, start_cell, attr);

        let middle_cell_list = [];
        let middle_cell_words = start_cell.nextElementSibling.querySelectorAll(`[data-word]`);
        for (let i = 0; i < middle_cell_words.length; i++) {
          middle_cell_list.push(i);
        }
        apply_selection_to_cell(middle_cell_list, start_cell.nextElementSibling, attr);

        let end_cell_list = [];
        for (let i = 0; i < last_word; i++) {
          end_cell_list.push(i);
        }
        apply_selection_to_cell(end_cell_list, end_cell, attr);
      }
    }
  } else {
    return;
  }
  /** Remove users selection after it has been utilized */
  userSelection.removeAllRanges();
}
function apply_selection_to_cell(list, cell, attr, ran_onload) {
  /**
   * @param {array} list: contains an array of the word numbers to whom attr is to be appended to
   * @param {element} cell: the cell to which the list is to be appended to
   * @param {string} attr: the data-status that will be added to each of the items in the list-array
   */
  let stu_el = cell;
  let props = { grade: cell.dataset.grade, paragraph: cell.dataset.paragraph };
  while (!stu_el.classList.contains("student")) {
    stu_el = stu_el.parentElement;
  }
  let master_cell = stu_el.querySelector(`td[data-grade="${props.grade}"][data-paragraph="${props.paragraph}"]`);
  for (let n of list) {
    let minion_span = cell.querySelector(`[data-word="${n}"]`);
    let master_span = master_cell.querySelector(`[data-word="${n}"]`);
    if (!attr) {
      // user has requested for the word status to be reset
      minion_span.removeAttribute("data-status");
      master_span.removeAttribute("data-status");
    } else if (minion_span.dataset.status == attr) {
      continue; // if dataset is already set, abort for this word - else master will receive an updated version (i.e. met1 becomes met2)
    } else {
      minion_span.dataset.status = attr;
      let attr_n;
      let status = master_span.dataset.status;
      if (attr == "met") {
        if (status) {
          switch (status) {
            case "met1":
              attr_n = "met2";
              break;
            case "met2":
              attr_n = "met3";
              break;
            case "met3":
              attr_n = "met3";
              break;
          }
        } else {
          attr_n = "met1";
        }
      } else {
        attr_n = attr;
      }
      master_span.dataset.status = attr_n;
    }
  }
  if (ran_onload) {
    return; // necessary to avoid storing every saved entry on load
  }
  /** Add this student to the changelist */
  let id = stu_el.id;
  let course = stu_el.dataset.course;
  register_student_change(id, course);
}

function register_student_change(stu_id, course) {
  /**
   * @param {string} stu_id: the id of the student
   * @param {string} course: course of the student
   * This function is either called when applying class to a minion, or if you edit a feedback textarea
   */
  let get_item = localStorage.getItem("changelist");
  let set_item;
  let arr;
  if (get_item == null) {
    arr = new Array();
  } else {
    arr = JSON.parse(get_item);
    for (let a of arr) {
      if (a.id == stu_id) {
        return;
      }
    }
  }
  arr.push({ id: stu_id, course: course });
  set_item = JSON.stringify(arr);
  localStorage.setItem("changelist", set_item);
}

function show_only_selected_student(student) {
  /** @param {object} student: contains .id & .course */
  let course_cont = document.getElementById(student.course);
  course_cont.querySelector(".no_student_selected").classList.add("hidden");
  let arr_of_students = course_cont.querySelectorAll(".student");
  for (let stu of arr_of_students) {
    if (stu.id == student.id) {
      stu.classList.remove("hidden");
    } else {
      stu.classList.add("hidden");
    }
  }
  /** Add Bold to the active student in the index */
  let el = document.querySelectorAll(`.show_student`);
  for (let e of el) {
    e.classList.remove("active_student");
    if (e.dataset.id == student.id) {
      e.classList.add("active_student");
    }
  }
}

function handle_asmt_edit(targ) {
  let reqs = (t) => {
    let result = new Array();
    let tr = t.querySelectorAll("tbody tr");
    for (let p of tr) {
      let td = p.firstChild;
      result.push(td.dataset.paragraph);
    }
    return result;
  };
  let val = {
    asmt_id: targ.dataset.asmt,
    caption: targ.querySelector(".caption").textContent,
    desc: targ.querySelector(".description").textContent,
    reqs: reqs(targ),
  };
  new_asmt_modal_display(val);
}

function handle_asmt_delete(asmt) {
  loading_start();
  let asmt_id = asmt.dataset.asmt;
  let course = asmt.closest(".student").dataset.course;
  let all_asmt = document.querySelectorAll(`[data-asmt="${asmt_id}"]`);
  /** Clientside */
  for (let asmt of all_asmt) {
    asmt.parentNode.removeChild(asmt);
  }

  delete_asmt_db(course, asmt_id);
  loading_end();
  display_toast("Uppgift borttagen!");
}

function display_share_asmt_modal(course) {
  document.getElementById("share_asmt_modal_course").textContent = course;
  document.getElementById("example_email_container").classList.add("hidden");
  let c = document.getElementById(course);
  let input_students = document.getElementById("share_asmt_course_index");
  let arr_students = c.querySelectorAll("a.show_student");

  for (let s of arr_students) {
    let id = s.dataset.id;
    let name = s.textContent;
    let li = document.createElement("li");

    let input = document.createElement("input");
    input.type = "checkbox";
    input.dataset.id = id;
    input.classList.add("form-check-input", "included_student");
    li.appendChild(input);

    let label = document.createElement("label");
    label.textContent = name;
    label.setAttribute("style", "margin-bottom:0;");
    li.appendChild(label);
    input_students.appendChild(li);
  }

  let arr_asmts = c.querySelector(".asmt_list").children;
  let input_asmts = document.getElementById("share_asmt_list");

  for (let asmt of arr_asmts) {
    let id = asmt.dataset.asmt;
    let txt = asmt.firstChild.textContent;
    let li = document.createElement("li");

    let input = document.createElement("input");
    input.type = "checkbox";
    input.dataset.id = id;
    input.classList.add("form-check-input", "included_asmt");

    li.appendChild(input);
    let label = document.createElement("label");
    label.textContent = txt;
    label.setAttribute("style", "margin-bottom:0;");
    li.appendChild(label);
    input_asmts.append(li);
  }

  $("#share_asmt_modal").modal();
}

function create_email(id, course) {
  let mail_fragment = document.createElement("div");

  let stu_elem = document.getElementById(id);
  let mail_intro = document.querySelector("#copy .student_email_template").cloneNode(true);
  let name = stu_elem.querySelector(".student_name").textContent;

  mail_intro.querySelector(".student_email_template_name").textContent = name;
  mail_intro.querySelector(".student_email_template_course").textContent = course;
  mail_fragment.append(mail_intro);

  let modal = document.getElementById("share_asmt_modal");
  /** Check if summary is to be included */
  const include_summary = modal.querySelector("#include_summary_yes:checked");
  let data = JSON.parse(localstorage_course_data("get"));
  let active_course = data.find((a) => a.id === course);
  if (include_summary) {
    let table = document.querySelector("#copy .email_table_master").cloneNode(true);
    mail_fragment.append(table);
    let tbody = table.querySelector("tbody");
    for (let paragraph in active_course.reqs) {
      let tr = document.createElement("tr");
      tbody.appendChild(tr);
      for (let grade in active_course.reqs[paragraph]) {
        let td = document.createElement("td");
        tr.appendChild(td);
        td.setAttribute("data-grade", grade);
        td.setAttribute("data-paragraph", paragraph);
        td.style.border = "1px solid black";
        td.classList.add("stu_master");
        td.spanify_text(active_course.reqs[paragraph][grade]);
      }
    }

    /** Copy all statused words from master */
    let master_table = stu_elem.querySelector("table.master");
    let words_with_status = master_table.querySelectorAll("[data-status]");
    for (let word of words_with_status) {
      let parent = word.parentNode;
      let p = { pg: parent.dataset.paragraph, gr: parent.dataset.grade, stat: word.dataset.status, word: word.dataset.word };
      let this_word = tbody.querySelector(`[data-paragraph="${p.pg}"][data-grade="${p.gr}"] [data-word="${p.word}"]`); // the space between grade and word is necessary
      switch (p.stat) {
        case "unmet":
          this_word.style = "background-color: #ffc1cc !important;";
          break;
        case "met1":
          this_word.style = "background-color: #DFFF00 !important;";
          break;
        case "met2":
          this_word.style = "background-color: #90e081 !important;";
          break;
        case "met3":
          this_word.style = "background-color: #5ad144 !important;";
          break;
      }
    }
  }

  /** Get asmts */
  const chosen_asmts = modal.querySelectorAll('#share_asmt_list input[type="checkbox"]:checked');
  for (let asmt of chosen_asmts) {
    let asmt_id = asmt.dataset.id;
    let this_asmt = stu_elem.querySelector(`div[data-asmt=${asmt_id}]`);
    let table = document.querySelector("#copy .email_table").cloneNode(true);
    mail_fragment.append(table);
    table.querySelector(".caption").textContent = this_asmt.querySelector(".caption").textContent;
    let description = this_asmt.querySelector(".description").textContent;
    let description_input = table.querySelector(".description");
    if (description) {
      description_input.textContent = description;
    } else {
      description_input.parentNode.removeChild(description_input);
    }

    let feedback = this_asmt.querySelector(".feedback").value;
    let feedback_input = table.querySelector(".feedback");
    if (feedback) {
      feedback_input.textContent = feedback;
    } else {
      table.querySelector(".feedback_section").parentNode.removeChild(table.querySelector(".feedback_section"));
    }
    let req_elems = this_asmt.querySelectorAll("tbody tr");
    let tbody = table.querySelector("tbody");
    for (let r of req_elems) {
      let paragraph = r.firstChild.dataset.paragraph;
      let tr = document.createElement("tr");
      tbody.appendChild(tr);
      for (let grade in active_course.reqs[paragraph]) {
        let td = document.createElement("td");
        tr.appendChild(td);
        td.setAttribute("data-grade", grade);
        td.setAttribute("data-paragraph", paragraph);
        td.style.border = "1px solid black";
        td.classList.add("stu_master");
        td.spanify_text(active_course.reqs[paragraph][grade]);
      }
    }

    let words_with_status = this_asmt.querySelectorAll("[data-status]");
    for (let word of words_with_status) {
      let parent = word.parentNode;
      let p = { pg: parent.dataset.paragraph, gr: parent.dataset.grade, stat: word.dataset.status, word: word.dataset.word };
      let this_word = tbody.querySelector(`[data-paragraph="${p.pg}"][data-grade="${p.gr}"] [data-word="${p.word}"]`); // the space between grade and word is necessary
      if (p.stat == "met") {
        this_word.style = "background-color: #90e081;";
      } else if (p.stat == "unmet") {
        this_word.style = "background-color: #ffc1cc;";
      }
    }
  }
  return mail_fragment;
}

function generate_example_email() {
  /** Get first checked option of #share_asmt_course_index */
  let modal = document.getElementById("share_asmt_modal");
  let first_student = modal.querySelector('#share_asmt_course_index input[type="checkbox"]:checked');
  if (!first_student) {
    display_toast("Du har inte valt en endaste elev!");
    return;
  }

  let this_student = first_student.dataset.id;
  let sel_course = document.getElementById("header_select_course").value;

  let example_email = create_email(this_student, sel_course);
  let mail_content = document.getElementById("example_email");
  while (mail_content.firstChild) {
    mail_content.removeChild(mail_content.firstChild);
  }
  mail_content.append(example_email);

  document.getElementById("example_email_container").classList.remove("hidden");
}

function handle_send_selected_students() {
  let modal = document.getElementById("share_asmt_modal");
  let sel_students = modal.querySelectorAll('#share_asmt_course_index input[type="checkbox"]:checked');

  if (!sel_students) {
    display_toast("Du har inte vald några elever");
    return;
  }

  const chosen_asmts = modal.querySelectorAll('#share_asmt_list input[type="checkbox"]:checked');
  const include_summary = modal.querySelector("#include_summary_yes:checked");
  if (chosen_asmts.length == 0 && !include_summary) {
    display_toast("Du har varken valt sammanställning eller minst en uppgift");
    return;
  }

  let course = document.getElementById("header_select_course").value;
  for (let stu of sel_students) {
    let id = stu.dataset.id;

    let example_email = create_email(id, course);
    send_email(example_email.innerHTML);
  }

  $("#share_asmt_modal").modal("hide");
}

function SPREADSHEET_DETAILS() {
  const SS = {
    KR: "1ol85EDybjVtfxX3v9mtuwhb8UGmDdzCNxF1kKzuXkh4",
    ID: "1VKuvv4756LPS2WzT66sPVXENAdqfcfBYItHoyLxXZxU",
    TAB: {
      DB: "db",
    },
  };
  return SS;
}

function safelyParseJSON(json) {
  let parsed;
  try {
    parsed = JSON.parse(json);
  } catch (e) {
    // Oh well, but whatever...
  }
  return parsed; // Could be undefined!
}

function create_new_asmt_id(course) {
  let highest_id = 0; // starting point to relate to is 0
  let asmts = document.getElementById(course).querySelector(".assessments"); // get all .asmt within course which is passed as parameter
  let regex = /(\d+)(?!.*\d)/; // get last number in string
  for (let el of asmts.children) {
    // loop through all elements
    let match = el.id.match(regex).shift(); // match against each element. Bit lengthy but not sure how to do it better relevant match will be match[0]
    highest_id = Math.max(Number(match), highest_id); // compare the final character of the id, which is hopefully a number
  }
  highest_id++; // increment highest id by 1
  return highest_id;
}

function display_toast(text) {
  document.querySelector(".toast-body").textContent = text;
  $("#toast").toast("show");
}

function loading_start() {
  document.getElementById("loading").classList.remove("hidden");
}

function loading_end() {
  document.getElementById("loading").classList.add("hidden");
}

function localstorage_course_data(mission, datastring) {
  /** @param {string} mission: 'set': update storage, 'get': fetch storage
   * @param {string} datastring: JSON string. only used if param above is 'set' */
  if (mission == "set") {
    localStorage.setItem("data", datastring);
  }

  if (mission == "get") {
    return localStorage.getItem("data");
  }
}

function get_todays_date() {
  var date = new Date();
  var dateString = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().split("T")[0];
  return dateString;
}

// function spanify_text(text, parent) {
//   for (let word of text) {
//       let word_span = document.createElement('span');
//       word_span.textContent = word.w + ' ';
//       word_span.classList.add('word')
//       word_span.dataset.word = word.n;
//       if ('b' in word) { word_span.classList.add('emphasized')}
//       parent.append(word_span)
//     }
// }

Element.prototype.spanify_text = function (text) {
  for (let word of text) {
    let word_span = document.createElement("span");
    word_span.textContent = word.w + " ";
    word_span.classList.add("word");
    word_span.dataset.word = word.n;
    if ("b" in word) {
      word_span.classList.add("emphasized");
    }
    this.append(word_span);
  }
};
