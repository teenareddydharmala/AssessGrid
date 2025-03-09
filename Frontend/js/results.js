import { db } from "../../firebase/firebase.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

const params = new URLSearchParams(window.location.search);
const interviewID = params.get("interviewID");

document.addEventListener("DOMContentLoaded", async () => {
    const scoreElement = document.getElementById("score");
    const strengthsElement = document.getElementById("strengths");
    const weaknessesElement = document.getElementById("weaknesses");
    const retryButton = document.getElementById("retry_button");

    try {
        const interviewRef = doc(db, "interviews", interviewID);
        const interviewSnap = await getDoc(interviewRef);
        
        if (!interviewSnap.exists()) {
            console.error("Interview not found!");
            return;
        }

        const interviewData = interviewSnap.data();
        const resultID = interviewData.resultID; 
        
        if (!resultID) {
            console.error("No result found for this interview.");
            return;
        }

        const resultRef = doc(db, "results", resultID);
        const resultSnap = await getDoc(resultRef);
        
        if (!resultSnap.exists()) {
            console.error("Result not found!");
            return;
        }

        const resultData = resultSnap.data();

        const score = resultData.score || 0;
        const strengths = resultData.strengths || ["None"];
        const weaknesses = resultData.weaknesses || ["None"];


        scoreElement.textContent = score;
        strengthsElement.textContent = strengths.join(", ");
        weaknessesElement.textContent = weaknesses.join(", ");

    } catch (error) {
        console.error("Error fetching data:", error);
    }

    retryButton.addEventListener("click", () => {
        window.location.href = "interview.html";
    });
});
