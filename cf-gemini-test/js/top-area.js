// js/top-area.js

export function initializeTopArea() {
    const apiKeyInput = document.getElementById('api-key-input');
    const saveApiKeyButton = document.getElementById('save-api-key');


    // Load API key from localStorage on page load (Temporary, replace with IndexedDB)
    const savedApiKey = localStorage.getItem('apiKey');
    if (savedApiKey) {
        apiKeyInput.value = savedApiKey;
        saveApiKeyButton.textContent = '修改';
        apiKeyInput.style.display = 'none'; // Hide input if key is saved
    } else {
        saveApiKeyButton.textContent = '保存';
        apiKeyInput.style.display = ''; // Ensure input is visible if no key is saved
    }

    saveApiKeyButton.addEventListener('click', () => {
        if (saveApiKeyButton.textContent === '保存') {
            const apiKey = apiKeyInput.value;
            if (apiKey) {
                console.log('API Key saved:', apiKey);
                localStorage.setItem('apiKey', apiKey); // Temporary save to localStorage
                saveApiKeyButton.textContent = '修改';
                apiKeyInput.style.display = 'none'; // Hide input after saving
            } else {
                alert('Please enter an API Key.');
            }
        } else { // Current text is '修改'
            saveApiKeyButton.textContent = '保存';
            apiKeyInput.value = localStorage.getItem('apiKey'); // Pre-fill the input with the saved key
            apiKeyInput.style.display = ''; // Show input when modifying
        }
    });



    // TODO: Implement IndexedDB saving and loading
}