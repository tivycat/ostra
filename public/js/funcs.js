document.addEventListener('DOMContentLoaded', () => {

    // add checkboxes to the new event modal
    let el = document.getElementById('input_event_groups');
    add_and_check_checkboxes(el, ['Alla'])

})

function display_active_weeks() {
    // start by making sure that all weeks are off
    let array_of_weeks = document.querySelectorAll(".week_row");
    for (let wk of array_of_weeks) {
        wk.classList.add('inactive_week')
    }

    // get current week
    let todays_date = moment(new Date()).format("YYYY-MM-DD");
    let this_week = moment(todays_date).isoWeek();
    let select_weeks_to_display = document.getElementById('select_weeks_to_display').value;
    let index_last_activated;
    // iterate through all week_row to find the starting point (current week)
    for (let i = 0; i < array_of_weeks.length; i++) {
        let week = array_of_weeks[i];

        if (select_weeks_to_display == 'all') {
            week.classList.remove('inactive_week')
            continue;
        }

        // find starting point (id is 'tr-2020-34' so split and then use the third item
        if (week.id.split('-')[2] == this_week) {
            let adjusted_number = Number(select_weeks_to_display) + Number(i);
            // loop through the weeks that should be activated
            for (let j = i; j < adjusted_number; j++) {
                let week_to_activate = array_of_weeks[j];
                week_to_activate.classList.remove('inactive_week');
                index_last_activated = adjusted_number
            }
            break;
        }
    }
    // add last activated index of the arr to the fetch_next_week button
    document.getElementById('fetch_next_week').dataset.index = index_last_activated;
}

function display_next_week() {
    let index_element = document.getElementById('fetch_next_week');
    let i = index_element.dataset.index
    let arr_of_weeks = document.querySelectorAll(".week_row");
    arr_of_weeks[i].classList.remove('inactive_week');

    //increment index on element by 1. This works just like DB. arr_of_weeks is the list, you add 1 more, and boom!
    index_element.dataset.index = Number(index_element.dataset.index) + 1
}

function add_event_to_calendar(event_id, event) {
    let target_element = document.getElementById(event.date_id);
    // create row and attach to target element, and then single td
    let event_row = document.createElement('div');
    target_element.appendChild(event_row);
    event_row.classList.add('event_row');

    event_row.dataset.creator = event.creator;
    event_row.id = event_id // this is the id to the doc in the DB.
    event_row.dataset.visiblefor = event.groups;

    let event_td = document.createElement('div');
    event_row.appendChild(event_td);
    event_td.dataset.dateid = event.date_id;
    event_td.classList.add(event.type, event.typecode) // will add the right classes depending on event. This is ingenius(!)

    let event_caption_div = document.createElement('span');
    event_td.appendChild(event_caption_div);
    event_caption_div.classList.add('event_caption')
    event_caption_div.textContent = event.caption;

    // if event.description, add it to title and add the info-icon
    if (event.description.length !== 0) {
        event_td.setAttribute('title', event.description);
        let icon = document.createElement('i');
        event_td.appendChild(icon)
        icon.classList.add('material-icons', 'event_icon');
        icon.textContent = 'info';
    }

    let event_groups = document.createElement('div');
    event_td.appendChild(event_groups);
    event_groups.classList.add('event_groups');
    event_groups.textContent = event.groups;
}



function new_event_modal_reset() {
    /**
     * Resets new event modal completely
     * Runs everytime you show the modal
     */
    document.getElementById('new_event_modal').style.display = 'none';
    document.getElementById('new_event_modal_title').value = '';
    document.getElementById('input_event_caption').value = '';
    document.getElementById('input_event_date').value = '';
    document.getElementById('input_event_date').disabled = false;
    document.getElementById('input_event_date_weekprefix').style.display = 'none';
    let typecode = document.getElementById('input_event_typecode');
    typecode.disabled = false;
    typecode.options.selectedIndex = 0;
    typecode.options[typecode.options.length - 1].disabled = true // disable final option (only for week events)
    document.getElementById('input_event_description').value = '';

    for (let cl of typecode.classList) {
        if (cl.substring(0, 3) == 'ET_') {
            typecode.classList.remove(cl)
            break;
        }
    }

    // set all cbs to checked (only tests uncheck them)
    let groups = document.getElementById('input_event_groups');
    let all_checkboxes = groups.querySelectorAll('input[type="checkbox"].Alla');
    for (let box of all_checkboxes) {
        box.checked = true;
    }
}

