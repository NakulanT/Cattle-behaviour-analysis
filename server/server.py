from flask import Flask, request, jsonify, send_from_directory, url_for , send_file ,Response
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
import random
from datetime import datetime, timedelta
import calendar
from datetime import datetime
import csv
import shutil
import threading
from PIL import Image

from calculation import calculate_total_behavior,get_cow_data_by_id,get_behavior_sums_by_day,convert_to_serializable


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

VIDEO_PATH = ''  # Initialize the video path as an empty string
COORDINATES = {}

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

import os
import cv2

def draw_bounding_boxes(result, image_path, coordinates):
    img = cv2.imread(image_path)

    colors = {
        "Lying down": (255, 0, 0),
        "Eating": (0, 255, 0),
        "Standing": (0, 0, 255),
        "Unknown": (255, 255, 255)
    }

    # Draw behavior bounding boxes
    for behavior_box in result.boxes:
        x1, y1, x2, y2 = map(int, behavior_box.xyxy[0])
        behavior_class_id = int(behavior_box.cls.item())
        behavior_name = behaviours.get(behavior_class_id, "Unknown")

        color = colors.get(behavior_name, (255, 255, 255))
        cv2.rectangle(img, (x1, y1), (x2, y2), color, 2)
        cv2.putText(img, behavior_name, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.9, color, 2)

    # Draw the quadrilateral for coordinates
    quad_points = [
        (int(coordinates['topLeft']['x']), int(coordinates['topLeft']['y'])),
        (int(coordinates['topRight']['x']), int(coordinates['topRight']['y'])),
        (int(coordinates['bottomRight']['x']), int(coordinates['bottomRight']['y'])),
        (int(coordinates['bottomLeft']['x']), int(coordinates['bottomLeft']['y']))
    ]
    
    # Draw the quadrilateral (line connecting the points)
    quad_color = (0, 255, 255)  # Yellow color for the quadrilateral
    cv2.polylines(img, [np.array(quad_points)], isClosed=True, color=quad_color, thickness=2)

    boxed_image_path = os.path.join(cache_dir, "boxed_" + os.path.basename(image_path))
    cv2.imwrite(boxed_image_path, img)

    return boxed_image_path


from shapely.geometry import Point, Polygon

def is_point_in_quad(px, py, quad_coords):
    """Check if a point (px, py) is inside the quadrilateral defined by quad_coords."""
    polygon = Polygon([
        (quad_coords['topLeft']['x'], quad_coords['topLeft']['y']),
        (quad_coords['topRight']['x'], quad_coords['topRight']['y']),
        (quad_coords['bottomRight']['x'], quad_coords['bottomRight']['y']),
        (quad_coords['bottomLeft']['x'], quad_coords['bottomLeft']['y'])
    ])
    
    point = Point(px, py)
    return polygon.contains(point)

def is_inside_coordinates(x1, y1, x2, y2, coordinates):
    """Check if any part of the bounding box is inside the specified quadrilateral coordinates."""
    print(x1, x2, y1, y2)
    print(coordinates)

    try:
        topLeft = coordinates['topLeft']
        topRight = coordinates['topRight']
        bottomLeft = coordinates['bottomLeft']
        bottomRight = coordinates['bottomRight']
    except KeyError as e:
        print(f"KeyError: Missing key {e} in coordinates.")
        return False

    # Bounding box corners
    box_coords = [(x1, y1), (x2, y1), (x1, y2), (x2, y2)]
    
    # Check if any corner of the bounding box is inside the quadrilateral
    for (x, y) in box_coords:
        if is_point_in_quad(x, y, coordinates):
            return True

    return False

def process_image(image_path):
    global COORDINATES
    print("COORDINATES:", COORDINATES)
    results = []
    behaviour_count = defaultdict(int)
    
    # Perform detection using the behavior model
    detection_model_result = behaviour_model.predict(image_path, conf=0.45)
    
    for result in detection_model_result:
        # Get cropped images for detected objects
        cropped_images = display_cropped_images(result)
        
        for detected_area, x_offset, y_offset, behavior_class_id in cropped_images:
            # Identify the shape of the detected object
            shape_classes = shape_finder(detected_area, x_offset, y_offset, result.orig_img.shape)
            behavior_name = behaviours.get(int(behavior_class_id.item()), "Unknown")
            
            # Define the bounding box coordinates
            x1, y1, x2, y2 = x_offset, y_offset, x_offset + detected_area.shape[1], y_offset + detected_area.shape[0]
            
            # Check if the bounding box is inside the defined zone
            if is_inside_coordinates(x1, y1, x2, y2, COORDINATES) :
                # Set behavior to 'Eating' if inside coordinates
                if shape_classes:
                    result_str = {class_map[shape_classes[0]]: "Eating"}
                else:
                    result_str = {"Unknown": "Eating"}
                    
                behaviour_count["Eating"] += 1
                
            elif shape_classes:
                # Use the detected behavior if not inside the zone
                result_str = {class_map[shape_classes[0]]: behavior_name}
                behaviour_count[behavior_name] += 1
            else:
                # Handle unknown cases
                result_str = {"Unknown": behavior_name}

            results.append(result_str)
    
    # Draw bounding boxes on the image
    boxed_image_path = draw_bounding_boxes(result, image_path, COORDINATES)
    
    # Generate charts based on behavior counts
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
        # Open the image file
        image = Image.open(file.stream)
        
        # Resize the image to 640x640
        resized_image = image.resize((640, 640))
        
        # Save the resized image to a temporary location
        file_path = os.path.join(cache_dir, 'resized_' + file.filename)
        resized_image.save(file_path)
        
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



@app.route('/coordinates', methods=['POST'])
def handle_coordinates():
    data = request.json
    # Process the data here
    # For example, save it to a database or file
    global COORDINATES
    COORDINATES = data
    print("Data : ",data)
    return jsonify({'status': 'success', 'data': data}), 200

#new code may probelm occurs

@app.route('/zone_image', methods=['GET'])
def zone_image():
    """
    Return the 5th frame of the uploaded video or a static image if no video is provided,
    resizing the frame to 640x640 before sending it.
    """
    global VIDEO_PATH  # Declare VIDEO_PATH as global to access its updated value
    print("zone_image dir, video path", VIDEO_PATH)
    
    video_path = VIDEO_PATH
    print("Video path:", video_path)
    
    # Check if the video exists
    if video_path == '' or not os.path.exists(video_path):
        print("Error: No video found.")
        image_path = url_for('static', filename='sampleImage.png')
        return jsonify({"image_url": image_path})
    
    # Open the video
    cap = cv2.VideoCapture(video_path)
    
    if not cap.isOpened():
        print("Error: Could not open the video.")
        image_path = url_for('static', filename='sampleImage.png')
        return jsonify({"image_url": image_path})
    
    # Skip frames to reach the 5th frame
    frame_number = 5
    for _ in range(frame_number - 1):
        ret = cap.grab()  # Skip frame
        if not ret:
            print("Error: Could not skip frames.")
            image_path = url_for('static', filename='sampleImage.png')
            cap.release()
            return jsonify({"image_url": image_path})
    
    # Read the 5th frame
    ret, frame = cap.read()
    if not ret:
        print("Error: Could not read the frame.")
        image_path = url_for('static', filename='sampleImage.png')
        cap.release()
        return jsonify({"image_url": image_path})
    
    # Resize the frame to 640x640
    resized_frame = cv2.resize(frame, (640, 640))
    
    # Generate a random 4-digit number for the image filename
    random_number = random.randint(1000, 9999)
    image_filename = f"{random_number}.jpg"
    temp_image_path = os.path.join(cache_dir, image_filename)
    
    # Save the resized 5th frame as an image
    cv2.imwrite(temp_image_path, resized_frame)
    
    cap.release()
    
    # Verify the file has been updated
    if os.path.exists(temp_image_path):
        print(f"Successfully saved the resized 5th frame as {image_filename}.")
    else:
        print("Error: Failed to save the resized 5th frame.")
    
    for i in os.listdir(cache_dir):
        print(i)
    print("Image shape`:", resized_frame.shape)
    
    # Return the URL of the saved image
    return jsonify({"image_url": url_for('cached_image', filename=image_filename)})

