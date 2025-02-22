

// ----------------------------------------------------------------------
// Function to create a single journalWrapper node from one content entry.
// This function uses an optional uploadedImagesEntry to display stored images.
// ----------------------------------------------------------------------
function createSingleJournalWrapper(contentEntry, uploadedImagesEntry) {
    document.getElementById("content").innerHTML = "";
  // Create the main container.
  const wrapper = document.createElement("div");
  wrapper.className = "journalWrapper";
  wrapper.id = "journalWrapper"; // Consider omitting or making unique if multiple wrappers exist

  // Create title input element.
  const input = document.createElement("input");
  input.type = "text";
  input.className = "journalInput";
  input.placeholder = "Journal Title Goes Here";
  input.autocomplete = "off";
  input.spellcheck = "false";
  input.value = contentEntry.title || "";

  // Create the journal description textarea.
  const textarea = document.createElement("textarea");
  textarea.className = "journalDescription";
  textarea.placeholder = "Wooh! What a day, Let's write it down";
  textarea.style.height = "52px";
  textarea.style.overflowY = "hidden";
  textarea.value = contentEntry.text || "";

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

  // Use uploadedImagesEntry if available; otherwise, fall back to contentEntry.image.
  let imagesToShow = [];
  if (uploadedImagesEntry && uploadedImagesEntry.images && uploadedImagesEntry.images.length > 0) {
    imagesToShow = uploadedImagesEntry.images;
  } else if (contentEntry.image && contentEntry.image.length > 0) {
    imagesToShow = contentEntry.image;
  }
  // For each image URL, create an imageSection div.
  imagesToShow.forEach(url => {
    const imgDiv = document.createElement("div");
    imgDiv.className = "imageSection";
    imgDiv.style.background = `url(${url}) center center / cover`;
    imageSections.appendChild(imgDiv);
  });

  // Append all created elements to the wrapper.
  wrapper.appendChild(input);
  wrapper.appendChild(textarea);
  wrapper.appendChild(newSection);
  wrapper.appendChild(thinkingSection);
  wrapper.appendChild(imageSections);

  return wrapper;
}

// ----------------------------------------------------------------------
// Function to rebuild and display the full blog view in the #content element.
// This function iterates over each content entry from the blog document and
// uses the corresponding uploaded images (if any) to create each journalWrapper.
// ----------------------------------------------------------------------
function displayBlog(docData) {
  const container = document.getElementById("content");
  if (!container) {
    console.error("No element with id 'content' found.");
    return;
  }
  // Clear existing content.
  container.innerHTML = "";
  
  // Extract the content array and uploadedImages array from the document.
  const contentArray = docData.content || [];
  const uploadedImagesArray = docData.uploadedImages || [];

  // For each content entry, try to find the matching uploaded images by wrapperIndex.
  contentArray.forEach((entry, index) => {
    // Assuming each entry corresponds to a wrapper with index (index+1)
    const imagesEntry = uploadedImagesArray.find(item => item.wrapperIndex === (index + 1));
    const wrapperNode = createSingleJournalWrapper(entry, imagesEntry);
    container.appendChild(wrapperNode);
  });
}

// ----------------------------------------------------------------------
// Function to attach click listeners to journalName divs.
// On click, the blog document is fetched and the full blog view is displayed in #content.
// ----------------------------------------------------------------------
function attachJournalClickListeners() {
  document.querySelectorAll(".journalName").forEach(journalDiv => {
    journalDiv.addEventListener("click", async function() {
      const docId = this.getAttribute("data-id");
      if (!docId) {
        console.error("No document id found on this journalName element.");
        return;
      }
      
      try {
        const docSnapshot = await db.collection("blog").doc(docId).get();
        if (!docSnapshot.exists) {
          console.error("No blog document found for id:", docId);
          return;
        }
        const docData = docSnapshot.data();
        // Clear the content container before rendering.
        document.getElementById("content").innerHTML = "";
        displayBlog(docData);
      } catch (error) {
        console.error("Error fetching blog document:", error);
      }
    });
  });
}

// ----------------------------------------------------------------------
// Retrieve the username from localStorage and query Firestore for blog documents.
// For each matching document, create a journalName div with the title and data-id,
// and append it to the menuBar.
// ----------------------------------------------------------------------
// const username = localStorage.getItem("ElixpoAIUser");
// if (!username) {
//   console.error("Username not found in localStorage.");
// } else {
//   const menuBar = document.querySelector(".menuBar");
//   db.collection("blog")
//     .where("username", "==", username)
//     .get()
//     .then(snapshot => {
//       snapshot.forEach(doc => {
//         const data = doc.data();
//         const journalDiv = document.createElement("div");
//         journalDiv.className = "journalName";
//         journalDiv.textContent = data.title || "Untitled Blog";
//         journalDiv.setAttribute("data-id", doc.id);
//         menuBar.appendChild(journalDiv);
//       });
//       attachJournalClickListeners();
//     })
//     .catch(error => {
//       console.error("Error retrieving blogs:", error);
//     });
// }