function new_event_modal_display(type, id) {
    /**
     * @param {string} type either 'event', 'week_event' or 'test'
     * @param {string} id comes from the element that the event is to appended to. if 'test', there is no element (it has to be added manually)
     */
    let title = document.getElementById('new_event_modal_title');
    let date = document.getElementById('input_event_date');
    let typecode = document.getElementById('input_event_typecode');
    let modal = document.getElementById('new_event_modal');
    let groups = document.getElementById('input_event_groups');

    // type changes: header and way date is presented
    if (type == 'event') {
        date.setAttribute('type', 'date')
        title.textContent = 'Lägg till nytt event'
        modal.setAttribute('data-eventtype', 'event')
        if (id) {
            date.value = id;
            date.disabled = true;
            modal.setAttribute('data-dateid', id)
        }
    }
    if (type == 'week_event') {
        title.textContent = 'Lägg till ny veckoavvikelse'
        date.setAttribute('type', 'string')
        document.getElementById('input_event_date_weekprefix').style.display = 'flex'
        typecode.options.selectedIndex = typecode.options.length - 1; // set select to 'veckoavvikelse' (last selection)
        typecode.disabled = true;
        modal.setAttribute('data-eventtype', 'week_event')
        if (id) {
            date.value = id
            date.disabled = true;
            modal.setAttribute('data-dateid', id)
        }
    }
    if (type == 'test') {
        title.textContent = 'Lägg till nytt prov/större inlämning'
        date.setAttribute('type', 'date')
        typecode.options.selectedIndex = 1; // set to ET_test
        typecode.disabled = true;
        modal.setAttribute('data-eventtype', 'event')
        let all_checkboxes = groups.querySelectorAll('input[type="checkbox"]')
        for (let box of all_checkboxes) {
            box.checked = false;
        }

    }
    // display modal
    $('#new_event_modal').modal()
}

function event_details_modal_reset() {
    let modal = document.getElementById('event_details_modal');
    if (modal.hasAttribute('data-eventid')) { modal.removeAttribute('data-eventid') }
    if (modal.hasAttribute('data-dateid')) { modal.removeAttribute('data-dateid') }
    if (modal.hasAttribute('data-creator')) { modal.removeAttribute('data-creator') }


    document.getElementById('event_details_modal_date').removeAttribute('type');

    let all_labels = modal.querySelectorAll('label');
    for (let lbl of all_labels) { lbl.style.display = 'none' }

    // reset all inputs/selects etc
    let all_forms = modal.querySelectorAll('.event_details_form')
    for (let form of all_forms) {
        if (form.nodeName == 'DIV') {
            form.texContent = ''
            continue;
        }

        form.value = ''
        if (form.nodeName == 'SELECT') {
            form.disabled = 'true';
            continue
        }
        form.classList.remove('form-control')
        form.classList.add('form-control-plaintext')
        form.setAttribute('readonly', '')
    }
    // clear edit buttons
    let edit_btns = document.querySelectorAll('.edit_buttons');
    for (let btn of edit_btns) {
        if (document.querySelector('button#toggle_admin_mode')) {
            btn.style.display = 'none'
        } else {
            btn.parentNode.removeChild(btn)
        }
    }
    document.getElementById('event_details_modal_edit').style.display = 'none';
}