DATA_DIR = 'cattle_behavior_data/'




# Helper function to convert minutes to hours for specified columns
def convert_minutes_to_hours(df, time_cols):
    df[time_cols] = df[time_cols] / 60  # Divide minutes by 60 to get hours
    return df


# # Helper function to load data
def load_behavior_data(date_range):
    data_list = []
    for date_str in date_range:
        file_path = os.path.join(DATA_DIR, f"{date_str}.csv")
        if os.path.exists(file_path):
            data_list.append(pd.read_csv(file_path))
    
    if data_list:
        return pd.concat(data_list, ignore_index=True)
    else:
        return None

def generate_date_range(start_date, end_date):
    date_range = pd.date_range(start=start_date, end=end_date)
    return [date.strftime('%Y-%m-%d') for date in date_range]

def convert_to_hours_minutes(decimal_hours):
    """Convert decimal hours to 'X hours Y minutes' format."""
    hours = int(decimal_hours)
    minutes = int((decimal_hours - hours) * 60)
    return f"{hours} hours and {minutes} minutes"


# Function to convert minutes to 'X hours Y minutes' format
def convert_to_hours_minutes(minutes):
    hours = minutes // 60
    mins = minutes % 60
    return f"{hours} hours and {mins} minutes"

# Filter cows based on behavior for the selected period
# def filter_cows(data, period):
#     data.columns = data.columns.str.strip()

#     # Group by 'Cow ID' and sum the time spent in different behaviors over the selected period
#     grouped_data = data.groupby('Cow ID').agg({
#         'Lying Time (min)': 'sum',
#         'Eating Time (min)': 'sum',
#         'Standing Time (min)': 'sum'
#     })

#     # Convert the summed times into hours and minutes
#     grouped_data['Lying Time (hours)'] = grouped_data['Lying Time (min)'] / 60
#     grouped_data['Eating Time (hours)'] = grouped_data['Eating Time (min)'] / 60
#     grouped_data['Standing Time (hours)'] = grouped_data['Standing Time (min)'] / 60

#     # Keep all cow data for general output
#     all_cows_data = data.groupby('Cow ID').first().reset_index()

#     # Filtering logic for different behavior conditions based on the selected period
#     if period == 'daily':
#         # Daily filter thresholds
#         eating_less_than_3 = grouped_data[grouped_data['Eating Time (hours)'] < 5]
#         eating_more_than_6 = grouped_data[grouped_data['Eating Time (hours)'] > 6]
#         lying_less_than_8 = grouped_data[grouped_data['Lying Time (hours)'] < 8]
#         lying_more_than_12 = grouped_data[grouped_data['Lying Time (hours)'] > 12]
#         standing_less_than_4 = grouped_data[grouped_data['Standing Time (hours)'] < 4]
#         standing_more_than_8 = grouped_data[grouped_data['Standing Time (hours)'] > 8]
#     elif period == 'weekly':
#         # Weekly filter thresholds (times 7 days)
#         lying_less_than_8 = grouped_data[grouped_data['Lying Time (hours)'] < (8 * 7)]
#         lying_more_than_12 = grouped_data[grouped_data['Lying Time (hours)'] > (12 * 7)]
#         eating_less_than_3 = grouped_data[grouped_data['Eating Time (hours)'] < (3 * 7)]
#         eating_more_than_6 = grouped_data[grouped_data['Eating Time (hours)'] > (6 * 7)]
#         standing_less_than_4 = grouped_data[grouped_data['Standing Time (hours)'] < (4 * 7)]
#         standing_more_than_8 = grouped_data[grouped_data['Standing Time (hours)'] > (8 * 7)]
#     elif period == 'monthly':
#         # Monthly filter thresholds (approx 30 days)
#         lying_less_than_8 = grouped_data[grouped_data['Lying Time (hours)'] < (8 * 30)]
#         lying_more_than_12 = grouped_data[grouped_data['Lying Time (hours)'] > (12 * 30)]
#         eating_less_than_3 = grouped_data[grouped_data['Eating Time (hours)'] < (3 * 30)]
#         eating_more_than_6 = grouped_data[grouped_data['Eating Time (hours)'] > (6 * 30)]
#         standing_less_than_4 = grouped_data[grouped_data['Standing Time (hours)'] < (4 * 30)]
#         standing_more_than_8 = grouped_data[grouped_data['Standing Time (hours)'] > (8 * 30)]

#     # Join the filtered data with the original all_cows_data based on Cow ID and add formatted time values
#     def join_filtered_data(filtered_group):
#         filtered_cows = all_cows_data[all_cows_data['Cow ID'].isin(filtered_group.index)]
        
#         # Add formatted time data for each cow
#         filtered_cows['Lying Time'] = filtered_cows['Lying Time (min)'].apply(convert_to_hours_minutes)
#         filtered_cows['Eating Time'] = filtered_cows['Eating Time (min)'].apply(convert_to_hours_minutes)
#         filtered_cows['Standing Time'] = filtered_cows['Standing Time (min)'].apply(convert_to_hours_minutes)

#         return filtered_cows

#     # Apply the join for each condition and return the entire cow data
#     filtered_results = {
#         'lying_less_than_8': join_filtered_data(lying_less_than_8),
#         'lying_more_than_12': join_filtered_data(lying_more_than_12),
#         'eating_less_than_3': join_filtered_data(eating_less_than_3),
#         'eating_more_than_6': join_filtered_data(eating_more_than_6),
#         'standing_less_than_4': join_filtered_data(standing_less_than_4),
#         'standing_more_than_8': join_filtered_data(standing_more_than_8)
#     }

#     # Return all filtered groups with full cow data
#     return filtered_results




def filter_cows(data, period):
    data.columns = data.columns.str.strip()

    # Group by 'Cow ID' and sum the time spent in different behaviors over the selected period
    grouped_data = data.groupby('Cow ID').agg({
        'Lying Time (min)': 'sum',
        'Eating Time (min)': 'sum',
        'Standing Time (min)': 'sum'
    })

    # Convert the summed times into hours and minutes
    grouped_data['Lying Time (hours)'] = grouped_data['Lying Time (min)'] / 60
    grouped_data['Eating Time (hours)'] = grouped_data['Eating Time (min)'] / 60
    grouped_data['Standing Time (hours)'] = grouped_data['Standing Time (min)'] / 60

    # Merge back the original data with all behaviors intact
    all_cows_data = data.groupby('Cow ID').first().reset_index()

    # Filtering logic for different behavior conditions based on the selected period
    if period == 'daily':
        # Daily filter thresholds
        eating_less_than_3 = grouped_data[grouped_data['Eating Time (hours)'] < 5]
        eating_more_than_6 = grouped_data[grouped_data['Eating Time (hours)'] > 6]
        lying_less_than_8 = grouped_data[grouped_data['Lying Time (hours)'] < 8]
        lying_more_than_12 = grouped_data[grouped_data['Lying Time (hours)'] > 12]
        standing_less_than_4 = grouped_data[grouped_data['Standing Time (hours)'] < 4]
        standing_more_than_8 = grouped_data[grouped_data['Standing Time (hours)'] > 8]
    elif period == 'weekly':
        # Weekly filter thresholds (times 7 days)
        lying_less_than_8 = grouped_data[grouped_data['Lying Time (hours)'] < (8 * 7)]
        lying_more_than_12 = grouped_data[grouped_data['Lying Time (hours)'] > (12 * 7)]
        eating_less_than_3 = grouped_data[grouped_data['Eating Time (hours)'] < (3 * 7)]
        eating_more_than_6 = grouped_data[grouped_data['Eating Time (hours)'] > (6 * 7)]
        standing_less_than_4 = grouped_data[grouped_data['Standing Time (hours)'] < (4 * 7)]
        standing_more_than_8 = grouped_data[grouped_data['Standing Time (hours)'] > (8 * 7)]
    elif period == 'monthly':
        # Monthly filter thresholds (approx 30 days)
        lying_less_than_8 = grouped_data[grouped_data['Lying Time (hours)'] < (8 * 30)]
        lying_more_than_12 = grouped_data[grouped_data['Lying Time (hours)'] > (12 * 30)]
        eating_less_than_3 = grouped_data[grouped_data['Eating Time (hours)'] < (3 * 30)]
        eating_more_than_6 = grouped_data[grouped_data['Eating Time (hours)'] > (6 * 30)]
        standing_less_than_4 = grouped_data[grouped_data['Standing Time (hours)'] < (4 * 30)]
        standing_more_than_8 = grouped_data[grouped_data['Standing Time (hours)'] > (8 * 30)]

    # Join the filtered data with the original all_cows_data based on Cow ID
    def join_filtered_data(filtered_group):
        return all_cows_data[all_cows_data['Cow ID'].isin(filtered_group.index)]

    # Apply the join for each condition and return the entire cow data
    filtered_results = {
        'lying_less_than_8': join_filtered_data(lying_less_than_8),
        'lying_more_than_12': join_filtered_data(lying_more_than_12),
        'eating_less_than_3': join_filtered_data(eating_less_than_3),
        'eating_more_than_6': join_filtered_data(eating_more_than_6),
        'standing_less_than_4': join_filtered_data(standing_less_than_4),
        'standing_more_than_8': join_filtered_data(standing_more_than_8)
    }

    # Return all filtered groups with full cow data
    return filtered_results




