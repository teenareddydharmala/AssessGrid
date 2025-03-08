import { db } from "../../firebase/firebase.js";
import { setDoc, doc, getDoc, updateDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

const params = new URLSearchParams(window.location.search);
const userID = params.get("userID");


async function fetchQuestions(interviewID) {
    const interviewRef = doc(db, "interviews", interviewID);
    const interviewSnap = await getDoc(interviewRef);

    if (!interviewSnap.exists()) {
        console.error("No interview found with ID:", interviewID);
        return;
    }

    const interviewData = interviewSnap.data();
    const questionIDs = interviewData.questions || [];

    if (questionIDs.length === 0) {
        console.warn("No questions found for this interview.");
        return;
    }

    let questionTexts = [];

    for (const quesID of questionIDs) {
        const quesRef = doc(db, "questions", quesID);
        const quesSnap = await getDoc(quesRef);

        if (quesSnap.exists()) {
            const questionData = quesSnap.data();
            questionTexts.push(questionData.question);
        }
    }

    document.getElementById("aiQuestions").value = questionTexts.join("\n");
}

document.getElementById('fileInput').addEventListener('change', function(event) {
    const fileList = document.getElementById('fileList');
    
    Array.from(event.target.files).forEach(file => {
        if (file.type === "application/pdf") {
            const li = document.createElement('li');
            li.textContent = file.name;
            
            const removeBtn = document.createElement('button');
            removeBtn.textContent = "❌";
            removeBtn.style.background = "transparent";
            removeBtn.style.border = "none";
            removeBtn.style.color = "white";
            removeBtn.style.cursor = "pointer";
            removeBtn.onclick = () => li.remove();
            
            li.appendChild(removeBtn);
            fileList.appendChild(li);
        } else {
            alert("Only PDF files are allowed.");
        }
    });
});

document.getElementById("upload_button").addEventListener("click", async () => {
    const fileInput = document.getElementById("fileInput");
    const files = fileInput.files;

    if (files.length === 0) {
        alert("Please select at least one PDF file to upload.");
        return;
    }

    const interviewID = generateUniqueID();
    
    try {
        await setDoc(doc(db, "interviews", interviewID), {
            userID: userID,
            files: [],
            questions: [],
            resultID: null
        });

        for (const file of files) {
            if (file.type === "application/pdf") {
                await uploadFile(file, interviewID);
            } else {
                console.warn(`Skipping non-PDF file: ${file.name}`);
            }
        }

        const userRef = doc(db, "users", userID);
        await updateDoc(userRef, {
            interviews: arrayUnion(interviewID)
        });

        document.getElementById('fileList').innerHTML = '';
        fileInput.value = '';
        
    } catch (error) {
        alert("Error: " + error.message);
    }   


    // call add_questions(interviewId) in python here
    await callGenerateQuestionsAPI(interviewID);

    await fetchQuestions(interviewID);
});

async function callGenerateQuestionsAPI(interviewID) {
    try {
        console.log("Calling API with interview ID:", interviewID);
        const response = await fetch("http://127.0.0.1:5000/add_questions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ interview_id: interviewID })
        });

        console.log("API response status:", response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error("API Error Response:", errorText);
            return false;
        }

        const result = await response.json();
        console.log("API response:", result);
        
        if (result.message) {
            console.log("Questions added successfully!");
            return true;
        } else {
            console.error("Error generating questions:", result.error);
            return false;
        }
    } catch (error) {
        console.error("API call failed:", error);
        return false;
    }
}

async function uploadFile(file, interviewID) {
    const fileID = generateUniqueID();
    
    try {
        const processedText = await processFile(file);
        await setDoc(doc(db, "files", fileID), {
            name: file.name,
            data: processedText
        });
        
        const interviewRef = doc(db, "interviews", interviewID);
        await updateDoc(interviewRef, {
            files: arrayUnion(fileID)
        });
        
        console.log(`File ${file.name} uploaded with ID: ${fileID}`);
        return fileID;
        
    } catch (error) {
        console.error(`Error uploading file ${file.name}:`, error);
        throw error;
    }
}


async function processFile(file) {
    return new Promise((resolve, reject) => {
      
        const reader = new FileReader();
        reader.onload = async function(event) {
            try {
                
                if (typeof pdfjsLib === 'undefined') {
                    console.warn("PDF.js is not loaded");
                    resolve(null);
                    return;
                }
                
                const arrayBuffer = event.target.result;
                const pdf = await pdfjsLib.getDocument({data: arrayBuffer}).promise;
                let fullText = "";
                
                for (let i = 1; i <= pdf.numPages; i++) {
                    try {
                        const page = await pdf.getPage(i);
                        const textContent = await page.getTextContent();
                        const pageText = textContent.items.map(item => item.str).join(' ');
                        fullText += pageText + "\n\n";
                    } catch (pageError) {
                        console.error(`Error extracting text from page ${i}:`, pageError);
                    }
                }
                
                if (fullText.trim().length > 0) {
                    resolve(fullText.trim());
                } else {
                    console.warn("No text was extracted from the PDF");
                    resolve(null);
                }
            } catch (error) {
                console.error("Error processing PDF:", error);
                resolve(null);
            }
        };
        
        reader.onerror = function(event) {
            console.error(`Failed to read file: ${file.name}`);
            resolve(null); 
        };
        
        reader.readAsArrayBuffer(file);
    });
}

function generateUniqueID() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let uniqueID = '';
    for (let i = 0; i < 6; i++) {
        uniqueID += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    console.log(uniqueID);
    return uniqueID;
}

