from flask import Flask, request, render_template, redirect, url_for, send_from_directory
import os
import cv2
import torch
import numpy as np
from ultralytics import YOLO
import tempfile
from collections import defaultdict
import matplotlib
matplotlib.use('Agg')  # Use Agg backend for non-interactive plotting
import matplotlib.pyplot as plt
import pandas as pd
import time
import json

app = Flask(__name__)

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
print("class mapping : ",class_map)

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

def draw_bounding_boxes(result, image_path):
    # Load the image using OpenCV
    img = cv2.imread(image_path)

    # Define colors for each behavior
    colors = {
        "Lying down": (255, 0, 0),  # Blue
        "Eating": (0, 255, 0),      # Green
        "Standing": (0, 0, 255),    # Red
        "Unknown": (255, 255, 255)  # White
    }

    for behavior_box in result.boxes:
        x1, y1, x2, y2 = map(int, behavior_box.xyxy[0])
        behavior_class_id = int(behavior_box.cls.item())
        behavior_name = behaviours.get(behavior_class_id, "Unknown")

        # Choose the color based on the behavior
        color = colors.get(behavior_name, (255, 255, 255))  # Default to white if behavior not found

        # Draw a bounding box and label on the image
        cv2.rectangle(img, (x1, y1), (x2, y2), color, 2)
        cv2.putText(img, behavior_name, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.9, color, 2)

    # Save the modified image to the cache directory
    boxed_image_path = os.path.join(cache_dir, "boxed_" + os.path.basename(image_path))
    cv2.imwrite(boxed_image_path, img)

    return boxed_image_path


def process_image(image_path):
    results = []
    
    # To store the count of each behavior class
    behaviour_count = defaultdict(int)
    
    detection_model_result = behaviour_model.predict(image_path, conf=0.45)
    for result in detection_model_result:
        print("result: ", result)
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
    
    # Draw bounding boxes on the original image
    boxed_image_path = draw_bounding_boxes(result, image_path)

    # Create separate pie and bar charts
    create_charts(behaviour_count)
    
    return results, boxed_image_path

def create_charts(behaviour_count):
    # Generate pie chart
    labels = behaviour_count.keys()
    sizes = behaviour_count.values()
    
    # Pie chart
    plt.figure(figsize=(5, 5))
    plt.pie(sizes, labels=labels, autopct='%1.1f%%', startangle=140)
    plt.axis('equal')  # Equal aspect ratio ensures that pie is drawn as a circle.
    plt.title("Behavior Distribution (Pie Chart)")
    pie_chart_path = os.path.join(cache_dir, "behavior_pie_chart.png")
    plt.savefig(pie_chart_path)
    plt.close()
    
    # Bar chart with x-axis as behaviors and y-axis as count
    plt.figure(figsize=(5, 5))
    plt.bar(list(labels), list(sizes), color='skyblue')
    plt.ylabel("Count")
    plt.xlabel("Behaviors")
    plt.title("Behavior Distribution (Bar Chart)")
    bar_chart_path = os.path.join(cache_dir, "behavior_bar_chart.png")
    plt.savefig(bar_chart_path)
    plt.close()

@app.route('/analysis')
def analysis():
    return render_template('upload.html')

@app.route('/results', methods=['POST'])
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
        start_time = time.time()
        results, boxed_image_path = process_image(file_path)
        end_time = time.time()
        processing_time = round(end_time - start_time) 
        return render_template('results.html', 
                               results=results, 
                               image_url=url_for('cached_image', filename=os.path.basename(boxed_image_path)),
                               pie_chart='behavior_pie_chart.png',
                               bar_chart='behavior_bar_chart.png',
                               device = device,
                               time=processing_time)

@app.route('/cache/<filename>')
def cached_image(filename):
    return send_from_directory(cache_dir, filename)

def extract_date(filename):
    parts = filename.split('_')
    try:
        return pd.to_datetime(f"20{parts[0]}-{parts[1]}-{parts[2].split('.')[0]}")
    except:
        print(f"Unexpected file format: {filename}")
        return pd.NaT

