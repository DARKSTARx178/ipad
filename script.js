// CLOCK LOGIC (ES5 Compatibility)
function updateClock() {
    var now = new Date();
    var hours = now.getHours().toString();
    var minutes = now.getMinutes().toString();
    var seconds = now.getSeconds().toString();

    if (hours.length < 2) hours = '0' + hours;
    if (minutes.length < 2) minutes = '0' + minutes;
    if (seconds.length < 2) seconds = '0' + seconds;

    document.getElementById('time').textContent = hours + ':' + minutes + ':' + seconds;

    var options = { weekday: 'long', month: 'short', day: 'numeric' };
    document.getElementById('date').textContent = now.toLocaleDateString('en-US', options);
}
setInterval(updateClock, 1000);
updateClock();

// DRAG & DROP WHITEBOARD LOGIC
var canvas = document.getElementById('canvas');
var addNoteBtn = document.getElementById('add-note-btn');

addNoteBtn.addEventListener('click', function () {
    createNote(40, 40, "New note...");
});

function createNote(x, y, text) {
    var note = document.createElement('div');
    note.className = 'sticky-note';
    note.style.left = x + 'px';
    note.style.top = y + 'px';

    var colors = ['#fef08a', '#bbf7d0', '#bfdbfe', '#fbcfe8'];
    note.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];

    var textarea = document.createElement('textarea');
    textarea.value = text;
    note.appendChild(textarea);
    canvas.appendChild(note);

    var active = false;
    var currentX, currentY, initialX, initialY;
    var xOffset = x;
    var yOffset = y;

    note.addEventListener('touchstart', function (e) {
        if (e.target === textarea && document.activeElement === textarea) return;
        initialX = e.touches[0].clientX - xOffset;
        initialY = e.touches[0].clientY - yOffset;
        active = true;
    }, false);

    note.addEventListener('touchend', function () {
        initialX = currentX;
        initialY = currentY;
        active = false;
    }, false);

    note.addEventListener('touchmove', function (e) {
        if (active) {
            e.preventDefault();
            currentX = e.touches[0].clientX - initialX;
            currentY = e.touches[0].clientY - initialY;
            xOffset = currentX;
            yOffset = currentY;
            note.style.left = currentX + 'px';
            note.style.top = currentY + 'px';
        }
    }, false);
}

createNote(30, 40, "Tap to edit notes");
createNote(190, 120, "Drag me around!");
