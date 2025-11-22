/*
 *   Copyright (c) 2025 
 *   All rights reserved.
 */
// Wait for the DOM to be fully loaded before running the script
document.addEventListener('DOMContentLoaded', () => {
    // PASTE_YOUR_GEMINI_API_KEY_HERE
    const YOUR_GEMINI_API_KEY = "PASTE_YOUR_GEMINI_API_KEY_HERE";
    // ----------------------


    // --- Summarizer Elements ---
    const textInput = document.getElementById('text-to-summarize');
    const summarizeBtn = document.getElementById('summarize-button');
    const loadingSpinner = document.getElementById('loading-spinner');
    const errorBox = document.getElementById('error-message');
    const resultContainer = document.getElementById('result-container');
    const summaryOutput = document.getElementById('summary-output');

    // --- Contact Form Elements ---
    const contactForm = document.getElementById('contact-form');
    const contactButton = document.getElementById('contact-button');
    const contactStatus = document.getElementById('contact-status-message');

    // --- Summarizer Logic ---
    // Check if all summarizer elements exist before adding listener
    if (summarizeBtn && textInput && loadingSpinner && errorBox && resultContainer && summaryOutput) {
        summarizeBtn.addEventListener('click', async () => {
            const text = textInput.value;

            // Check if API key has been added
            if (YOUR_GEMINI_API_KEY === "PASTE_YOUR_GEMINI_API_KEY_HERE") {
                showError("Please open frontend/app.js and paste in your Gemini API key at the top.");
                return;
            }
            // Simple validation
            if (!text.trim()) {
                showError('Please paste some text to summarize.');
                return;
            }

            // --- UI Reset and Loading State ---
            hideError();
            resultContainer.classList.add('hidden');
            loadingSpinner.classList.remove('hidden');
            summarizeBtn.disabled = true;
            // Visually disable button
            summarizeBtn.classList.add('opacity-50', 'cursor-not-allowed');

            try {
                // --- OPTION 1: Call Backend (Currently Commented Out) ---
                // This is the "correct" full-stack way, but your backend isn't running.
                /*
                const API_URL = 'http://localhost:5001';
                const response = await fetch(`${API_URL}/summarize`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: text }),
                });
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
                }
                const data = await response.json();
                const summary = data.summary;
                */

                // --- OPTION 2: Call Gemini API Directly from Frontend ---
                // This is the "extra" API call you asked for.
                // It's insecure for a live website, but works for local testing.
                const summary = await callDirectGeminiApi(text);
                
                // --- Display Results ---
                // We use .textContent to prevent HTML injection
                summaryOutput.textContent = summary; 
                resultContainer.classList.remove('hidden');

            } catch (error) {
                console.error('Summarize error:', error);
                showError(error.message || 'Failed to get summary from Gemini.');
            } finally {
                // --- Reset UI ---
                loadingSpinner.classList.add('hidden');
                summarizeBtn.disabled = false;
                summarizeBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            }
        });
    } else {
        console.warn('One or more summarizer elements are missing. Check your HTML IDs.');
    }

    // --- New Function: Call Gemini API Directly ---
    async function callDirectGeminiApi(textToSummarize) {
        const apiKey = YOUR_GEMINI_API_KEY;
        // Use gemini-2.5-flash-preview-09-2025 model for summarization
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

        const payload = {
            contents: [{
                parts: [{
                    // Updated prompt for better summarization
                    text: `Summarize the following text in a single, concise paragraph:\n\n${textToSummarize}`
                }]
            }]
        };

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorBody = await response.json();
            console.error("Gemini API Error Body:", errorBody);
            throw new Error(`Gemini API error! Status: ${response.status}. ${errorBody.error?.message || ''}`);
        }

        const result = await response.json();
        
        // Safely parse the response
        if (result.candidates && result.candidates.length > 0 &&
            result.candidates[0].content && result.candidates[0].content.parts &&
            result.candidates[0].content.parts.length > 0) {
            return result.candidates[0].content.parts[0].text;
        } else {
            // Handle cases where the response structure is unexpected
            console.error("Unexpected Gemini response:", result);
            throw new Error("Could not parse summary from Gemini response.");
        }
    }

    // --- Contact Form Logic (for Formsubmit) ---
    // Check if all contact form elements exist
    if (contactForm && contactButton && contactStatus) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Stop default form submission

            // --- UI Loading State ---
            contactButton.disabled = true;
            contactButton.classList.add('opacity-50', 'cursor-not-allowed');
            contactButton.textContent = 'Sending...';
            contactStatus.classList.add('hidden'); // Hide previous status

            const formData = new FormData(e.target);
            const action = e.target.action;

            try {
                const response = await fetch(action, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'Accept': 'application/json' // Tells Formsubmit to send a JSON response back
                    }
                });

                const data = await response.json();

                if (data.success === "true" || data.success === true) {
                    // --- Success ---
                    contactForm.reset(); // Clear the form
                    showContactStatus('Message sent successfully!', 'success');
                } else {
                    // Handle Formsubmit errors (e.g., spam filter)
                    throw new Error(data.error || 'Formsubmit reported an error.');
                }

            } catch (error) {
                console.error('Contact form error:', error);
                showContactStatus(error.message, 'error');
            } finally {
                // --- Reset UI ---
                contactButton.disabled = false;
                contactButton.classList.remove('opacity-50', 'cursor-not-allowed');
                contactButton.textContent = 'Send Message';
            }
        });
    } else {
        console.warn('One or more contact form elements are missing. Check your HTML IDs.');
    }

    // --- Helper Functions ---
    function showError(message) {
        // Add check in case errorBox itself is missing
        if (errorBox) {
            // Use .textContent to safely insert error message
            errorBox.textContent = `Error: ${message}`;
            errorBox.classList.remove('hidden');
        } else {
            console.error('Error box not found. Message:', message);
        }
    }

    function hideError() {
        if (errorBox) {
            errorBox.classList.add('hidden');
        }
    }

    // --- Contact Status Helper ---
    function showContactStatus(message, type) {
        // Add check in case contactStatus is missing
        if (contactStatus) {
            contactStatus.textContent = message;
            // Clear all old color classes
            contactStatus.classList.remove('hidden', 'text-green-400', 'text-red-400');
            
            if (type === 'success') {
                contactStatus.classList.add('text-green-400');
            } else {
                contactStatus.classList.add('text-red-400');
            }
        } else {
            console.error('Contact status element not found. Message:', message);
        }
    }
});


