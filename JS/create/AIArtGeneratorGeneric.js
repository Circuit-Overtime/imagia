let privateImage = false;
let enhanceSwitch = false;
let sampleAIPrompts = [
  "A breathtaking sunset casting golden hues over a futuristic cyberpunk city skyline, neon lights flickering in the twilight.",
  "A sprawling metropolis in the year 3000, where gravity-defying highways intertwine between glowing skyscrapers.",
  "A tranquil valley with a crystal-clear river reflecting the vibrant colors of a surreal, dreamlike sky.",
  "An ancient dragon soaring above a medieval kingdom, its scales shimmering in the sunlight as knights prepare for battle.",
  "A mystical forest where bioluminescent mushrooms illuminate the paths, and enchanted creatures whisper secrets in the wind.",
  "A neon-drenched cyberpunk city at midnight, filled with holographic advertisements, rain-slicked streets, and shadowy figures in trench coats.",
  "A post-apocalyptic wasteland where the last remnants of humanity survive amidst towering rusted ruins and radioactive storms.",
  "A steampunk world with colossal airships sailing through copper-colored skies, gears and steam hissing as they hover above floating cities.",
  "A gravity-defying world of floating islands covered in lush greenery, connected by glowing energy bridges.",
  "A massive battle between towering mechs and alien creatures in a war-torn futuristic landscape, explosions lighting up the battlefield.",
  "A lush, alien jungle with bioluminescent plants, vibrant creatures with iridescent wings, and floating jellyfish-like organisms drifting in the air.",
  "An ancient temple hidden deep in an enchanted jungle, filled with mythical creatures guarding its untold secrets.",
  "A wizard’s tower surrounded by swirling magical auras, where arcane spells crackle in the air and glowing runes hover in mid-space.",
  "A futuristic utopia where artificial intelligence governs society in perfect harmony, with AI-driven architecture morphing at will.",
  "An ancient civilization lost beneath the ocean, where mermaids swim between crumbling ruins illuminated by strange glowing corals.",
  "A high-speed aerial race through a city of floating vehicles, where gravity-defying racers weave through impossible loops and tunnels.",
  "A mind-bending journey through time, where past and future collide in a surreal, ever-shifting landscape of history’s greatest moments.",
  "A portal to a parallel universe where physics defy logic, colors bend reality, and landscapes change with every step.",
  "A team of superheroes soaring above a dystopian city, their capes trailing streaks of energy as they battle a cosmic threat.",
  "A secret lair of the world’s most notorious supervillain, filled with high-tech gadgets, doomsday devices, and an eerie sense of foreboding.",
  "A galactic voyage through the cosmos, where astronauts explore ancient alien megastructures drifting in the depths of space.",
  "A small town caught in an alien invasion, with eerie spacecraft hovering above and beams of light abducting unsuspecting citizens.",
  "A mysterious city trapped in an endless time loop, where every day resets and only one person remembers the past events.",
  "A fully immersive virtual reality world where players can reshape reality at will, from floating castles to pixelated dreamscapes.",
  "An AI-driven megacity where sentient robots coexist with humans, but an underground resistance fights for control over the mainframe.",
  "A bio-engineered future where humanity has spliced their DNA with animals, creating powerful hybrid species with incredible abilities.",
  "A cybernetic revolution where people merge with machines, transforming into sleek, high-tech cyborgs with superhuman capabilities.",
  "A sprawling factory where sentient robots are mass-produced, but one defective unit gains self-awareness and begins a rebellion.",
  "A secret underground laboratory where nanotechnology has evolved beyond human control, consuming everything in its path.",
  "A quantum physics experiment gone wrong, creating rifts in reality where past, present, and future exist simultaneously."
];

document.getElementById("privateBtn").addEventListener("click", function() 
{
  privateImage = !privateImage;
  if (privateImage) {
    document.getElementById("privateBtn").classList.add("selected");
  }
  else 
  {
    document.getElementById("privateBtn").classList.remove("selected");
  }
});
document.getElementById("pimpPrompt").addEventListener("click", function()
{
  enhanceSwitch = !enhanceSwitch;
  if (enhanceSwitch) {
    document.getElementById("pimpPrompt").classList.add("selected");
  }
  else 
  {
    document.getElementById("pimpPrompt").classList.remove("selected");
  }
});

