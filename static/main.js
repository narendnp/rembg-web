let availableModels = [];
let quickConvertEnabled = false;
let originalImageUrl = null;
let resultImageUrl = null;
let sliderMode = false;

/* ----------------------------- Dark mode ----------------------------- */
function toggleDarkMode() {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('darkMode', isDark);
    updateThemeIcon(isDark);
}

function updateThemeIcon(isDark) {
    document.getElementById('iconMoon').classList.toggle('hidden', isDark);
    document.getElementById('iconSun').classList.toggle('hidden', !isDark);
}

if (localStorage.getItem('darkMode') === 'true') {
    document.documentElement.classList.add('dark');
} else if (localStorage.getItem('darkMode') === 'false') {
    document.documentElement.classList.remove('dark');
}

/* ----------------------------- Quick convert ----------------------------- */
function toggleQuickConvert() {
    quickConvertEnabled = document.getElementById('quickConvertToggle').checked;
    localStorage.setItem('quickConvert', quickConvertEnabled);
}

/* ----------------------------- Toasts ----------------------------- */
function showToast(message, type = 'info', duration = 4000) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast-enter toast-${type}`;

    const icons = {
        success: '<svg class="h-5 w-5 shrink-0 text-accent dark:text-accent-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>',
        error: '<svg class="h-5 w-5 shrink-0 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4a2 2 0 00-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z"/></svg>',
        info: '<svg class="h-5 w-5 shrink-0 text-ink-muted dark:text-ink-muted-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
    };

    toast.innerHTML = `
        ${icons[type] || icons.info}
        <p class="flex-1 leading-snug">${message}</p>
        <button class="shrink-0 text-ink-muted hover:text-ink dark:text-ink-muted-dark dark:hover:text-ink-dark" aria-label="Dismiss">
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
    `;

    const close = () => {
        toast.style.transition = 'opacity 0.2s, transform 0.2s';
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(1rem)';
        setTimeout(() => toast.remove(), 200);
    };
    toast.querySelector('button').addEventListener('click', close);
    container.appendChild(toast);
    if (duration > 0) setTimeout(close, duration);
}

/* ----------------------------- Init ----------------------------- */
document.addEventListener('DOMContentLoaded', () => {
    updateThemeIcon(document.documentElement.classList.contains('dark'));

    const quickConvertToggle = document.getElementById('quickConvertToggle');
    const savedQuickConvert = localStorage.getItem('quickConvert') === 'true';
    quickConvertToggle.checked = savedQuickConvert;
    quickConvertEnabled = savedQuickConvert;

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

            const defaultModel = 'u2net';
            if (models.some(m => m.id === defaultModel)) {
                modelSelect.value = defaultModel;
            }
            updateModelDescription();
        })
        .catch(error => {
            console.error('Error fetching models:', error);
            const descriptionElement = document.getElementById('modelDescription');
            descriptionElement.textContent = 'Error: Could not load model list from the server.';
            showToast('Could not load model list from the server.', 'error');
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

/* ----------------------------- Drag & drop ----------------------------- */
function dragOverHandler(e) {
    e.preventDefault();
    e.stopPropagation();
    document.getElementById('dropBorder').classList.add('border-accent', 'bg-accent/5', 'dark:border-accent-dark');
}

function dragLeaveHandler(e) {
    e.preventDefault();
    e.stopPropagation();
    document.getElementById('dropBorder').classList.remove('border-accent', 'bg-accent/5', 'dark:border-accent-dark');
}

function dropHandler(e) {
    e.preventDefault();
    e.stopPropagation();
    dragLeaveHandler(e);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        const fileInput = document.getElementById('fileInput');
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(files[0]);
        fileInput.files = dataTransfer.files;
        handleImage(files[0]);
    }
}

document.getElementById('fileInput').addEventListener('change', function (e) {
    if (this.files && this.files[0]) {
        handleImage(this.files[0]);
    }
});

/* ----------------------------- Reset ----------------------------- */
function resetAll() {
    const fileInput = document.getElementById('fileInput');
    fileInput.value = '';

    document.getElementById('previewContainer').classList.add('hidden');
    document.getElementById('previewImage').src = '';
    document.getElementById('uploadPrompt').classList.remove('hidden');

    document.getElementById('outputEmpty').classList.remove('hidden');
    document.getElementById('sliderContainer').classList.add('hidden');
    document.getElementById('downloadButton').classList.add('hidden');
    document.getElementById('copyButton').classList.add('hidden');
    document.getElementById('sliderToggleButton').classList.add('hidden');

    const outputImage = document.getElementById('sliderResult');
    const sliderOriginal = document.getElementById('sliderOriginal');
    outputImage.src = '';
    sliderOriginal.src = '';

    if (originalImageUrl) { URL.revokeObjectURL(originalImageUrl); originalImageUrl = null; }
    if (resultImageUrl) { URL.revokeObjectURL(resultImageUrl); resultImageUrl = null; }

    sliderMode = false;
    document.getElementById('processButton').disabled = true;
}

/* ----------------------------- Handle image ----------------------------- */
function handleImage(file) {
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
        showToast('Please upload a valid image file (PNG, JPG, JPEG, or WebP).', 'error');
        return;
    }
    if (file.size > 10 * 1024 * 1024) {
        showToast('File size should not exceed 10MB.', 'error');
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        document.getElementById('previewImage').src = e.target.result;
        document.getElementById('previewContainer').classList.remove('hidden');
        document.getElementById('uploadPrompt').classList.add('hidden');
        document.getElementById('processButton').disabled = false;

        // Reset output area
        document.getElementById('outputEmpty').classList.remove('hidden');
        document.getElementById('sliderContainer').classList.add('hidden');
        document.getElementById('downloadButton').classList.add('hidden');
        document.getElementById('copyButton').classList.add('hidden');
        document.getElementById('sliderToggleButton').classList.add('hidden');

        if (originalImageUrl) { URL.revokeObjectURL(originalImageUrl); originalImageUrl = null; }
        if (resultImageUrl) { URL.revokeObjectURL(resultImageUrl); resultImageUrl = null; }
        sliderMode = false;

        if (quickConvertEnabled) {
            processImage();
        }
    };
    reader.readAsDataURL(file);
}

/* ----------------------------- Process ----------------------------- */
async function processImage() {
    const fileInput = document.getElementById('fileInput');
    const model = document.getElementById('modelSelect').value;
    const loadingIndicator = document.getElementById('loadingIndicator');
    const processButton = document.getElementById('processButton');
    const processIcon = document.getElementById('processIcon');
    const processSpinner = document.getElementById('processSpinner');

    if (!fileInput.files[0]) {
        showToast('Please select an image first.', 'info');
        return;
    }

    loadingIndicator.classList.remove('hidden');
    processButton.disabled = true;
    processIcon.classList.add('hidden');
    processSpinner.classList.remove('hidden');

    const formData = new FormData();
    formData.append('image', fileInput.files[0]);
    formData.append('model', model);

    try {
        const response = await fetch('/process', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Processing failed');
        }

        const blob = await response.blob();
        if (resultImageUrl) URL.revokeObjectURL(resultImageUrl);
        resultImageUrl = URL.createObjectURL(blob);

        // Store original for slider comparison
        if (!originalImageUrl) {
            originalImageUrl = URL.createObjectURL(fileInput.files[0]);
        }

        renderResult();

        document.getElementById('downloadButton').classList.remove('hidden');
        document.getElementById('copyButton').classList.remove('hidden');
        document.getElementById('sliderToggleButton').classList.remove('hidden');
        document.getElementById('outputEmpty').classList.add('hidden');

        showToast('Background removed successfully.', 'success');
    } catch (error) {
        showToast(error.message, 'error', 6000);
    } finally {
        loadingIndicator.classList.add('hidden');
        processButton.disabled = false;
        processIcon.classList.remove('hidden');
        processSpinner.classList.add('hidden');
    }
}

/* ----------------------------- Render result / slider ----------------------------- */
function renderResult() {
    const sliderContainer = document.getElementById('sliderContainer');
    const sliderOriginal = document.getElementById('sliderOriginal');
    const sliderResult = document.getElementById('sliderResult');

    sliderResult.src = resultImageUrl;
    sliderOriginal.src = originalImageUrl;

    sliderContainer.classList.remove('hidden');
    sliderContainer.classList.add('fade-in');

    if (sliderMode) {
        // Compare: original clipped to left half, result on right
        sliderOriginal.style.opacity = '1';
        setSliderPosition(50);
        document.getElementById('sliderHandle').classList.remove('hidden');
    } else {
        // Result only: hide original layer entirely
        sliderOriginal.style.opacity = '0';
        document.getElementById('sliderHandle').classList.add('hidden');
    }
}

function toggleSlider() {
    sliderMode = !sliderMode;
    const toggleButton = document.getElementById('sliderToggleButton');
    const sliderOriginal = document.getElementById('sliderOriginal');

    if (sliderMode) {
        sliderOriginal.style.opacity = '1';
        setSliderPosition(50);
        document.getElementById('sliderHandle').classList.remove('hidden');
        toggleButton.querySelector('span').textContent = 'Result';
    } else {
        sliderOriginal.style.opacity = '0';
        document.getElementById('sliderHandle').classList.add('hidden');
        toggleButton.querySelector('span').textContent = 'Compare';
    }
}

/* ----------------------------- Slider drag ----------------------------- */
(function initSliderDrag() {
    const handle = document.getElementById('sliderHandle');
    const container = document.getElementById('sliderContainer');
    let dragging = false;

    const onMove = (clientX) => {
        if (!dragging || !sliderMode) return;
        const rect = container.getBoundingClientRect();
        const pct = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
        setSliderPosition(pct);
    };

    const start = (e) => {
        if (!sliderMode) return;
        dragging = true;
        e.preventDefault();
    };
    const end = () => { dragging = false; };

    handle.addEventListener('mousedown', start);
    handle.addEventListener('touchstart', (e) => start(e.touches[0]), { passive: false });
    document.addEventListener('mousemove', (e) => onMove(e.clientX));
    document.addEventListener('touchmove', (e) => onMove(e.touches[0].clientX), { passive: false });
    document.addEventListener('mouseup', end);
    document.addEventListener('touchend', end);

    // Click anywhere on the container to move the handle
    container.addEventListener('mousedown', (e) => {
        if (!sliderMode || e.target.closest('#sliderHandle')) return;
        const rect = container.getBoundingClientRect();
        const pct = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
        setSliderPosition(pct);
        dragging = true;
    });
})();

function setSliderPosition(pct) {
    document.getElementById('sliderHandle').style.left = `${pct}%`;
    document.getElementById('sliderOriginal').style.clipPath = `inset(0 ${100 - pct}% 0 0)`;
}

/* ----------------------------- Download / copy ----------------------------- */
function downloadResult() {
    if (!resultImageUrl) return;
    const link = document.createElement('a');
    link.href = resultImageUrl;
    link.download = 'removed_background.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

async function copyResult() {
    if (!resultImageUrl) return;
    const copyButton = document.getElementById('copyButton');
    const originalText = copyButton.querySelector('span').textContent;

    try {
        const blob = await fetch(resultImageUrl).then((res) => res.blob());
        await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
        copyButton.querySelector('span').textContent = 'Copied!';
        showToast('Image copied to clipboard.', 'success');
        setTimeout(() => {
            copyButton.querySelector('span').textContent = originalText;
        }, 2000);
    } catch (error) {
        console.error('Copy failed:', error);
        showToast('Could not copy image to clipboard. Your browser may not support this feature.', 'error', 6000);
    }
}

/* ----------------------------- Paste ----------------------------- */
document.addEventListener('paste', (event) => {
    const items = event.clipboardData?.items;
    if (!items) return;

    const imageItem = Array.from(items).find((item) => item.type.startsWith('image/'));
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
