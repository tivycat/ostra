/* https://patorjk.com/software/taag/#p=display&h=2&v=1&f=ANSI%20Regular&t=localstorage*/
/*
  ██      ██████   █████  ██████  
  ██     ██    ██ ██   ██ ██   ██ 
  ██     ██    ██ ███████ ██   ██ 
  ██     ██    ██ ██   ██ ██   ██ 
  ███████ ██████  ██   ██ ██████  
*/

const myApp = {};
myApp.current_schoolyear = "20-21";
myApp.dates = {
  first_week_of_term: 32,
  last_week_of_term: 25,
};
myApp.FB = {
  events: firebase
    .firestore()
    .collection("planning")
    .doc(myApp.current_schoolyear)
    .collection("events"),
};
// Initiate load
document.addEventListener("DOMContentLoaded", () => {
  Toast.init();
  loadCal();
});

const Loader = {
  start() {
    document.getElementById("loader-wrapper").classList.remove("hidden");
    document.body.classList.add("wait");
    setTimeout(() => {
      if (
        !document.getElementById("loader-wrapper").classList.contains("hidden")
      ) {
        console.error("Loader misslyckades");
        Loader.finish();
        Toast.show(
          "Loader avslutades manuellt. Något tog väldigt lång tid...",
          "error"
        );
      } else {
      }
    }, 15000);
  },
  finish() {
    document.getElementById("loader-wrapper").classList.add("hidden");
    document.body.classList.remove("wait");
  },
};

function loadCal() {
  // Fyll kalendern med datum
  let today = new Date();
  let todays_week = getWeek(today);
  let year_to_start;
  let year_to_end;
  // Om denna vecka är MINDRE än 26 så är det vårtermin
  if (todays_week <= myApp.dates.last_week_of_term) {
    year_to_end = today.getFullYear();
    year_to_start = today.getFullYear() - 1;
  } else {
    // Annars är det just nu höst
    year_to_start = today.getFullYear();
    year_to_end = today.getFullYear() + 1;
  }

  let mon_first_week = getMondayOfWeek(
    year_to_start,
    myApp.dates.first_week_of_term
  );
  let mon_last_week = getMondayOfWeek(
    year_to_end,
    myApp.dates.last_week_of_term
  );

  // loopa igenom datum tills datumet når sista veckan
  var loop = new Date(mon_first_week);
  let week_idx = 0;
  while (loop <= mon_last_week) {
    let year = loop.getFullYear();
    let week = getWeek(loop);
    let week_object = generateWeekobject(year, week, loop);
    create_week(week_object, week_idx++);

    var newDate = loop.setDate(loop.getDate() + 7);
    loop = new Date(newDate);
  }

  PLANNING_DB.collection("events")
    .orderBy("order")
    .get()
    .then((querySnapshot) => {
      querySnapshot.forEach((doc) => {
        let event = doc.data();
        let container = document
          .getElementById(event.date)
          .querySelector(".events");
        event_create(event, container);
      });
    })
    .then(() => {
      add_elements_to_menu_dropdown();
      display_active_weeks();
      Loader.finish();
    })
    .catch((e) => console.error("Error loading events ===>", e));
}

function create_week(week, week_idx) {
  // -- ELEMENTS
  const container = document.getElementById("calendar");

  let row = document.createElement("div");
  row.classList.add("week");
  row.dataset.weeknum = week.week_num;
  row.dataset.weekIdx = week_idx;
  // row.id = week.id;

  let weekHeader = document.createElement("div");
  weekHeader.classList.add("day", "week__header");
  weekHeader.id = week.id;
  weekHeader.dataset.weeknum = week.week_num;
  row.appendChild(weekHeader);

  let weekDetails = document.createElement("div");
  weekDetails.classList.add("week__details");
  weekHeader.appendChild(weekDetails);

  let weekNum = document.createElement("div");
  weekNum.classList.add("week__detail", "weekNum");
  weekNum.textContent = week.week_num;
  weekDetails.appendChild(weekNum);

  let weekDates = document.createElement("div");
  weekDates.classList.add("week__detail", "weekDates");
  let date_span =
    formatDateWithSlash(week.start_date) +
    " - " +
    formatDateWithSlash(week.end_date);
  weekDates.textContent = date_span;
  weekDetails.appendChild(weekDates);

  let weekEvents = document.createElement("div");
  weekEvents.classList.add("events", "mt-2");
  weekHeader.appendChild(weekEvents);

  for (let day of week.days) {
    let el_day = document.createElement("div");
    el_day.classList.add("day");
    el_day.dataset.day = day.weekday;
    el_day.id = day.id;
    row.appendChild(el_day);

    let dateDetails_wrapper = document.createElement("div");
    dateDetails_wrapper.classList.add("dateDetails", "screenOnly--flex");
    let span_weekday = document.createElement("div");
    span_weekday.classList.add(
      "dateDetails__column",
      "dateDetails__column--weekday",
      "screenOnly--block"
    );
    span_weekday.textContent = translateDay(day.weekday);
    dateDetails_wrapper.appendChild(span_weekday);

    let span_date = document.createElement("div");
    span_date.classList.add(
      "dateDetails__column",
      "dateDetails__column--date",
      "screenOnly--block"
    );
    span_date.textContent = formatDateWithSlash(day.id);
    dateDetails_wrapper.appendChild(span_date);

    el_day.appendChild(dateDetails_wrapper);

    let events = document.createElement("div");
    events.classList.add("events");
    el_day.appendChild(events);
  }

  container.appendChild(row);

  // -- HELPER FUNCTIONS
  function formatDateWithSlash(date) {
    const [year, month, day] = date.split("-");
    return day + "/" + month;
  }

  function translateDay(day) {
    let d;
    switch (day) {
      case "mon":
        d = "Måndag";
        break;
      case "tue":
        d = "Tisdag";
        break;
      case "wed":
        d = "Onsdag";
        break;
      case "thu":
        d = "Torsdag";
        break;
      case "fri":
        d = "Fredag";
        break;
    }

    return d;
  }
}

function add_elements_to_menu_dropdown() {
  // -- ELEMENTS
  const personal_content_element = document.getElementById("dropdown-personal");
  const level_parent_elements = [
    document.getElementById("dropdown-Åk1"),
    document.getElementById("dropdown-Åk2"),
    document.getElementById("dropdown-Åk3"),
    document.getElementById("dropdown-Andra"),
  ];

  let list_to_append_to_personal = [
    {
      txt: "Alla personal events",
      id: "show-personal-all",
      prop: "all",
    },
    // {
    //   txt: "Programmöten",
    //   id: "show-personal-prgm",
    //   prop: "prgm",
    // },
    // {
    //   txt: "Ämnesmöten",
    //   id: "show-personal-sbjt",
    //   prop: "sbjt",
    // },
    // {
    //   txt: "APT",
    //   id: "show-personal-apt",
    //   prop: "apt",
    // },
    // {
    //   txt: "IFO",
    //   id: "show-personal-ifo",
    //   prop: "ifo",
    // },
  ];

  for (let item of list_to_append_to_personal) {
    let li = document.createElement("li");
    li.classList.add("dropdown__item");

    let btn = document.createElement("button");
    btn.classList.add("dropdown__btn", "change-eventDisplay");
    btn.textContent = item.txt;
    btn.id = item.id;
    btn.dataset.forEvents = "Personal";
    btn.dataset.eventProp = item.prop;
    li.appendChild(btn);

    personal_content_element.appendChild(li);
  }

  for (let container of level_parent_elements) {
    let [dropdown, level] = container.id.split("-"); // the parent element is called 'dropdown-year1' for example. we need year1 here.
    for (let cls of LEVELS_AND_CLASSES[level]) {
      let li = document.createElement("li");
      li.classList.add("dropdown__item");

      let btn = document.createElement("button");
      btn.classList.add("dropdown__btn");
      btn.textContent = cls;
      btn.id = `show-class-${cls}`;
      btn.classList.add("dropdown__btn", "change-eventDisplay");
      btn.dataset.forEvents = level;
      btn.dataset.eventProp = cls;
      li.appendChild(btn);

      container.appendChild(li);
    }
  }
}

