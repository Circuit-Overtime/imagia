// Function to create the journalWrapper node from retrieved document data.
function createJournalWrapper(docData) {
    // Create the main container.
    const wrapper = document.createElement("div");
    wrapper.className = "journalWrapper hidden";
    wrapper.id = "journalWrapper";
  
    // Create title input element.
    const input = document.createElement("input");
    input.type = "text";
    input.className = "journalInput";
    input.placeholder = "Journal Title Goes Here";
    input.autocomplete = "off";
    input.spellcheck = false;
    // Use the title from the document if available.
    input.value = docData.title || "";
  
    // Create the journal description textarea.
    const textarea = document.createElement("textarea");
    textarea.className = "journalDescription";
    textarea.placeholder = "Wooh! What a day, Let's write it down";
    textarea.style.height = "52px";
    textarea.style.overflowY = "hidden";
    // Optionally, if content exists, fill the textarea with the text from the first content entry.
    if (docData.content && docData.content.length > 0) {
      textarea.value = docData.content[0].text || "";
    }
  
    // Create the newSection div.
    const newSection = document.createElement("div");
    newSection.className = "newSection";
    newSection.textContent = " + ";
  
    // Create the thinkingSection div.
    const thinkingSection = document.createElement("div");
    thinkingSection.className = "thinkingSection";
  
    // Create the imageSections container.
    const imageSections = document.createElement("div");
    imageSections.className = "imageSections";
  
    // Use uploadedImages from the document to populate imageSections.
    // Assume that docData.uploadedImages is an array of objects,
    // each with a "wrapperIndex" and an "images" array.
    // For simplicity, we will display images from the first wrapper entry.
    if (docData.uploadedImages && docData.uploadedImages.length > 0) {
      const firstWrapperImages = docData.uploadedImages[0].images || [];
      firstWrapperImages.forEach(url => {
        const imgDiv = document.createElement("div");
        imgDiv.className = "imageSection";
        imgDiv.style.background = `url(${url})`;
        imgDiv.style.backgroundSize = "cover";
        imgDiv.style.backgroundPosition = "center";
        imageSections.appendChild(imgDiv);
      });
    }
    else {
      // If there are no images yet, you can use a placeholder.
      const placeholderUrl = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR2ETLUZ3jAJWBp7O7TVnzUdiTuYG55gGEmww&s";
      for (let i = 0; i < 2; i++) {
        const imgDiv = document.createElement("div");
        imgDiv.className = "imageSection";
        imgDiv.style.background = `url(${placeholderUrl})`;
        imgDiv.style.backgroundSize = "cover";
        imgDiv.style.backgroundPosition = "center";
        imageSections.appendChild(imgDiv);
      }
    }
    
    // Append all elements into the journalWrapper.
    wrapper.appendChild(input);
    wrapper.appendChild(textarea);
    wrapper.appendChild(newSection);
    wrapper.appendChild(thinkingSection);
    wrapper.appendChild(imageSections);
  
    return wrapper;
  }

// Function to attach click listeners to journalName divs
function attachJournalClickListeners() {
    document.querySelectorAll(".journalName").forEach(journalDiv => {
        journalDiv.addEventListener("click", async function() {
            const docId = this.getAttribute("data-id");
            if (!docId) {
                console.error("No document id found on this journalName element.");
                return;
            }

            try {
                // Fetch the document from Firestore.
                const docSnapshot = await db.collection("blog").doc(docId).get();
                if (!docSnapshot.exists) {
                    console.error("No blog document found for id:", docId);
                    return;
                }
                const docData = docSnapshot.data();

                // Create the journalWrapper element from the retrieved document data.
                const journalWrapper = createJournalWrapper(docData);
                journalWrapper.classList.remove("hidden");

                // Append the journalWrapper to a container (assumed with id "journalContainer").
                const container = document.getElementById("journalContainer");
                if (container) {
                    // Optionally clear previous content.
                    container.innerHTML = "";
                    container.appendChild(journalWrapper);
                } else {
                    document.body.appendChild(journalWrapper);
                }
            } catch (error) {
                console.error("Error fetching blog document:", error);
            }
        });
    });
}
  

// Retrieve the username from localStorage.
const username = localStorage.getItem("ElixpoAIUser");
if (!username) {
  console.error("Username not found in localStorage.");
} else {
  // Reference the menuBar div.
  const menuBar = document.querySelector(".menuBar");
  
  // Query Firestore for blog documents where the username matches.
  db.collection("blog")
    .where("username", "==", username)
    .get()
    .then(snapshot => {
      snapshot.forEach(doc => {
        const data = doc.data();
        // Create a new div element for the journal.
        const journalDiv = document.createElement("div");
        journalDiv.className = "journalName";
        // Set the title inside the journal div.
        journalDiv.textContent = data.title.slice(0,12)+"..." || "Untitled Blog";
        
        // Set the data-id attribute to the document's ID.
        journalDiv.setAttribute("data-id", doc.id);
        
        // Append the journal div to the menuBar.
        menuBar.appendChild(journalDiv);
      });
      // After journalNames are added, attach the event listeners.
      attachJournalClickListeners();
    })
    .catch(error => {
      console.error("Error retrieving blogs:", error);
    });
}


