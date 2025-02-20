// Model descriptions
const modelDescriptions = {
    'u2net': 'Default model, good for general purpose background removal. Balanced between performance and quality.',
    'isnet-anime': 'Specialized model for anime and cartoon images. Provides better results for artistic and illustrated content.',
    'isnet-general-use': 'Alternative general-purpose model. May perform better than u2net in some cases.',
    'u2net_human_seg': 'Specialized in human segmentation. Best for portraits and human-focused images.',
    'birefnet-general': 'General-purpose model with improved edge detection. Good for complex objects.',
    'birefnet-massive': 'High-capacity model for challenging cases. Best quality but slower processing.',
    'birefnet-portrait': 'Optimized for portrait photos. Excellent for professional headshots and full-body portraits.',
    'u2net_cloth_seg': 'Specialized in clothing and fashion items. Ideal for e-commerce and fashion photography.',
    'birefnet-dis': 'Specialized in dichotomous image segmentation. Excellent for separating foreground from background in binary scenarios.',
    'birefnet-hrsod': 'Optimized for high-resolution salient object detection. Best for detailed images where precision is crucial.',
    'birefnet-cod': 'Designed for concealed object detection. Effective at identifying and segmenting partially hidden or camouflaged objects.'
};

// Quick convert state
let quickConvertEnabled = false;

// Dark mode toggle
function toggleDarkMode() {
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('darkMode', document.documentElement.classList.contains('dark'));
}

// Initialize dark mode from localStorage
if (localStorage.getItem('darkMode') === 'true') {
    document.documentElement.classList.add('dark');
} else if (localStorage.getItem('darkMode') === 'false') {
    document.documentElement.classList.remove('dark');
}

// Toggle quick convert
function toggleQuickConvert() {
    quickConvertEnabled = document.getElementById('quickConvertToggle').checked;
    const processButton = document.getElementById('processButton');
    processButton.disabled = quickConvertEnabled;
    
    // Save preference
    localStorage.setItem('quickConvert', quickConvertEnabled);
}

// Initialize quick convert from localStorage
document.addEventListener('DOMContentLoaded', () => {
    const quickConvertToggle = document.getElementById('quickConvertToggle');
    const savedQuickConvert = localStorage.getItem('quickConvert') === 'true';
    quickConvertToggle.checked = savedQuickConvert;
    quickConvertEnabled = savedQuickConvert;
    const processButton = document.getElementById('processButton');
    processButton.disabled = savedQuickConvert;
    
    // Initialize model description
    updateModelDescription();
});

// Update model description
function updateModelDescription() {
    const select = document.getElementById('modelSelect');
    const descriptionElement = document.getElementById('modelDescription');
    const description = modelDescriptions[select.value] || 'No description available for this model.';
    descriptionElement.textContent = description;
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
    // Reset file input
    const fileInput = document.getElementById('fileInput');
    fileInput.value = '';
    
    // Reset preview
    const previewContainer = document.getElementById('previewContainer');
    const previewImage = document.getElementById('previewImage');
    const uploadPrompt = document.getElementById('uploadPrompt');
    
    previewContainer.classList.add('hidden');
    previewImage.src = '';
    uploadPrompt.classList.remove('hidden');
    
    // Reset output
    const outputImage = document.getElementById('outputImage');
    const downloadButton = document.getElementById('downloadButton');
    
    outputImage.classList.add('hidden');
    outputImage.src = '';
    downloadButton.classList.add('hidden');
    
    // Reset process button
    const processButton = document.getElementById('processButton');
    processButton.disabled = quickConvertEnabled;
}

function handleImage(file) {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
        alert('Please upload a valid image file (PNG, JPG, JPEG, or WebP)');
        return;
    }

    // Validate file size (max 10MB)
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
        processButton.disabled = quickConvertEnabled;
        
        // Hide previous output and download button
        document.getElementById('outputImage').classList.add('hidden');
        document.getElementById('downloadButton').classList.add('hidden');

        // If quick convert is enabled, process immediately
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
        
        // Show download button
        document.getElementById('downloadButton').classList.remove('hidden');
        
    } catch (error) {
        alert(error.message);
    } finally {
        // Hide loading state
        loadingIndicator.classList.add('hidden');
        processButton.disabled = quickConvertEnabled;
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

// Add clipboard paste event listener
document.addEventListener('paste', (event) => {
    const items = event.clipboardData?.items;
    if (!items) return;

    // Find the first image item in the clipboard
    const imageItem = Array.from(items).find(item => item.type.startsWith('image/'));
    if (!imageItem) return;

    // Get the image as a blob
    const blob = imageItem.getAsFile();
    if (!blob) return;

    // Create a File object from the blob
    const file = new File([blob], `pasted-image-${Date.now()}.png`, { type: 'image/png' });

    // Update file input
    const fileInput = document.getElementById('fileInput');
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    fileInput.files = dataTransfer.files;

    // Handle the image
    handleImage(file);
});