/*
███████ ██    ██ ███████ ███    ██ ████████     ███████ ██    ██ ███    ██  ██████ ███████ 
██      ██    ██ ██      ████   ██    ██        ██      ██    ██ ████   ██ ██      ██      
█████   ██    ██ █████   ██ ██  ██    ██        █████   ██    ██ ██ ██  ██ ██      ███████ 
██       ██  ██  ██      ██  ██ ██    ██        ██      ██    ██ ██  ██ ██ ██           ██ 
███████   ████   ███████ ██   ████    ██        ██       ██████  ██   ████  ██████ ███████     
*/

/**
 * Runs whenever you want to create an event, including on-load
 * @param {object} prop consist of : caption, description, event_type, typecode, creator, groups, event_id, date
 */
function event_create(prop, container) {
  let el = document.createElement("div");
  el.classList.add("event", prop.typecode);
  el.id = prop.event_id;

  el.dataset.creator = prop.creator;
  el.dataset.visibleFor = prop.groups;
  el.dataset.event_id = prop.event_id;
  el.dataset.date = prop.date;
  el.dataset.eventType = prop.event_type;
  el.dataset.caption = prop.caption;
  el.dataset.typeCode = prop.typecode;
  el.dataset.order = prop.order;

  let caption = document.createElement("div");
  caption.classList.add("event__caption");
  el.appendChild(caption);
  caption.textContent = prop.caption;

  if (prop.description) {
    el.setAttribute("title", prop.description);
    let icon = document.createElement("span");
    icon.classList.add("event__icon");
    icon.textContent = "🛈";
    el.appendChild(icon);
  } else {
    caption.classList.add("event__caption--noDescription");
  }

  let groups = document.createElement("div");
  el.appendChild(groups);
  groups.classList.add("event__groups");
  groups.textContent = prop.groups;

  // Om inga tidigare element finns, lägg bara till
  if (container.children.length == 0) {
    container.appendChild(el);
  } else {
    // Loopa igenom barn. Om order hos elementet är högre än det som vi skapat så insertBefore
    for (let i = 0; i < container.children.length; i++) {
      let child = container.children[i];
      let child_order = Number(child.dataset.order);
      if (child_order >= Number(prop.order)) {
        container.insertBefore(el, child);
        break;
      }
      // Om funktionen ännu inte breakat, lägg bara till
      if (i === container.children.length - 1) {
        container.appendChild(el);
      }
    }
  }
}

function event_save(d, newEvent) {
  // -- ELEMENTS
  const newEvent_container = document
    .getElementById(d.date)
    .querySelector(".events");

  // Update db
  if (newEvent) {
    create_event_firebase(d)
      .then((e) => {
        event_create(e, newEvent_container);
        Toast.show("Event skapad", "success");
        Modal.hide();
        Loader.finish();
      })
      .catch((err) => console.error(err));
  } else {
    delete_previous_eventElement();
    update_event_db(d)
      .then(() => {
        event_create(d, newEvent_container);
        Toast.show("Event uppdaterat!", "success");
        Modal.hide();
        Loader.finish();
        handle_new_event_order(newEvent_container, d);
      })
      .catch((err) => console.error(err));
  }

  // -- FUNCTIONS
  function create_event_firebase(event) {
    return new Promise(async (resolve) => {
      // Lägg till creator och event_id i objekt, sen passera tillbaka
      event.creator = firebase.auth().currentUser.email;
      let docRef = PLANNING_DB.collection("events");
      let { id } = await docRef.add(event);
      event.event_id = id;
      docRef.doc(id).set(event);
      resolve(event);
    });
  }

  function delete_previous_eventElement() {
    if (!newEvent) {
      const event_element = document.getElementById(d.event_id);
      event_element.parentNode.removeChild(event_element);
    }
  }

  function update_event_db(event) {
    return new Promise((resolve, reject) => {
      PLANNING_DB.collection("events")
        .doc(event.event_id)
        .set(event)
        .then(() => {
          resolve();
        })
        .catch((e) => {
          console.error("Error setting document: ", e);
        });
    });
  }
}

async function event_delete() {
  // -- IMPLEMENTATION
  let active_event = await get_event_from_SS();
  let event_id = active_event.event_id;
  delete_event_fb(event_id)
    .then(() => {
      const event_element = document.getElementById(event_id);
      event_element.parentElement.removeChild(event_element);
    })
    .then(() => {
      Toast.show("Event borttaget!", "success");
      Modal.hide();
    });

  // -- FUNCTIONS
  function delete_event_fb(event_id) {
    return new Promise((res) => {
      PLANNING_DB.collection("events")
        .doc(event_id)
        .delete()
        .then(res())
        .catch((err) => console.error("Error removing document", err));
    });
  }
}

function toggle_newEvent_buttons(command) {
  // -- ELEMENTS
  const all_day_elements = document.querySelectorAll(".day");
  if (command === "activate") {
    activate();
  } else if (command === "deactivate") {
    deactivate();
  }

  // -- FUNCTIONS
  function activate() {
    for (let day of all_day_elements) {
      // Lägg till admin-knappar
      let new_event_btn = document.createElement("button");
      new_event_btn.classList.add(
        "admin-btn",
        "button",
        "button--small",
        "button--coral"
      );
      new_event_btn.style.margin = "0.5rem auto";
      new_event_btn.addEventListener("click", (evt) => {
        const parent_element = evt.target.parentNode;
        const event_type = evt.target.dataset.eventType;
        newEventModal_display(event_type, parent_element);
      });
      day.appendChild(new_event_btn);

      if (day.classList.contains("week__header")) {
        new_event_btn.textContent = "Lägg till veckoavvikelse";
        new_event_btn.dataset.eventType = "week";
      } else {
        new_event_btn.textContent = "Lägg till event";
        new_event_btn.dataset.eventType = "day";
      }

      day.setAttribute("ondrop", "drop(event, this)");
      day.setAttribute("ondragover", "allowDrop(event)");

      let new_massEvent = document.createElement("button");
      new_massEvent.classList.add(
        "admin-btn",
        "button",
        "button--small",
        "button--blue"
      );
      new_massEvent.style.margin = "0.5rem auto";
      new_massEvent.addEventListener("click", (evt) => {
        const parent_element = evt.target.parentNode;
        const event_type = evt.target.dataset.eventType;
        newQuickEventModal_display(event_type, parent_element);
      });
      day.appendChild(new_massEvent);

      if (day.classList.contains("week__header")) {
        new_massEvent.textContent = "Flertillägg";
        new_massEvent.dataset.eventType = "week";
      } else {
        new_massEvent.textContent = "Flertillägg";
        new_massEvent.dataset.eventType = "day";
      }
    }
    // Lägg till drag & drop på alla events
    let all_events = document.querySelectorAll(".event");
    for (let evt of all_events) {
      evt.setAttribute("draggable", "true");
      evt.setAttribute("ondragstart", "drag(event)");
    }
  }

  function deactivate() {
    let buttons_to_remove = document.querySelectorAll(".admin-btn");
    for (let btn of buttons_to_remove) {
      btn.parentNode.removeChild(btn);
    }
  }
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
  async show(type) {
    let modal = document.querySelector(`[data-modal="${type}"]`);
    modal.classList.add("modal--active");
  },
  hide() {
    let active_modal = document.querySelector(".modal--active");
    if (active_modal) {
      active_modal.classList.remove("modal--active");
    }
  },
};

