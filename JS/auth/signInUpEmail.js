

const regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
var emailSignUp = document.getElementById("signupEmail").value;
var passwordSignUp = document.getElementById("signupPsswd").value;
var ConfpasswordSignUp = document.getElementById("signupPsswdConf").value;
var userSignUp = document.getElementById("signupName").value;

var emailSignIn = document.getElementById("signInEmail").value.toLowerCase().trim();
var usernameSignIn = document.getElementById("signInName").value.toLowerCase().trim();
var passwordSignIn = document.getElementById("signInPassword").value.toLowerCase().trim();



document.getElementById("signupBtnDB").addEventListener("click", () => { //when the signup button is clicked
    emailSignUp = document.getElementById("signupEmail").value.trim();
    passwordSignUp = document.getElementById("signupPsswd").value.trim();
    ConfpasswordSignUp = document.getElementById("signupPsswdConf").value.trim();
    userSignUp = document.getElementById("signupName").value.trim();

    if(emailSignUp == "" || passwordSignUp == "" || ConfpasswordSignUp == "" || userSignUp == "")
    {
        RegisterError("Please Fill All Fields!");
    }
    else if(!regex.test(emailSignUp))
    {
        RegisterError("Invalid Email!");
    }
    else if(passwordSignUp.length < 6)
    {
        RegisterError("Password Must be 6 Characters Long!");
    }
    else if(passwordSignUp != ConfpasswordSignUp)
    {
        RegisterError("Password Doesn't Match!");
    }
    else
    {
        registerUser();
    }
});

document.getElementById("signinBtnDB").addEventListener("click", () => { //when the signin button is clicked
    
    emailSignIn = document.getElementById("signInEmail").value.toLowerCase().trim();
    usernameSignIn = document.getElementById("signInName").value.toLowerCase().trim();
    passwordSignIn = document.getElementById("signInPassword").value.toLowerCase().trim();

    if(emailSignIn == "" || passwordSignIn == "" || usernameSignIn == "")
    {
        LoginError("Please Fill All Fields!");
    }
    else if(!regex.test(emailSignIn))
    {
        LoginError("Invalid Email!");
    }
    else if(passwordSignIn.length < 6)
    {
        LoginError("Password Must be 6 Characters Long!");
    }
    else
    {
        loginUser();
    }
});
function registerUser() {
    emailSignUp = document.getElementById("signupEmail").value;
    passwordSignUp = document.getElementById("signupPsswd").value;
    ConfpasswordSignUp = document.getElementById("signupPsswdConf").value;
    userSignUp = document.getElementById("signupName").value;

    // Disable form interactions during registration
    document.getElementById("form_register").style.pointerEvents = "none";

    // Check if the username already exists in Firestore
    const docRef = db.collection("users").doc(userSignUp.toLowerCase());
    docRef.get().then((doc) => {
        if (doc.exists) {
            notify("Username Already Exists!");
            document.getElementById("form_register").style.pointerEvents = "all"; // Re-enable form
            return; // Exit the function if username exists
        }

        // Create user with Firebase Authentication
        firebase.auth().createUserWithEmailAndPassword(emailSignUp, passwordSignUp)
            .then((userCredential) => {
                const user = userCredential.user; // Get the authenticated user

                // Prepare user data for Firestore
                const userData = {
                    username: userSignUp.toLowerCase(),
                    email: emailSignUp,
                    uid: user.uid,
                    displayName: userSignUp,
                    dateCreated: new Date().toLocaleDateString(),
                    isDev: "NotDev",
                    provider: "Firebase",
                    plan: "lix",
                    coins: 1000000,
                    user_logo: "https://firebasestorage.googleapis.com/v0/b/elixpoai.appspot.com/o/officialDisplayImages%2FCoverPageSlidingImages%2F18_18_11zon.png?alt=media&token=2ae8d56e-6a51-4c1b-bfb1-7f291abfd655",
                    password: passwordSignUp
                };

                // Save user data to Firestore
                return db.collection("users").doc(userSignUp.toLowerCase()).set(userData);
            })
            .then(() => {
                // Success: User created and data saved to Firestore
                notify("Account Created Successfully!");
                localStorage.setItem("ElixpoAIUser", userSignUp.toLowerCase());

                // Reset the form and switch to the login form
                setTimeout(() => {
                    resetRegisterForm();
                    document.getElementById("form_register").classList.add("hidden");
                    document.getElementById("form_login").classList.remove("hidden");
                    document.getElementById("form_register").style.pointerEvents = "all"; // Re-enable form
                    notify("Please Re Login!");
                }, 2200);
            })
            .catch((error) => {
                // Handle errors
                console.error("Error during registration:", error);
                if (error.code === "auth/email-already-in-use") {
                    RegisterError("Email already registered");
                } else {
                    RegisterError("Some Error Occurred!");
                }
                document.getElementById("form_register").style.pointerEvents = "all"; // Re-enable form
            });
    }).catch((error) => {
        console.error("Error checking username:", error);
        RegisterError("Some Error Occurred!");
        document.getElementById("form_register").style.pointerEvents = "all"; // Re-enable form
    });
}

