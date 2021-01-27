document.addEventListener("DOMContentLoaded", () => {
  // Auto-grow textareas
  document.querySelectorAll(`.textarea`).forEach((TA) => {
    TA.addEventListener("input", () => {
      TA.style.height = "auto";
      TA.style.height = TA.scrollHeight + "px";
    });
  });
});

document.addEventListener("click", (evt) => {
  let target = evt.target;

  if (target.id === "print-student") {
    print_prepare_student();
  }

  if (target.id === "save-reflection") {
    handle_save_reflection();
  }
});

async function handle_load_student(data) {
  let user_email = getUserEmail();

  if (data.length === 0) {
    Onload.noData(user_email);
    return;
  }

  if (data === "noCredentials") {
    Onload.noCredentials(user_email);
    return;
  }

  let p = new Promise((res) => {
    load_student_data(data);
    res();
  });

  p.then(() => {
    Onload.signedIn();
  });
}

function load_student_data(data) {
  // Lägg till header från data[0]
  let el_header = document.querySelector(".report__studentName");
  let el_coach = document.querySelector(".report__studentCoach");
  let el_class = document.querySelector(".report__studentClass");
  let el_term = document.querySelector(".report__term");

  el_term.textContent = CURRENT_TERM;
  el_header.textContent = data[0].name;
  el_coach.textContent = data[0].coach_name;
  el_class.textContent = data[0].class;

  // Populera textareas med reflektion
  if ("reflections" in data[0]) {
    populate_reflections(data[0].reflections);
  }
  for (let c of data) {
    add_grid_row(c);
  }
}

function add_grid_row(data) {
  let tr = document.createElement("div");
  tr.classList.add("row", "py-1", "mb-2");

  let col_course = document.createElement("div");
  col_course.classList.add("col-3", "mr-2");
  tr.appendChild(col_course);

  let course_title = document.createElement("div");
  col_course.appendChild(course_title);
  course_title.classList.add("sGrid__courseTitle", "text-bold");
  course_title.textContent = data.course_title;

  let teacher_wrapper = document.createElement("div");
  col_course.appendChild(teacher_wrapper);

  let teacher_img = document.createElement("img");
  teacher_img.setAttribute("src", "/../resources/images/s-teacher.png");
  teacher_img.setAttribute("alt", "teacher");
  teacher_img.classList.add("teacher-img");
  teacher_wrapper.appendChild(teacher_img);

  let mobile_teacher_title = document.createElement("span");
  teacher_wrapper.appendChild(mobile_teacher_title);
  mobile_teacher_title.textContent = "Lärare:";
  mobile_teacher_title.style.marginRight = "15px";
  mobile_teacher_title.classList.add("mobile-only--inline", "text-bold", "my-2");

  let teacher_name = document.createElement("span");
  teacher_wrapper.appendChild(teacher_name);
  teacher_name.classList.add("sGrid__teacher");
  teacher_name.textContent = data.teacher_name;

  if ("attendance" in data) {
    let attendance = "N/A";
    if (typeof data.attendance.total !== Boolean || data.attendance.total !== undefined || data.attendance.total !== "") {
      attendance = data.attendance.total;
    }
    let absence = document.createElement("div");
    col_course.appendChild(absence);
    absence.textContent = `Elevens frånvaro: ${attendance}%`;
  }

  // Omdöme
  let col_asmt = document.createElement("div");
  col_asmt.classList.add("col-2", "mr-2");
  tr.appendChild(col_asmt);

  let mobile_asmt_title = document.createElement("span");
  col_asmt.appendChild(mobile_asmt_title);
  mobile_asmt_title.textContent = "Omdöme:";
  mobile_asmt_title.style.marginRight = "15px";
  mobile_asmt_title.classList.add("mobile-only--inline", "text-bold", "my-2");

  let asmt = document.createElement("div");
  col_asmt.appendChild(asmt);

  let asmt_spelled_out;
  let class_to_add = `option-${data.assessment}`;
  switch (data.assessment) {
    case "T":
      asmt_spelled_out = "Tillfredsställande";
      break;
    case "TEB":
      asmt_spelled_out = "Tillfredsställande (ej betyg)";
      break;
    case "IT":
      asmt_spelled_out = "Icke tillfredsställande";
      break;
    case "UB":
      asmt_spelled_out = "Underlag bristfälligt";
      break;
    default:
      asmt_spelled_out = "Ej rapporterad av lärare";
      class_to_add = "text-small";
      break;
  }
  asmt.textContent = asmt_spelled_out;
  asmt.classList.add("asmt-box", class_to_add, "mt-2");

  // Kommentar
  let col_comment = document.createElement("div");
  tr.appendChild(col_comment);
  col_comment.classList.add("col", "mr-2");

  let mobile_comment_title = document.createElement("span");
  col_comment.appendChild(mobile_comment_title);
  mobile_comment_title.textContent = "Lärarens kommentar:";
  mobile_comment_title.style.marginRight = "15px";
  mobile_comment_title.classList.add("mobile-only--block", "text-bold", "mt-2");

  let comment = document.createElement("div");
  comment.classList.add("comment-text");
  col_comment.appendChild(comment);

  if ("comment" in data) {
    if (data.comment.length !== 0) {
      comment.textContent = data.comment;
      // Ja det här är lite puckat, men det fungerar
      comment.innerHTML = comment.innerHTML.replace(/\r?\n/g, "<br>");
    }
  }
  document.getElementById("grid-body").appendChild(tr);
}

