const textareas = document.querySelectorAll('.journalDescription');
const maxHeight = 500; // Maximum height in pixels

function autoResize() {
    // Reset height to get the correct scrollHeight
    this.style.height = 'auto';
    // Calculate the new height, but do not exceed maxHeight
    const newHeight = Math.min(this.scrollHeight, maxHeight);
    this.style.height = newHeight + 'px';

    // If content exceeds maxHeight, enable vertical scrolling
    if (this.scrollHeight > maxHeight) {
        this.style.overflowY = 'scroll';
    } else {
        this.style.overflowY = 'hidden';
    }
}

// Listen for input events (covering pressing Enter and other changes)
textareas.forEach(textarea => {
    textarea.addEventListener('input', autoResize);
});


document.querySelectorAll("#newSection").forEach(section => {
    section.addEventListener("click", function() {
        const node = `<input type="text" class="journalInput" id="journalInput" placeholder="Journal Title Goes Here" autocomplete="off" spellcheck="off">
            <textarea class="journalDescription" id="journalDescription" placeholder="Wooh! What a day, Let's write it down"></textarea>
            <div class="newSection" id="newSection"> + Add Section </div>
            <div class="thinkingSection" id="thinkingSection"></div>`;
            
        document.getElementById("content").innerHTML += node;

        // Re-attach the autoResize event listener to the new textarea
        document.querySelectorAll('.journalDescription').forEach(textarea => {
            textarea.addEventListener('input', autoResize);
        });

        // Re-attach the click event listener to the new section
        document.querySelectorAll("#newSection").forEach(newSection => {
            newSection.addEventListener("click", arguments.callee);
        });
    });
});