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

document.querySelectorAll(".newSection").forEach(section => {
  section.addEventListener("click", function addNewSection() {
    const node = `
      <div class="journalWrapper">
        <textarea class="journalDescription" placeholder="Wooh! What a day, let's write it down"></textarea>
        <div class="newSection" id="newSection"> + </div>
        <div class="thinkingSection"></div>
      </div>
    `;
    // Append the new node to the content container without overwriting existing content
    document.getElementById("content").insertAdjacentHTML('beforeend', node);

    // Re-attach the autoResize event listener to all journalDescription textareas
    document.querySelectorAll('.journalDescription').forEach(textarea => {
      textarea.addEventListener('input', autoResize);
    });

    // Re-attach the click event listener to all newSection elements
    document.querySelectorAll(".newSection").forEach(newSection => {
      newSection.removeEventListener("click", addNewSection);
      newSection.addEventListener("click", addNewSection);
    });
  });
});



document.getElementById("closeJournal").addEventListener("click", function() {
    document.getElementById("journalSection").classList.add("hidden");
});

document.getElementById("journalMode").addEventListener("click", function() {
    document.getElementById("journalSection").classList.remove("hidden");
    document.getElementById("journalInput").focus();
});



const typeOfImageTile = document.getElementById('typeOfImageTileJournal');
const children = typeOfImageTile.getElementsByTagName('span');
Array.from(children).forEach(child => {
    child.addEventListener('click', () => {
        imageVarType = child.className;
        console.log(imageVarType);
        Array.from(children).forEach(c => {
            c.style.opacity = ".25";
            c.style.border = "none";
        });
        child.style.opacity = "1";
        child.style.border = "1px solid #f4bb00";
      
    });
    
});

document.getElementById("menu").addEventListener("click", function() {
    document.getElementById("menubar").classList.toggle("hidden");
});