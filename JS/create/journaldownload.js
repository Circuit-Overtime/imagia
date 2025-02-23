const generatePDF = () => {
  
  document.getElementById("downloadJournal").classList.add("shine");
            setTimeout(() => {
                document.getElementById("downloadJournal").classList.remove("shine");
            }, 2000);
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();
  
    let yOffset = 10;
  
    // Journal Input (Title)
    const journalInput = document.querySelector('.journalInput');
    if (journalInput && journalInput.offsetParent !== null) {
      pdf.setFontSize(20); // Larger title font
      pdf.text(journalInput.value || journalInput.placeholder, 10, yOffset);
      yOffset += 25;
    }
  
    // Iterate through all journalDescription elements
    const journalDescriptions = document.querySelectorAll('.journalDescription');
    if (journalDescriptions.length > 0) {
      journalDescriptions.forEach(desc => {
        if (desc.offsetParent !== null) {
          const descriptionText = desc.value || desc.placeholder || "";
          if (descriptionText.trim()) {
            pdf.setFontSize(12);
            const maxWidth = pdf.internal.pageSize.getWidth() - 20;
            const lines = pdf.splitTextToSize(descriptionText, maxWidth);
            lines.forEach(line => {
              pdf.text(line, 10, yOffset);
              yOffset += 8;
            });
            yOffset += 10; // spacing between descriptions
          }
        }
      });
    } else {
      // If no journalDescriptions, show notification
      document.getElementById("NotifTxt").innerText = "Not enough content";
      document.getElementById("savedMsg").classList.add("display");
      setTimeout(() => {
        document.getElementById("savedMsg").classList.remove("display");
        document.getElementById("NotifTxt").innerText = "Greetings!";
      }, 1500);
      return;
    }
  
    // Image Sections
    const imageSections = document.querySelector('.imageSections');
    if (imageSections && imageSections.offsetParent !== null) {
      const imageDivs = Array.from(imageSections.querySelectorAll('.imageSection'));
      const hasCustomImages = imageDivs.some(div => 
        div.style.backgroundImage && div.style.backgroundImage.includes('url')
      );
  
      if (hasCustomImages) {
        let processedImages = 0;
        imageDivs.forEach((div, index) => {
          if (div.style.backgroundImage && div.style.backgroundImage.includes('url')) {
            const imageUrl = div.style.backgroundImage.slice(4, -1).replace(/['"]/g, "");
            fetch(imageUrl)
              .then(response => response.blob())
              .then(blob => {
                const reader = new FileReader();
                reader.onloadend = () => {
                  const imageData = reader.result;
                  pdf.addImage(imageData, 'JPEG', 10, yOffset, 50, 30);
                  yOffset += 40;
                  processedImages++;
                  if (processedImages === imageDivs.length) {
                    pdf.save('journal.pdf');
                  }
                };
                reader.readAsDataURL(blob);
              })
              .catch(error => {
                console.error('Error fetching image:', error);
                pdf.text(`Error loading image ${index + 1}`, 10, yOffset);
                yOffset += 10;
                processedImages++;
                if (processedImages === imageDivs.length) {
                  pdf.save('journal.pdf');
                }
              });
          } else {
            pdf.text(`Placeholder image ${index + 1}`, 10, yOffset);
            yOffset += 10;
            processedImages++;
            if (processedImages === imageDivs.length) {
              pdf.save('journal.pdf');
            }
          }
        });
      } else {
        pdf.text("No custom images found, printing default images.", 10, yOffset);
        yOffset += 10;
        imageSections.querySelectorAll('.imageSection').forEach((div, index) => {
          pdf.text(`Default Image ${index + 1}`, 10, yOffset);
          yOffset += 10;
        });
        pdf.save('journal.pdf');
      }
    } else {
      pdf.save('journal.pdf');
    }
  };
  
  // Button click event for PDF download
  document.getElementById('downloadJournal').addEventListener('click', generatePDF);
  
  // Listen for Ctrl+P (or Cmd+P on macOS) to trigger PDF generation
  document.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'p') {
      event.preventDefault();
      generatePDF();
    }
  });
  