# Flask route for cow behavior analysis
@app.route('/cow_behavior', methods=['GET'])
def get_cow_behavior():
    date_str = request.args.get('date')
    period = request.args.get('period', 'daily')  # Default to 'daily' if not provided
    
    if not date_str:
        return jsonify({'error': 'Please provide a valid date'}), 400

    try:
        start_date = datetime.strptime(date_str, '%Y-%m-%d')
    except ValueError:
        return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400

    if period == 'daily':
        end_date = start_date
    elif period == 'weekly':
        end_date = start_date + timedelta(days=6)
    elif period == 'monthly':
        end_date = (start_date + pd.DateOffset(months=1)) - timedelta(days=1)
    else:
        return jsonify({'error': 'Invalid period. Choose from "daily", "weekly", or "monthly".'}), 400

    date_range = generate_date_range(start_date, end_date)

    data = load_behavior_data(date_range)
    
    if data is not None:
        filtered_data = filter_cows(data, period)
        
        result = {}
        for key, df in filtered_data.items():
            result[key] = df.to_dict(orient='records')
        
        return jsonify(result)
    else:
        return jsonify({'error': 'Data not found for the given date range'}), 404




# @app.route('/cow/<cow_id>', methods=['GET'])
# def get_cow_details(cow_id):
#     date_str = '2022-09-21'
#     period = 'daily'
    
#     if not date_str:
#         return jsonify({'error': 'Please provide a valid date'}), 400

#     try:
#         start_date = datetime.strptime(date_str, '%Y-%m-%d')
#     except ValueError:
#         return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400

#     # Initialize lists for storing the start date and other dates
#     start_date_list = []
#     other_dates_list = []

#     # Determine the end date based on the specified period and store the start and other dates in lists
#     if period == 'daily':
#         # Get 7 days of data for daily (past 7 days)
#         end_date = start_date - timedelta(days=6)  # Return data for 7 days, including the start date
#     elif period == 'weekly':
#         # Get 4 weeks of data for weekly (past 4 weeks)
#         end_date = start_date - timedelta(weeks=4) - timedelta(days=1)  # Return data for 4 weeks
#     elif period == 'monthly':
#         # Get 12 months of data for monthly (past 12 months)
#         end_date = (start_date - pd.DateOffset(months=12)) - timedelta(days=1)  # Return data for 12 months
#     else:
#         return jsonify({'error': 'Invalid period. Choose from "daily", "weekly", or "monthly".'}), 400
    
#     # Store the start date and other dates
#     start_date_list.append(start_date.strftime('%Y-%m-%d'))
    
#     current_date = start_date
#     while current_date > end_date:
#         current_date -= timedelta(days=1)
#         other_dates_list.append(current_date.strftime('%Y-%m-%d'))

#     # Generate the date range and load the data (from end_date to start_date)
#     date_range = generate_date_range(start_date=end_date, end_date=start_date)
#     data = load_behavior_data(date_range)
    
#     if data is not None:
#         # Filter the data by the provided Cow ID
#         cow_data = data[data['Cow ID'] == cow_id]
#         if not cow_data.empty:
#             # Return the cow data, start date, and other dates in the response
#             return jsonify({
#                 "cow_data": cow_data.to_dict(orient='records'),
#                 "start_date": start_date_list,
#                 "other_dates": other_dates_list
#             })
#         else:
#             return jsonify({"error": "Cow ID not found"}), 404
#     else:
#         return jsonify({'error': 'No data found for the given date range'}), 404

# @app.route('/cow/<cow_id>', methods=['GET'])
# def get_cow_details(cow_id):
#     # Get 'date' and 'period' from the query parameters
#     date_str = request.args.get('date', '2022-09-21')
#     period = request.args.get('period', 'daily')  # Default to 'daily' if not provided
    
#     if not date_str:
#         return jsonify({'error': 'Please provide a valid date'}), 400

#     try:
#         start_date = datetime.strptime(date_str, '%Y-%m-%d')
#     except ValueError:
#         return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400

#     # Initialize lists for storing the start date and other dates
#     start_date_list = []
#     other_dates_list = []

#     # Determine the end date based on the specified period
#     if period == 'daily':
#         end_date = start_date - timedelta(days=6)  # Return data for 7 days, including the start date
#     elif period == 'weekly':
#         end_date = start_date - timedelta(weeks=4)  # Return data for 4 weeks
#     elif period == 'monthly':
#         end_date = start_date - pd.DateOffset(months=12)  # Return data for 12 months
#     else:
#         return jsonify({'error': 'Invalid period. Choose from "daily", "weekly", or "monthly".'}), 400
    
#     # Store the start date in its own list
#     start_date_list.append(start_date.strftime('%Y-%m-%d'))
    
#     # Generate other dates by iterating from end_date to the day before start_date
#     current_date = end_date
#     while current_date < start_date:
#         other_dates_list.append(current_date.strftime('%Y-%m-%d'))
#         current_date += timedelta(days=1)

#     # Generate the date range and load the data
#     date_range = generate_date_range(start_date=end_date, end_date=start_date)
#     data = load_behavior_data(date_range)

#     num_days = len(other_dates_list)

#     if data is not None:
#         # Filter the data by both the Cow ID and the Date
#         cow_data = data[data['Cow ID'] == cow_id]

#         if not cow_data.empty:
#             # Separate cow data based on 'start_date' and 'other_dates'
#             cow_data_start = cow_data[cow_data['Date'] == start_date.strftime('%Y-%m-%d')]
#             cow_data_others = cow_data[cow_data['Date'].isin(other_dates_list)]

#             # Calculate total behavior times
#             total_behavior_start = calculate_total_behavior(cow_data_start)
#             total_behavior_others = calculate_total_behavior(cow_data_others)
            
#             # Ensure all totals are serializable (convert numbers to float)
#             total_behavior_start = {k: float(v) for k, v in total_behavior_start.items()}
#             total_behavior_others = {k: float(v) for k, v in total_behavior_others.items()}
            
#             # Calculate average behavior over other days
#             avg_behavior_others = {behavior: total / num_days for behavior, total in total_behavior_others.items()}

#             # Ensure the averages are serializable (convert to float if needed)
#             avg_behavior_others = {k: float(v) for k, v in avg_behavior_others.items()}

#             # Return the cow data, start date, other dates, and total/average times in the response
#             return jsonify({
#                 "cow_data_start": cow_data_start.to_dict(orient='records'),  # Data for the start date
#                 "cow_data_others": cow_data_others.to_dict(orient='records'),  # Data for other dates
#                 "start_date": start_date_list,  # The start date in a separate list
#                 "other_dates": other_dates_list,  # Other past dates in a different list
#                 "total_behavior_start": total_behavior_start,  # Total behavior time for start date
#                 "total_behavior_others": total_behavior_others,  # Total behavior time for other dates
#                 "avg_behavior_others": avg_behavior_others  # Average behavior time for other dates
#             })
#         else:
#             return jsonify({"error": f"Cow ID '{cow_id}' not found"}), 404
#     else:
#         return jsonify({'error': 'No data found for the given date range'}), 404









