from flask import Flask, request, render_template, redirect, url_for, send_file
import os
import cv2
import torch
import numpy as np
from ultralytics import YOLO
import tempfile

app = Flask(__name__)

# Create a temporary directory to store cached files
cache_dir = tempfile.mkdtemp()

os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"
os.environ["KMP_INIT_AT_FORK"] = "FALSE"

# Set up YOLO models
behaviour_model = YOLO(os.path.join("models", "behaviour_detection_model.pt"))
shape_model = YOLO(os.path.join("models", "shape_detection_model.pt"))

behaviours = {0: "Lying down", 1: "Eating", 2: "Standing"}

# Function definitions from your existing code
def check_cuda():
    return torch.device("cuda" if torch.cuda.is_available() else "cpu")

device = check_cuda()
print(f"Using device: {device}")

def distance_to_center(x1, y1, x2, y2, img_center):
    box_center_x = (x1 + x2) / 2
    box_center_y = (y1 + y2) / 2
    return np.sqrt((box_center_x - img_center[0]) ** 2 + (box_center_y - img_center[1]) ** 2)

def shape_finder(detected_area, x_offset, y_offset, original_size):
    shape_model_results = shape_model.predict(detected_area)
    boxes = shape_model_results[0].boxes.xyxy.cpu().numpy()
    class_ids = shape_model_results[0].boxes.cls.cpu().numpy()
    predicted_classes = [shape_model_results[0].names[int(class_id)] for class_id in class_ids]

    img_center = (detected_area.shape[1] / 2, detected_area.shape[0] / 2)

    if len(boxes) > 1:
        distances = [distance_to_center(*box, img_center) for box in boxes]
        min_index = np.argmin(distances)
        boxes = [boxes[min_index]]
        predicted_classes = [predicted_classes[min_index]]

    return predicted_classes

def display_cropped_images(result):
    detected_areas = []
    for behavior_box in result.boxes:
        x1, y1, x2, y2 = map(int, behavior_box.xyxy[0])
        detected_area = result.orig_img[y1:y2, x1:x2]
        detected_areas.append((detected_area, x1, y1, behavior_box.cls))

    return detected_areas

def process_image(image_path):
    results = []
    detection_model_result = behaviour_model.predict(image_path, conf=0.45)
    for result in detection_model_result:
        cropped_images = display_cropped_images(result)
        
        for detected_area, x_offset, y_offset, behavior_class_id in cropped_images:
            shape_classes = shape_finder(detected_area, x_offset, y_offset, result.orig_img.shape)

            behavior_name = behaviours.get(int(behavior_class_id.item()), "Unknown")
            # result_str = f"Behavior: {behavior_name} (ID: {behavior_class_id.item()}) has the following shape classes: {shape_classes}"
            if shape_classes:
                result_str = f"{shape_classes[0]} : This ID cattle is {(behavior_name).lower()}."
            else:
                result_str = f"Unidentified cow's behavior: {behavior_name}."
            results.append(result_str)

    return results

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return redirect(request.url)
    file = request.files['file']
    if file.filename == '':
        return redirect(request.url)
    
    if file:
        # Save the uploaded file to the cache directory
        file_path = os.path.join(cache_dir, file.filename)
        file.save(file_path)
        results = process_image(file_path)
        return render_template('results.html', results=results, image_url=url_for('uploaded_file', filename=file.filename))

@app.route('/cache/<filename>')
def uploaded_file(filename):
    file_path = os.path.join(cache_dir, filename)
    if os.path.exists(file_path):
        return send_file(file_path)
    else:
        return "File not found", 404

if __name__ == "__main__":
    app.run(debug=True)