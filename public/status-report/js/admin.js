function handle_load_admin(data) {
  if (!data.exists || !('admin' in data.data()) ) {
    document.querySelector('#no-data .user-email').textContent = getUserEmail();
    Onload.noData();
    return;
  }
  data = data.data();
  
  Onload.signedIn() 
}


// Switch Tab
document.addEventListener('click', (ev) => {
  const tar = ev.target;

  if (tar.classList.contains('tabs__btn')) {
    const menu = document.querySelectorAll('.tabs__btn');
    const tabs = document.querySelectorAll('.tabs__section')
    menu.forEach( btn => {
      btn.classList.remove('tabs__btn--active')
    })
    
    tabs.forEach( block => {
      block.classList.remove('tabs__section--active')
    })

    tar.classList.add('tabs__btn--active')
    const tabIndex = tar.dataset.forTab;
    tabs[tabIndex].classList.add('tabs__section--active')
  }

})