@app.route('/cow/<cow_id>', methods=['GET'])
def get_cow_details(cow_id):
    # Get 'date' and 'period' from the query parameters
    date_str = request.args.get('date', '2022-09-21')
    period = request.args.get('period', 'monthly')  # Default to 'daily' if not provided
    # date_str='2023-09-21'
    # period='daily'

    all_data_cow=get_cow_data_by_id(cow_id)
    if all_data_cow is not None:
        behavior_sums = get_behavior_sums_by_day(all_data_cow)

        # Store the behavior sums for each day in a dictionary
        cow_behavior_dict = {}

        for date, totals in behavior_sums.items():
            cow_behavior_dict[date] = {
                "total_eating": totals['total_eating'],
                "total_lying": totals['total_lying'],
                "total_standing": totals['total_standing']
            }
        cow_behavior_dict = convert_to_serializable(cow_behavior_dict)


    if not date_str:
        return jsonify({'error': 'Please provide a valid date'}), 400

    try:
        start_date = datetime.strptime(date_str, '%Y-%m-%d')
    except ValueError:
        return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400

    # Initialize lists for storing the start date and other dates
    start_date_list = []
    other_dates_list = []

    # Determine the end date based on the specified period
    if period == 'daily':
        end_date = start_date - timedelta(days=6)  # Return data for 7 days, including the start date
    elif period == 'weekly':
        end_date = start_date - timedelta(weeks=4)  # Return data for 4 weeks
    elif period == 'monthly':
        end_date = start_date - pd.DateOffset(months=12)  # Return data for 12 months
    else:
        return jsonify({'error': 'Invalid period. Choose from "daily", "weekly", or "monthly".'}), 400
    
    # Store the start date in its own list
    start_date_list.append(start_date.strftime('%Y-%m-%d'))
    
    # Generate other dates by iterating from end_date to the day before start_date
    current_date = end_date
    while current_date < start_date:
        other_dates_list.append(current_date.strftime('%Y-%m-%d'))
        current_date += timedelta(days=1)

    # Generate the date range and load the data
    date_range = generate_date_range(start_date=end_date, end_date=start_date)
    data = load_behavior_data(date_range)

    if data is not None:
        # Filter the data by both the Cow ID and the Date
        cow_data = data[data['Cow ID'] == cow_id]

        if not cow_data.empty:


            if period == 'daily':
                # Initialize a list to store daily behavior data in the required format
                weekly_data = []

                # Group the data by each date
                grouped_by_date = cow_data.groupby('Date')

                # Variables to store cumulative totals for calculating the 7-day average
                cumulative_totals = {"total_eating": 0, "total_lying": 0, "total_standing": 0}
                total_days = len(other_dates_list)  # Assuming we have exactly 7 days of data

                # Iterate through each group (date) and calculate total behavior times
                day_counter = 1  # For naming the days (Day 1, Day 2, etc.)
                for date, group in grouped_by_date:
                    total_behavior = calculate_total_behavior(group)
                    
                    # Convert the daily totals from minutes to hours and round to the nearest integer
                    daily_totals = {k: int(round(float(v) / 60)) for k, v in total_behavior.items()}
                    
                    # Add the daily totals to the cumulative totals
                    cumulative_totals = {k: cumulative_totals[k] + daily_totals[k] for k in cumulative_totals.keys()}

                    # Add the daily behavior data to the weekly_data list in the desired format
                    weekly_data.append({
                        "name": f"Day {day_counter}",
                        "standing": daily_totals["total_standing"],
                        "eating": daily_totals["total_eating"],
                        "lyingDown": daily_totals["total_lying"]
                    })
                    
                    day_counter += 1

                # Calculate the average behavior for the 7-day period and round to the nearest integer
                average_behavior = {k: int(round(cumulative_totals[k] / total_days)) for k in cumulative_totals.keys()}

                # Return the cow data and the weekly formatted data
                return jsonify({
                    # "cow_data": cow_data.to_dict(orient='records'),  # Data for the cow
                    "weeklyData": weekly_data, 
                     "data":cow_behavior_dict # Behavior data for each of the 7 days
                    # # "average_7_days_behavior": {
                    #     "standing": average_behavior["total_standing"],
                    #     "eating": average_behavior["total_eating"],
                    #     "lyingDown": average_behavior["total_lying"]
                    # },  # 7-day average behavior in hours (rounded)
                    # "start_date": start_date_list,  # The start date in a separate list
                    # "other_dates": other_dates_list  # Other past dates in a different list
                })

            

            elif period == 'weekly':
                # Initialize a list to store weekly data in the required format
                weekly_data = []

                total_weeks = 4  # Limit to 4 weeks

                # Split `other_dates_list` into 4 weeks, each containing 7 days
                weeks = [other_dates_list[i:i + 7] for i in range(0, min(len(other_dates_list), 28), 7)]

                # Ensure we have exactly 4 weeks (4 sets of 7 days)
                for week_num, week_dates in enumerate(weeks, start=1):
                    week_data = cow_data[cow_data['Date'].isin(week_dates)]

                    if not week_data.empty:
                        # Calculate the total and average behavior for this week
                        total_behavior_week = calculate_total_behavior(week_data)

                        # Convert behavior values from minutes to hours and round them to integers
                        avg_behavior_week = {k: int(round(float(v) / 60 / 7)) for k, v in total_behavior_week.items()}

                        # Append the weekly behavior data to the list in the required format
                        weekly_data.append({
                            "name": str(week_num),  # Week number as the name
                            "standing": avg_behavior_week.get("total_standing", 0),
                            "eating": avg_behavior_week.get("total_eating", 0),
                            "lyingDown": avg_behavior_week.get("total_lying", 0)
                        })

                # Return the weekly data in the requested format
                return jsonify({
                    "weeklyData": weekly_data,
                    "data":cow_behavior_dict # Behavior data for each of the 7 days
 # List of weekly behavior data
                })

            elif period == 'monthly':               # Initialize a list to store monthly data in the required format
                monthly_data = []

                # Get the last 12 months starting from the start_date
                current_date = start_date
                for i in range(12):
                    # Get the start and end of the current month
                    month_start = current_date.replace(day=1)
                    next_month_start = (month_start + pd.DateOffset(months=1)).replace(day=1)
                    month_end = next_month_start - timedelta(days=1)
                    
                    # Filter cow data for the current month
                    month_data = cow_data[(cow_data['Date'] >= month_start.strftime('%Y-%m-%d')) & 
                                        (cow_data['Date'] <= month_end.strftime('%Y-%m-%d'))]
                    
                    # Calculate total behavior times for the month
                    total_behavior_month = calculate_total_behavior(month_data)
                    
                    # Convert the totals to hours (currently in minutes) and round to integers
                    total_behavior_month = {k: int(round(float(v) / 60)) for k, v in total_behavior_month.items()}
                    
                    # Calculate average behavior times for the month (if there are enough days of data)
                    num_days_in_month = month_data['Date'].nunique()  # Number of unique days in the month
                    if num_days_in_month > 0:
                        avg_behavior_month = {k: int(round(float(v) / num_days_in_month)) for k, v in total_behavior_month.items()}
                    else:
                        avg_behavior_month = {k: 0 for k in total_behavior_month.keys()}  # Handle empty months
                    
                    # Add the monthly behavior data to the list in the desired format
                    monthly_data.append({
                        "name": f"{i+1}",  # Month number as the name
                        "standing": avg_behavior_month["total_standing"],
                        "eating": avg_behavior_month["total_eating"],
                        "lyingDown": avg_behavior_month["total_lying"]
                    })
                    
                    # Move to the previous month
                    current_date = month_start - pd.DateOffset(months=1)

                # Return the monthly data in the requested format
                return jsonify({
                    "monthlyData": monthly_data,
                    "data":cow_behavior_dict 
                })

 
            else:
                # Separate cow data based on 'start_date' and 'other_dates'
                cow_data_start = cow_data[cow_data['Date'] == start_date.strftime('%Y-%m-%d')]
                cow_data_others = cow_data[cow_data['Date'].isin(other_dates_list)]

                # Calculate total behavior times
                total_behavior_start = calculate_total_behavior(cow_data_start)
                total_behavior_others = calculate_total_behavior(cow_data_others)

                # Ensure all totals are serializable (convert numbers to float)
                total_behavior_start = {k: float(v) for k, v in total_behavior_start.items()}
                total_behavior_others = {k: float(v) for k, v in total_behavior_others.items()}

                # Calculate average behavior over other days
                num_days = len(other_dates_list)
                avg_behavior_others = {behavior: total / num_days for behavior, total in total_behavior_others.items()}
                avg_behavior_others = {k: float(v) for k, v in avg_behavior_others.items()}

                # Return the cow data, start date, other dates, and total/average times in the response
                return jsonify({
                    "cow_data_start": cow_data_start.to_dict(orient='records'),  # Data for the start date
                    "cow_data_others": cow_data_others.to_dict(orient='records'),  # Data for other dates
                    "start_date": start_date_list,  # The start date in a separate list
                    "other_dates": other_dates_list,  # Other past dates in a different list
                    "total_behavior_start": total_behavior_start,  # Total behavior time for start date
                    "total_behavior_others": total_behavior_others,  # Total behavior time for other dates
                    "avg_behavior_others": avg_behavior_others  # Average behavior time for other dates
                })
        else:
            return jsonify({"error": f"Cow ID '{cow_id}' not found"}), 404
    else:
        return jsonify({'error': 'No data found for the given date range'}), 404







