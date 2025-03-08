document.addEventListener("DOMContentLoaded", () => {
    const scoreElement = document.getElementById("score");
    const strengthsElement = document.getElementById("strengths");
    const weaknessesElement = document.getElementById("weaknesses");
    const retryButton = document.getElementById("retry_button");
    
    // Simulating fetched score and analysis
    const score = Math.floor(Math.random() * 101); // Random score between 0-100
    const strengths = ["Good communication", "Clear answers", "Confidence"];
    const weaknesses = ["Hesitation", "Need more examples", "Technical depth"];
    
    // Display the score
    scoreElement.textContent = score;
    
    // Determine strengths and weaknesses based on score
    if (score > 70) {
        strengthsElement.textContent = strengths.join(", ");
        weaknessesElement.textContent = "Minimal weaknesses";
    } else if (score > 40) {
        strengthsElement.textContent = strengths.slice(0, 2).join(", ");
        weaknessesElement.textContent = weaknesses.slice(0, 2).join(", ");
    } else {
        strengthsElement.textContent = strengths[0];
        weaknessesElement.textContent = weaknesses.join(", ");
    }
    
    // Retry button redirects to the interview page
    retryButton.addEventListener("click", () => {
        window.location.href = "interview.html";
    });
});
