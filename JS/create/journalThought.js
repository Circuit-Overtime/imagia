let journalImageType = "Normal";
let suffixPromptJournal = "in a realistic and natural style with minimal artistic exaggeration";
const triggerPhrase = "generate image"; // Trigger phrase in CoT for auto image generation

document.addEventListener("DOMContentLoaded", () => {
    let lastCoTRequestTime = 0;
    const coTCooldown = 10000; // 5 seconds cooldown for chain-of-thought
    let imageGenerationInProgress = false; // flag to prevent concurrent image generation

    // -------------------------
    // Chain-of-Thought generation
    // -------------------------
    document.addEventListener("input", async (e) => {
        if (e.target && e.target.classList.contains("journalDescription")) {
            const text = e.target.value.trim();
            if (!text) return;

            const wordCount = text.split(/\s+/).filter(Boolean).length;
            if (wordCount > 4) {
                const now = Date.now();
                if (now - lastCoTRequestTime < coTCooldown) return;
                lastCoTRequestTime = now;

                // Find the closest wrapper inside the content div
                const journalWrapper = e.target.closest(".journalWrapper");
                if (!journalWrapper) {
                    console.warn("No journalWrapper found for this journalDescription");
                    return;
                }

                const thinkingSection = journalWrapper.querySelector(".thinkingSection");
                if (!thinkingSection) {
                    console.warn("No thinkingSection found inside journalWrapper");
                    return;
                }

                displayChainOfThought(thinkingSection, "Hmm, I see");
                var inst = "act like as if you are a therapist and a wife  ,  listening to the user, write your reaction , like as if you are a great friend, in detail edn by asking an interesting question to the user. "
                const url = `https://txtelixpo.vercel.app/t/ ${inst} ${encodeURIComponent(text)} in 40 words`;
                try {
                    const response = await fetch(url, { method: "GET" });
                    if (!response.ok) throw new Error("Failed to fetch chain-of-thought");
                    let chainText = await response.text();
                    const unwanted = `data: {"message": "Request received, processing..."}`;
                    chainText = chainText.replace(unwanted, "").trim();
                    animateText(thinkingSection, chainText, async () => {
                        // After animating the CoT, check if it includes our trigger phrase
                        if (!imageGenerationInProgress && chainText.toLowerCase().includes(triggerPhrase)) {
                            // Auto-generate the image if the trigger phrase is found
                            console.log("Trigger phrase found in CoT, auto-generating image...");
                            imageGenerationInProgress = true;
                            const engineeredImagePrompt = `"${text}"`;
                            try {
                                await updateImageSectionsWithImages(engineeredImagePrompt, journalWrapper);
                            } catch (error) {
                                console.error("Error generating images automatically:", error);
                            } finally {
                                imageGenerationInProgress = false;
                            }
                        }
                    });
                } catch (error) {
                    console.error("Error generating chain-of-thought:", error);
                    displayChainOfThought(thinkingSection, "⚠️ Failed to generate chain-of-thought.");
                }
            }
        }
    });

    // -------------------------
    // Image generation on Ctrl+S with animation
    // -------------------------
    document.addEventListener("keydown", async (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
            e.preventDefault();
            console.log(imageGenerationInProgress);
            if (imageGenerationInProgress) return;

            const focusedTextArea = document.querySelector(".journalDescription:focus");
            if (!focusedTextArea) return;

            const text = focusedTextArea.value.trim();
            if (!text) return;

            const wordCount = text.split(/\s+/).filter(Boolean).length;
            if (wordCount <= 3) return;

            imageGenerationInProgress = true;
            const engineeredImagePrompt = `"${text}"`;

            // Find the closest wrapper inside the content div
            const journalWrapper = focusedTextArea.closest(".journalWrapper");
            if (!journalWrapper) return;

            try {
                await updateImageSectionsWithImages(engineeredImagePrompt, journalWrapper);
            } catch (error) {
                console.error("Error generating images:", error);
            } finally {
                imageGenerationInProgress = false;
            }
        }
    });

    // Update function to take journalWrapper as a parameter
    async function updateImageSectionsWithImages(prompt, journalWrapper) {
        let imageSections = journalWrapper.querySelector(".imageSections");

        if (!imageSections) {
            imageSections = document.createElement("div");
            imageSections.className = "imageSections";
            journalWrapper.appendChild(imageSections);

            for (let i = 0; i < 2; i++) {
                const imgDiv = document.createElement("div");
                imgDiv.className = "imageSection anim";
                imgDiv.style.opacity = 1;
                imgDiv.style.backgroundSize = "cover";
                imgDiv.style.backgroundPosition = "center";
                imageSections.appendChild(imgDiv);
            }
        }

        const imageDivs = imageSections.querySelectorAll(".imageSection");

        // Choose the appropriate suffix based on journalImageType
        function getSuffix() {
            const suffixes = {
                "Fantasy": "in a magical fantasy setting, with mythical creatures and surreal landscapes",
                "Halloween": "with spooky Halloween-themed elements, pumpkins, and eerie shadows",
                "Structure": "in the style of monumental architecture, statues, or structural art",
                "Crayon": "in the style of colorful crayon art with vibrant, childlike strokes",
                "Space": "in a vast, cosmic space setting with stars, planets, and nebulae",
                "Chromatic": "in a chromatic style with vibrant, shifting colors and gradients",
                "Cyberpunk": "in a futuristic cyberpunk setting with neon lights and dystopian vibes",
                "Anime": "in the style of anime, with detailed character designs and dynamic poses",
                "Landscape": "depicting a breathtaking landscape with natural scenery and serene views",
                "Samurai": "featuring a traditional samurai theme with warriors and ancient Japan",
                "Wpap": "in the WPAP style with geometric shapes and vibrant pop-art colors",
                "Vintage": "in a vintage, old-fashioned style with sepia tones and retro aesthetics",
                "Pixel": "in a pixel art style with blocky, 8-bit visuals and retro game aesthetics",
                "Normal": "in a realistic and natural style with minimal artistic exaggeration",
                "Synthwave": "in a retro-futuristic synthwave style with neon colors and 80s vibes"
            };
            return suffixes[journalImageType] || "in a realistic and natural style";
        }

        const suffixPromptJournal = getSuffix();
        const fullPrompt = `${prompt} -- rendered in vibrant, whimsical storybook style with warm colors and playful details ${suffixPromptJournal}`;
        console.log("Encoded Prompt:", fullPrompt);

        // For each image section, fetch and render the image in parallel
        imageDivs.forEach(async (div, idx) => {
            try {
                const url = `https://imgelixpo.vercel.app/c/${encodeURIComponent(fullPrompt)}`;
                const response = await fetch(url, { method: "GET" });
                if (!response.ok) throw new Error(`Failed to fetch image ${idx + 1}`);
                const blob = await response.blob();
                const objectUrl = URL.createObjectURL(blob);

                div.style.backgroundImage = `url('${objectUrl}')`;
                div.classList.remove("anim");
            } catch (error) {
                console.error(`Error fetching image ${idx + 1}:`, error);
            }
        });
    }

    // -------------------------
    // Utility functions for chain-of-thought display and animation
    // -------------------------
    function displayChainOfThought(element, text) {
        element.textContent = text;
    }

    // animateText now takes a callback that runs after the animation completes
    function animateText(element, text, callback) {
        element.textContent = "";
        let index = 0;
        function type() {
            if (index < text.length) {
                element.textContent += text.charAt(index);
                index++;
                requestAnimationFrame(type);
            } else if (typeof callback === "function") {
                callback();
            }
        }
        type();
    }
});