function event_details_modal_display(ev_details) {
    /**
     * @param {object} ev_details contains caption, groups, description, date, typecode, event_id
     * @param {string} event_type is either 'event' or 'week_event'
     */

    event_details_modal_reset();
    let el_caption = document.getElementById('event_details_modal_caption');
    let el_date = document.getElementById("event_details_modal_date");
    let el_typecode = document.getElementById('event_details_modal_typecode');
    let el_description = document.getElementById('event_details_modal_description');
    let el_groups = document.getElementById('event_details_modal_groups');
    let el_creator = document.getElementById('event_details_modal_creator')

    let modal = document.getElementById('event_details_modal');
    modal.setAttribute('data-eventid', ev_details.event_id)
    modal.setAttribute('data-dateid', ev_details.date_id)
    modal.setAttribute('data-eventtype', ev_details.type)
    modal.setAttribute('data-creator', ev_details.creator)
    modal.dataset.week = ev_details.week;

    el_typecode.value = ev_details.typecode;
    el_typecode.classList.add(ev_details.typecode)
    el_date.value = ev_details.date_id;
    el_caption.value = ev_details.caption;
    el_description.value = ev_details.description;
    el_groups.textContent = ev_details.groups;
    el_creator.textContent = ev_details.creator;

    // check credentials (pass arg for this event to see if user has credentials)
    const current_user = firebase.auth().currentUser.email;
    let is_creator = check_credentials_for_event({ user: current_user, ev_creator: ev_details.creator });
    // check if admin button exists, or is_creator returns true
    if (document.querySelector('button#toggle_admin_mode')) {
        document.getElementById('event_details_modal_edit').style.display = 'inline-block';
    } else if (is_creator) {
        add_admin_functions()
        document.getElementById('event_details_modal_edit').style.display = 'inline-block';
    }


    // show modal
    $('#event_details_modal').modal();
}

function event_details_edit() {
    let modal = document.getElementById('event_details_modal');
    let el_date = document.getElementById("event_details_modal_date");

    let all_labels = modal.querySelectorAll('label');
    for (let lbl of all_labels) { lbl.style.display = 'inline-block' }

    // caption, description and date get the same treatment
    let text_inputs = [document.getElementById('event_details_modal_caption'), document.getElementById('event_details_modal_description'), el_date];
    for (let inp of text_inputs) {
        inp.classList.add('form-control')
        inp.classList.remove('form-control-plaintext')
        inp.removeAttribute('readonly')
    }

    let event_type = modal.getAttribute('data-eventtype')
    if (event_type == 'event') {
        el_date.setAttribute('type', 'date')
        el_date.setAttribute('min', '2020-08-10')
        el_date.setAttribute('max', '2021-06-18')
        document.getElementById('event_details_modal_typecode').removeAttribute('disabled');
    } else if (event_type == 'week_event') {

        el_date.setAttribute('type', 'text')
        el_date.minlength = '3'
        el_date.maxlength = '4'
    }

    let el_groups = document.getElementById('event_details_modal_groups');
    let to_be_checked = el_groups.textContent.split(',')
    el_groups.textContent = '';
    add_and_check_checkboxes(el_groups, to_be_checked)


    // replace edit button with the save and delete button
    let edit_btns = document.querySelectorAll('.edit_buttons');
    for (let btn of edit_btns) {
        btn.style.display = 'inline-block'
    }
    document.getElementById('event_details_modal_edit').style.display = 'none';

}