/*
███    ███               ███    ██ ███████ ██     ██     ███████ ██    ██ ████████ 
████  ████               ████   ██ ██      ██     ██     ██      ██    ██    ██    
██ ████ ██     █████     ██ ██  ██ █████   ██  █  ██     █████   ██    ██    ██    
██  ██  ██               ██  ██ ██ ██      ██ ███ ██     ██       ██  ██     ██    
██      ██               ██   ████ ███████  ███ ███      ███████   ████      ██    
*/

async function newEventModal_display(type, container_element) {
  // -- ELEMENTS
  const modal_element = document.querySelector(`[data-modal="newEvent"]`);
  const content_container = modal_element.querySelector(
    ".modal__exchangableContent"
  );

  empty_element(content_container); // Reset modal

  const event_date = container_element.id;
  let new_content_element;
  if (type === "day") {
    // event_container = document.getElementById(event_date);
    new_content_element = document
      .querySelector("#clone .modal__newEvent--day")
      .cloneNode(true);
    set_event_date(event_date, new_content_element);
  } else if (type === "week") {
    // event_container = document.getElementById(`weekHeader-${event_date}`);
    new_content_element = document
      .querySelector("#clone .modal__newEvent--week")
      .cloneNode(true);

    let caldata = get_week_headers_from_cal();
    let weeknum = container_element.parentElement.dataset.weeknum;
    set_event_week(new_content_element, caldata, weeknum);
  }
  // -- ELEMENTS
  const caption_element = new_content_element.querySelector(
    ".editable__caption"
  );
  const description_element = new_content_element.querySelector(
    ".editable__description"
  );
  const groups_element = new_content_element.querySelector(".groups__editable");
  const typeCode_element = new_content_element.querySelector(
    ".editable__typeCode"
  );
  const saveBtn_element = new_content_element.querySelector(
    ".modal-saveChanges"
  );
  const order_element = new_content_element.querySelector(".editable__order");

  if (type === "week") {
    typeCode_element.value = "event--week";
    typeCode_element.disabled = true;
  }

  const checkboxes = add_checkboxes_to_editable(); // Lägg till checkboxes för grupperna
  groups_element.appendChild(checkboxes);

  // Fix order options
  const event_container = container_element.querySelector(".events");
  let children = event_container.children;
  order_element.value = children.length;
  order_element.setAttribute("max", children.length);

  content_container.appendChild(new_content_element);
  Modal.show("newEvent"); // Show modal

  // -- EVENT LISTENERS
  if (type === "day") {
    saveBtn_element.addEventListener("click", () => {
      Loader.start();
      let ticked_boxes = get_ticked_boxes(groups_element);
      let date_element = new_content_element.querySelector(
        ".datePicker__selectedDate"
      );
      let date = new Date(date_element.dataset.date);
      if (date.getDay() === 6 || date.getDay() === 0) {
        Toast.show(
          "Det går inte spara event på helger! Ny dag, tack!",
          "error"
        );
        Loader.finish();
        return;
      }
      date = formatDate(date);

      if (ticked_boxes == "" || ticked_boxes == null) {
        Toast.show("Just nu har du inte valt vilka eventet berör", "error");
        Loader.finish();
        return;
      }

      if (caption_element == "") {
        Toast.show("Ditt event saknar caption", "error");
        Loader.finish();
        return;
      }

      event_save(
        {
          caption: caption_element.value,
          description: description_element.value,
          date: date,
          order: order_element.value,
          groups: ticked_boxes,
          typecode: typeCode_element.value,
          event_type: "day",
        },
        true
      );
    });
  } else if (type === "week") {
    saveBtn_element.addEventListener("click", () => {
      Loader.start();
      let ticked_boxes = get_ticked_boxes(groups_element);
      const weekdate_element = new_content_element.querySelector(
        ".editable__weekdate"
      );
      let index = weekdate_element.selectedIndex;
      let right_option = weekdate_element.options[index];
      let week = right_option.dataset.forWeek;

      if (caption_element.value == "") {
        Toast.show("Ditt event saknar caption", "error");
        Loader.finish();
        return;
      }

      if (ticked_boxes == "" || ticked_boxes == null) {
        Toast.show("Just nu har du inte valt vilka eventet berör", "error");
        Loader.finish();
        return;
      }

      event_save(
        {
          caption: caption_element.value,
          description: description_element.value,
          date: week,
          order: order_element.value,
          groups: ticked_boxes,
          typecode: typeCode_element.value,
          event_type: "week",
        },
        true
      );
    });
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
}

function newQuickEventModal_display(type, container_element) {
  const modal_element = document.querySelector(`[data-modal="newEvent"]`);
  const content_container = modal_element.querySelector(
    ".modal__exchangableContent"
  );

  empty_element(content_container); // Reset modal

  const event_date = container_element.id;
  let new_content_element = document
    .querySelector("#clone .modal__newQuickEvent")
    .cloneNode(true);

  // -- ELEMENTS
  const quickEvent_container = new_content_element.querySelector(
    ".editable__quickEvents"
  );
  const saveBtn_element = new_content_element.querySelector(
    ".modal-saveChanges"
  );
  const addRow_button = new_content_element.querySelector(
    ".editable__addNewRow"
  );
  const header_caption = new_content_element.querySelector(
    ".editable__inputCaption"
  );
  let row = new_content_element.querySelector(".quickEvent__template");

  header_caption.textContent = event_date;
  content_container.appendChild(new_content_element);
  Modal.show("newEvent"); // Show modal

  addRow_button.addEventListener("click", () => {
    let r = row.cloneNode(true);
    r.classList.remove("hidden");

    if (type === "week") {
      let typeCode_in_template = r.querySelector(".editable__typeCode");
      typeCode_in_template.value = "event--week";
      typeCode_in_template.disabled = true;
    }

    quickEvent_container.appendChild(r);
  });

  saveBtn_element.addEventListener("click", () => {
    Loader.start();
    let all_events = quickEvent_container.children;
    if (all_events.length == 0) {
      Toast.show("Lägg till en rad", "error");
      Loader.finish();
      return;
    }

    for (let i = 0; i < all_events.length; i++) {
      let el = all_events[i];
      let caption, description, groups, typecode;
      caption = el.querySelector(".editable__caption");
      description = el.querySelector(".editable__description");
      groups = el.querySelector(".editable__groupSelect");
      typecode = el.querySelector(".editable__typeCode");

      if (caption.value == "") {
        Toast.show("Du saknar rubrik på ett event", "error");
        caption.classList.add("bg-red-500");
        Loader.finish();
        return;
      }
      if (groups.value == "") {
        Toast.show("Du saknar grupper till ett event", "error");
        groups.classList.add("bg-red-500");
        Loader.finish();
        return;
      }

      let data = {
        order: i,
        caption: caption.value,
        description: description.value,
        date: event_date,
        typecode: typecode.value,
        groups: groups.value,
        event_type: type,
      };

      event_save(data, true);
    }
  });
}

function set_event_date(date, container) {
  const [year, month, day] = date.split("-");
  let active_date = new Date(year, month - 1, day, 00); // Kom ihåg att månad är 0-indexad
  datePicker_init(container, active_date); // Initiera datepicker. Inkluderar att populera rätt datum
}

function get_ticked_boxes(groups_element) {
  let levels = Object.keys(LEVELS_AND_CLASSES);

  let count = 0;
  let arr = [];
  let value_to_return;
  if (groups_element.querySelector("#gr_endastPersonal").checked) {
    return "Personal";
  }

  for (let lvl of levels) {
    let arr_of_groups = groups_element.querySelectorAll(
      `li input[data-group='${lvl}']:checked`
    );
    if (arr_of_groups.length == 9) {
      arr.push(lvl); // set group to name
      count++;
    } else {
      // if not all are selected, push the classnames into group instead
      for (let group of arr_of_groups) {
        arr.push(group.id.substring(3));
      }
    }
  }
  // if 'count' is 3 that means all 3 are full
  if (count == 3) {
    value_to_return = "Alla";
  } else {
    value_to_return = arr.toString();
  }
  return value_to_return;
}

/*
███    ███               ███████ ██    ██ ████████     ██████ ████████ ███████ 
████  ████               ██      ██    ██    ██        ██   ██   ██    ██      
██ ████ ██     █████     █████   ██    ██    ██        ██   ██   ██    ███████ 
██  ██  ██               ██       ██  ██     ██        ██   ██   ██         ██ 
██      ██               ███████   ████      ██        ██████    ██    ███████ 
*/

function eventDetailsModal_display(t) {
  // -- ELEMENTS
  const modal_element = document.querySelector(`[data-modal="eventDetails"]`);
  const container_element = modal_element.querySelector(
    ".modal__exchangableContent"
  );
  const new_content_element = document
    .querySelector("#clone .modal__eventDetails--readOnly")
    .cloneNode(true);
  const groups_element = new_content_element.querySelector(".readOnly__groups");
  const caption_element = new_content_element.querySelector(
    ".readOnly__caption"
  );
  const description_element = new_content_element.querySelector(
    ".readOnly__description"
  );
  const dateCard_month_element = new_content_element.querySelector(
    ".dateCard__month"
  );
  const dateCard_date_element = new_content_element.querySelector(
    ".dateCard__date"
  );
  const dateCard_week_element = new_content_element.querySelector(
    ".dateCard__week"
  );
  const dateCard_weekday_element = new_content_element.querySelector(
    ".dateCard__weekday"
  );
  const dateCard_year_element = new_content_element.querySelector(
    ".dateCard__year"
  );

  const d = get_event_data(t);

  empty_element(container_element);

  set_sessionStorage(d);

  // Add content to new element
  add_right_date(d);
  groups_element.textContent = d.groups;
  caption_element.textContent = d.caption;
  description_element.textContent = d.description;

  // Avsluta med att appenda nya tbodyn
  container_element.appendChild(new_content_element);
  Modal.show("eventDetails");

  // -- FUNCTIONS
  function add_right_date(d) {
    if (d.event_type === "day") {
      let date = new Date(d.date);
      date = {
        day: date.getDate(),
        month: date.toLocaleString("sv-SE", { month: "short" }), // Hämta första 3 bokstäverna i månaden
        year: date.getFullYear(),
        weekday: translate_day(date.getDay()),
        week: getWeek(date),
      };

      dateCard_date_element.textContent = date.day;
      dateCard_week_element.textContent = `V ${date.week}`;
      dateCard_weekday_element.textContent = date.weekday;
      dateCard_month_element.textContent = date.month;
      dateCard_year_element.textContent = date.year;
    } else if (d.event_type === "week") {
      const [year, week] = d.date.split("-");

      dateCard_date_element.classList.add("hidden");
      dateCard_weekday_element.classList.add("hidden");
      dateCard_week_element.classList.add("dateCard__week--displayFull");
      dateCard_week_element.textContent = `V.${week}`;
      dateCard_year_element.textContent = year;
    }
  }

  // -- HELPER FUNCTIONS
  function empty_element(element) {
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
  }

  function get_event_data(element) {
    return {
      date: element.dataset.date,
      caption: element.dataset.caption,
      description: element.title,
      groups: element.dataset.visibleFor,
      creator: element.dataset.creator,
      event_id: element.dataset.event_id,
      event_type: element.dataset.eventType,
      typecode: element.dataset.typeCode,
      order: element.dataset.order,
    };
  }

  function set_sessionStorage(data) {
    sessionStorage.setItem("active-event", JSON.stringify(data));
  }

  function translate_day(day_num) {
    let weekdays = [
      "Söndag",
      "Måndag",
      "Tisdag",
      "Onsdag",
      "Torsdag",
      "Fredag",
      "Lördag",
      "Söndag",
    ];
    return weekdays[day_num];
  }
}

async function eventDetailsModal_makeEditable() {
  // -- ELEMENTS
  const modal_element = document.querySelector(`[data-modal="eventDetails"]`);
  const container_element = modal_element.querySelector(
    ".modal__exchangableContent"
  );

  clear_previous_body(container_element);

  const activeEvent = get_event_from_SS();
  if (typeof activeEvent !== "object") {
    return;
  }

  // Check what type of event it is; this decides
  let new_content_element;
  if (activeEvent.event_type === "day") {
    new_content_element = document
      .querySelector("#clone .modal__eventDetails--editableDay")
      .cloneNode(true);

    const [year, month, day] = activeEvent.date.split("-");
    let active_date = new Date(year, month - 1, day, 00); // Kom ihåg att månad är 0-indexad
    datePicker_init(new_content_element, active_date); // Initiera datepicker. Inkluderar att populera rätt datum
  } else if (activeEvent.event_type === "week") {
    new_content_element = document
      .querySelector("#clone .modal__eventDetails--editableWeek")
      .cloneNode(true);
    let weeks = get_week_headers_from_cal();
    let [year, right_week] = activeEvent.date.split("-");
    set_event_week(new_content_element, weeks, right_week);
  }

  // -- ELEMENTS #2
  const caption_element = new_content_element.querySelector(
    ".editable__caption"
  );
  const description_element = new_content_element.querySelector(
    ".editable__description"
  );
  const groups_element = new_content_element.querySelector(".groups__editable");
  const typeCode_element = new_content_element.querySelector(
    ".editable__typeCode"
  );
  const order_element = new_content_element.querySelector(".editable__order");
  const saveBtn_element = new_content_element.querySelector(
    ".modal-saveChanges"
  );

  if (activeEvent.event_type === "week") {
    typeCode_element.value = "event--week";
    typeCode_element.disabled = true;
  }

  // Add caption & description & eventtype
  caption_element.value = activeEvent.caption;
  description_element.value = activeEvent.description;
  typeCode_element.value = activeEvent.typecode;

  let boxes_to_check = activeEvent.groups.split(",");
  const checkboxes = add_checkboxes_to_editable(boxes_to_check);
  groups_element.appendChild(checkboxes);

  // Add new body to wrapper
  container_element.appendChild(new_content_element);

  // Fix order options;
  let this_event = document.getElementById(activeEvent.event_id);
  let event_container = this_event.parentElement;
  let siblings = event_container.children;
  let this_event_order = Array.from(siblings).indexOf(this_event);
  order_element.value = this_event_order;
  order_element.setAttribute("max", siblings.length - 1);
  // -- EVENT LISTENERS
  if (activeEvent.event_type === "day") {
    saveBtn_element.addEventListener("click", () => {
      Loader.start();
      let ticked_boxes = get_ticked_boxes(groups_element);
      let date_element = new_content_element.querySelector(
        ".datePicker__selectedDate"
      );
      let date = new Date(date_element.dataset.date);
      if (date.getDay() === 6 || date.getDay() === 0) {
        Toast.show(
          "Det går inte spara event på helger! Ny dag, tack!",
          "error"
        );
        Loader.finish();
        return;
      }
      date = formatDate(date);

      if (ticked_boxes == "" || ticked_boxes == null) {
        Toast.show("Just nu har du inte valt vilka eventet berör", "error");
        Loader.finish();
        return;
      }

      if (caption_element.value == "") {
        Toast.show("Ditt event saknar caption", "error");
        Loader.finish();
        return;
      }

      event_save(
        {
          event_id: activeEvent.event_id,
          caption: caption_element.value,
          description: description_element.value,
          date: date,
          order: order_element.value,
          groups: ticked_boxes,
          typecode: typeCode_element.value,
          event_type: "day",
          creator: activeEvent.creator,
        },
        false
      );
    });
  } else if (activeEvent.event_type === "week") {
    saveBtn_element.addEventListener("click", () => {
      let ticked_boxes = get_ticked_boxes(groups_element);
      const weekdate_element = new_content_element.querySelector(
        ".editable__weekdate"
      );
      let index = weekdate_element.selectedIndex;
      let right_option = weekdate_element.options[index];
      let week = right_option.dataset.forWeek;

      if (caption_element == "") {
        Toast.show("Ditt event saknar caption", "error");
        return;
      }

      if (ticked_boxes == "" || ticked_boxes == null) {
        Toast.show("Just nu har du inte valt vilka eventet berör", "error");
        return;
      }

      event_save(
        {
          event_id: activeEvent.event_id,
          caption: caption_element.value,
          description: description_element.value,
          date: week,
          order: order_element.value,
          groups: ticked_boxes,
          typecode: "event--week",
          event_type: "week",
          creator: activeEvent.creator,
        },
        false
      );
    });
  }

  // -- HELPER FUNCTIONS
  function clear_previous_body(element) {
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
  }

  function get_event_from_SS() {
    let activeEvent;
    try {
      activeEvent = JSON.parse(sessionStorage.getItem("active-event"));
    } catch (e) {
      console.log("Fel med JSON. Något är fel med sessionStorage");
    }
    return activeEvent;
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
}

function get_week_headers_from_cal() {
  let all_week_elements = document.querySelectorAll(".week__header");
  let weeks = [];
  for (let el of all_week_elements) {
    let week_num = el.dataset.weeknum;
    let id = el.id;
    let weekDates = el.querySelector(".weekDates").textContent;
    weeks.push({
      week_num: week_num,
      id: id,
      dateSpan: weekDates,
    });
  }
  return weeks;
}

function set_event_week(container, weeks, right_week) {
  // Om 0 först, ta bort den (beror vart ifrån funktionen körs)
  if (right_week.substring(0, 1) == 0) {
    right_week = right_week.substring(1, 2);
  }
  const weekdate_element = container.querySelector(".editable__weekdate");
  for (let week of weeks) {
    let option = document.createElement("option");
    let first_last = "(" + week.dateSpan + ")";
    option.textContent = "v. " + week.week_num + " " + first_last;
    option.dataset.forWeek = week.id;
    if (week.week_num == right_week) {
      option.selected = true;
    }
    weekdate_element.appendChild(option);
  }
}

function handle_new_event_order(container, changedEvent) {
  // Syftar till att spara om event som fått sin ordning påverkad
  for (let i = 0; i < container.children.length; i++) {
    // Alla event utom just det som håller på att uppdateras får ny order
    let event = container.children[i];
    if (event !== changedEvent) {
      if (event.dataset.order !== i) {
        // Om inte index är desamma som order så uppdatera eventet med nya index
        let event_id = event.dataset.event_id;
        myApp.FB.events
          .doc(event_id)
          .update({
            order: i,
          })
          .catch((err) => console.error(err));
      }
    }
  }
}

/*
██████   █████ ████████ ███████ ██████  ██  ██████ ██   ██ ███████ ██████  
██   ██ ██   ██   ██    ██      ██   ██ ██ ██      ██  ██  ██      ██   ██ 
██   ██ ███████   ██    █████   ██████  ██ ██      █████   █████   ██████  
██   ██ ██   ██   ██    ██      ██      ██ ██      ██  ██  ██      ██   ██ 
██████  ██   ██   ██    ███████ ██      ██  ██████ ██   ██ ███████ ██   ██ 
*/

function datePicker_init(el, active_date, series_element) {
  // ELEMENTS
  const datePicker_element = el.querySelector(".datePicker");
  const selectedWeek_element = datePicker_element.querySelector(
    ".datePicker__selectedWeek"
  );
  const selectedDate_element = datePicker_element.querySelector(
    ".datePicker__selectedDate"
  );
  const dropdown_element = datePicker_element.querySelector(
    ".datePicker__dateDropdown"
  );
  const mth_element = datePicker_element.querySelector(".datePicker__month");
  const next_mth_element = datePicker_element.querySelector(".next-mth");
  const prev_mth_element = datePicker_element.querySelector(".prev-mth");
  const days_element = datePicker_element.querySelector(".datePicker__days");
  const months = [
    "Januari",
    "Februari",
    "Mars",
    "April",
    "Maj",
    "Juni",
    "Juli",
    "Augusti",
    "September",
    "Oktober",
    "November",
    "December",
  ];

  let current_date = new Date(active_date);
  let day = current_date.getDate();
  let month = current_date.getMonth();
  let year = current_date.getFullYear();

  let selected_date = current_date;
  let selected_day = day;
  let selected_month = month;
  let selected_year = year;

  mth_element.textContent = `${months[month]} ${year}`;

  selectedDate_element.textContent = formatDate(current_date);
  selectedWeek_element.textContent = getWeek(current_date);
  selectedDate_element.dataset.date = selected_date;
  selectedDate_element.dataset.week = getWeek(selected_date);

  populateDates();

  // EVENTLISTENERS
  datePicker_element.addEventListener("click", toggleDatePicker);
  next_mth_element.addEventListener("click", goToNextMonth);
  prev_mth_element.addEventListener("click", goToPrevMonth);

  // FUNCTIONS
  function toggleDatePicker(e) {
    if (e) {
      if (!checkEventPathForClass(e.path, "datePicker__dateDropdown")) {
        dropdown_element.classList.toggle("datePicker__dateDropdown--active");
      }
    }
  }

  function goToNextMonth(e) {
    month++;
    if (month > 11) {
      month = 0;
      year++;
    }
    mth_element.textContent = `${months[month]} ${year}`;
    populateDates();
  }

  function goToPrevMonth(e) {
    month--;
    if (month < 0) {
      month = 11;
      year--;
    }
    mth_element.textContent = `${months[month]} ${year}`;
    populateDates();
  }

  function populateDates() {
    days_element.innerHTML = "";

    let active_date = new Date();
    active_date.setMonth(month);
    active_date.setFullYear(year);
    active_date.setDate(1); // first day of the month

    // För att hämta veckodag som månaden börjar på
    let first_weekDay = active_date.getDay() + -1;
    if (first_weekDay < 0) {
      first_weekDay = 6;
    }

    // This variabel gets the last day of the month. When you specify day as 0, you get the last day of the PREVIOUS month, so we increment the month by 1 so we get THIS month's last day
    let lastDay = new Date(
      year, // year
      month + 1, // month.
      0 // day
    ).getDate();

    let lastDaysOfLastMonth = new Date(
      year, // year
      month, // month.
      0 // day
    ).getDate();

    // Börja med att loopa igenom de sista dagarna innan första dagen (om 1a är på en onsdag t ex så behövs måndag och tisdag populeras också från tidigar emånad)
    for (let x = first_weekDay; x > 0; x--) {
      const day_element = document.createElement("div");
      day_element.classList.add(
        "datePicker__day",
        "datePicker__day--pastMonth"
      );
      day_element.textContent = lastDaysOfLastMonth - x + 1;
      days_element.appendChild(day_element);
    }

    // Lägg på hela månaden nu (efter att de sista dagarna blivit tillsatta)
    for (let i = 0; i < lastDay; i++) {
      const day_element = document.createElement("div");
      day_element.classList.add("datePicker__day");
      day_element.textContent = i + 1;
      days_element.appendChild(day_element);

      if (
        selected_day == i + 1 &&
        selected_year == year &&
        selected_month == month
      ) {
        day_element.classList.add("datePicker__day--selected");
      }

      // Eventlistener för att byta aktuell dag
      day_element.addEventListener("click", () => {
        selected_date = new Date(year + "-" + (month + 1) + "-" + (i + 1));
        selected_day = i + 1;
        selected_month = month;
        selected_year = year;
        const date_formated = formatDate(selected_date);
        const date_week = getWeek(selected_date);
        selectedDate_element.textContent = date_formated;
        selectedWeek_element.textContent = date_week;
        selectedDate_element.dataset.date = selected_date;
        selectedDate_element.dataset.week = date_week;
        populateDates();
        toggleDatePicker();
        if (series_element) {
          // OM eventet är en serie ska eventet även läggas till i serie
          let serie_li = document.createElement("li");
          let active_day = selected_date.getDay();

          if (active_day === 6 || active_day === 0) {
            Toast.show(
              "Det går inte spara event på helger! Ny dag, tack!",
              "error"
            );
            Loader.finish();
            return;
          }
          // Check if event already exist in list
          const same_event = series_element.querySelector(
            `[data-date="${date_formated}"]`
          );
          if (same_event) {
            Toast.show("Datum finns redan i listan", "error");
            Loader.finish();
            return; // Eventet finns redan
          }
          const wkd_day = translate_integral_to_weekday(active_day, "short");
          serie_li.dataset.date = selected_date;
          serie_li.textContent = wkd_day + " " + date_formated;

          let remove_btn = document.createElement("button");
          remove_btn.classList.add("button--small", "button--red", "ml-2");
          remove_btn.textContent = "Ta bort";
          remove_btn.addEventListener("click", remove_item);
          serie_li.appendChild(remove_btn);
          series_element.appendChild(serie_li);

          function remove_item() {
            // Just remove the closest <li> ancestor to the <span> that got clicked
            series_element.removeChild(this.closest("li"));
          }
        }
      });
    }
  }

  // HELPER FUNCTIONS
  function checkEventPathForClass(path, selector) {
    for (let i = 0; i < path.length; i++) {
      if (path[i].classList && path[i].classList.contains(selector)) {
        return true;
      }
    }
    return false;
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

    return `${day} / ${month} / ${year}`;
  }

  function getWeek(D) {
    var date = new Date(D.getTime());
    date.setHours(0, 0, 0, 0);
    // Thursday in current week decides the year.
    date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
    // January 4 is always in week 1.
    var week1 = new Date(date.getFullYear(), 0, 4);
    // Adjust to Thursday in week 1 and count number of weeks from date to week1.
    return (
      1 +
      Math.round(
        ((date.getTime() - week1.getTime()) / 86400000 -
          3 +
          ((week1.getDay() + 6) % 7)) /
          7
      )
    );
  }
}

/*
███████ ██   ██  ██████  ██     ██     ██     ██ ███████ ███████ ██   ██ ███████ 
██      ██   ██ ██    ██ ██     ██     ██     ██ ██      ██      ██  ██  ██      
███████ ███████ ██    ██ ██  █  ██     ██  █  ██ █████   █████   █████   ███████ 
     ██ ██   ██ ██    ██ ██ ███ ██     ██ ███ ██ ██      ██      ██  ██       ██ 
███████ ██   ██  ██████   ███ ███       ███ ███  ███████ ███████ ██   ██ ███████ 
*/

function display_active_weeks() {
  // start by making sure that all weeks are off
  let array_of_weeks = document.querySelectorAll(".week");
  for (let wk of array_of_weeks) {
    wk.classList.add("inactive_week");
  }
  // Get Current Week
  const today = new Date();
  const this_week = getWeek(today);
  const weeks_to_display = document.getElementById("select_weeks_to_display")
    .value;
  let index_last_activated;

  // iterate through all week_row to find the starting point (current week)
  for (let i = 0; i < array_of_weeks.length; i++) {
    let week = array_of_weeks[i];

    if (weeks_to_display == "all") {
      week.classList.remove("inactive_week");
      continue;
    }

    if (week.dataset.weeknum == this_week) {
      let adjusted_number = Number(weeks_to_display) + Number(i); // i is zero-indexed after all
      // loop through the weeks that should be activated
      for (let j = i; j < adjusted_number; j++) {
        let week_to_activate = array_of_weeks[j];
        week_to_activate.classList.remove("inactive_week");
        index_last_activated = adjusted_number;
      }
      break;
    }
  }
  // add last activated index of the arr to the fetch_next_week button
  document.getElementById(
    "fetch_next_week"
  ).dataset.index = index_last_activated;
}

function display_next_week() {
  let index_element = document.getElementById("fetch_next_week");
  let i = index_element.dataset.index;
  let arr_of_weeks = document.querySelectorAll(".week");
  arr_of_weeks[i].classList.remove("inactive_week");

  //increment index on element by 1. This works just like DB. arr_of_weeks is the list, you add 1 more, and boom!
  index_element.dataset.index = Number(index_element.dataset.index) + 1;
}

function change_event_display(p) {
  let all_events = document.querySelectorAll(".event");
  console.log(p);

  for (let event of all_events) {
    if (
      event.dataset.visibleFor.includes(p.events) ||
      event.dataset.visibleFor.includes(p.prop) ||
      event.dataset.visibleFor.includes("Alla") ||
      p.events === "all"
    ) {
      event.style.display = "block";
    } else {
      event.style.display = "none";
    }
  }
}

/*
██████  ██████   █████   ██████         ██        ██████  ██████   ██████  ██████  
██   ██ ██   ██ ██   ██ ██              ██        ██   ██ ██   ██ ██    ██ ██   ██ 
██   ██ ██████  ███████ ██   ███     ████████     ██   ██ ██████  ██    ██ ██████  
██   ██ ██   ██ ██   ██ ██    ██     ██  ██       ██   ██ ██   ██ ██    ██ ██      
██████  ██   ██ ██   ██  ██████      ██████       ██████  ██   ██  ██████  ██      
*/

function drag(ev) {
  ev.dataTransfer.setData("text", ev.target.id);
}

function drop(ev) {
  ev.preventDefault();

  var data = ev.dataTransfer.getData("text");
  let target = ev.target;
  if (target.classList.contains("day")) {
    target = target.querySelector(".events");
  } else if (
    target.classList.contains("event_row") ||
    target.classList.contains("event")
  ) {
    target = target.closest(".event_table");
  } else if (target.classList.contains("admin_btn")) {
    target = target.previousSibling;
  }

  if (!target.classList.contains("events")) {
    return;
  }
  if (target) {
    handle_event_dragged(data, target);
  }
}

function allowDrop(ev) {
  ev.preventDefault();
}

function handle_event_dragged(event_id, target) {
  let day_id = target.parentElement.id;
  update_event();

  // -- FUNCTIONS
  function update_event() {
    return new Promise((res) => {
      PLANNING_DB.collection("events")
        .doc(event_id)
        .update({
          date: day_id,
        })
        .then(() => {
          Toast.show("Event flyttat", "success");
          target.appendChild(document.getElementById(event_id));
          res();
        });
    });
  }
}

/*
███████ ██    ██ ████████     ██      ██ ███████ ████████ ███████ ███    ██ ███████ ██████  ███████ 
██      ██    ██    ██        ██      ██ ██         ██    ██      ████   ██ ██      ██   ██ ██      
█████   ██    ██    ██        ██      ██ ███████    ██    █████   ██ ██  ██ █████   ██████  ███████ 
██       ██  ██     ██        ██      ██      ██    ██    ██      ██  ██ ██ ██      ██   ██      ██ 
███████   ████      ██        ███████ ██ ███████    ██    ███████ ██   ████ ███████ ██   ██ ███████ 
*/

document.addEventListener("click", (evt) => {
  let t = evt.target;

  if (t.classList.contains("close-modal")) {
    Modal.hide();
  }

  if (t.classList.contains("event")) {
    eventDetailsModal_display(t);
  }

  if (t.classList.contains("modal-makeChanges")) {
    eventDetailsModal_makeEditable();
  }

  if (t.id === "admin-newEvent") {
    let status;
    if (t.classList.contains("admin-newEvent--active")) {
      status = "deactivate";
    } else {
      status = "activate";
    }
    toggle_newEvent_buttons(status);
    t.classList.toggle("admin-newEvent--active");
  }
  if (t.id === "admin-newEventSeries") {
    newEventSeries();
  }

  if (t.id === "fetch_next_week") {
    display_next_week();
  }

  if (t.classList.contains("change-eventDisplay")) {
    let events_to_display = t.dataset.forEvents;
    let event_property = t.dataset.eventProp;
    add_active_to_menuitem(t.closest(".navMenu__item"));
    // deactivate hamburger
    const hamburger_btn = document.querySelector(".nav__hamburger");
    hamburger_btn.click();

    change_event_display({
      events: events_to_display,
      prop: event_property,
    });
  }

  if (t.classList.contains("modal-removeEvent")) {
    event_delete();
  }
});

document.querySelector(".nav__hamburger").addEventListener("click", () => {
  // This is for toggling the hamburger nav
  const nav = document.querySelector(".nav__column--menu");
  const navBtns = document.querySelectorAll(".navMenu__btn");

  // Toggle Nav
  nav.classList.toggle("nav__hamburger--active");

  // Animate Links
  navBtns.forEach((link, index) => {
    if (link.style.animation) {
      link.style.animation = "";
    } else {
      link.style.animation = `navLinkFade 0.5s ease forwards ${
        index / 7 + 0.3
      }s`;
    }
  });

  // Burger Animation
  document.querySelector(".nav__hamburger").classList.toggle("toggle");
});

document
  .getElementById("select_weeks_to_display")
  .addEventListener("change", () => {
    display_active_weeks();
  });

document.addEventListener("keydown", function (evt) {
  if (evt.key === "Escape") {
    let active_modal = document.querySelector(".modal--active");
    if (active_modal) {
      Modal.hide();
    }
  }
});

/*
██   ██ ███████ ██      ██████  ███████ ██████      ███████ ██    ██ ███    ██  ██████ ███████
██   ██ ██      ██      ██   ██ ██      ██   ██     ██      ██    ██ ████   ██ ██      ██
███████ █████   ██      ██████  █████   ██████      █████   ██    ██ ██ ██  ██ ██      ███████
██   ██ ██      ██      ██      ██      ██   ██     ██      ██    ██ ██  ██ ██ ██           ██
██   ██ ███████ ███████ ██      ███████ ██   ██     ██       ██████  ██   ████  ██████ ███████
*/

function removeRow(event) {
  let row = event.target.parentElement.parentElement;
  row.parentElement.removeChild(row);
}

function empty_element(element) {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

function addZero(val) {
  if (val < 10) {
    val = "0" + val;
  }
  return val;
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

// function formatDate(date) {
//   return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().split("T")[0];
// }

function getWeek(D) {
  var date = new Date(D.getTime());
  date.setHours(0, 0, 0, 0);
  // Thursday in current week decides the year.
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
  // January 4 is always in week 1.
  var week1 = new Date(date.getFullYear(), 0, 4);
  // Adjust to Thursday in week 1 and count number of weeks from date to week1.
  return (
    1 +
    Math.round(
      ((date.getTime() - week1.getTime()) / 86400000 -
        3 +
        ((week1.getDay() + 6) % 7)) /
        7
    )
  );
}

Date.prototype.getWeekNumber = function () {
  var d = new Date(
    Date.UTC(this.getFullYear(), this.getMonth(), this.getDate())
  );
  var dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
};

function getMondayOfWeek(year, week) {
  var d = new Date(year, 0, 1);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + week * 7); // Sätt vecka

  // Hitta första dagen på veckan. Om söndag +1, annars loopa tills 1
  if (d.getDay() < 1) {
    d.setDate(d.getDay() + 1); // 0 = söndag
  } else {
    while (d.getDay() > 1) {
      d.setDate(d.getDate() - 1);
    }
  }

  return d;
}

function generateWeekobject(year, week, mon) {
  var d = new Date(year, 0, 1);
  d.setDate(d.getDate() + week * 7); // Sätt vecka

  const increment_day = (date, n) => {
    let d = new Date(date);
    d.setDate(d.getDate() + n);
    return d;
  };
  // Veckodagarna;
  let tue = formatDate(increment_day(mon, 1));
  let wed = formatDate(increment_day(mon, 2));
  let thu = formatDate(increment_day(mon, 3));
  let fri = formatDate(increment_day(mon, 4));
  let week_object = {
    id: mon.getFullYear() + "-" + addZero(week),
    week_num: week,
    start_date: formatDate(mon),
    end_date: fri,
    days: [
      {
        id: formatDate(mon),
        weekday: "mon",
      },
      {
        id: tue,
        weekday: "tue",
      },
      {
        id: wed,
        weekday: "wed",
      },
      {
        id: thu,
        weekday: "thu",
      },
      {
        id: fri,
        weekday: "fri",
      },
    ],
  };
  return week_object;
}

function autogrow_TA(evt) {
  let TA = evt.target;
  TA.style.height = "auto";
  TA.style.height = TA.scrollHeight + "px";
}

const Toast = {
  init() {
    this.hideTimeout = null;

    this.el = document.createElement("div");
    this.el.classList.add("toast");
    document.body.appendChild(this.el);
  },
  show(message, state) {
    clearTimeout(this.hideTimeout);
    this.el.textContent = message;
    this.el.classList.add("toast-show");
    if (state) {
      this.el.classList.add("toast-" + state);
    }

    this.hideTimeout = setTimeout(() => {
      this.el.classList.remove("toast-show");
      if (state) {
        this.el.classList.remove("toast-" + state);
      }
    }, 3000);
  },
};

function getWeek(D) {
  var date = new Date(D.getTime());
  date.setHours(0, 0, 0, 0);
  // Thursday in current week decides the year.
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
  // January 4 is always in week 1.
  var week1 = new Date(date.getFullYear(), 0, 4);
  // Adjust to Thursday in week 1 and count number of weeks from date to week1.
  return (
    1 +
    Math.round(
      ((date.getTime() - week1.getTime()) / 86400000 -
        3 +
        ((week1.getDay() + 6) % 7)) /
        7
    )
  );
}

function add_active_to_menuitem(item) {
  let previous_active = document.querySelector(".navMenu__item--active");
  if (item === previous_active) {
    return;
  }
  previous_active.classList.remove("navMenu__item--active");
  item.classList.add("navMenu__item--active");
}

function get_event_from_SS() {
  let activeEvent;
  try {
    activeEvent = JSON.parse(sessionStorage.getItem("active-event"));
  } catch (e) {
    console.log("Fel med JSON. Något är fel med sessionStorage");
  }
  return activeEvent;
}

function add_checkboxes_to_editable(boxes_to_check) {
  let data = LEVELS_AND_CLASSES;
  let main_fragment = document.createDocumentFragment();

  for (let key in data) {
    let col_div = document.createElement("div");
    main_fragment.appendChild(col_div);
    col_div.dataset.forLevel = key;
    col_div.classList.add("col", "groupSelection__col");

    let dl = document.createElement("dl");
    col_div.appendChild(dl);

    let dt = document.createElement("dt");
    dl.appendChild(dt);
    dt.classList.add("groupSelection__colHead");

    let ak_label = document.createElement("label");
    dt.appendChild(ak_label);
    ak_label.for = key;
    ak_label.classList.add(
      "groupSelection__label",
      "groupSelection__label--head"
    );

    let ak_input = document.createElement("input");
    ak_label.appendChild(ak_input);
    ak_input.classList.add("change_whole_level", "Alla", key);
    ak_input.type = "checkbox";
    ak_input.dataset.forGroup = key;
    ak_input.id = key;
    ak_input.addEventListener("change", change_whole_level);

    let label_txt = document.createElement("span");
    label_txt.textContent = key;
    label_txt.className = "font-bold hover:underline ml-1";

    ak_label.appendChild(label_txt);

    let dd = document.createElement("dd");
    dl.appendChild(dd);
    let ul = document.createElement("ul");
    dd.appendChild(ul);

    for (let course of data[key]) {
      let li = document.createElement("li");
      ul.appendChild(li);
      li.classList.add("groupSelection__listItem");

      let c_label = document.createElement("label");
      li.appendChild(c_label);
      c_label.classList.add("groupSelection__label");
      c_label.for = `gr_${course}`;

      let c_input = document.createElement("input");
      c_label.appendChild(c_input);
      c_input.id = `gr_${course}`;
      c_input.classList.add("Alla", key, course);
      c_input.type = "checkbox";
      c_input.dataset.group = key;

      let c_label_txt = document.createElement("span");
      c_label_txt.className = "hover:underline ml-1";
      c_label_txt.textContent = course;
      c_label.appendChild(c_label_txt);
    }
  }

  // Sista kolumnen: Först ta bort input för "välj alla", sen lägg till "endast personal"
  const all_cols = main_fragment.querySelectorAll(".col.groupSelection__col");
  const last_col = all_cols[all_cols.length - 1];
  const last_ul_element = last_col.querySelector("ul");
  const colHead_element = last_col.querySelector(
    ".groupSelection__colHead label"
  );
  const input_element = colHead_element.querySelector("input");

  // Ta bort "Välj alla" i sista kolumnen
  colHead_element.removeChild(input_element);

  // Endast personal
  let pers_li = document.createElement("li");
  last_ul_element.appendChild(pers_li);
  pers_li.classList.add("groupSelection__listItem");

  let pers_label = document.createElement("label");
  pers_li.appendChild(pers_label);
  pers_label.classList.add(
    "groupSelection__label",
    "groupSelection__label--head"
  );

  let pers_cb = document.createElement("input");
  pers_label.appendChild(pers_cb);
  pers_cb.type = "checkbox";
  pers_cb.classList.add("Personal");
  pers_cb.id = "gr_endastPersonal";
  pers_cb.addEventListener("change", untick_all_except_personal);

  let pers_label_txt = document.createElement("span");
  pers_label_txt.textContent = "Endast personal";
  pers_label_txt.className = "hover:underline ml-1";
  pers_label.appendChild(pers_label_txt);

  if (boxes_to_check) {
    for (let item of boxes_to_check) {
      try {
        main_fragment
          .querySelectorAll(`input[type="checkbox"].${item}`)
          .forEach((x) => (x.checked = true));
      } catch (e) {
        console.log(e);
      }
    }
  }

  return main_fragment;

  // -- HELPER FUNCTIONS
  function change_whole_level(evt) {
    const target = evt.target;
    const level = target.dataset.forGroup;
    const container = target.closest(".groupSelection__col");
    const elements_to_change = container.querySelectorAll(
      `input[data-group="${level}"]`
    );
    for (let item of elements_to_change) {
      if (target.checked) {
        item.checked = true;
      } else {
        item.checked = false;
      }
    }
  }

  function untick_all_except_personal() {
    main_fragment
      .querySelectorAll(`input.Alla`)
      .forEach((x) => (x.checked = false));
  }
}

function translate_integral_to_weekday(int, scope) {
  let days = [
    "Söndag",
    "Måndag",
    "Tisdag",
    "Onsdag",
    "Torsdag",
    "Fredag",
    "Lördag",
  ];

  if (scope === "full") {
    return days[int];
  } else if (scope === "short") {
    return days[int].substring(0, 3);
  }
}

const LEVELS_AND_CLASSES = {
  Åk1: [
    "EE20",
    "EKJU20",
    "EKEKES20",
    "NANA20",
    "NANASAES20",
    "SABE20",
    "SASAESME20",
    "TEIN20",
    "TETEES20",
  ],
  Åk2: [
    "EE19",
    "EKJU19",
    "EKEKES19",
    "NANA19",
    "NANASAES19",
    "SABE19",
    "SASAESME19",
    "TEIN19",
    "TETEES19",
  ],
  Åk3: [
    "EE18",
    "EKJU18",
    "EKEKES18",
    "NANA18",
    "NANASAES18",
    "SABE18",
    "SASAESME18",
    "TEIN18",
    "TETEES18",
  ],
  Andra: ["SPRINT", "T4", "Särskola"],
};