# 


            # elif period == 'weekly':
            #     # Initialize a dictionary to store each week's total, average behavior, and dates
            #     weekly_averages = {}
            #     total_weeks = 4  # Limit to 4 weeks

            #     # Split `other_dates_list` into 4 weeks, each containing 7 days
            #     weeks = [other_dates_list[i:i + 7] for i in range(0, min(len(other_dates_list), 28), 7)]
                
            #     # Ensure we have exactly 4 weeks (4 sets of 7 days)
            #     for week_num, week_dates in enumerate(weeks, start=1):
            #         week_data = cow_data[cow_data['Date'].isin(week_dates)]

            #         if not week_data.empty:
            #             # Calculate the total and average behavior for this week
            #             total_behavior_week = calculate_total_behavior(week_data)
                        
            #             # Convert all values to Python `int` types to avoid serialization issues
            #             total_behavior_week = {k: int(v) for k, v in total_behavior_week.items()}

            #             # Convert behavior values from minutes to hours and round them to integers
            #             avg_behavior_week = {k: int(round(float(v) / 60 / 7)) for k, v in total_behavior_week.items()}



            #             # avg_behavior_week = ''

            #             # Get the start and end date for the current week
            #             week_start_date = week_dates[0]
            #             week_end_date = week_dates[-1]

            #             # Store the total, averages, and start/end date under week_1, week_2, etc.
            #             week_key = f"week_{week_num}"
            #             weekly_averages[week_key] = {
            #                 "total_eating": total_behavior_week.get("total_eating", 0),
            #                 "total_standing": total_behavior_week.get("total_standing", 0),
            #                 "total_lying": total_behavior_week.get("total_lying", 0),
            #                 "avg_total_eating": avg_behavior_week.get("total_eating", 0),
            #                 "avg_total_standing": avg_behavior_week.get("total_standing", 0),
            #                 "avg_total_lying": avg_behavior_week.get("total_lying", 0),
            #                 # "week_start_date": week_start_date,
            #                 # "week_end_date": week_end_date
            #             }

            #     # Return the weekly averages in the requested format
            #     return jsonify({
            #         "weekly": weekly_averages,  # Behavior totals and averages for each week
            #         # "start_date": start_date_list,  # The start date in a separate list
            #         # "other_dates": other_dates_list[:total_weeks * 7]  # Limit to dates in the range of 4 weeks
            #     })


            # if period == 'daily':
            #     # Initialize a dictionary to store behavior totals for each date
            #     daily_behavior_totals = {}

            #     # Group the data by each date
            #     grouped_by_date = cow_data.groupby('Date')

            #     # Variables to store cumulative totals for calculating the 7-day average
            #     cumulative_totals = {"total_eating": 0, "total_lying": 0, "total_standing": 0}
            #     total_days = len(other_dates_list)  # Assuming we have exactly 7 days of data

            #     # Iterate through each group (date) and calculate total behavior times
            #     for date, group in grouped_by_date:
            #         total_behavior = calculate_total_behavior(group)
                    
            #         # Convert the daily totals from minutes to hours and round to the nearest integer
            #         daily_totals = {k: int(round(float(v) / 60)) for k, v in total_behavior.items()}
                    
            #         # Add the daily totals to the cumulative totals
            #         cumulative_totals = {k: cumulative_totals[k] + daily_totals[k] for k in cumulative_totals.keys()}
                    
            #         # Store the daily totals
            #         daily_behavior_totals[date] = daily_totals

            #     # Calculate the average behavior for the 7-day period and round to the nearest integer
            #     average_behavior = {k: int(round(cumulative_totals[k] / total_days)) for k in cumulative_totals.keys()}

            #     # Return the cow data, behavior totals for each date, and the 7-day average
            #     return jsonify({
            #         "cow_data": cow_data.to_dict(orient='records'),  # Data for the cow
            #         "7_days_behavior_totals": daily_behavior_totals,  # Behavior totals for each date
            #         "average_7_days_behavior": average_behavior,  # 7-day average behavior in hours (rounded)
            #         "start_date": start_date_list,  # The start date in a separate list
            #         "other_dates": other_dates_list  # Other past dates in a different list
            #     })


            # elif period == 'monthly':
            #     # Initialize a dictionary to store monthly data
            #     monthly_data = {}
                
            #     # Get the last 12 months starting from the start_date
            #     current_date = start_date
            #     for i in range(12):
            #         # Get the start and end of the current month
            #         month_start = current_date.replace(day=1)
            #         next_month_start = (month_start + pd.DateOffset(months=1)).replace(day=1)
            #         month_end = next_month_start - timedelta(days=1)
                    
            #         # Filter cow data for the current month
            #         month_data = cow_data[(cow_data['Date'] >= month_start.strftime('%Y-%m-%d')) & 
            #                             (cow_data['Date'] <= month_end.strftime('%Y-%m-%d'))]
                    
            #         # Calculate total behavior times for the month
            #         total_behavior_month = calculate_total_behavior(month_data)
                    
            #         # Convert the totals to hours (currently in minutes) and round to integers
            #         total_behavior_month = {k: int(round(float(v) / 60)) for k, v in total_behavior_month.items()}
                    
            #         # Calculate average behavior times for the month (if there are enough days of data)
            #         num_days_in_month = month_data['Date'].nunique()  # Number of unique days in the month
            #         if num_days_in_month > 0:
            #             avg_behavior_month = {k: int(round(float(v) / num_days_in_month)) for k, v in total_behavior_month.items()}
            #         else:
            #             avg_behavior_month = {k: 0 for k in total_behavior_month.keys()}  # Handle empty months
                    
            #         # Store the start and end dates for the month, along with totals and averages
            #         monthly_data[f'month_{i+1}'] = {
            #             'start_date': month_start.strftime('%Y-%m-%d'),
            #             'end_date': month_end.strftime('%Y-%m-%d'),
            #             'total_behavior': total_behavior_month,
            #             'avg_behavior': avg_behavior_month
            #         }
                    
            #         # Move to the previous month
            #         current_date = month_start - pd.DateOffset(months=1)
                
            #     # Return the monthly data
            #     return jsonify({
            #         "monthly_data": monthly_data
            #     })

#


