let availableModels = [];
let quickConvertEnabled = false;

function toggleDarkMode() {
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('darkMode', document.documentElement.classList.contains('dark'));
}

if (localStorage.getItem('darkMode') === 'true') {
    document.documentElement.classList.add('dark');
} else if (localStorage.getItem('darkMode') === 'false') {
    document.documentElement.classList.remove('dark');
}

function toggleQuickConvert() {
    quickConvertEnabled = document.getElementById('quickConvertToggle').checked;
    localStorage.setItem('quickConvert', quickConvertEnabled);
}

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    const quickConvertToggle = document.getElementById('quickConvertToggle');
    const savedQuickConvert = localStorage.getItem('quickConvert') === 'true';
    quickConvertToggle.checked = savedQuickConvert;
    quickConvertEnabled = savedQuickConvert;

    // Fetch models and populate dropdown
    fetch('/api/models')
        .then(response => response.json())
        .then(models => {
            availableModels = models;
            const modelSelect = document.getElementById('modelSelect');
            modelSelect.innerHTML = '';

            models.forEach(model => {
                const option = document.createElement('option');
                option.value = model.id;
                option.textContent = model.name;
                modelSelect.appendChild(option);
            });

            // Set default selection
            const defaultModel = "u2net";
            if (models.some(m => m.id === defaultModel)) {
                modelSelect.value = defaultModel;
            }
            updateModelDescription();
        })
        .catch(error => {
            console.error('Error fetching models:', error);
            const descriptionElement = document.getElementById('modelDescription');
            descriptionElement.textContent = 'Error: Could not load model list from the server.';
            descriptionElement.classList.add('bg-red-50', 'dark:bg-red-900/20', 'border-red-200', 'dark:border-red-800', 'text-red-800', 'dark:text-red-200');
        });
});

function updateModelDescription() {
    const select = document.getElementById('modelSelect');
    const descriptionElement = document.getElementById('modelDescription');
    const selectedModel = availableModels.find(m => m.id === select.value);
    
    if (selectedModel) {
        descriptionElement.textContent = selectedModel.description;
    } else {
        descriptionElement.textContent = 'No description available for this model.';
    }
}

function dragOverHandler(e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.add('border-blue-500');
}

function dropHandler(e) {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        // Create a new FileList-like object
        const fileInput = document.getElementById('fileInput');
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(files[0]);
        fileInput.files = dataTransfer.files;
        
        handleImage(files[0]);
    }
    e.currentTarget.classList.remove('border-blue-500');
}

document.getElementById('fileInput').addEventListener('change', function(e) {
    if (this.files && this.files[0]) {
        handleImage(this.files[0]);
    }
});

function resetAll() {
    const fileInput = document.getElementById('fileInput');
    fileInput.value = '';
    
    const previewContainer = document.getElementById('previewContainer');
    const previewImage = document.getElementById('previewImage');
    const uploadPrompt = document.getElementById('uploadPrompt');
    
    previewContainer.classList.add('hidden');
    previewImage.src = '';
    uploadPrompt.classList.remove('hidden');
    
    const outputImage = document.getElementById('outputImage');
    const downloadButton = document.getElementById('downloadButton');
    const copyButton = document.getElementById('copyButton');
    
    outputImage.classList.add('hidden');
    outputImage.src = '';
    downloadButton.classList.add('hidden');
    copyButton.classList.add('hidden');
    
    const processButton = document.getElementById('processButton');
    processButton.disabled = true; // Button is disabled until an image is loaded
}

function handleImage(file) {
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
        alert('Please upload a valid image file (PNG, JPG, JPEG, or WebP)');
        return;
    }

    if (file.size > 10 * 1024 * 1024) {
        alert('File size should not exceed 10MB');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const previewContainer = document.getElementById('previewContainer');
        const previewImage = document.getElementById('previewImage');
        const uploadPrompt = document.getElementById('uploadPrompt');
        const processButton = document.getElementById('processButton');
        
        previewImage.src = e.target.result;
        previewContainer.classList.remove('hidden');
        uploadPrompt.classList.add('hidden');
        processButton.disabled = false;
        
        document.getElementById('outputImage').classList.add('hidden');
        document.getElementById('downloadButton').classList.add('hidden');
        document.getElementById('copyButton').classList.add('hidden');

        if (quickConvertEnabled) {
            processImage();
        }
    }
    reader.readAsDataURL(file);
}

async function processImage() {
    const fileInput = document.getElementById('fileInput');
    const model = document.getElementById('modelSelect').value;
    const loadingIndicator = document.getElementById('loadingIndicator');
    const processButton = document.getElementById('processButton');
    
    if (!fileInput.files[0]) {
        alert('Please select an image first');
        return;
    }

    // Show loading state
    loadingIndicator.classList.remove('hidden');
    processButton.disabled = true;

    const formData = new FormData();
    formData.append('image', fileInput.files[0]);
    formData.append('model', model);

    try {
        const response = await fetch('/process', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Processing failed');
        }
        
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const outputImg = document.getElementById('outputImage');
        outputImg.src = url;
        outputImg.classList.remove('hidden');
        
        document.getElementById('downloadButton').classList.remove('hidden');
        document.getElementById('copyButton').classList.remove('hidden');
        
    } catch (error) {
        alert(error.message);
    } finally {
        loadingIndicator.classList.add('hidden');
        processButton.disabled = false;
    }
}

function downloadResult() {
    const outputImage = document.getElementById('outputImage');
    if (outputImage.src) {
        const link = document.createElement('a');
        link.href = outputImage.src;
        link.download = 'removed_background.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

async function copyResult() {
    const outputImage = document.getElementById('outputImage');
    if (!outputImage.src) return;

    const copyButton = document.getElementById('copyButton');
    const originalButtonText = copyButton.querySelector('span').textContent;

    try {
        const blob = await fetch(outputImage.src).then(res => res.blob());
        await navigator.clipboard.write([
            new ClipboardItem({ [blob.type]: blob })
        ]);

        // Visual feedback
        copyButton.querySelector('span').textContent = 'Copied!';
        setTimeout(() => {
            copyButton.querySelector('span').textContent = originalButtonText;
        }, 2000);

    } catch (error) {
        console.error('Copy failed:', error);
        alert('Could not copy image to clipboard. Your browser may not support this feature.');
    }
}

// Add clipboard paste event listener
document.addEventListener('paste', (event) => {
    const items = event.clipboardData?.items;
    if (!items) return;

    const imageItem = Array.from(items).find(item => item.type.startsWith('image/'));
    if (!imageItem) return;

    const blob = imageItem.getAsFile();
    if (!blob) return;

    const file = new File([blob], `pasted-image-${Date.now()}.png`, { type: 'image/png' });

    const fileInput = document.getElementById('fileInput');
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    fileInput.files = dataTransfer.files;

    handleImage(file);
});
