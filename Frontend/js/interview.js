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
    alert("Processing uploaded PDFs...");
});

document.getElementById("mic_button").addEventListener("click", async () => {
    if (micActive) {
        stopListening();
    } else {
        startListening();
    }
});

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