function handle_event_delete(event_id) {
    new Promise((resolve, reject) => {
        delete_event_firebase(event_id)
        resolve()

    }).then(() => {

        let current_event = document.getElementById(event_id);
        current_event.parentNode.removeChild(current_event)

        $('#event_details_modal').modal('hide')
        display_toast('Event borttaget!')
    })


}
function handle_event_create() {
    let ev_details = {
        type: document.getElementById('new_event_modal').dataset.eventtype,
        date_id: document.getElementById('input_event_date').value,
        caption: document.getElementById('input_event_caption').value,
        description: document.getElementById('input_event_description').value,
        typecode: document.getElementById('input_event_typecode').value,
    };

    ev_details.groups = handle_group_selection('create');

    // if no date or caption, return
    if (!ev_details.date_id || !ev_details.caption) {
        display_toast('Det saknas titel på eventet (eller datum men mindre troligt)')
        return;
    }

    // First event is sent to db, then it is added clientside
    create_event_firebase(ev_details).then((e) => {
        add_event_to_calendar(e.id, e.event)
        display_toast('Event skapat!')
        // hide modal
        $('#new_event_modal').modal('hide')
    })
}
function handle_event_save_edit() {
    let modal = document.getElementById('event_details_modal');
    let ev_details = {
        caption: document.getElementById('event_details_modal_caption').value,
        description: document.getElementById('event_details_modal_description').value,
        typecode: document.getElementById('event_details_modal_typecode').value,
        groups: handle_group_selection('edit'),
        type: modal.dataset.eventtype,
        creator: modal.dataset.creator
    }

    let event_id = modal.dataset.eventid;

    ev_details.date_id = document.getElementById('event_details_modal_date').value;

    // First refresh the document in db, then delete current event and add new
    save_edit_event_firebase(event_id, ev_details).then(() => {

        let current_event = document.getElementById(event_id);
        current_event.parentNode.removeChild(current_event)

        add_event_to_calendar(event_id, ev_details)
        $('#event_details_modal').modal('hide')

    })

    // JAG FATTAR INTE? DET LEDER JU TILL SAMMA ELEMENT? KAN DOCK VARA ATT MAN SKA LÄGGA TILL ETT V eller nått först?
    // if (ev_details.type == 'event') {
    //     ev_details.date_id = document.getElementById('event_details_modal_date').value;
    // }
    // // if (ev_details.type == 'week_event') {
    // //     ev_details.date_id = document.getElementById('event_details_modal_date').value;
    // // }
}

function display_group_selection(sel) {
    let all_events = document.querySelectorAll('.event_row');
    if (sel === 'All') {
        for (let event of all_events) {
            event.style.display = 'table-row'
        }
    } else if (sel === 'Personal') {
        for (let event of all_events) {
            if (event.dataset.visiblefor.includes('Personal') || event.dataset.visiblefor == 'Alla') {
                event.style.display = 'table-row'
            } else {
                event.style.display = 'none';
            }
        }
    } else {
        for (let event of all_events) {
            if (event.dataset.visiblefor.includes(sel.id) || event.dataset.visiblefor.includes(sel.level) || event.dataset.visiblefor == 'Alla') {
                event.style.display = 'table-row'
            } else {
                event.style.display = 'none';
            }
        }
    }
}

function toggle_admin_mode(status) {
    // run relevant function based on param
    if (status == 'activate') {
        activate();
    } else if (status == 'deactivate') {
        deactivate();
    }

    function activate() {
        /**
         * Fetches all cells of main table and adds button to the end of it
        */
        let arr_of_cells = document.querySelectorAll('.main_table_cell')
        for (let cell of arr_of_cells) {
            let new_event_btn = document.createElement('div');
            cell.appendChild(new_event_btn);
            new_event_btn.classList.add('admin_btn', 'btn', 'btn-dark')

            if (cell.classList.contains('week_col')) {
                new_event_btn.textContent = 'Lägg till veckoavvikelse';
                new_event_btn.classList.add('add_week_event');
            } else {
                // else this is just a normal day
                new_event_btn.textContent = 'Lägg till event'
                new_event_btn.classList.add('add_event_to_date');
            }

            // let evt_tbl = cell.querySelector('.event_table');
            cell.setAttribute('ondrop', 'drop(event, this)');
            cell.setAttribute('ondragover', 'allowDrop(event)');
        }
        let arr_of_events = document.querySelectorAll('.event_row');
        for (let row of arr_of_events) {
            row.setAttribute('draggable', 'true');
            row.setAttribute('ondragstart', 'drag(event)');



        }

    }

    function deactivate() {
        let buttons_to_remove = document.querySelectorAll('.admin_btn')
        for (let btn of buttons_to_remove) {
            btn.parentNode.removeChild(btn)
        }
    }
}

// function to get highest id so that we know what ID the event needs. Necessary for editing and removing elements later. Not used outside of function
// function get_highest_id(type) {
//     let highest_id = 0;
//     let elements = document.getElementsByClassName(type);
//     for (let el of elements) { highest_id = Math.max(el.id.substring(3), highest_id) }
//     highest_id++
//     return highest_id
// }

