// this script shifts the active class to the account page link
document.addEventListener('DOMContentLoaded', function() {
    // event listener to the hamburger icon
    const hamburger = document.querySelector('.hamburger');
    if (hamburger) {
        // adding an event listener to the hamburger icon, using an arrow function
        hamburger.addEventListener('click',  () => {
            const settingsPanel = document.querySelector('.settings_popup');
            if (settingsPanel) {
                settingsPanel.style.display = 'flex'; 
            }
        });

        // hide the settings panel when clicking outside of it
        document.addEventListener('click', (event) => {
            const overviewSettings = document.querySelector('.left_settings_overview_1');
            const settingsPanel = document.querySelector('.settings_popup');
            if (overviewSettings && !overviewSettings.contains(event.target) && !hamburger.contains(event.target)) {
                settingsPanel.style.display = 'none';
            }
        });
    }


});

