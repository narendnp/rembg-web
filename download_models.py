import os
import requests
import json
from tqdm import tqdm
import time

with open('models.json', 'r') as f:
    MODEL_DESCRIPTIONS = json.load(f)

MODELS = [
    {
        "id": "u2net",
        "url": "https://github.com/danielgatis/rembg/releases/download/v0.0.0/u2net.onnx",
        "size": "167MB",
        "filename": "u2net.onnx"
    },
    {
        "id": "u2net_human_seg",
        "url": "https://github.com/danielgatis/rembg/releases/download/v0.0.0/u2net_human_seg.onnx",
        "size": "167MB",
        "filename": "u2net_human_seg.onnx"
    },
    {
        "id": "u2net_cloth_seg",
        "url": "https://github.com/danielgatis/rembg/releases/download/v0.0.0/u2net_cloth_seg.onnx",
        "size": "168MB",
        "filename": "u2net_cloth_seg.onnx"
    },
    {
        "id": "isnet-general-use",
        "url": "https://github.com/danielgatis/rembg/releases/download/v0.0.0/isnet-general-use.onnx",
        "size": "170MB",
        "filename": "isnet-general-use.onnx"
    },
    {
        "id": "isnet-anime",
        "url": "https://github.com/danielgatis/rembg/releases/download/v0.0.0/isnet-anime.onnx",
        "size": "167MB",
        "filename": "isnet-anime.onnx"
    },
    {
        "id": "birefnet-general",
        "url": "https://github.com/danielgatis/rembg/releases/download/v0.0.0/BiRefNet-general-epoch_244.onnx",
        "size": "927MB",
        "filename": "birefnet-general.onnx"
    },
    {
        "id": "birefnet-portrait",
        "url": "https://github.com/danielgatis/rembg/releases/download/v0.0.0/BiRefNet-portrait-epoch_150.onnx",
        "size": "927MB",
        "filename": "birefnet-portrait.onnx"
    },
    {
        "id": "birefnet-dis",
        "url": "https://github.com/danielgatis/rembg/releases/download/v0.0.0/BiRefNet-DIS-epoch_590.onnx",
        "size": "927MB",
        "filename": "birefnet-dis.onnx"
    },
    {
        "id": "birefnet-hrsod",
        "url": "https://github.com/danielgatis/rembg/releases/download/v0.0.0/BiRefNet-HRSOD_DHU-epoch_115.onnx",
        "size": "927MB",
        "filename": "birefnet-hrsod.onnx"
    },
    {
        "id": "birefnet-cod",
        "url": "https://github.com/danielgatis/rembg/releases/download/v0.0.0/BiRefNet-COD-epoch_125.onnx",
        "size": "927MB",
        "filename": "birefnet-cod.onnx"
    },
    {
        "id": "birefnet-massive",
        "url": "https://github.com/danielgatis/rembg/releases/download/v0.0.0/BiRefNet-massive-TR_DIS5K_TR_TEs-epoch_420.onnx",
        "size": "927MB",
        "filename": "birefnet-massive.onnx"
    },
    {
        "id": "ben2-base",
        "url": "https://huggingface.co/PramaLLC/BEN2/resolve/main/BEN2_Base.onnx",
        "size": "212MB",
        "filename": "ben2-base.onnx"
    }
]

ONNX_DIR = os.path.join(os.path.expanduser("~"), ".u2net")

def display_models():
    """Display available models with descriptions."""
    print("Available models:")
    print("-" * 50)
    for model in MODELS:
        model_id = model["id"]
        model_size = model["size"]
        description = MODEL_DESCRIPTIONS.get(model_id, {}).get("description", "No description available.")
        print(f"[*] {model_id} [{model_size}]: {description}")
    print("-" * 50)
    print("Specify models you want to download, separated by commas (e.g., 'u2net, isnet-anime'), or 'all' to download all models.")

def get_selected_models(user_input):
    """Parse user input and return list of selected models."""
    if user_input.lower() == 'all':
        return MODELS

    selected_ids = [id.strip() for id in user_input.split(',')]
    selected_models = [model for model in MODELS if model["id"] in selected_ids]

    if len(selected_models) != len(selected_ids):
        invalid_ids = [id for id in selected_ids if id not in [m["id"] for m in MODELS]]
        print(f"Warning: Invalid model IDs: {', '.join(invalid_ids)}")

    return selected_models

def download_file(url, filename):
    """Download a file from the given URL and save it with the specified filename."""
    filepath = os.path.join(ONNX_DIR, filename)

    if os.path.exists(filepath):
        print(f"{filename} already exists. Skipping download.")
        return

    try:
        print(f"Downloading {filename}...")
        response = requests.get(url, stream=True)
        response.raise_for_status()

        total_size = int(response.headers.get('content-length', 0))

        # Initialize progress bar
        with tqdm(
            total=total_size,
            unit='B',
            unit_scale=True,
            unit_divisor=1024,
            desc=filename,
            ncols=100,
            miniters=1
        ) as pbar:
            downloaded_size = 0
            start_time = time.time()

            with open(filepath, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)
                        downloaded_size += len(chunk)
                        pbar.update(len(chunk))

                        # Calculate and display speed
                        elapsed_time = time.time() - start_time
                        if elapsed_time > 0:
                            speed = downloaded_size / elapsed_time
                            pbar.set_postfix({
                                'speed': f'{speed / 1024:.1f} KB/s'
                            })

        print(f"Successfully downloaded {filename}")
    except requests.exceptions.RequestException as e:
        print(f"Error downloading {filename}: {e}")

def main():
    os.makedirs(ONNX_DIR, exist_ok=True)
    display_models()

    user_input = input("Enter your choice: ").strip()
    selected_models = get_selected_models(user_input)

    if not selected_models:
        print("No valid models selected. Exiting.")
        return

    print(f"\nSelected models for download: {[m['id'] for m in selected_models]}")

    for model in selected_models:
        download_file(model["url"], model["filename"])

    print("\nDownload of models completed.")

if __name__ == "__main__":
    main()
