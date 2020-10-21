function add_week_to_calendar(week) {
  let week_body = document.querySelector('#week_body')

    // create row for each week
    let new_week_row = document.createElement('div');
    week_body.appendChild(new_week_row);
    new_week_row.classList.add('week_row', 'inactive_week');
    new_week_row.id = 'tr-' + week.id;

    // add weekdetails into the first cell of the row
    let week_col_header_cell = document.createElement('div');
    new_week_row.appendChild(week_col_header_cell);
    week_col_header_cell.classList.add('main_table_cell', 'week_col');

    // add table with 1 row with details and 1 row for week events
    let week_det_table = document.createElement('div');
    week_col_header_cell.appendChild(week_det_table);
    week_det_table.classList.add('table');

    let week_det_tr1 = document.createElement('div');
    week_det_table.appendChild(week_det_tr1);
    week_det_tr1.classList.add('tr')

    let week_det_tr1_td = document.createElement('div');
    week_det_tr1.appendChild(week_det_tr1_td);
    week_det_tr1_td.classList.add('week_table_cell')
    let week_details_title_week_num = document.createElement('div');
    week_det_tr1_td.appendChild(week_details_title_week_num);
    week_details_title_week_num.classList.add('week_col_title_week_num')
    week_details_title_week_num.textContent = week.weeknum;
    let week_details_title_week_datespan = document.createElement('div');
    week_det_tr1_td.appendChild(week_details_title_week_datespan);
    week_details_title_week_datespan.classList.add('week_col_title_datespan');
    week_details_title_week_datespan.textContent = `${week.startdate} - ${week.enddate}`;

    //add 2nd row for week events
    let week_det_tr2 = document.createElement('div');
    week_det_table.appendChild(week_det_tr2);
    week_det_tr2.classList.add('tr')


    function create_event_table(parent_element, id, td_class) {
      let td = document.createElement('div');
      parent_element.appendChild(td);
      td.classList.add(td_class);

      let table = document.createElement('div');
      td.appendChild(table);
      table.classList.add('event_table')
      table.id = id;
      table.dataset.week = week.id;
    }
    create_event_table(week_det_tr2, week.id, 'td')
    // loop through arr in .days and create table in each td (id should be date)
    for (let day of week.days) {
      create_event_table(new_week_row, day.id, 'main_table_cell')
    }
}


function add_admin_functions(role) {
  let existing_roles = ['admin', 'teacher']
  if (!existing_roles.includes(role)) { return }
  if (role == 'admin') {
      let admin_button = document.createElement('button');
      document.getElementById('header_btn_row').appendChild(admin_button);
      admin_button.setAttributes({
          className: 'btn btn-warning ml-1',
          id: 'toggle_admin_mode',
          textContent: 'Adminvy',
          type: 'button'
      })
  }

  let btn_group = document.getElementById('event_details_modal_button_group');

  let save_button = document.createElement('button');
  btn_group.appendChild(save_button);
  save_button.setAttributes({
      textContent: 'Spara ändringar',
      className: 'btn btn-primary ml-1 edit_buttons',
      id: 'event_details_modal_save',
      type: 'button',
      style: "display: none"
  })

  let delete_button = document.createElement('button');
  btn_group.appendChild(delete_button);
  delete_button.setAttributes({
      textContent: 'Ta bort event',
      className: 'btn btn-danger ml-1 edit_buttons',
      id: 'event_details_modal_delete',
      type: 'button',
      style: 'display: none'
  })
}