# Route for streaming numbers
@app.route('/stream')
def stream():
    def generate():
        total = random.randint(42, 50)  # Start with a random value between 42 and 50
        last_update_time = time.time()  # To keep track of the last time we modified the total
        while True:  # Infinite loop to keep streaming
            current_time = time.time()

            # Every 15 seconds, either add or subtract a random value (1-5)
            if current_time - last_update_time >= 15:
                # Randomly decide whether to add or subtract
                operation = random.choice(['add', 'subtract'])
                change_value = random.randint(1, 5)

                if operation == 'subtract':
                    total -= change_value
                    if total < 42:  # Ensure the total doesn't go below 42
                        total = 42
                elif operation == 'add':
                    total += change_value
                    if total > 50:  # Ensure the total doesn't go above 50
                        total = 50

                last_update_time = current_time

            # Send the total number every 10 seconds
            yield f"data: {total}\n\n"
            time.sleep(10)  # Send response every 10 seconds

    return Response(generate(), mimetype='text/event-stream')



def get_weekly_behavior(end_date_str, cow_id=None):
    end_date = datetime.strptime(end_date_str, '%Y-%m-%d')
    start_date = end_date - timedelta(days=6)
    dates = [start_date + timedelta(days=i) for i in range(7)]
    
    weekly_data = []
    for date in dates:
        date_str = date.strftime('%Y-%m-%d')
        data = load_behavior_data(date_str)
        if data is not None:
            weekly_data.append(data)
    
    if weekly_data:
        weekly_df = pd.concat(weekly_data)
        
        # Clean column names and ensure proper types
        weekly_df.columns = weekly_df.columns.str.strip()
        weekly_df['Cow ID'] = weekly_df['Cow ID'].astype(str)
        numeric_cols = ['Lying Time (min)', 'Standing Time (min)', 'Eating Time (min)', 'Temperature (°C)']
        weekly_df[numeric_cols] = weekly_df[numeric_cols].apply(pd.to_numeric, errors='coerce')
        weekly_df[numeric_cols].fillna(0, inplace=True)

        # Filter by cow_id if provided
        if cow_id:
            weekly_df = weekly_df[weekly_df['Cow ID'] == cow_id]
        
        # Group by 'Cow ID' and calculate the total sum of numeric columns
        weekly_trends = weekly_df.groupby('Cow ID')[numeric_cols].sum()
        
        # Convert time columns from minutes to hours
        time_cols = ['Lying Time (min)', 'Standing Time (min)', 'Eating Time (min)']
        weekly_trends = convert_minutes_to_hours(weekly_trends, time_cols)
        
        return weekly_trends.to_dict()
    else:
        return {}


def get_daily_behavior(date_str, cow_id=None):
    # Load behavior data for the specified date
    data = load_behavior_data(date_str)
    
    if data is not None:
        # Clean column names and ensure proper types
        data.columns = data.columns.str.strip()
        data['Cow ID'] = data['Cow ID'].astype(str)
        numeric_cols = ['Lying Time (min)', 'Standing Time (min)', 'Eating Time (min)', 'Temperature (°C)']
        data[numeric_cols] = data[numeric_cols].apply(pd.to_numeric, errors='coerce')
        data[numeric_cols] = data[numeric_cols].copy()

        data[numeric_cols].fillna(0, inplace=True)

        # Filter by cow_id if provided
        if cow_id:
            data = data[data['Cow ID'] == cow_id]

        # Group by 'Cow ID' and calculate the sum for the day
        daily_trends = data.groupby('Cow ID')[numeric_cols].sum()
        
        # Convert time columns from minutes to hours
        time_cols = ['Lying Time (min)', 'Standing Time (min)', 'Eating Time (min)']
        daily_trends = convert_minutes_to_hours(daily_trends, time_cols)
        
        return daily_trends.to_dict()
    else:
        return pd.DataFrame()



def get_monthly_behavior(year_month_str, cow_id=None):
    year, month = map(int, year_month_str.split('-'))
    _, num_days_in_month = calendar.monthrange(year, month)
    start_date = datetime(year, month, 1)
    end_date = datetime(year, month, num_days_in_month)
    
    dates = [start_date + timedelta(days=i) for i in range(num_days_in_month)]
    
    monthly_data = []
    for date in dates:
        date_str = date.strftime('%Y-%m-%d')
        data = load_behavior_data(date_str)
        if data is not None:
            monthly_data.append(data)
    
    if monthly_data:
        monthly_df = pd.concat(monthly_data)
        
        # Clean column names and ensure proper types
        monthly_df.columns = monthly_df.columns.str.strip()
        monthly_df['Cow ID'] = monthly_df['Cow ID'].astype(str)
        numeric_cols = ['Lying Time (min)', 'Standing Time (min)', 'Eating Time (min)', 'Temperature (°C)']
        monthly_df[numeric_cols] = monthly_df[numeric_cols].apply(pd.to_numeric, errors='coerce')

        monthly_df[numeric_cols].fillna(0, inplace=True)

        # Filter by cow_id if provided
        if cow_id:
            monthly_df = monthly_df[monthly_df['Cow ID'] == cow_id]
        
        # Group by 'Cow ID' and calculate the total sum of numeric columns for the month
        monthly_trends = monthly_df.groupby('Cow ID')[numeric_cols].sum()
        
        # Convert time columns from minutes to hours
        time_cols = ['Lying Time (min)', 'Standing Time (min)', 'Eating Time (min)']
        monthly_trends = convert_minutes_to_hours(monthly_trends, time_cols)

        return monthly_trends.to_dict()
    else:
        return {}



@app.route('/api/behavior/trends', methods=['GET'])
def behavior_trends():
    # Get the type of trend from query parameters: 'weekly', 'monthly', or 'daily'
    trend_type = request.args.get('trend_type', 'daily')  # Default to 'daily' if not provided
    date = request.args.get('date')  # The date parameter (should be in 'YYYY-MM-DD' format)
    cow_id = request.args.get('cow_id')  # Optional cow ID parameter

    if not date:
        return jsonify({'error': 'Date is required'}), 400

    if trend_type == 'daily':
        # Daily behavior trends
        data = load_behavior_data(date)
        if data is not None:
            daily_trends = get_daily_behavior(date, cow_id)  # Pass cow_id
            return jsonify({'trends': daily_trends})
        else:
            return jsonify({'error': 'Date not found'}), 404

    elif trend_type == 'weekly':
        # Weekly behavior trends
        weekly_trends = get_weekly_behavior(date, cow_id)  # Pass cow_id
        if weekly_trends:
            return jsonify({'trends': weekly_trends})
        else:
            return jsonify({'error': 'Data not found for the week'}), 404

    elif trend_type == 'monthly':
        # Monthly behavior trends
        try:
            year_month = '-'.join(date.split('-')[:2])  # Extract 'YYYY-MM' from 'YYYY-MM-DD'
            monthly_trends = get_monthly_behavior(year_month, cow_id)  # Pass cow_id
            if monthly_trends:
                return jsonify({'trends': monthly_trends})
            else:
                return jsonify({'error': 'Data not found for the month'}), 404
        except ValueError:
            return jsonify({'error': 'Invalid date format'}), 400

    else:
        # Invalid trend_type
        return jsonify({'error': 'Invalid trend_type. Use "daily", "weekly", or "monthly".'}), 400



    
# Function to load data for a specific date range or the entire directory
def load_behavior_data_with_weather(start_date=None, end_date=None):
    all_data = []
    
    # List all files in the directory
    for file_name in os.listdir(DATA_DIR):
        # Extract the date from the file name (e.g., 2022-09-07.csv -> 2022-09-07)
        file_date_str = file_name.replace('.csv', '')

        # Check if the date falls within the desired range (if specified)
        if start_date and end_date:
            if not (start_date <= file_date_str <= end_date):
                continue

        # Construct full file path
        file_path = os.path.join(DATA_DIR, file_name)

        # Load CSV data
        data = pd.read_csv(file_path)
        all_data.append(data)

    # Combine all the data into a single DataFrame
    if all_data:
        combined_data = pd.concat(all_data, ignore_index=True)
        return combined_data
    else:
        print(f"No data found between {start_date} and {end_date}")
        return None



def get_week_start_end(date_str):
    # Convert the input string to a date object
    date = datetime.strptime(date_str, '%Y-%m-%d')

    # Find the start of the week (Monday)
    week_start = date - timedelta(days=date.weekday())

    # Find the end of the week (Sunday)
    week_end = week_start + timedelta(days=6)

    # Return the start and end dates as strings in 'YYYY-MM-DD' format
    return week_start.strftime('%Y-%m-%d'), week_end.strftime('%Y-%m-%d')