document.addEventListener('change', (event) => {
    let targ = event.target;
    // eventlistener for group checkboxes (if you press 'åk1', all åk1 is toggled etc)
    if (targ.tagName.toLowerCase() == 'input' && targ.getAttribute('type') == 'checkbox') {
        if (targ.classList.contains('select_all_classes')) {
            let group = targ.id;
            let container = targ.closest(`#container_${group}_group`)
            let elements = container.querySelectorAll(`input[data-group='${group}']`);
            for (let el of elements) {
                if (targ.checked) {
                    el.checked = true
                } else {
                    el.checked = false
                }
            }
        }

        if (targ.id == 'endast_personal') {
            targ.parentNode.parentNode.querySelectorAll(`input.Alla`).forEach(x => x.checked = false);
        } else {

            // If you hit another checkbox, endast_personal should not be checked
            let cb = document.querySelector('input#endast_personal:checked')
            if (cb) {
                cb.checked = false;
            }
        }

    }


    if (targ.id == 'event_details_modal_typecode' || targ.id == 'input_event_typecode') {
        let chosen_class = targ.value;
        for (let cl of targ.classList) {
            if (cl.substring(0, 3) == 'ET_') {
                targ.classList.remove(cl)
            }
        }
        targ.classList.add(chosen_class)
    }
})

function check_credentials_for_event(dts) {
    if (dts.ev_creator == dts.user) {
        return true
    } else {
        return false
    }
}

function add_and_check_checkboxes(parentNode, to_be_checked) {
    /**
     * @param {element} parentNode is the actual node where you append this stuff
     * @param {string} to_be_checked is which groups are to be checked. can be empty
     */
    // borde inte det här hämtas från db? Jo! men just nu används de bara i denna kapacitet så mindre jobb såhär. just nu alltså.
    let data = {
        "Åk1": ["EE20", "EKJU20", "EKEKES20", "NANA20", "NANASAES20", "SABE20", "SASAESME20", "TEIN20", "TETEES20"],
        "Åk2": ["EE19", "EKJU19", "EKEKES19", "NANA19", "NANASAES19", "SABE19", "SASAESME19", "TEIN19", "TETEES19"],
        "Åk3": ["EE18", "EKJU18", "EKEKES18", "NANA18", "NANASAES18", "SABE18", "SASAESME18", "TEIN18", "TETEES18"]
    }

    // create following:
    let main_fragment = document.createDocumentFragment();
    for (let key in data) {
        let col_div = document.createElement('div');
        main_fragment.appendChild(col_div);
        col_div.setAttributes({ id: `container_${key}_group`, className: 'col-sm-3' })

        let dl = document.createElement('dl');
        col_div.appendChild(dl);

        let dt = document.createElement('dt');
        dl.appendChild(dt);

        let ak_input = document.createElement('input');
        dt.appendChild(ak_input);
        ak_input.setAttributes({
            className: `form-check-input select_all_classes Alla ${key}`,
            type: 'checkbox',
            dataset: { group: key },
            id: key,
        })

        let ak_label = document.createElement('label');
        dt.appendChild(ak_label);
        ak_label.setAttributes({ for: key, textContent: key })

        let dd = document.createElement('dd');
        dl.appendChild(dd);
        let ul = document.createElement('ul');
        dd.appendChild(ul);

        for (let course of data[key]) {
            let li = document.createElement('li');
            ul.appendChild(li);
            let c_input = document.createElement('input')
            li.appendChild(c_input);
            c_input.setAttributes({ id: `gr_${course}`, className: `form-check-input Alla ${key} ${course}`, type: 'checkbox', dataset: { group: key } })
            let c_label = document.createElement('label');
            li.appendChild(c_label);
            c_label.setAttributes({ textContent: course, for: `gr_${course}`, className: 'form-check-label' })
        }
    }
    // Lägg till endast personal
    let col_div_p = document.createElement('div');
    main_fragment.appendChild(col_div_p)
    col_div_p.id = `endast_personal_group`;
    col_div_p.classList.add('col-sm-2')
    let cb_p = document.createElement('input')
    col_div_p.appendChild(cb_p)
    cb_p.classList.add('form-check-input', 'Personal')
    cb_p.setAttribute('type', 'checkbox')
    cb_p.id = 'endast_personal'

    let label_p = document.createElement('label')
    col_div_p.appendChild(label_p)
    label_p.textContent = 'Endast personal'
    label_p.setAttribute('style', 'font-weight: 700')

    if (to_be_checked) {
        for (let item of to_be_checked) {
            try {
                main_fragment.querySelectorAll(`input[type="checkbox"].${item}`).forEach(x => x.checked = true)
            } catch (e) { console.log(e) }

        }
    }

    parentNode.appendChild(main_fragment)
}

