from flask import Flask, request, render_template, send_file, jsonify
from rembg import remove, new_session
import os
import platform
from PIL import Image
import io
import uuid
import shutil
import onnxruntime
import json

app = Flask(__name__)
UPLOAD_FOLDER = 'uploads'
OUTPUT_FOLDER = 'outputs'
LOCAL_ONNX_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'onnx')

# Set up model paths - check both user home and local project directory
# Handle different OS paths
if platform.system() == 'Windows':
    HOME_U2NET_PATH = os.path.join(os.environ['USERPROFILE'], '.u2net')
else:
    HOME_U2NET_PATH = os.path.join(os.path.expanduser('~'), '.u2net')

# Create the home directory if it doesn't exist
os.makedirs(HOME_U2NET_PATH, exist_ok=True)

# Set the U2NET_HOME environment variable to point to the models directory
os.environ['U2NET_HOME'] = HOME_U2NET_PATH

# Clear cache on startup
if os.path.exists(UPLOAD_FOLDER):
    shutil.rmtree(UPLOAD_FOLDER)
if os.path.exists(OUTPUT_FOLDER):
    shutil.rmtree(OUTPUT_FOLDER)
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/models')
def get_available_models():
    # Load model descriptions from JSON file
    try:
        with open('models.json', 'r') as f:
            model_details = json.load(f)
    except (IOError, json.JSONDecodeError):
        model_details = {}

    # Find all available .onnx files
    available_models = set()
    model_paths = [HOME_U2NET_PATH, LOCAL_ONNX_PATH]
    for path in model_paths:
        if os.path.exists(path):
            for file_name in os.listdir(path):
                if file_name.endswith(".onnx"):
                    model_name = os.path.splitext(file_name)[0]
                    available_models.add(model_name)

    # Prepare the final list of models
    final_model_list = []
    for model_name in sorted(list(available_models)):
        details = model_details.get(model_name, {
            "id": model_name,
            "name": model_name,
            "description": "A custom-loaded model with no description available."
        })
        final_model_list.append(details)

    return jsonify(final_model_list)

@app.route('/process', methods=['POST'])
def process_image():
    model = request.form.get('model', 'u2net')
    file = request.files['image']
    
    try:
        # Check if model exists in either location
        model_name = f"{model}.onnx"
        model_exists = (
            os.path.exists(os.path.join(HOME_U2NET_PATH, model_name)) or 
            os.path.exists(os.path.join(LOCAL_ONNX_PATH, model_name))
        )
        
        if not model_exists:
            return f"Model '{model}' not found. Please download the model file and place it in either '{HOME_U2NET_PATH}' or '{LOCAL_ONNX_PATH}'", 404
        
        # Generate unique filenames
        file_id = str(uuid.uuid4())
        input_path = os.path.join(UPLOAD_FOLDER, f"{file_id}.png")
        output_path = os.path.join(OUTPUT_FOLDER, f"{file_id}.png")
        
        # Process image
        image = Image.open(file.stream)
        # Convert to RGB if image is in RGBA mode (e.g., for WebP with transparency)
        if image.mode in ('RGBA', 'LA') or (image.mode == 'P' and 'transparency' in image.info):
            # Create a white background image
            bg = Image.new('RGB', image.size, (255, 255, 255))
            if image.mode == 'P':
                image = image.convert('RGBA')
            # Composite the image onto the background
            bg.paste(image, mask=image.split()[3] if image.mode == 'RGBA' else image.split()[1])
            image = bg
        elif image.mode != 'RGB':
            image = image.convert('RGB')

        # Determine providers, preferring GPU
        available_providers = onnxruntime.get_available_providers()
        providers = (
            ["CUDAExecutionProvider", "CPUExecutionProvider"]
            if "CUDAExecutionProvider" in available_providers
            else ["CPUExecutionProvider"]
        )
        
        session = new_session(model, providers=providers)
        result = remove(image, session=session)
        result.save(output_path, 'PNG')
        
        return send_file(output_path, mimetype='image/png')
        
    except Exception as e:
        return str(e), 500

if __name__ == '__main__':
    try:
        # Ensure the upload and output directories exist
        os.makedirs(UPLOAD_FOLDER, exist_ok=True)
        os.makedirs(OUTPUT_FOLDER, exist_ok=True)
        
        # Run the Flask app
        app.run(host='0.0.0.0', port=5000)
    except KeyboardInterrupt:
        print("Shutting down gracefully...")
    finally:
        # Clean up temporary files
        if os.path.exists(UPLOAD_FOLDER):
            shutil.rmtree(UPLOAD_FOLDER)
        if os.path.exists(OUTPUT_FOLDER):
            shutil.rmtree(OUTPUT_FOLDER)