function loginUser() {
    emailSignIn = document.getElementById("signInEmail").value.toLowerCase().trim();
    usernameSignIn = document.getElementById("signInName").value.toLowerCase().trim();
    passwordSignIn = document.getElementById("signInPassword").value.toLowerCase().trim();

    // Flash tiles for visual feedback
    tileFlash();

    // Reference to the user document in Firestore
    const docRef = db.collection("users").doc(usernameSignIn.toLowerCase());

    docRef.get().then((doc) => {
        if (doc.exists) {
            console.log("Firestore Data:", doc.data()); // Debugging: Log Firestore data
            console.log("Input Data:", { usernameSignIn, emailSignIn, passwordSignIn }); // Debugging: Log input data

            // Check if the credentials match
            if (
                doc.data().username === usernameSignIn &&
                doc.data().email === emailSignIn &&
                doc.data().password === passwordSignIn
            ) {
                notify("Login Successful!");

                // Save username to localStorage
                localStorage.setItem("ElixpoAIUser", usernameSignIn);
                localStorage.setItem("guestLogin", "false");

                // Redirect after a delay
                setTimeout(() => {
                    const urlParams = new URLSearchParams(window.location.search);
                    if (urlParams.get('cmp')) {
                        console.log("Campaign Parameter:", urlParams.get('cmp')); // Debugging: Log campaign parameter
                        redirectTo(`blogs/elixpo_art/?cmp=${urlParams.get('cmp')}`);
                    } else {
                        window.location.href=`/src/create/index.html`
                    }
                }, 2000);
            } else {
                // Credentials do not match
                LoginError("Invalid Credentials!");
            }
        } else {
            // User document does not exist
            LoginError("User Not Found!");
        }
    }).catch((error) => {
        // Handle Firestore read errors
        console.error("Error fetching user data:", error);
        LoginError("An Error Occurred. Please Try Again.");
    });
}





function RegisterError(err) {
    document.getElementById("RegisterError").innerText = err;
    setTimeout(() => {
        document.getElementById("RegisterError").innerText = "";
    }, 3500);
}


function LoginError(err) {
    document.getElementById("LoginError").innerText = err;
    setTimeout(() => {
        document.getElementById("LoginError").innerText = "";
    }, 3500);
}


function resetRegisterForm() {
    document.getElementById("signupEmail").value = "";
    document.getElementById("signupPsswd").value = "";
    document.getElementById("signupPsswdConf").value = "";
    document.getElementById("signupName").value = "";
}


function tileFlash() {

    const tiles = document.querySelectorAll('.tile');
    const baseDelay = 90; // Base delay in milliseconds
    const delayIncrement = 50; // Increment delay for each subsequent tile

    tiles.forEach((tile, index) => {
        const delay = baseDelay + (index * delayIncrement);
        setTimeout(() => {
            tile.classList.add('flash');
        }, delay);
    });

}

