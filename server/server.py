from flask import Flask, request, jsonify, send_from_directory, url_for
import os
import cv2
import torch
import numpy as np
from ultralytics import YOLO
import tempfile
from collections import defaultdict
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import pandas as pd
import time
import json
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Create a temporary directory to store cached files
cache_dir = tempfile.mkdtemp()

os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"
os.environ["KMP_INIT_AT_FORK"] = "FALSE"

# Set up YOLO models
behaviour_model = YOLO(os.path.join("models", "behaviour_detection_model.pt"))
shape_model = YOLO(os.path.join("models", "shape_detection_model.pt"))

behaviours = {0: "Lying down", 1: "Eating", 2: "Standing"}

with open('static/class.json', 'r') as file:
    class_map = json.load(file)

def check_cuda():
    return torch.device("cuda" if torch.cuda.is_available() else "cpu")

device = check_cuda()

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

def draw_bounding_boxes(result, image_path):
    img = cv2.imread(image_path)

    colors = {
        "Lying down": (255, 0, 0),
        "Eating": (0, 255, 0),
        "Standing": (0, 0, 255),
        "Unknown": (255, 255, 255)
    }

    for behavior_box in result.boxes:
        x1, y1, x2, y2 = map(int, behavior_box.xyxy[0])
        behavior_class_id = int(behavior_box.cls.item())
        behavior_name = behaviours.get(behavior_class_id, "Unknown")

        color = colors.get(behavior_name, (255, 255, 255))
        cv2.rectangle(img, (x1, y1), (x2, y2), color, 2)
        cv2.putText(img, behavior_name, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.9, color, 2)

    boxed_image_path = os.path.join(cache_dir, "boxed_" + os.path.basename(image_path))
    cv2.imwrite(boxed_image_path, img)

    return boxed_image_path

def process_image(image_path):
    results = []
    behaviour_count = defaultdict(int)
    detection_model_result = behaviour_model.predict(image_path, conf=0.45)
    
    for result in detection_model_result:
        cropped_images = display_cropped_images(result)
        
        for detected_area, x_offset, y_offset, behavior_class_id in cropped_images:
            shape_classes = shape_finder(detected_area, x_offset, y_offset, result.orig_img.shape)

            behavior_name = behaviours.get(int(behavior_class_id.item()), "Unknown")
            if shape_classes:
                result_str = f"{class_map[shape_classes[0]]} : This ID cattle is {(behavior_name).lower()}."
                behaviour_count[behavior_name] += 1
            else:
                result_str = f"Unidentified cow's behavior: {behavior_name}."
            results.append(result_str)
    
    boxed_image_path = draw_bounding_boxes(result, image_path)
    create_charts(behaviour_count)
    
    return results, boxed_image_path

def create_charts(behaviour_count):
    labels = list(behaviour_count.keys())
    sizes = list(behaviour_count.values())
    
    plt.figure(figsize=(5, 5))
    plt.pie(sizes, labels=labels, autopct='%1.1f%%', startangle=140)
    plt.axis('equal')
    plt.title("Behavior Distribution (Pie Chart)")
    pie_chart_path = os.path.join(cache_dir, "behavior_pie_chart.png")
    plt.savefig(pie_chart_path)
    plt.close()
    
    plt.figure(figsize=(5, 5))
    plt.bar(labels, sizes, color='skyblue')
    plt.ylabel("Count")
    plt.xlabel("Behaviors")
    plt.title("Behavior Distribution (Bar Chart)")
    bar_chart_path = os.path.join(cache_dir, "behavior_bar_chart.png")
    plt.savefig(bar_chart_path)
    plt.close()