def get_month_start_end(year_month):
    # Split 'YYYY-MM' into year and month components
    year, month = map(int, year_month.split('-'))

    # Calculate the first day of the month
    month_start = datetime(year, month, 1)

    # Calculate the last day of the month
    _, last_day = calendar.monthrange(year, month)
    month_end = datetime(year, month, last_day)

    # Return the start and end dates as strings in 'YYYY-MM-DD' format
    return month_start.strftime('%Y-%m-%d'), month_end.strftime('%Y-%m-%d')

# API endpoint to return weather-based behavior trends
@app.route('/api/behavior/weather_impact', methods=['GET'])
def weather_impact():
    # Get the type of trend from query parameters: 'weekly', 'monthly', or 'daily'
    trend_type = request.args.get('trend_type', 'daily')  # Default to 'daily' if not provided
    date = request.args.get('date')  # The date parameter (should be in 'YYYY-MM-DD' format)

    if not date:
        return jsonify({'error': 'Date is required'}), 400

    if trend_type == 'daily':
        # Load daily behavior data with weather for the specified date
        data = load_behavior_data_with_weather(date, date)
        if data is not None:
            weather_impact_totals = data.groupby('Weather Condition')[['Lying Time (min)', 'Standing Time (min)', 'Eating Time (min)']].sum()
            time_cols = ['Lying Time (min)', 'Standing Time (min)', 'Eating Time (min)']
            weather_impact_totals = convert_minutes_to_hours(weather_impact_totals, time_cols)
            weather_impact_dict = weather_impact_totals.to_dict()
            return jsonify({'weather_impact': weather_impact_dict})
        else:
            return jsonify({'error': 'No data found for the given date'}), 404

    elif trend_type == 'weekly':
        # Calculate the start and end date of the week containing the given date
        week_start, week_end = get_week_start_end(date)
        data = load_behavior_data_with_weather(week_start, week_end)
        if data is not None:
            weather_impact_totals = data.groupby('Weather Condition')[['Lying Time (min)', 'Standing Time (min)', 'Eating Time (min)']].sum()
            time_cols = ['Lying Time (min)', 'Standing Time (min)', 'Eating Time (min)']
            weather_impact_totals = convert_minutes_to_hours(weather_impact_totals, time_cols)
            weather_impact_dict = weather_impact_totals.to_dict()
            return jsonify({'weather_impact': weather_impact_dict})
        else:
            return jsonify({'error': 'No data found for the given week'}), 404

    elif trend_type == 'monthly':
        # Extract the month and year from the provided date
        try:
            year_month = '-'.join(date.split('-')[:2])  # Extract 'YYYY-MM' from 'YYYY-MM-DD'
            month_start, month_end = get_month_start_end(year_month)
            data = load_behavior_data_with_weather(month_start, month_end)
            if data is not None:
                weather_impact_totals = data.groupby('Weather Condition')[['Lying Time (min)', 'Standing Time (min)', 'Eating Time (min)']].sum()
                time_cols = ['Lying Time (min)', 'Standing Time (min)', 'Eating Time (min)']
                weather_impact_totals = convert_minutes_to_hours(weather_impact_totals, time_cols)
                weather_impact_dict = weather_impact_totals.to_dict()
                return jsonify({'weather_impact': weather_impact_dict})
            else:
                return jsonify({'error': 'No data found for the given month'}), 404
        except ValueError:
            return jsonify({'error': 'Invalid date format'}), 400

    else:
        # Invalid trend_type
        return jsonify({'error': 'Invalid trend_type. Use "daily", "weekly", or "monthly".'}), 400






def detect_health_issues(behavior_data):
    """
    Detect potential health issues based on behavior data.
    Args:
        behavior_data: DataFrame or dictionary containing behavior data for cows.
    Returns:
        A dictionary containing potential health issues for each cow.
    """

    # Convert to DataFrame if it's a dictionary
    if isinstance(behavior_data, dict):
        behavior_data = pd.DataFrame.from_dict(behavior_data)

    health_issues = {}

    for cow_id, row in behavior_data.iterrows():
        issues = []

        # Lying Time
        lying_time_hours = row['Lying Time (min)'] / 60
        if lying_time_hours < 8:
            issues.append('Possible lameness, discomfort, or heat stress (Lying Time < 8 hours)')
        elif lying_time_hours > 12:
            issues.append('Postpartum fatigue, metabolic disorders, or illness (Lying Time > 12 hours)')

        # Eating Time
        eating_time_hours = row['Eating Time (min)'] / 60
        if eating_time_hours < 3:
            issues.append('Poor feed quality or illness (Eating Time < 3 hours)')
        elif eating_time_hours > 6:
            issues.append('Nutritional deficiency or stress-related overeating (Eating Time > 6 hours)')

        # Standing Time
        standing_time_hours = row['Standing Time (min)'] / 60
        if standing_time_hours < 4:
            issues.append('Possible lameness or fatigue (Standing Time < 4 hours)')
        elif standing_time_hours > 8:
            issues.append('Inadequate lying area or stress (Standing Time > 8 hours)')

        # If no issues were detected, mark cow as healthy
        if not issues:
            issues.append('No health issues detected')

        health_issues[cow_id] = issues

    return health_issues


@app.route('/api/behavior/health', methods=['GET'])
def health_monitoring():
    # Get the type of trend and date from query parameters
    trend_type = request.args.get('trend_type', 'daily')
    date = request.args.get('date')

    if not date:
        return jsonify({'error': 'Date is required'}), 400

    # Load behavior data (use existing helper functions for daily, weekly, or monthly)
    if trend_type == 'daily':
        behavior_data = get_daily_behavior(date)
    elif trend_type == 'weekly':
        behavior_data = get_weekly_behavior(date)
    elif trend_type == 'monthly':
        behavior_data = get_monthly_behavior(date)
    else:
        return jsonify({'error': 'Invalid trend_type'}), 400

    if not behavior_data:
        return jsonify({'error': 'No data found for the given date or period'}), 404

    # Detect health issues based on the behavior data
    health_issues = detect_health_issues(behavior_data)

    return jsonify({'health_issues': health_issues})




# Determine the predominant behavior for a cow in a given time frame
def determine_behavior(row):
    behavior_times = {
        'Lying': row['Lying Time (min)'],
        'Standing': row['Standing Time (min)'],
        'Eating': row['Eating Time (min)']
    }
    return max(behavior_times, key=behavior_times.get)

# Track transitions between behaviors for each cow
def track_transitions(start_date='2022-09-08', end_date='2022-09-14'):
    print("track_transitions")
    print("track_transitions")
    print("track_transitions")
    print("track_transitions")
    print("track_transitions")
    print("track_transitions")
    print("track_transitions")
    print("track_transitions")
    print("track_transitions")
    print(start_date)
    print(start_date)
    print(start_date)
    print(start_date)
    print("start_date")
    print("end_date")
    print(end_date)
    print(end_date)
    print(end_date)
    print(end_date)
    print(end_date)
    behaviors = ['Lying', 'Standing', 'Eating']  # The behaviors we're tracking

    transitions = defaultdict(lambda: {behavior: {next_behavior: 0 for next_behavior in behaviors} for behavior in behaviors})

    current_date = pd.to_datetime(start_date)
    end_date = pd.to_datetime(end_date)

    # Iterate over each date in the range
    while current_date <= end_date:
        date_str = current_date.strftime('%Y-%m-%d')
        df = load_behavior_data(date_str)
        
        if df is not None:
            df['Predominant Behavior'] = df.apply(determine_behavior, axis=1)

            # Track transitions for each cow
            for cow_id in df['Cow ID'].unique():
                cow_data = df[df['Cow ID'] == cow_id]
                previous_behavior = None
                
                for _, row in cow_data.iterrows():
                    current_behavior = row['Predominant Behavior']
                    if previous_behavior is not None and previous_behavior != current_behavior:
                        transitions[cow_id][previous_behavior][current_behavior] += 1
                    previous_behavior = current_behavior

        current_date += pd.DateOffset(days=1)

    return transitions

