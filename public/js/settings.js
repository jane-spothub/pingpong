document.getElementById("openSettings").addEventListener("click", () => {
    document.getElementById("settingsPopup").classList.remove("hidden");
});

document.querySelector(".close-settings").addEventListener("click", () => {
    document.getElementById("settingsPopup").classList.add("hidden");
});

document.getElementById("backbtnstn").addEventListener("click", () => {
    document.getElementById("settingsPopup").classList.add("hidden");
});


// Master Sound toggle
const masterToggle = document.querySelectorAll('.toggle-switch input')[0];
masterToggle.addEventListener('change', e => {
    if (window.soundHandler) {
        if (e.target.checked) {
            window.soundHandler.unmute();
        } else {
            window.soundHandler.mute();
        }
    }
});

// Background Music toggle
const bgToggle = document.querySelectorAll('.toggle-switch input')[1];
bgToggle.addEventListener('change', e => {
    if (window.soundHandler) {
        if (e.target.checked) {
            window.soundHandler.playBackground();
        } else {
            window.soundHandler.stopBackground();
        }
    }
});

// Volume slider (controls background + effects)
const volumeSlider = document.querySelector('.volume-slider');
const volumeValue = volumeSlider.nextElementSibling;

volumeSlider.addEventListener('input', e => {
    const value = e.target.value / 100;
    volumeValue.textContent = e.target.value + '%';

    if (window.soundHandler) {
        // update all effect volumes
        Object.values(window.soundHandler.sounds).forEach(a => a.volume = value);

        // background volume (respect mute state)
        if (window.soundHandler.background) {
            window.soundHandler.background.volume = window.soundHandler.muted ? 0 : value;
        }
    }
});

// Ball sounds toggle (index 3)
const ballToggle = document.querySelectorAll('.toggle-switch input')[3];
ballToggle.addEventListener('change', e => {
    if (window.soundHandler) {
        window.soundHandler.disableBall = !e.target.checked;
    }
});


// Victory sounds toggle (index 4)
const victoryToggle = document.querySelectorAll('.toggle-switch input')[4];
victoryToggle.addEventListener('change', e => {
    if (window.soundHandler) {
        window.soundHandler.disableVictory = !e.target.checked;
    }
});
