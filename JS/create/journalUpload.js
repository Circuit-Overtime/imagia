// Firebase variables
const db = firebase.firestore();
const storageRef = firebase.storage().ref();

// When the user clicks journalMode, either open the existing blog or create a new blog ID.
document.getElementById("journalMode").addEventListener("click", function() {
  let blogId = localStorage.getItem("ElixpoBlogID");
  if (!blogId) {
    const username = localStorage.getItem("ElixpoAIUser");
    if (!username) {
      console.error("Username not found in localStorage.");
      return;
    }
    const timestamp = Date.now();
    blogId = `${username}_${timestamp}`;
    localStorage.setItem("ElixpoBlogID", blogId);
  }
  // Open the blog section (assumes "journalSection" shows the blog)
  document.getElementById("journalSection").classList.remove("hidden");
});

// When the user clicks the addJournal button, create a new blogID,
// clear the content DOM, insert a blank template, and add an event listener to newSection.
document.getElementById("addJournal").addEventListener("click", function() {
  document.getElementById("menuBar").classList.add("hidden");
  const username = localStorage.getItem("ElixpoAIUser");
  if (!username) {
    console.error("Username not found in localStorage.");
    return;
  }
  const timestamp = Date.now();
  const blogId = `${username}_${timestamp}`;
  localStorage.setItem("ElixpoBlogID", blogId);
  
  // Clear the content container.
  const contentContainer = document.getElementById("content");
  if (contentContainer) {
    contentContainer.innerHTML = `
      <div class="journalWrapper hidden" id="journalWrapper">
        <input type="text" class="journalInput" id="journalInput" placeholder="Journal Title Goes Here"
          autocomplete="off" spellcheck="off">
        <textarea class="journalDescription"
          placeholder="Wooh! What a day, Let's write it down" style="height: 52px; overflow-y: hidden;"></textarea>
        <div class="newSection" id="newSection"> +  </div>
        <div class="thinkingSection"> </div>
      </div>
    `;
    // Add event listener to newSection to add a new journal section.
    document.getElementById("newSection").addEventListener("click", function addNewSection(event) {
      // Create a new journal wrapper element.
      const newWrapper = document.createElement("div");
      newWrapper.classList.add("journalWrapper");
      newWrapper.innerHTML = `
        <input type="text" class="journalInput" placeholder="Journal Title Goes Here" autocomplete="off" spellcheck="off">
        <textarea class="journalDescription" placeholder="Wooh! What a day, Let's write it down" style="height: 52px; overflow-y: hidden;"></textarea>
        <div class="newSection"> +  </div>
        <div class="thinkingSection"> </div>
      `;
      contentContainer.appendChild(newWrapper);
      
      // Attach the same event listener to the new newSection.
      newWrapper.querySelector(".newSection").addEventListener("click", addNewSection);
    });
  }
});