# API endpoint to return behavior transitions
@app.route('/api/behavior/transitions', methods=['GET'])
def behavior_transitions():
    # Get the type of trend from query parameters: 'daily', 'weekly', or 'monthly'
    trend_type = request.args.get('trend_type', 'daily')  # Default to 'daily' if not provided
    date = request.args.get('date')  # The date parameter (should be in 'YYYY-MM-DD' format)
    print(date)
    print(date)
    print(date)
    print(date)
    print(date)
    print(date)
    print(date)
    print(date)
    print(date)
    print(date)
    if not date:
        return jsonify({'error': 'Date is required'}), 400

    try:
        # Parse the date
        date_obj = datetime.strptime(date, '%Y-%m-%d')
    except ValueError:
        return jsonify({'error': 'Invalid date format. Use "YYYY-MM-DD".'}), 400

    if trend_type == 'daily':
        # Track behavior transitions for a single day
        transitions = track_transitions()
       
        print("track_transitions")
        print("track_transitions")
        print("track_transitions")
        print("track_transitions")
        print("track_transitions")
        print("track_transitions")
        print("track_transitions")
        print("track_transitions")
        print("track_transitions")
        print(track_transitions)
        print(track_transitions)
        print(track_transitions)
        if transitions:
            return jsonify(transitions)
        else:
            return jsonify({'error': 'No data found for the given date'}), 404

    elif trend_type == 'weekly':
        # Calculate the start and end date of the week containing the given date
        week_start = (date_obj - timedelta(days=date_obj.weekday())).strftime('%Y-%m-%d')  # Monday
        week_end = (date_obj + timedelta(days=6 - date_obj.weekday())).strftime('%Y-%m-%d')  # Sunday
        transitions = track_transitions(week_start, week_end)
        if transitions:
            return jsonify(transitions)
        else:
            return jsonify({'error': 'No data found for the given week'}), 404

    elif trend_type == 'monthly':
        # Calculate the start and end date of the month containing the given date
        month_start = date_obj.replace(day=1).strftime('%Y-%m-%d')
        next_month = date_obj.replace(day=28) + timedelta(days=4)  # Go to the next month and rewind to get the last day
        month_end = (next_month - timedelta(days=next_month.day)).strftime('%Y-%m-%d')
        transitions = track_transitions(month_start, month_end)
        if transitions:
            return jsonify(transitions)
        else:
            return jsonify({'error': 'No data found for the given month'}), 404

    else:
        # Invalid trend_type
        return jsonify({'error': 'Invalid trend_type. Use "daily", "weekly", or "monthly".'}), 400

# Function to load and filter data by date range
def load_feeding_data(start_date=None, end_date=None):
    directory = 'cattle_behavior_data/'  # Path to your CSV directory
    all_data = []

    # Parse the start and end dates
    if start_date:
        start_date = datetime.strptime(start_date, '%Y-%m-%d')
    if end_date:
        end_date = datetime.strptime(end_date, '%Y-%m-%d')

    # Read all CSV files and filter by date
    for file_name in os.listdir(directory):
        file_date = datetime.strptime(file_name.replace('.csv', ''), '%Y-%m-%d')

        if start_date and end_date:
            if start_date <= file_date <= end_date:
                file_path = os.path.join(directory, file_name)
                data = pd.read_csv(file_path)
                all_data.append(data)
        else:
            file_path = os.path.join(directory, file_name)
            data = pd.read_csv(file_path)
            all_data.append(data)

    if all_data:
        combined_data = pd.concat(all_data, ignore_index=True)
        return combined_data[['Cow ID', 'Eating Time (min)']]
    return None

# API endpoint to get feeding efficiency data by date range
@app.route('/api/feeding_efficiency', methods=['GET'])
def feeding_efficiency():
    # Get the date parameters from the query string (daily, weekly, or monthly)
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')

    # Load data based on the provided date range
    data = load_feeding_data(start_date, end_date)
    if data is None:
        return jsonify({"error": "No data available for the selected date range"}), 404

    # Calculate the herd average eating time
    herd_average = data['Eating Time (min)'].mean()

    # Create a list of cows with their eating times and comparison to the average
    result = []
    for _, row in data.iterrows():
        result.append({
            'Cow ID': row['Cow ID'],
            'Eating Time (min)': row['Eating Time (min)'],
            'belowAverage': row['Eating Time (min)'] < herd_average
        })

    return jsonify({
        'herdAverage': herd_average,
        'feedingData': result
    })



# Define the base URL for your app (adjust as per your app's setup)

RESULTS = {}  # Global dictionary to store video processing results

def process_video(video_path, csv_file_path, fps):
    """
    Function to process the video and progressively write results to a CSV file in the background.
    """
    global RESULTS
    RESULTS = {}  # Reset the RESULTS dictionary
    cap = cv2.VideoCapture(video_path)

    # Create the CSV file with headers based on class_map
    with open(csv_file_path, mode='w', newline='') as csv_file:
        fieldnames = ['frameNumber'] + list(class_map.values())
        writer = csv.DictWriter(csv_file, fieldnames=fieldnames)
        writer.writeheader()

        while True:
            ret, frame = cap.read()
            if not ret:
                break
            frame_number = int(cap.get(cv2.CAP_PROP_POS_FRAMES))
            if frame_number % int(fps) == 0:  # Extract one frame per second
                temp_frame_path = os.path.join(cache_dir, f"frame_{frame_number}.jpg")
                
                #resize the frame to 640x640
                resized_frame = cv2.resize(frame, (640, 640))
                cv2.imwrite(temp_frame_path, resized_frame)

                # Process the frame and get the results
                results, boxed_image_path = process_image(temp_frame_path)
                print(f"Results for frame {frame_number}: {results}")

                # Create a dictionary for the CSV row with 'nan' if a class is not detected
                row = {}
                for class_name in class_map.values():
                    detected = next((result for result in results if class_name in result), None)
                    if detected:
                        row[class_name] = list(detected.values())[0]
                    else:
                        row[class_name] = 'nan'

                # Write the row to the CSV file
                writer.writerow(row)

                # Construct the image URL manually using the base URL
                image_url = f"/cache/{os.path.basename(boxed_image_path)}"

                # Add the frame number, results, and boxed image URL to the RESULTS dictionary
                RESULTS[frame_number] = [row, {'frameNumber': frame_number ,"image_url": image_url}]
    
    cap.release()
    print(results)


@app.route('/zone_video', methods=['POST'])
def zone_video():
    """
    Handle the video upload, save it as 'uploaded_video' and replace it if it already exists.
    """
    global VIDEO_PATH
    print("Video upload request received")
    
    if 'video' not in request.files:
        return {'error': "No video part in the request"}, 400
    
    video_file = request.files['video']
    
    if video_file.filename == '':
        return {'error': "No selected file"}, 400
    
    video_path = os.path.join(cache_dir, video_file.filename)
    
    # Save the uploaded video
    video_file.save(video_path)
    print("Video saved successfully at:", video_path)
    
    if os.path.exists(video_path):
        VIDEO_PATH = video_path  # Update the global VIDEO_PATH
        print("Video path updated:", VIDEO_PATH)
    
    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS)
    cap.release()

    # Generate a CSV file name based on the current date
    current_date = datetime.now().strftime('%Y_%m_%d')
    csv_file_path = os.path.join(cache_dir, f'{current_date}.csv')
    print("CSV file will be saved at:", csv_file_path)

    # Process the video in a background thread
    threading.Thread(target=process_video, args=(video_path, csv_file_path, fps)).start()

    return {'message': "Video uploaded successfully. Processing started."}, 200


@app.route('/video_results', methods=['GET'])
def video_results():
    """
    Send the video processing results as JSON data.
    """
    global RESULTS

    # Check if the RESULTS global variable is populated
    if RESULTS:
        # Return the RESULTS as JSON data
        return jsonify(RESULTS)
    else:
        return {'error': 'Results not available or processing is still ongoing'}, 404

if __name__ == '__main__':
    app.run(debug=True)