@app.route('/process', methods=['POST'])
def process_file():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    
    if file:
        file_path = os.path.join(cache_dir, file.filename)
        file.save(file_path)
        start_time = time.time()
        results, boxed_image_path = process_image(file_path)
        end_time = time.time()
        processing_time = round(end_time - start_time)
        return jsonify({
            "results": results,
            "image_url": url_for('cached_image', filename=os.path.basename(boxed_image_path)),
            "pie_chart_url": url_for('cached_image', filename='behavior_pie_chart.png'),
            "bar_chart_url": url_for('cached_image', filename='behavior_bar_chart.png'),
            "device": str(device),
            "time": processing_time
        })

@app.route('/cache/<filename>')
def cached_image(filename):
    return send_from_directory(cache_dir, filename)

@app.route('/get_csv_data', methods=['GET'])
def get_csv_data():
    csv_dir = 'db'
    try:
        csv_files = [f for f in os.listdir(csv_dir) if f.endswith('.csv')]
        csv_files = sorted(csv_files, key=extract_date)
        print("CSV files:", csv_files)
        
        if not csv_files:
            return jsonify({"error": "No valid CSV files found."}), 400

        data = pd.read_csv(os.path.join(csv_dir, csv_files[-1]))
        cattle_columns = data.columns.tolist()
        
        print("Cattle columns:", cattle_columns)
        return jsonify({
            "cattle_columns": cattle_columns,
            "data": data.to_dict()
        })

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({"error": "An error occurred while processing the CSV files."}), 500

@app.route('/analyze_cattle', methods=['POST'])
def analyze_cattle():
    try:
        request_data = request.get_json()
        print("Request data:", request_data)
        selected_cattle = request_data.get('cattle')

        if not selected_cattle:
            return jsonify({"error": "No cattle selected."}), 400

        csv_dir = 'db'
        csv_files = [f for f in os.listdir(csv_dir) if f.endswith('.csv')]
        print("Original CSV files:", csv_files)

        for f in csv_files:
            extracted_date = extract_date(f)
            print(f"Filename: {f}, Extracted Date: {extracted_date}")

        csv_files = sorted(csv_files, key=extract_date)
        print("Sorted CSV files:", csv_files)

        csv_files = [f for f in csv_files if extract_date(f) is not pd.NaT]
        print("Filtered CSV files:", csv_files)

        if not csv_files:
            return jsonify({"error": "No valid CSV files found."}), 400

        data = pd.read_csv(os.path.join(csv_dir, csv_files[-1]))
        cattle_data = data[selected_cattle]
        previous_data = [pd.read_csv(os.path.join(csv_dir, f))[selected_cattle] for f in csv_files[:-1]]

        avg_eating_previous = sum(d.value_counts().get('E', 0) for d in previous_data) / len(previous_data) / 12
        avg_lying_previous = sum(d.value_counts().get('L', 0) for d in previous_data) / len(previous_data) / 12

        eating_today = (cattle_data.value_counts().get('E', 0) * 5) / 60
        lying_today = (cattle_data.value_counts().get('L', 0) * 5) / 60

        lying_less_than_8 = []
        eating_less_than_4 = []
        lying_more_than_12 = []

        for cattle in data.columns:
            cattle_today_data = data[cattle]
            lying_today_cattle = (cattle_today_data.value_counts().get('L', 0) * 5) / 60
            eating_today_cattle = (cattle_today_data.value_counts().get('E', 0) * 5) / 60

            if lying_today_cattle < 8:
                lying_less_than_8.append(cattle)
            if eating_today_cattle < 4:
                eating_less_than_4.append(cattle)
            if lying_today_cattle > 12:
                lying_more_than_12.append(cattle)

        create_comparison_charts(avg_eating_previous, avg_lying_previous, eating_today, lying_today, selected_cattle , csv_dir , csv_files)

        # Verify that the files were created successfully
        print("Comparison charts created:", os.path.join(cache_dir, 'comparison_chart_eating.png'))
        print("Pie chart created:", os.path.join(cache_dir, 'selected_cattle_pie_chart.png'))

        return jsonify({
            "selected_cattle": selected_cattle,
            "avg_eating_previous": avg_eating_previous,
            "avg_lying_previous": avg_lying_previous,
            "eating_today": eating_today,
            "lying_today": lying_today,
            "lying_less_than_8": lying_less_than_8,
            "eating_less_than_4": eating_less_than_4,
            "lying_more_than_12": lying_more_than_12,
            "comparison_chart_eating": url_for('cached_image', filename='comparison_chart_eating.png'),
            "comparison_chart_lying": url_for('cached_image', filename='comparison_chart_lying.png'),
            "pie_chart": url_for('cached_image', filename='selected_cattle_pie_chart.png'),
            "time_series": url_for('cached_image', filename='time_series_graph.png')
        })

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": "An error occurred during analysis."}), 500



