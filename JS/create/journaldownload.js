document.getElementById('downloadJournal').addEventListener('click', function () {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();

    let yOffset = 10;

    // Journal Input (Title)
    const journalInput = document.querySelector('.journalInput');
    if (journalInput && journalInput.offsetParent !== null) {
        pdf.setFontSize(20); // Make the title larger
        pdf.text(journalInput.value || journalInput.placeholder, 10, yOffset);
        yOffset += 25; // Increase spacing after the title
    }

    // Journal Description
    const journalDescription = document.querySelector('.journalDescription');
    if (journalDescription && journalDescription.offsetParent !== null) {
        pdf.setFontSize(12);
        const descriptionText = journalDescription.value || journalDescription.placeholder;
        // Split the description into lines that fit the PDF's width
        const maxWidth = pdf.internal.pageSize.getWidth() - 20; // PDF width minus margins
        const lines = pdf.splitTextToSize(descriptionText, maxWidth);

        lines.forEach(line => {
            pdf.text(line, 10, yOffset);
            yOffset += 8; // Spacing between lines of the description
        });
        yOffset += 10; // Additional spacing after the description
    }

    // Image Sections
    const imageSections = document.querySelector('.imageSections');
    if (imageSections && imageSections.offsetParent !== null) {
        // Check if there are any images with actual URLs set as background
        const imageDivs = Array.from(imageSections.querySelectorAll('.imageSection'));
        const hasCustomImages = imageDivs.some(div => div.style.backgroundImage && div.style.backgroundImage !== '' && div.style.backgroundImage.includes('url'));

        if (hasCustomImages) {
            imageDivs.forEach((div, index) => {
                if (div.style.backgroundImage && div.style.backgroundImage !== '' && div.style.backgroundImage.includes('url')) {
                    // Extract the URL from the background-image style
                    const imageUrl = div.style.backgroundImage.slice(4, -1).replace(/['"]/g, "");

                    // Use fetch to get the image as a Blob
                    fetch(imageUrl)
                        .then(response => response.blob())
                        .then(blob => {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                                const imageData = reader.result;
                                // Add the image to the PDF
                                pdf.addImage(imageData, 'JPEG', 10, yOffset, 50, 30); // Adjust position and size
                                yOffset += 40; // Spacing after the image
                                if (index === imageDivs.length - 1) {
                                    // Save the PDF only after the last image is processed
                                    pdf.save('journal.pdf');
                                }
                            };
                            reader.readAsDataURL(blob);
                        })
                        .catch(error => {
                            console.error('Error fetching image:', error);
                            // Handle error: maybe add a placeholder or skip the image
                            pdf.text(`Error loading image ${index + 1}`, 10, yOffset);
                            yOffset += 10; // Still add some spacing, and continue
                            if (index === imageDivs.length - 1) {
                                // Save the PDF even with errors
                                pdf.save('journal.pdf');
                            }
                        });
                } else {
                    pdf.text(`Placeholder image ${index + 1}`, 10, yOffset); // Indicate placeholder
                    yOffset += 10;  // Spacing
                    if (index === imageDivs.length - 1) {
                        // Save the PDF when the last image div has been processed
                        pdf.save('journal.pdf');
                    }
                }
            });
        } else {
            // Print a message if no custom URLs are present
            pdf.text("No custom images found, printing default images.", 10, yOffset);
            yOffset += 10;

            imageDivs.forEach((div, index) => {
                // Add a generic placeholder for each of the default image sections
                pdf.text(`Default Image ${index + 1}`, 10, yOffset); // Indicate default
                yOffset += 10;  // Spacing
            });
            pdf.save('journal.pdf'); // Save after all default images have been accounted for.
        }
    } else {
        pdf.save('journal.pdf'); // Save even if there are no image sections at all.
    }
});