function populate_reflections(ref) {
  // Each TA has ID form0 to form3. Just loop through, using an index
  let i = 0;
  let len = ref.length;
  for (i; i < len; i++) {
    let active_TA = document.getElementById(`form${i}`);
    active_TA.value = ref[i];
  }
}

function handle_save_reflection() {
  let forms = [
    document.getElementById("form0").value,
    document.getElementById("form1").value,
    document.getElementById("form2").value,
    document.getElementById("form3").value,
  ];

  let save_reflection = (val) => {
    return new Promise((res) => {
      let userEmail = getUserEmail();
      DB.collection("status-report")
        .doc(CURRENT_TERM)
        .collection("students")
        .doc(userEmail)
        .collection("courses")
        .get()
        .then((querySnapshot) => {
          querySnapshot.forEach((doc) => {
            if (doc.exists) {
              doc.ref
                .update({
                  reflections: val,
                })
                .catch((e) => console.error(e));
            }
          });
        })
        .then(() => {
          res();
        });
    });
  };

  save_reflection(forms).then(() => {
    Toast.show("Tack! Din reflektion har sparats!", "success");
  });
}

function print_prepare_student() {
  // Replace textareas with DIVs

  let all_TA = document.querySelectorAll("textarea");

  all_TA.forEach((TA) => {
    let div = document.createElement("div");
    div.setAttribute("style", "font-size: 0.85rem; white-space: pre-wrap; border: 1px solid black; padding: 0.33rem; margin: 10px 0"); // Spelar mindre roll om det görs såhär eller i nästa funktion
    div.textContent = TA.value;
    // Lägg till radbyten där användaren gjort dem
    div.innerHTML = div.innerHTML.replace(/\r?\n/g, "<br>");
    TA.parentElement.appendChild(div);
    TA.parentElement.removeChild(TA);
  });

  print_student();
}

function print_student() {
  let divContents = document.getElementById("report").innerHTML;
  let printWindow = window.open("", "", "height=600,width=1000");
  printWindow.document.write("<html><head><title>UTSKRIFT - Lägesrapport</title>");
  printWindow.document.write(
    "\
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
    .mobile-only--inline, .mobile-only--block { display: none} \
    .row { display: flex; width: 100%; padding: 0.25rem 0}\
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
    textarea { width: 100%; overflow: auto; display: block} \
    #save-reflection { display: none} \
    .option-IT { background-color: #ffd2cf !important; }\
    .option-T { background-color: #96f2af !important; }\
    .option-TEB { background-color: #6ec76e !important; }\
    .option-UB { background-color: #feffd9 !important; }\
  </style>"
  );
  printWindow.document.write("</head><body >");
  printWindow.document.write(divContents);
  printWindow.document.write("</body></html>");
  printWindow.document.close();
  printWindow.print();
}