def create_comparison_charts(avg_eating_previous, avg_lying_previous, eating_today, lying_today, selected_cattle , csv_dir , csv_files):
    plt.figure(figsize=(5, 5))
    plt.bar(['Previous Avg', 'Today'], [avg_eating_previous, eating_today], color='skyblue')
    plt.ylabel('Eating Time (hours)')
    plt.title(f'Eating Time Comparison - {selected_cattle}')
    plt.savefig(os.path.join(cache_dir, 'comparison_chart_eating.png'))
    plt.close()

    plt.figure(figsize=(5, 5))
    plt.bar(['Previous Avg', 'Today'], [avg_lying_previous, lying_today], color='skyblue')
    plt.ylabel('Lying Down Time (hours)')
    plt.title(f'Lying Down Time Comparison - {selected_cattle}')
    plt.savefig(os.path.join(cache_dir, 'comparison_chart_lying.png'))
    plt.close()

    labels = ['Eating', 'Lying down', 'Standing']
    sizes = [eating_today, lying_today, 24 - eating_today - lying_today]
    
    plt.figure(figsize=(5, 5))
    plt.pie(sizes, labels=labels, autopct='%1.1f%%', startangle=140)
    plt.axis('equal')
    plt.title(f'Behavior Distribution - {selected_cattle}')
    plt.savefig(os.path.join(cache_dir, 'selected_cattle_pie_chart.png'))
    plt.close()
    
    # Initialize lists for storing average values and time sequence
    # average_index = []   
    time_sequence = []
    eating_time_sequence = []
    lying_time_sequence = []

    # Iterate through each file to compute the average index

    for i, file in enumerate(csv_files):
        df = pd.read_csv(os.path.join(csv_dir, file))
        eating_time = df[selected_cattle].value_counts().get('E', 0) / 12
        lying_time = df[selected_cattle].value_counts().get('L', 0) / 12
        # average_index.append((eating_time + (lying_time / 2)) / 2)
        eating_time_sequence.append(eating_time)
        lying_time_sequence.append(lying_time)
        time_sequence.append(i + 1)

    # Plot the average index
    plot_path = os.path.join(cache_dir, 'behavior_analysis.png')
    plt.figure(figsize=(10, 6))
    # plt.plot(time_sequence, average_index, label='Average Index based on Eating and Lying Down time(Eating + Lying Down / 2)', marker='o')
    plt.plot(time_sequence, eating_time_sequence, label='Eating Time', marker='o')
    plt.plot(time_sequence, lying_time_sequence, label='Lying Down Time', marker='s')
    plt.xlabel('Days')
    plt.ylabel('hours')
    plt.title('Average Index of Eating and Lying Down Time Over Days')
    plt.legend()
    plt.grid(True)
    plt.savefig(os.path.join(cache_dir, 'time_series_graph.png'))
    plt.close()

def extract_date(filename):
    parts = filename.split('_')
    try:
        return pd.to_datetime(f"20{parts[0]}-{parts[1]}-{parts[2].split('.')[0]}")
    except:
        print(f"Unexpected file format: {filename}")
        return pd.NaT


if __name__ == '__main__':
    app.run(debug=True)