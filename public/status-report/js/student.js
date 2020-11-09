function handle_load_student(data) {
  if (!data.exists) {
    document.querySelector('#no-data .user-email').textContent = getUserEmail();
    Onload.noData();
    return;
  }

  data = data.data();
}

loader_finish()

document.querySelectorAll('.accordion__button').forEach( (btn) => {
  btn.addEventListener('click', () => {
    btn.classList.toggle('accordion__button--active')
  })
})