// Function to upload/update blog content.
// Triggered via Ctrl+U (or Cmd+S) keydown event.
async function uploadBlog() {
  // Show a visual shine effect for feedback.
  document.getElementById("uploadJournal").classList.add("shine");
  setTimeout(() => {
    document.getElementById("uploadJournal").classList.remove("shine");
  }, 2000);
  
  // Get username from localStorage.
  const username = localStorage.getItem("ElixpoAIUser");
  if (!username) {
    console.error("Username not found in localStorage.");
    return;
  }
  
  // Get or create the blog ID.
  let blogId = localStorage.getItem("ElixpoBlogID");
  if (!blogId) {
    const timestamp = Date.now();
    blogId = `${username}_${timestamp}`;
    localStorage.setItem("ElixpoBlogID", blogId);
  }
  const storageFolder = `blog/${blogId}`;
  
  // Prepare blog data.
  const blogData = [];
  const wrappers = document.querySelectorAll(".journalWrapper");
  
  wrappers.forEach(wrapper => {
    // Get the title.
    const inputEl = wrapper.querySelector(".journalInput");
    let title = "";
    if (inputEl) {
      title = inputEl.value.trim();
      if (!title) {
        // If empty, derive the title from the first three words of the first journalDescription.
        const descriptionEl = wrapper.querySelector(".journalDescription");
        if (descriptionEl) {
          const words = descriptionEl.value.trim().split(/\s+/);
          title = words.slice(0, 3).join(" ");
          inputEl.value = title; // Update the input element.
        }
      }
    }
    
    // Gather text from all journalDescription textareas.
    const textElements = wrapper.querySelectorAll(".journalDescription");
    let textContent = "";
    textElements.forEach(el => {
      textContent += el.value + "\n";
    });
    
    // Collect any temporary image URLs from imageSection elements.
    const imageLinks = [];
    const imageDivs = wrapper.querySelectorAll(".imageSection");
    imageDivs.forEach(imgDiv => {
      const bg = imgDiv.style.backgroundImage;
      if (bg && bg.startsWith("url(")) {
        // Remove the url(' and ') parts.
        const url = bg.slice(5, -2);
        imageLinks.push(url);
      }
    });
    
    blogData.push({
      title,           // Title for this wrapper.
      text: textContent.trim(),
      image: imageLinks // Temporary object URLs.
    });
  });
  
  // Use the title from the first wrapper as the root-level title.
  const rootTitle = blogData.length > 0 && blogData[0].title ? blogData[0].title : "";
  
  // Prepare the Firestore document data.
  const blogDocData = {
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    username,
    docId: blogId,
    title: rootTitle,
    content: blogData,
    uploadedImages: []  // To be updated after image uploads.
  };
  
  const blogRef = db.collection("blog").doc(blogId);
  let uploadedImages = [];
  
  // Create or update the Firestore document.
  try {
    const doc = await blogRef.get();
    if (!doc.exists) {
      await blogRef.set(blogDocData);
      console.log("New blog document created with ID:", blogId);
    } else {
      // Here we update the non-image parts and clear uploadedImages.
      await blogRef.update({
        content: blogData,
        uploadedImages: [],
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      console.log("Blog document updated with new content.");
    }
  } catch (err) {
    console.error("Error writing/updating blog doc:", err);
    return;
  }
  
  // For each journal wrapper, upload its images and record the download URLs.
  for (let wrapperIndex = 0; wrapperIndex < wrappers.length; wrapperIndex++) {
    const wrapper = wrappers[wrapperIndex];
    const imageDivs = wrapper.querySelectorAll(".imageSection");
    
    // Process all images concurrently for this wrapper.
    const wrapperImageURLs = await Promise.all(
      Array.from(imageDivs).map(async (imgDiv, imgIndex) => {
        const bg = imgDiv.style.backgroundImage;
        if (!bg || !bg.startsWith("url(")) return null;
        const objectUrl = bg.slice(5, -2);
        try {
          const response = await fetch(objectUrl);
          const blob = await response.blob();
          // Create a unique storage path.
          const storagePath = `${storageFolder}/wrapper${wrapperIndex + 1}_img${imgIndex + 1}.jpg`;
          const imageRef = storageRef.child(storagePath);
          await imageRef.put(blob);
          const downloadURL = await imageRef.getDownloadURL();
          console.log("Uploaded image to:", downloadURL);
          return downloadURL;
        } catch (uploadErr) {
          console.error("Error uploading image:", uploadErr);
          return null;
        }
      })
    );
    
    // Filter out any null values (failed uploads).
    uploadedImages.push({
      wrapperIndex: wrapperIndex + 1,
      images: wrapperImageURLs.filter(url => url !== null)
    });
  }
  
  // Update the Firestore document with the Storage download URLs.
  try {
    await blogRef.update({
      uploadedImages: uploadedImages,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    console.log("Blog document updated with image URLs.");
    document.querySelector(".savepoll").style.opacity = 1;
    setTimeout(() => {
      document.querySelector(".savepoll").style.opacity = 0;
    }, 2000);
  } catch (updateErr) {
    console.error("Error updating blog doc with image URLs:", updateErr);
  }
}

// Listen for Ctrl+U (or Cmd+S) keydown event to trigger uploadBlog().
document.addEventListener("keydown", function(e) {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
    e.preventDefault();
    uploadBlog();
  }
});

// Function to create a journal wrapper node from a single content entry and its image URLs.
function createJournalWrapperFromContent(contentEntry, imageURLs, wrapperIndex) {
  // Create the main container.
  const wrapper = document.createElement("div");
  wrapper.className = "journalWrapper"; // Remove "hidden" so that it shows immediately.
  // (Optionally, you can set an id that includes the index if needed)
  wrapper.id = "journalWrapper_" + wrapperIndex;
  
  // Create title input element.
  const input = document.createElement("input");
  input.type = "text";
  input.className = "journalInput";
  input.placeholder = "Journal Title Goes Here";
  input.autocomplete = "off";
  input.spellcheck = false;
  // Use the title from the content entry.
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
  // If your content structure has thinking text, you can assign it here.
  // For this example, we leave it empty unless provided.
  thinkingSection.textContent = contentEntry.thinking || "";
  
  // Create the imageSections container.
  const imageSections = document.createElement("div");
  imageSections.className = "imageSections";
  
  // Populate imageSections using the imageURLs array (if provided).
  if (imageURLs && imageURLs.length > 0) {
    imageURLs.forEach(url => {
      const imgDiv = document.createElement("div");
      imgDiv.className = "imageSection";
      imgDiv.style.background = `url(${url})`;
      imgDiv.style.backgroundSize = "cover";
      imgDiv.style.backgroundPosition = "center center";
      imageSections.appendChild(imgDiv);
    });
  } else {
    // If no images available, add a placeholder (repeat twice).
    const placeholderUrl = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR2ETLUZ3jAJWBp7O7TVnzUdiTuYG55gGEmww&s";
    for (let i = 0; i < 2; i++) {
      const imgDiv = document.createElement("div");
      imgDiv.className = "imageSection";
      imgDiv.style.background = `url(${placeholderUrl})`;
      imgDiv.style.backgroundSize = "cover";
      imgDiv.style.backgroundPosition = "center center";
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
  
// Function to create the full display from retrieved document data.
function renderJournalFromDoc(docData) {
  // First, clear the container.
  const container = document.getElementById("journalContainer");
  if (!container) {
    console.error("Journal container not found.");
    return;
  }
  container.innerHTML = "";
  
  // docData.content is an array of journal entries.
  // docData.uploadedImages is an array of objects each with wrapperIndex and images array.
  const contentArray = docData.content || [];
  const uploadedImages = docData.uploadedImages || [];
  
  contentArray.forEach((entry, index) => {
    // Find matching images for this wrapper based on wrapperIndex (assume 1-indexed).
    const wrapperIndex = index + 1;
    const imageObj = uploadedImages.find(imgObj => imgObj.wrapperIndex === wrapperIndex);
    const imageURLs = imageObj ? imageObj.images : [];
    
    // Create the wrapper for this entry.
    const wrapperNode = createJournalWrapperFromContent(entry, imageURLs, wrapperIndex);
    
    // Append the wrapper into the container.
    container.appendChild(wrapperNode);
  });
}
  
// Function to attach click listeners to journalName divs.
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
        // Render all journal wrappers using the full docData.
        renderJournalFromDoc(docData);
      } catch (error) {
        console.error("Error fetching blog document:", error);
      }
    });
  });
}
  
// Retrieve the username from localStorage and fetch journal names.
const username = localStorage.getItem("ElixpoAIUser");
if (!username) {
  console.error("Username not found in localStorage.");
} else {
  const menuBar = document.querySelector(".menuBar");
  db.collection("blog")
    .where("username", "==", username)
    .get()
    .then(snapshot => {
      snapshot.forEach(doc => {
        const data = doc.data();
        // Create a new div element for the journal.
        const journalDiv = document.createElement("div");
        journalDiv.className = "journalName";
        // Use a short version of the title.
        journalDiv.textContent = (data.title && data.title.slice(0, 12)) || "Untitled Blog";
        journalDiv.setAttribute("data-id", doc.id);
        menuBar.appendChild(journalDiv);
      });
      attachJournalClickListeners();
    })
    .catch(error => {
      console.error("Error retrieving blogs:", error);
    });
  }
