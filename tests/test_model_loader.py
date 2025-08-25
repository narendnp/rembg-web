import os
import platform
import onnxruntime
from rembg import new_session

# Define model paths
LOCAL_ONNX_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'onnx')

if platform.system() == 'Windows':
    HOME_U2NET_PATH = os.path.join(os.environ['USERPROFILE'], '.u2net')
else:
    HOME_U2NET_PATH = os.path.join(os.path.expanduser('~'), '.u2net')

# Ensure the home directory for models exists
os.makedirs(HOME_U2NET_PATH, exist_ok=True)

# Dictionary to hold sessions (for testing purposes)
SESSIONS = {}

def test_model_loading():
    """
    Scans for ONNX models, loads them, and reports the status.
    """
    print("--- Starting Model Loading Test ---")
    
    # Determine the execution providers
    available_providers = onnxruntime.get_available_providers()
    print(f"Available ONNX Runtime providers: {available_providers}")
    
    if "CUDAExecutionProvider" in available_providers:
        providers = ["CUDAExecutionProvider", "CPUExecutionProvider"]
        print("GPU (CUDA) is available. Will attempt to use GPU first.")
    else:
        providers = ["CPUExecutionProvider"]
        print("GPU (CUDA) not found. Using CPU.")

    # Scan for and load all available models
    model_paths = [HOME_U2NET_PATH, LOCAL_ONNX_PATH]
    models_found = 0
    models_loaded = 0

    for path in model_paths:
        if os.path.exists(path):
            print(f"\nScanning directory: {path}")
            for file_name in os.listdir(path):
                if file_name.endswith(".onnx"):
                    models_found += 1
                    model_name = os.path.splitext(file_name)[0]
                    if model_name not in SESSIONS:
                        print(f"  - Found model: '{model_name}'. Attempting to load...")
                        try:
                            SESSIONS[model_name] = new_session(model_name, providers=providers)
                            print(f"    [SUCCESS] Model '{model_name}' loaded successfully.")
                            models_loaded += 1
                        except Exception as e:
                            print(f"    [FAILURE] Failed to load model '{model_name}'. Error: {e}")
    
    print("\n--- Test Summary ---")
    print(f"Total models found: {models_found}")
    print(f"Total models successfully loaded: {models_loaded}")
    if models_found > 0 and models_loaded == models_found:
        print("All models loaded successfully!")
    elif models_loaded > 0:
        print("Some models failed to load. Please check the errors above.")
    else:
        print("No models were loaded. Ensure your .onnx files are in the correct directories.")

if __name__ == "__main__":
    test_model_loading()