function handle_group_selection(create_or_edit) {
    let element;
    if (create_or_edit === 'create') {
        element = document.getElementById('input_event_groups')
    } else if (create_or_edit === 'edit') {
        element = document.getElementById('event_details_modal_groups')
    }

    let levels = [
        { display_name: 'ak1', prefix: 'Åk1' },
        { display_name: 'ak2', prefix: 'Åk2' },
        { display_name: 'ak3', prefix: 'Åk3' }
    ]

    let count = 0;
    let arr = [];
    let value_to_return;
    if (element.querySelector('#endast_personal_group input').checked) {
        return 'Personal'
    }

    for (let lvl of levels) {
        let arr_of_groups = element.querySelectorAll(`li input[data-group='${lvl.prefix}']:checked`);
        if (arr_of_groups.length == 9) {
            arr.push(lvl.prefix); // set group to name
            count++
        } else {
            // if not all are selected, push the classnames into group instead
            for (let group of arr_of_groups) {
                arr.push(group.id.substring(3))
            }
        }
    }
    // if 'count' is 3 that means all 3 are full
    if (count == 3) {
        value_to_return = 'Alla';
    } else {
        value_to_return = arr.toString();
    }
    return value_to_return;
}


function display_toast(text) {
    document.querySelector('.toast-body').textContent = text;
    $('#toast').toast('show')
}


function drag(ev) {
    ev.dataTransfer.setData("text", ev.target.id);
}


function drop(ev) {
    ev.preventDefault();

    var data = ev.dataTransfer.getData("text");
    let target = ev.target;
    if (target.classList.contains('main_table_cell')) {
        target = target.querySelector('.event_table')
    }
    else if (target.classList.contains('event_row') || target.classList.contains('event')) {
        target = target.closest('.event_table')
    } else if (target.classList.contains('admin_btn')) {
        target = target.previousSibling;
    }

    if (!target.classList.contains('event_table')) {
        return
    }
    if (target) {
        handle_event_dragged(data, target)
    }
}


function allowDrop(ev) {
    ev.preventDefault();
}

function handle_event_dragged(event_id, target) {
    new Promise((resolve, reject) => {
        firebase.auth().onAuthStateChanged(function (user) {
            let docRef = firebase.firestore().collection("events").doc(event_id);
            docRef.update({
                date_id: target.id
            })
            
            resolve()
        })
    }).then(() => {
        display_toast('Event flyttad')
        target.appendChild(document.getElementById(event_id));
    })

}

Element.prototype.setAttributes = function (attributes) {
    // inspiration: http://jsfiddle.net/Keleko34/H7Spu/
    let recursiveSet = function (key, value) {
        for (let prop in key) {
            // check if object and not a dom node or array
            if (typeof key[prop] == 'object' && key[prop].dataset == null && key[prop][0] == null) {
                recursiveSet(key[prop], value[prop]);
            } else {
                value[prop] = key[prop];
            }
        }
    }
    recursiveSet(attributes, this);
}


function loading_start() {
    document.getElementById('loading').classList.remove('hidden')
}

function loading_end() {
    document.getElementById('loading').classList.add('hidden')
}


