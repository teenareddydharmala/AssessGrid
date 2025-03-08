import { db } from "../../firebase/firebase.js";
import { setDoc, doc, getDoc, updateDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

const params = new URLSearchParams(window.location.search);
const userID = params.get("userID");

let recognition;
let timerInterval;
let seconds = 0;
let micActive = false;

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
});

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


document.getElementById("mic_button").addEventListener("click", async () => {
    if (micActive) {
        stopListening();
    } else {
        startListening();
    }
});

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

function startListening() {
    if (!('webkitSpeechRecognition' in window)) {
        alert("Your browser does not support speech recognition.");
        return;
    }
    
    if (!timerInterval) {
        startTimer();
    }

    micActive = true;
    recognition = new webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = function() {
        console.log("Voice recognition started");
    };
    
    recognition.onresult = function(event) {
        const transcript = event.results[0][0].transcript;
        document.getElementById('voiceOutput').value = transcript;
    };
    
    recognition.onerror = function(event) {
        console.error("Error occurred in recognition: ", event.error);
    };
    
    recognition.start();
}

function stopListening() {
    if (recognition) {
        recognition.stop();
    }
    stopTimer();
    micActive = false;
}

function startTimer() {
    seconds = 0;
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        seconds++;
        let minutes = Math.floor(seconds / 60);
        let sec = seconds % 60;
        document.getElementById('timer').textContent = 
            (minutes < 10 ? '0' : '') + minutes + ":" + (sec < 10 ? '0' : '') + sec;
    }, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
}
