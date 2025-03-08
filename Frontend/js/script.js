import { db } from "../../firebase/firebase.js";
import { setDoc, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";


document.getElementById("registerBtn").addEventListener("click", async () => {
    alert("teeeeenaaaaaaa");
    const userId = document.getElementById("registerUser").value;
    const password = document.getElementById("registerPassword").value;

    if (!userId || !password) {
        alert("Please enter both UserId and Password.");
        return;
    }

    try {
        
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            alert("User already exists!");
            return;
        }

        await setDoc(userRef, { password: password, interviews: [] });

        alert("User registered successfully!");
    } catch (error) {
        alert("Error: " + error.message);
    }
});

document.getElementById("loginBtn").addEventListener("click", async () => {
    const userId = document.getElementById("loginUser").value;
    const password = document.getElementById("loginPassword").value;

    if (!userId || !password) {
        alert("Please enter both UserId and Password.");
        return;
    }

    try {
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            alert("User not found!");
            return;
        }

        // Check password
        const userData = userSnap.data();
        if (userData.password === password) {
            alert("Login Successful!");
            console.log("User logged in:", userId);
        } else {
            alert("Incorrect password!");
        }
    } catch (error) {
        alert("Error: " + error.message);
    }
});