document.getElementById("promptIdea").addEventListener("click", function() {
  const randomIndex = Math.floor(Math.random() * sampleAIPrompts.length);
  document.getElementById("promptTextInput").value = sampleAIPrompts[randomIndex];
  document.getElementById("promptTextInput").style.height = "auto";
});

const promptTextInput = document.getElementById("promptTextInput");
const combinations = [
    { configuration: 1, roundness: 1 },
    { configuration: 1, roundness: 2 },
    { configuration: 1, roundness: 4 },
    { configuration: 2, roundness: 2 },
    { configuration: 2, roundness: 3 },
  
  ];
  let prev = 0; //counts iteratiuons for the boxes
  const randomTile = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);

document.getElementById('enhanceSwitch').addEventListener('change', function() {
    if (this.checked) {
        document.getElementById("textForAIPrompt").innerHTML = "AI Prompt Enhancement is Active (Slower)";
    } else {
        document.getElementById("textForAIPrompt").innerHTML = "AI Prompt Enhancement is In-active (Faster)";
    }
});


document.getElementById('privateSwitch').addEventListener('change', function() {
    if (this.checked) {
        document.getElementById("privatePublicResultDesc").innerText = "The Image you Generate will be Displayed in the Server Gallery (Public)";
    } else {
        document.getElementById("privatePublicResultDesc").innerText = "The Image you Generate will not be Displayed in the Server Gallery (Private)";
    }
});


document.addEventListener("DOMContentLoaded", function () {
  const textarea = document.querySelector(".samplePrompt .promptTextInput");

  textarea.addEventListener("input", function () {
      textarea.style.height = "auto"; // Reset to auto first
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + "px"; // Grow down up to max-height
  });
});


// promptTextInput.addEventListener("input", function() {
//     this.style.height = "auto";
//     this.style.height = (this.scrollHeight) + "px";
//     document.getElementById("samplePrompt").style.height = (this.scrollHeight + 12) + "px";
    
  // });

  // setInterval(() => {
  //     if (promptTextInput.value.length == 0)
  //         {
  //             promptTextInput.style.height = "45px";
  //             document.getElementById("samplePrompt").style.height = "60px";
  //         }
  // }, 1200);



  const wrapper = document.getElementById("wrapper");

  document.getElementById("loginButton").addEventListener("click", function() {
    redirectTo("auth");
  });
  document.getElementById("navBarDocs").addEventListener("click", function() {
    redirectTo("blog");
  });

  document.getElementById("navBarGitHub").addEventListener("click", () => {
    location.href = "https://github.com/Circuit-Overtime/imagia"
  })

const uniqueRand = (min, max, prev) => {
  let next = prev;
  
  while(prev === next) next = randomTile(min, max);
  
  return next;
}



setInterval(() => {
  const index = uniqueRand(0, combinations.length - 1, prev),
        combination = combinations[index];
  
  wrapper.dataset.configuration = combination.configuration;
  wrapper.dataset.roundness = combination.roundness;
  
  prev = index;
},1000);



function scaleContainer() {
  if((!window.matchMedia("(max-width: 1080px) and (max-height: 1440px)").matches))
  {

  
    const container = document.querySelector('.container');
    const containerWidth = 1519;
    const containerHeight = 730;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    // Calculate scale factors for both width and height
    const scaleWidth = windowWidth / containerWidth;
    const scaleHeight = windowHeight / containerHeight;

    // Use the smaller scale factor to ensure the container fits in the viewport
    const scale = Math.min(scaleWidth, scaleHeight);

    // Apply the scale transform
    container.style.transform = `translate(-50%, -50%) scale(${scale})`;
  }
}





document.getElementById("userLogo").addEventListener("click", function() {
  if(document.getElementById("loginNavBar").classList.contains("hidden"))
  {
    document.getElementById("loginNavBar").classList.remove("hidden");
    document.getElementById("userLogo").style.left = "5%";
    document.getElementById("userLogo").style.zIndex = "100";
  }
  else 
  {
    document.getElementById("loginNavBar").classList.add("hidden");
    document.getElementById("userLogo").style.left = "95%";
    document.getElementById("userLogo").style.zIndex = "10";
  }
    
});


window.addEventListener('resize', scaleContainer);
window.addEventListener('load', scaleContainer);