@app.route('/dashboard', methods=['GET', 'POST'])
def dashboard():
    # Directory containing CSV files
    csv_dir = 'db'
    csv_files = [f for f in os.listdir(csv_dir) if f.endswith('.csv')]

    # Sort files, filtering out any that return NaT (not a time)
    csv_files = sorted(csv_files, key=extract_date)
    csv_files = [f for f in csv_files if extract_date(f) is not pd.NaT]

    # If no valid CSV files found, return an error message
    if not csv_files:
        return "No valid CSV files found."

    # Load the CSV data
    data = pd.read_csv(os.path.join(csv_dir, csv_files[-1]))
    cattle_columns = data.columns

    # Handle cattle selection
    selected_cattle = request.form.get('cattle') if request.method == 'POST' else cattle_columns[0]

    # Filter data for the selected cattle
    cattle_data = data[selected_cattle]
    previous_data = [pd.read_csv(os.path.join(csv_dir, f))[selected_cattle] for f in csv_files[:-1]]

    # Calculate averages for previous days (excluding the most recent one)
    avg_eating_previous = sum(d.value_counts().get('E', 0) for d in previous_data) / len(previous_data) / 12
    avg_lying_previous = sum(d.value_counts().get('L', 0) for d in previous_data) / len(previous_data) / 12

    # Get today's eating and lying down time
    eating_today = (cattle_data.value_counts().get('E', 0) * 5)/ 60
    lying_today = (cattle_data.value_counts().get('L', 0) * 5)/ 60

    # Perform basic analysis for all cattle
    lying_less_than_8 = []
    eating_less_than_4 = []
    lying_more_than_12 = []
    
    for cattle in cattle_columns:
        cattle_today_data = data[cattle]
        lying_today_cattle = (cattle_today_data.value_counts().get('L', 0) *  5) / 60
        eating_today_cattle = (cattle_today_data.value_counts().get('E', 0) * 5) / 60
        print("Cattle: ", cattle , "Lying: ", lying_today_cattle, "Eating: ", eating_today_cattle) 

        if lying_today_cattle < 8:
            lying_less_than_8.append(cattle)
        if eating_today_cattle < 4:
            eating_less_than_4.append(cattle)
        if lying_today_cattle > 12:
            lying_more_than_12.append(cattle)

    # Generate Bar Chart for Eating Time
    bar_chart_eating_path = os.path.join(cache_dir, 'bar_chart_eating.png')
    plt.figure(figsize=(8, 6))
    plt.bar(['Average', 'Today'], [avg_eating_previous, eating_today])
    plt.xlabel('Time Period')
    plt.ylabel('Eating Time (hours)')
    plt.title(f'Eating Time Comparison for {selected_cattle}')
    plt.savefig(bar_chart_eating_path)
    plt.close()

    # Generate Bar Chart for Lying Down Time
    bar_chart_lying_path = os.path.join(cache_dir, 'bar_chart_lying.png')
    plt.figure(figsize=(8, 6))
    plt.bar(['Average', 'Today'], [avg_lying_previous, lying_today])
    plt.xlabel('Time Period')
    plt.ylabel('Lying Down Time (hours)')
    plt.title(f'Lying Down Time Comparison for {selected_cattle}')
    plt.savefig(bar_chart_lying_path)
    plt.close()

    # Generate Pie Chart for today's data
    pie_chart_path = os.path.join(cache_dir, 'pie_chart.png')
    plt.figure(figsize=(6, 6))
    cattle_data.value_counts().plot.pie(autopct='%1.1f%%', colors=['#ff9999','#66b3ff','#99ff99'], labels=['Lying Down', 'Eating', 'Standing'])
    plt.title(f'Behavior Distribution for {selected_cattle}')
    plt.savefig(pie_chart_path)
    plt.close()

    # Initialize lists for storing average values and time sequence
    # average_index = []   
    time_sequence = []
    eating_time_sequence = []
    lying_time_sequence = []

    # Iterate through each file to compute the average index
    print("len(csv_files): ", len(csv_files))
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
    plt.savefig(plot_path)
    plt.close()

    return render_template('dashboard.html', cattle_columns=cattle_columns, selected_cattle=selected_cattle,
                           lying_less_than_8=lying_less_than_8,
                           eating_less_than_4=eating_less_than_4,
                           lying_more_than_12=lying_more_than_12,
                           pie_chart='pie_chart.png', bar_chart_eating='bar_chart_eating.png', 
                           bar_chart_lying='bar_chart_lying.png',
                           behavior_analysis='behavior_analysis.png'
                          )
                        
                        
@app.route('/video', methods=['POST'])
def upload_video():
    if 'video' not in request.files:
        return redirect(request.url)
    
    video_file = request.files['video']
    video_path = os.path.join(cache_dir, 'uploaded_video.mp4')
    video_file.save(video_path)
    
    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS)
    frame_results = []

    while True:
        ret, frame = cap.read()
        if not ret:
            break
        frame_number = int(cap.get(cv2.CAP_PROP_POS_FRAMES))
        if frame_number % int(fps) == 0:  # Extract one frame per second
            temp_frame_path = os.path.join(cache_dir, f"frame_{frame_number}.jpg")
            cv2.imwrite(temp_frame_path, frame)
            results, boxed_image_path = process_image(temp_frame_path)
            frame_results.append({
                'frameNumber': frame_number,
                'results': results,
                'boxedImage': os.path.basename(boxed_image_path)  # Store only the filename
            })
    
    cap.release()

    # Return results to the template for display
    return render_template('video_results.html', frame_results=frame_results)

# Route to send cached images
@app.route('/results/<filename>')
def send_image(filename):
    # This will serve the image from the cache directory
    return send_from_directory(cache_dir, filename)

@app.route('/')
def index():
    return render_template('video_upload.html')


if __name__ == "__main__":
    app.run(debug=True)