document.addEventListener('click', function (event) {
    let targ = event.target;

    if (targ.classList.contains('show_group')) {
        display_group_selection({ id: targ.id.substring(5), level: targ.getAttribute('data-level') })
        document.getElementById('show_start').parentNode.classList.remove('active')
    }

    if (targ.id == 'show_start') {
        display_group_selection('All')
        targ.parentNode.classList.add('active')
        document.getElementById('show_personal').parentNode.classList.remove('active')
    }

    if (targ.id == 'show_personal') {
        display_group_selection('Personal')
        document.getElementById('show_start').parentNode.classList.remove('active')
        targ.parentNode.classList.add('active')
    }



    if (targ.id == 'add_test') {
        new Promise((resolve, reject) => {
            new_event_modal_reset()
            resolve()
        }).then(() => new_event_modal_display('test'))



    }

    /* * * * * * * * * * * * * * * *
    * Lägg till event/veckoavvikelse
    *  * * * * * * * * * * * * * * **/

    // lägg till event till särskilt datum
    if (targ.classList.contains('add_event_to_date')) {
        new Promise((resolve, reject) => {
            new_event_modal_reset()
            resolve()
        }).then(() => {
            let type = 'event';
            let event_table = targ.parentNode.querySelector('.event_table');
            new_event_modal_display(type, event_table.id, event_table.dataset.week)
        })


    }

    // lägg till veckoavvvikelse till vald vecka
    if (targ.classList.contains('add_week_event')) {
        new Promise((resolve, reject) => {
            new_event_modal_reset()
            resolve();
        }).then(() => {
            let type = 'week_event';
            let id = targ.parentNode.querySelector('.event_table').id;
            new_event_modal_display(type, id)

        })
    }

    // visa modal för ny event/veckoavvikelse (oavsett vald datum eller ej)
    if (targ.id == 'new_event_modal_save') {
        handle_event_create()
    }


    // stäng modal för ny event/veckoavvikelse
    if (targ.id == 'new_event_modal_close') {
        $('#new_event_modal').modal('hide')
    }

    // aktivera admin mode (dvs skapa knappar i alla celler)
    if (targ.id == 'toggle_admin_mode') {
        let status;
        if (targ.classList.contains('active')) {
            status = 'deactivate'
        } else {
            status = 'activate';
        }
        toggle_admin_mode(status)
        targ.classList.toggle('active');

    }


    /* * * * * * * * * * * * * * * *
    * Eventdetaljer
    *  * * * * * * * * * * * * * * **/

    if (targ.id == 'event_details_modal_close') {
        // hide modal
        document.getElementById('event_details_modal').removeAttribute('data-eventid')
        $('#event_details_modal').modal('hide')

    }

    if (targ.classList.contains('event')) {
        let typecode = targ.classList[1] // is this a poor idea? 'event' will always be [0] so [1] will always(?) be the right type
        let ev_details = {
            type: 'event',
            caption: targ.querySelector('.event_caption').textContent,
            groups: targ.querySelector('.event_groups').textContent,
            description: targ.getAttribute('title'),
            date_id: targ.dataset.dateid,
            typecode: typecode,
            event_id: targ.parentNode.id,
            creator: targ.parentNode.dataset.creator,
            week: targ.parentNode.parentNode.dataset.week
        }
        event_details_modal_display(ev_details);
    }

    if (targ.classList.contains('week_event')) {
        let typecode = targ.classList[1] // is this a poor idea? 'event' will always be [0] so [1] will always(?) be the right type
        let ev_details = {
            type: 'week_event',
            caption: targ.querySelector('.event_caption').textContent,
            groups: targ.querySelector('.event_groups').textContent,
            description: targ.getAttribute('title'),
            date_id: targ.dataset.dateid,
            typecode: typecode,
            event_id: targ.parentNode.id,
            creator: targ.parentNode.dataset.creator,
            // week : targ.parentNode.parentNode.dataset.week
        }
        event_details_modal_display(ev_details);
    }

    if (targ.id == 'event_details_modal_edit') {
        event_details_edit();
    }

    if (targ.id == 'event_details_modal_save') {
        handle_event_save_edit()
    }

    if (targ.id == 'event_details_modal_delete') {

        let modal = document.getElementById('event_details_modal');
        handle_event_delete(modal.dataset.eventid)
    }
    if (targ.id == 'fetch_next_week') {
        display_next_week();
    }

})

document.getElementById('select_weeks_to_display').addEventListener('change', () => { display_active_weeks() })