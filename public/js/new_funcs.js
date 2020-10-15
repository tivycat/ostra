
// function display_active_weeks() {
//   // start by making sure that all weeks are off
//   let array_of_weeks = document.querySelectorAll(".week_row"); 
//   for (let wk of array_of_weeks) {
//       wk.classList.add('inactive_week')
//   }

//   // get current week
//   let todays_date = '2020-09-07' //moment(new Date()).format("YYYY-MM-DD");
//   let this_week = moment(todays_date).isoWeek();
//   let select_weeks_to_display = document.getElementById('select_weeks_to_display').value;
//   let index_last_activated;
//   // iterate through all week_row to find the starting point (current week)
//   for (let i = 0; i<array_of_weeks.length; i++) {
//       let week = array_of_weeks[i];

//       if (select_weeks_to_display == 'all') {
//           week.classList.remove('inactive_week')
//           continue;   
//       }

//       // find starting point (id is 'tr-v34' so need to substring 3 to remove tr-)
//       if (week.id.substring(3) == `v${this_week}`) {            
//           let adjusted_number = Number(select_weeks_to_display) + Number(i);
//           // loop through the weeks that should be activated
//           for (let j = i; j<adjusted_number; j++) {
//               let week_to_activate = array_of_weeks[j];
//               week_to_activate.classList.remove('inactive_week');
//               index_last_activated = adjusted_number
//           }
//           break;
//       }
//   }
//   // add last activated index of the arr to the fetch_next_week button
//   document.getElementById('fetch_next_week').setAttribute('data-index', index_last_activated);
// }

// function display_next_week() {
//   let index_element = document.getElementById('fetch_next_week');
//   let i = index_element.getAttribute('data-index')
//   let arr_of_weeks = document.querySelectorAll(".week_row");
//   arr_of_weeks[i].classList.remove('inactive_week');

//   //increment index on element by 1
//   index_element.setAttribute('data-index', Number(index_element.getAttribute('data-index')) + 1)

// }



// document.addEventListener('click', function(event) {
//   let targ = event.target;

//     if (targ.classList.contains('show_group')) {
//         display_group_selection({id : targ.id.substring(5), level: targ.getAttribute('data-level')})
//     }

//     if (targ.id == 'show_start') {
//         display_group_selection('All')
//     }

//     if (targ.id == 'add_test') {
//         new_event_modal_reset()
//         new_event_modal_display('test')

//     }
  
//   /* * * * * * * * * * * * * * * *
//   * Lägg till event/veckoavvikelse
//   *  * * * * * * * * * * * * * * **/

//   // lägg till event till särskilt datum
//   if (targ.classList.contains('add_event_to_date')) {
//       new_event_modal_reset()
//       let type = 'event';
      
//       let id = targ.parentNode.querySelector('.event_table').id;
//       new_event_modal_display(type, id)
//   }

//   // lägg till veckoavvvikelse till vald vecka
//   if (targ.classList.contains('add_week_event')) {
      
//       new_event_modal_reset()
//       let type = 'week_event';
//       let id = targ.parentNode.querySelector('.event_table').id;
//       new_event_modal_display(type, id)
//   }

//   // visa modal för ny event/veckoavvikelse (oavsett vald datum eller ej)
//   if (targ.id == 'new_event_modal_save') {
//     gather_event_details()
//   }
  

//   // stäng modal för ny event/veckoavvikelse
//   if (targ.id == 'new_event_modal_close') {
//       $('#new_event_modal').modal('hide')
//   }

//   // aktivera admin mode (dvs skapa knappar i alla celler)
//   if (targ.id =='toggle_admin_mode') {
//       let status;
//       if (targ.classList.contains('active')) {
//         status = 'deactivate'
//       } else {
//         status = 'activate';
//       }
//       toggle_admin_mode(status)
//       targ.classList.toggle('active');
//   }


//   /* * * * * * * * * * * * * * * *
//   * Eventdetaljer
//   *  * * * * * * * * * * * * * * **/ 
  
//   if (targ.id == 'event_details_modal_close') {
//       // hide modal
//       document.getElementById('event_details_modal').removeAttribute('data-eventid')
//       $('#event_details_modal').modal('hide')
      
//   }

//   if (targ.classList.contains('event')) {
//       let typecode = targ.classList[1] // is this a poor idea? 'event' will always be [0] so [1] will always(?) be the right type
//       let ev_details = {
//           type : 'event',
//           caption : targ.querySelector('.event_caption').textContent,
//           groups : targ.querySelector('.event_groups').textContent,
//           description : targ.getAttribute('title'),
//           date_id : targ.getAttribute('data-dateid'),
//           typecode: typecode,
//           event_id: targ.parentNode.id,
//           creator : targ.parentNode.getAttribute('data-creator')
//       }
//       event_details_modal_display(ev_details);
//   }

//   if (targ.classList.contains('week_event')) {
//     let typecode = targ.classList[1] // is this a poor idea? 'event' will always be [0] so [1] will always(?) be the right type
//     let ev_details = {
//         type : 'week_event',
//         caption : targ.querySelector('.event_caption').textContent,
//         groups : targ.querySelector('.event_groups').textContent,
//         description : targ.getAttribute('title'),
//         date_id : targ.getAttribute('data-dateid'),
//         typecode: typecode,
//         event_id: targ.parentNode.id,
//         creator : targ.parentNode.getAttribute('data-creator')
//     }
//     event_details_modal_display(ev_details);
// }

//   if (targ.id == 'event_details_modal_edit') {
//       event_details_edit();   
//   }

//   if (targ.id == 'event_details_modal_save') {
//       event_details_save_new_changes();
//   }

//   if (targ.id == 'event_details_modal_delete') {
//     let modal = document.getElementById('event_details_modal');
//     event_details_delete_event({
//         event_id: modal.getAttribute('data-eventid'), 
//         date_id: modal.getAttribute('data-dateid')
//     });
// }
// if (targ.id == 'fetch_next_week') {
//     display_next_week();
// }

// })

// document.getElementById('select_weeks_to_display').addEventListener('change', () => { display_active_weeks() })