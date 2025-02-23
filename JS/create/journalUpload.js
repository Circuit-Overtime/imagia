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
  
  
    document.getElementById("content").innerHTML = "";
    // Insert the blank journal template.
    document.getElementById("content").innerHTML = `
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
    document.getElementById("newSection").addEventListener("click", function() {
      const newSection = document.createElement("div");
      newSection.classList.add("journalWrapper");
      newSection.innerHTML = `
        <input type="text" class="journalInput" placeholder="Journal Title Goes Here" autocomplete="off" spellcheck="off">
        <textarea class="journalDescription" placeholder="Wooh! What a day, Let's write it down" style="height: 52px; overflow-y: hidden;"></textarea>
        <div class="newSection"> +  </div>
        <div class="thinkingSection"> </div>
      `;
      document.getElementById("content").appendChild(newSection);

      // Attach the same event listener to the new newSection.
      newSection.querySelector(".newSection").addEventListener("click", arguments.callee);
    });
  } 
);

// Function to upload/update blog content.
// Triggered via Ctrl+U; always uses the blog ID stored in localStorage.
async function uploadBlog() {
  document.getElementById("uploadJournal").classList.add("shine");
  setTimeout(() => {
    document.getElementById("uploadJournal").classList.remove("shine");
  }, 2000);
  
  // Get username from localStorage
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
  
  // Array to hold each journal wrapper's data.
  const blogData = [];
  const wrappers = document.querySelectorAll(".journalWrapper");
  
  wrappers.forEach(wrapper => {
    // Check for a journalInput (title) inside this wrapper.
    const inputEl = wrapper.querySelector(".journalInput");
    let title = "";
    if (inputEl) {
      title = inputEl.value.trim();
      if (!title) {
        // If empty, extract the first three words from the first journalDescription.
        const descriptionEl = wrapper.querySelector(".journalDescription");
        if (descriptionEl) {
          const words = descriptionEl.value.trim().split(/\s+/);
          title = words.slice(0, 3).join(" ");
          // Update the input element with the derived title.
          inputEl.value = title;
        }
      }
    }
    
    // Collect text from all journalDescription textareas.
    const textElements = wrapper.querySelectorAll(".journalDescription");
    let textContent = "";
    textElements.forEach(el => {
      textContent += el.value + "\n";
    });
    
    // Collect temporary image URLs from each imageSection.
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
  
  // Prepare data to store in Firestore.
  const blogDocData = {
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    username,
    docId: blogId,         // Root-level docId field.
    title: rootTitle,      // Root-level title.
    content: blogData,     // Array of journal objects.
    uploadedImages: []     // Will be updated after image uploads.
  };
  
  const blogRef = db.collection("blog").doc(blogId);
  
  // Declare uploadedImages here so it's defined for all later usages.
  let uploadedImages = [];
  
  // Create or update the Firestore document.
  try {
    const doc = await blogRef.get();
    if (!doc.exists) {
      await blogRef.set(blogDocData);
      console.log("New blog document created with ID:", blogId);
    } else {
      // Merge new content into the content array.
      await blogRef.update({
        uploadedImages: uploadedImages,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      console.log("Blog document updated with new content.");
    }
  } catch (err) {
    console.error("Error writing/updating blog doc:", err);
    return;
  }
  
  // Upload images to Storage for each journal wrapper.
  // We store an array of objects (one per wrapper) to avoid nested arrays.
  for (let wrapperIndex = 0; wrapperIndex < wrappers.length; wrapperIndex++) {
    const wrapper = wrappers[wrapperIndex];
    const imageDivs = wrapper.querySelectorAll(".imageSection");
    const wrapperImageURLs = [];
    
    for (let imgIndex = 0; imgIndex < imageDivs.length; imgIndex++) {
      const imgDiv = imageDivs[imgIndex];
      const bg = imgDiv.style.backgroundImage;
      if (!bg || !bg.startsWith("url(")) continue;
      const objectUrl = bg.slice(5, -2);
      
      try {
        // Fetch the blob from the object URL.
        const response = await fetch(objectUrl);
        const blob = await response.blob();
        
        // Create a unique storage path for the image.
        const storagePath = `${storageFolder}/wrapper${wrapperIndex + 1}_img${imgIndex + 1}.jpg`;
        const imageRef = storageRef.child(storagePath);
        
        // Upload the blob and get its download URL.
        await imageRef.put(blob);
        const downloadURL = await imageRef.getDownloadURL();
        wrapperImageURLs.push(downloadURL);
        console.log("Uploaded image to:", downloadURL);
      } catch (uploadErr) {
        console.error("Error uploading image:", uploadErr);
      }
    }
    
    uploadedImages.push({
      wrapperIndex: wrapperIndex + 1,
      images: wrapperImageURLs
    });
  }
  
  // Update the Firestore blog document with the Storage download URLs.
  try {
    const doc = await blogRef.get();
    if (!doc.exists) {
      // This should not happen because we created the document above.
      await blogRef.set({ uploadedImages });
    } else {
      await blogRef.update({
        uploadedImages: firebase.firestore.FieldValue.arrayUnion(...uploadedImages),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    }
    console.log("Blog document updated with image URLs.");
    document.querySelector(".savepoll").style.opacity = 1;
    setTimeout(() => {
      document.querySelector(".savepoll").style.opacity = 0;
    }, 2000);
  } catch (updateErr) {
    console.error("Error updating blog doc with image URLs:", updateErr);
  }
}

// Listen for Ctrl+U (or Cmd+s) keydown event to trigger uploadBlog().
document.addEventListener("keydown", function(e) {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
    e.preventDefault();
    uploadBlog();
  }
});

