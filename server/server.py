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
# behaviour_model = YOLO(os.path.join("models", "behaviour_detection_model.pt"))
behaviour_model = YOLO(os.path.join("models", "newly_trained_behaviour.pt"))
shape_model = YOLO(os.path.join("models", "shape_detection_model.pt"))

behaviours = {0: "Lying down", 2: "Eating", 1: "Standing"}

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
            print("hereeeee is behaviour class ID", behavior_class_id ,type(result))
            
            # Check if the bounding box is inside the defined zone
            if is_inside_coordinates(x1, y1, x2, y2, COORDINATES) :
                # Set behavior to 'Eating' if inside coordinates
                if shape_classes:
                    result_str = {class_map[shape_classes[0]]: "Eating"}
                else:
                    result_str = {"Unknown": "Eating"}
                    
                behaviour_count["Eating"] += 1
                
            elif shape_classes:
                # Use the detected behavior if not inside the zone csv
                result_str = {class_map[shape_classes[0]]: behavior_name}
                behaviour_count[behavior_name] += 1
            else:
                # Handle unknown cases
                result_str = {"Unknown": behavior_name}

            results.append(result_str)
    
    # Draw bounding boxes on the image
    print("here it shows at draweing bouding box")
    print(result)
    print("end of the result")
    boxed_image_path = draw_bounding_boxes(result, image_path, COORDINATES)
    
    
    return results, boxed_image_path

    
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

def extract_date(filename):
    parts = filename.split('_')
    try:
        return pd.to_datetime(f"20{parts[0]}-{parts[1]}-{parts[2].split('.')[0]}")
    except:
        print(f"Unexpected file format: {filename}")
        return pd.NaT



VIDEO_PATH = ''
COORDINATES = {}
RESULTS = {}  # Global dictionary to store video processing results
processing_thread = None  # Thread variable to handle video processing
stop_event = threading.Event()  # Event to signal when to stop the current thread frame
csv_file_path = ''  # Global variable to store the current CSV file path
CAMERA = 'camera 1'

@app.route('/coordinates', methods=['POST'])
def handle_coordinates():
    """
    Handle coordinates data and start processing the video in a background thread.
    """
    global COORDINATES, VIDEO_PATH, processing_thread, stop_event, csv_file_path
    
    data = request.json
    # Save the coordinates data to a global variable
    COORDINATES = data
    print("Coordinates received: ", data)

    # Stop the ongoing processing thread if it exists
    if processing_thread and processing_thread.is_alive():
        print("Stopping current video processing...")
        stop_event.set()  # Signal the thread to stop
        processing_thread.join()  # Wait for the thread to stop
        stop_event.clear()  # Reset the stop event for future threads

        # Delete the previous CSV file if it exists
        if os.path.exists(csv_file_path):
            os.remove(csv_file_path)
            print(f"Deleted old CSV file: {csv_file_path}")

    # Start the video processing in a background thread after coordinates are saved
    if VIDEO_PATH:
        # Generate a CSV file name based on the current date
        current_date = datetime.now().strftime('%Y_%m_%d')
        csv_file_path = os.path.join('static', f'{current_date}.csv')
        print("CSV file will be saved at:", csv_file_path)

        # Get the FPS of the video
        cap = cv2.VideoCapture(VIDEO_PATH)
        fps = cap.get(cv2.CAP_PROP_FPS)
        cap.release()

        # Start video processing in a new background thread
        processing_thread = threading.Thread(target=process_video, args=(VIDEO_PATH, csv_file_path, fps, stop_event))
        processing_thread.start()
        return jsonify({'status': 'success', 'data': data, 'message': 'Video processing started.'}), 200
    else:
        return jsonify({'status': 'error', 'message': 'No video uploaded yet.'}), 400


def process_video(video_path, csv_file_path, fps, stop_event):
    """
    Function to process the video and progressively write results to a CSV file in the background.
    Terminates if stop_event is set.
    """
    global RESULTS , CAMERA
    RESULTS = {}  # Reset the RESULTS dictionary
    cap = cv2.VideoCapture(video_path)

    # Create the CSV file with headers based on class_map
    with open(csv_file_path, mode='w', newline='') as csv_file:
        fieldnames = ['frameNumber'] + list(class_map.values())
        writer = csv.DictWriter(csv_file, fieldnames=fieldnames)
        writer.writeheader()

        count = 0
        while not stop_event.is_set():  # Continue processing unless stop_event is set
            ret, frame = cap.read()
            if not ret:
                break
            frame_number = int(cap.get(cv2.CAP_PROP_POS_FRAMES))
            if frame_number % int(fps) == 0:  # Extract one frame per second
                temp_frame_path = os.path.join(cache_dir, f"frame_{frame_number}.jpg")
                count += 1

                # Resize the frame to 640x640
                resized_frame = cv2.resize(frame, (640, 640))
                cv2.imwrite(temp_frame_path, resized_frame)

                # Process the frame and get the results
                results, boxed_image_path = process_image(temp_frame_path)
                print(f"Results for frame {frame_number}: {results}")

                # Create a dictionary for the CSV row with 'nan' if a class is not detected frameNumber
                row = {}
                for class_name in class_map.values():
                    detected = next((result for result in results if class_name in result), None)
                    if detected:
                        row[class_name] = (list(detected.values())[0] , CAMERA)
                    else:
                        row[class_name] = ('nan',"Unidentified")

                # Write the row to the CSV file
                writer.writerow(row)

                # Construct the image URL manually using the base URL
                image_url = f"/cache/{os.path.basename(boxed_image_path)}"

                # Add the frame number, results, and boxed image URL to the RESULTS dictionary
                RESULTS[frame_number] = [row, {'frameNumber': frame_number, 'image_url': image_url , 'count': count}]

    cap.release()
    print(f"Stopped processing video at frame {frame_number}")


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

@app.route('/zone_video', methods=['POST'])
def zone_video():
    """
    Handle the video upload, save it, and update the VIDEO_PATH.
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
    
    # Update the global VIDEO_PATH
    if os.path.exists(video_path):
        VIDEO_PATH = video_path
        print("Video path updated:", VIDEO_PATH)
    
    return {'message': "Video uploaded successfully. Waiting for coordinates."}, 200


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
        return jsonify({'status': 'processing', 'message': 'Video processing is still ongoing, no results yet.'}), 200




DATA_DIR = 'cattle_behavior_data/'



@app.route('/get_cattle_behavior', methods=['GET'])
def get_cattle_behavior():
    # Get the date argument from the request
    date = request.args.get('date','2022-09-07')
    
    if not date:
        return jsonify({"error": "Date parameter is required"}), 400

    # Construct the expected file path based on the provided date
    file_name = f"{date}.csv"
    file_path = os.path.join(DATA_DIR, file_name)

    # Check if the file exists
    if not os.path.exists(file_path):
        return jsonify({"error": f"No data file found for the date {date}"}), 404

    # Load the data from the CSV file
    data = pd.read_csv(file_path)

    # Calculate the total time spent in each behavior for all cattle
    total_behavior_time = data.groupby('Cow ID')[
        ['Lying Time (min)', 'Standing Time (min)', 'Eating Time (min)', 'Not Recognized (min)']
    ].sum().reset_index()

    # Rename columns for better readability
    total_behavior_time.columns = ['Cow ID', 'Lying Time (min)', 'Standing Time (min)', 
                                   'Eating Time (min)', 'Not Recognized Time (min)']

    # Convert the result to a dictionary for JSON response
    result = total_behavior_time.to_dict(orient='records')
    
    return jsonify(result), 200

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
    
# Function to calculate feeding frequency
def calculate_feeding_frequency(data, time_period='D'):
    # Ensure 'Eating Time (min)' is numeric
    data['Eating Time (min)'] = pd.to_numeric(data['Eating Time (min)'], errors='coerce')
    
    # Define a feeding event: Eating time > 0
    data['Feeding Event'] = data['Eating Time (min)'] > 0
    
    # Convert 'Date' column to datetime if it's not already
    data['Date'] = pd.to_datetime(data['Date'])
    
    # Group by Cow ID and the specified time period (e.g., daily 'D', hourly 'H')
    feeding_frequency = data.groupby([data['Cow ID'], data['Date'].dt.to_period(time_period)])['Feeding Event'].sum().reset_index()
    
    # Rename the column for clarity
    feeding_frequency.columns = ['Cow ID', 'Period', 'Feeding Frequency']
    
    return feeding_frequency

# Main function that combines loading data and calculating feeding frequency
def load_data_and_calculate_feeding_frequency(date_range, time_period='D'):
    # Step 1: Load the behavior data from the provided date range
    combined_data = load_behavior_data(date_range)
    
    # Check if data was successfully loaded
    if combined_data is None:
        print("No data found for the provided date range.")
        return None
    
    # Step 2: Calculate feeding frequency
    feeding_frequency = calculate_feeding_frequency(combined_data, time_period)
    
    return feeding_frequency




def generate_date_range(start_date, end_date):
    date_range = pd.date_range(start=start_date, end=end_date)
    return [date.strftime('%Y-%m-%d') for date in date_range]

def convert_to_hours_minutes(decimal_hours):
    """Convert decimal hours to 'X hours Y minutes' format."""
    hours = int(decimal_hours)
    minutes = int((decimal_hours - hours) * 60)
    return f"{hours} hours and {minutes} minutes"


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



@app.route('/feedingFrequency', methods=['GET', 'POST'])
def get_feeding_frequency():
    # Extract date, period, and cow ID from request
    date_str = request.args.get('date', '2022-09-07')  # Default to '2022-09-07'
    period = request.args.get('period', 'weekly')  # Default to 'daily' if not provided
    cow_id = request.args.get('cow_id','Cow_5')  # Get the specific cow ID (optional)

    start_date_list = []
    other_dates_list = []
    if not date_str:
        return jsonify({'error': 'Please provide a valid date'}), 400

    try:
        start_date = datetime.strptime(date_str, '%Y-%m-%d')
    except ValueError:
        return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400

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
    # Load the data and calculate feeding frequency
    data = load_data_and_calculate_feeding_frequency(date_range)

    if data is None or data.empty:
        return jsonify({'error': 'No data available for the given date range'}), 404

    # Filter the data by cow ID if provided
    if cow_id:
        data = data[data['Cow ID'] == cow_id]

    # Convert the Period column to a string so it's JSON-serializable
    data['Period'] = data['Period'].astype(str)

    # Convert the DataFrame to a JSON-compatible format (list of dictionaries)
    data_dict = data.to_dict(orient='records')

    # Return the JSON response
    return jsonify(data_dict)




# Flask route for cow behavior analysis
@app.route('/cow_behavior', methods=['GET'])
def get_cow_behavior():
    date_str = request.args.get('date')
    period = request.args.get('period', 'daily')  # Default to 'daily' if not provided
    
    if not date_str:
        # print(date_str)
        # print(date_str)
        # print(date_str)
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
    elif period == 'one':
        # For 'one', load data only for the specified date
        end_date = start_date
        date_range = generate_date_range(start_date, end_date)

        # Load behavior data for the specific date
        data = load_behavior_data(date_range)
        
        if data is not None and not data.empty:
            # Group by 'Cow ID' and sum 'Lying Time (min)', 'Standing Time (min)', 'Eating Time (min)'
            total_behavior = data.groupby('Cow ID').agg({
                'Lying Time (min)': 'sum',
                'Standing Time (min)': 'sum',
                'Eating Time (min)': 'sum'
            }).reset_index()

            # Convert the result to a dictionary and return as JSON
            return jsonify(total_behavior.to_dict(orient='records'))
        else:
            return jsonify({'error': 'Data not found for the given date'}), 404
    
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



@app.route('/cow_all_data/<cow_id>', methods=['GET'])
def get_all_day_cow_details(cow_id):
    # Get the end-date argument in the format YYYY-MM
    end_date_param = request.args.get('end_date', None)
    
    # If the end date is provided in the YYYY-MM format, parse it accordingly
    if end_date_param:
        try:
            end_date = pd.to_datetime(end_date_param, format='%Y-%m')  # Parse YYYY-MM
        except ValueError:
            return jsonify({"error": "Invalid date format, expected YYYY-MM"}), 400
    else:
        end_date = pd.to_datetime(datetime.now().strftime('%Y-%m'))  # Default to current month if not provided

    # Calculate the start date by subtracting 365 days from the end date
    start_date = end_date - pd.DateOffset(days=365)

    # Fetch the cow data by cow_id
    all_data_cow = get_cow_data_by_id(cow_id)
    
    if all_data_cow is not None:
        behavior_sums = get_behavior_sums_by_day(all_data_cow)

        # Create a new dictionary to store the behavior conditions for monthly aggregation
        monthly_conditions = {}

        # Populate cow_behavior_dict with behavior sums within the 365 days range
        for date, totals in behavior_sums.items():
            date_obj = pd.to_datetime(date)
            
            # Only include data within the 365 days range
            if start_date <= date_obj <= end_date:
                eating_time = totals['total_eating'] / 60
                lying_time = totals['total_lying'] / 60
                standing_time = totals['total_standing'] / 60

                # Convert the date to a month format for monthly aggregation
                month = date_obj.strftime('%Y-%m')

                # If the month is not already in the dictionary, initialize it
                if month not in monthly_conditions:
                    monthly_conditions[month] = {
                        "Anorexia": 0,
                        "Anxiety": 0,
                        "Lameness": 0,
                        "Postpartum Fatigue": 0,
                        "Weakness or Fatigue": 0,
                        "Heat Stress": 0
                    }

                # Check the conditions and count the days for each condition
                monthly_conditions[month]['Anorexia'] = 1 if eating_time < 4 else 0
                monthly_conditions[month]['Anxiety'] = 1 if eating_time > 6 else 0
                monthly_conditions[month]['Lameness'] = 1 if lying_time < 8 else 0
                monthly_conditions[month]['Postpartum Fatigue'] = 1 if lying_time > 12 else 0
                monthly_conditions[month]['Weakness or Fatigue'] = 1 if standing_time < 4 else 0
                monthly_conditions[month]['Heat Stress'] = 1 if standing_time > 8 else 0
        print(monthly_conditions)
        # Return only the monthly conditions as JSON for the past 12 months (365 days)
        return jsonify({
            "monthly_conditions": monthly_conditions  # Aggregated counts per month within the last 12 months
        })

    return jsonify({"error": "No data found for cow ID"}), 404






@app.route('/cow/<cow_id>', methods=['GET'])
def get_cow_details(cow_id):
    # Get 'date' and 'period' from the query parameters
    date_str = request.args.get('date')
    print(date_str)
    print(date_str)
    period = request.args.get('period','daily')  # Default to 'daily' if not provided
    # date_str='2023-09-21'
    # period='weekly'



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
    # print('date_range')
    # print(date_range)
    # print(date_range)
    # print(date_range)
    # print(date_range)

    if data is not None:
        # Filter the data by both the Cow ID and the Date
        cow_data = data[data['Cow ID'] == cow_id]
        cow_data_1 = data[(data['Cow ID'] == cow_id) & (data['Date'] == start_date.strftime('%Y-%m-%d'))]
        cow_data_1=convert_to_serializable(cow_data_1)
        total_eating = 0
        total_lying = 0
        total_standing = 0
        total_NotRecognized=0


        # print("selected_date")
        # print(cow_data_1)
        for entry in cow_data_1:
            total_eating += entry.get('Eating Time (min)', 0)
            total_lying += entry.get('Lying Time (min)', 0)
            total_standing += entry.get('Standing Time (min)', 0)
            total_NotRecognized  += entry.get('Not Recognized (min)', 0)

        # Output the totals
        total_eating_hours = int(round(float(total_eating) / 60)) 
        total_lying_hours = int(round(float(total_lying) / 60))
        total_standing_hours = int(round(float(total_standing) / 60))
        total_NotRecognized = int(round(float(total_NotRecognized) / 60)) # int(round(float(total_NotRecognized) / 60

        # Output the totals in hours
        totals = {
            "eating": total_eating_hours,
            "standing": total_lying_hours,
            "lyingdown": total_standing_hours,
            "not_reconized":total_NotRecognized
        }

        if not cow_data.empty:


            if period == 'daily':
                # Initialize a list to store daily behavior data in the required format
                weekly_data = []

                # Group the data by each date
                grouped_by_date = cow_data.groupby('Date')
                # print("grouped_by_date")
                # print(grouped_by_date)
                # print(grouped_by_date)

                # Variables to store cumulative totals for calculating the 7-day average
                cumulative_totals = {"total_eating": 0, "total_lying": 0, "total_standing": 0,"total_not_recognized":0}
                
                # Count the number of days for which data is available
                total_days = len(grouped_by_date)  # Total number of unique days with data

                # Iterate through each group (date) and calculate total behavior times
                day_counter = 1  # For naming the days (Day 1, Day 2, etc.)
                for date, group in grouped_by_date:
                    # print("group")
                    # print(group)
                    # print(group)
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
                        "lyingDown": daily_totals["total_lying"],
                        "notRecognized": daily_totals["total_not_recognized"]
                    })
                    # print("week_data")
                    # print(weekly_data)
                    # print(weekly_data)
                    # print(weekly_data)
                    
                    day_counter += 1

                # Calculate the average behavior for the available days (not necessarily 7) and round to the nearest integer
                average_behavior = {k: int(round(cumulative_totals[k] / total_days)) for k in cumulative_totals.keys()}

                # Return the cow data and the daily behavior data
                return jsonify({
                    "daily": weekly_data, 
                    "average_data": {
                        "standing": average_behavior["total_standing"],
                        "eating": average_behavior["total_eating"],
                        "lyingDown": average_behavior["total_lying"],
                        "not_reconized": average_behavior["total_not_recognized"]
                    },  
                    "selected_day":totals
                })

            elif period == 'weekly':
                # Initialize a list to store weekly data in the required format
                weekly_data = []

                total_weeks = 4  # Limit to 4 weeks

                # Initialize totals for calculating the 28-day average
                total_standing_sum = 0
                total_eating_sum = 0
                total_lying_sum = 0
                total_not_recognized_sum = 0

                # Split `other_dates_list` into 4 weeks, each containing 7 days
                weeks = [other_dates_list[i:i + 7] for i in range(0, min(len(other_dates_list), 28), 7)]

                for week_num, week_dates in enumerate(weeks, start=1):
                    week_data = cow_data[cow_data['Date'].isin(week_dates)]

                    if not week_data.empty:
                        # Calculate the total and average behavior for this week
                        total_behavior_week = calculate_total_behavior(week_data)

                        # Convert behavior values from minutes to hours and round them to integers (average per day in a week)
                        avg_behavior_week = {k: int(round(float(v) / 60 / 7)) for k, v in total_behavior_week.items()}

                        # Append the weekly behavior data to the list in the required format
                        weekly_data.append({
                            "name": str(week_num),  # Week number as the name
                            "standing": avg_behavior_week.get("total_standing", 0),
                            "eating": avg_behavior_week.get("total_eating", 0),
                            "lyingDown": avg_behavior_week.get("total_lying", 0),
                            "notRecognized": avg_behavior_week.get("total_not_recognized", 0),

                        })

                        # Add weekly total behavior to the overall 28-day sum
                        total_standing_sum += total_behavior_week.get("total_standing", 0)
                        total_eating_sum += total_behavior_week.get("total_eating", 0)
                        total_lying_sum += total_behavior_week.get("total_lying", 0)
                        total_not_recognized_sum += total_behavior_week.get("total_not_recognized", 0)

                # Calculate the 28-day average (convert from minutes to hours and divide by 28 days)
                avg_28_days = {
                    "standing": int(round(float(total_standing_sum) / 60 / 28)),
                    "eating": int(round(float(total_eating_sum) / 60 / 28)),
                    "lyingDown": int(round(float(total_lying_sum) / 60 / 28)),
                    "not_reconized": int(round(float(total_not_recognized_sum) / 60 / 28))
                }

                # Return the weekly data and the 28-day average data in the requested format
                return jsonify({
                    "weeklyData": weekly_data,
                    "average_data": avg_28_days,  
                    "selected_day":totals
                })
            
            elif period == 'monthly':  
                # Initialize a list to store monthly data in the required format
                monthly_data = []

                # Initialize totals for each behavior to calculate the overall average later
                total_standing_sum = 0
                total_eating_sum = 0
                total_lying_sum = 0
                total_not_recognized_sum = 0

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
                        "lyingDown": avg_behavior_month["total_lying"],
                        "notRecognized": avg_behavior_month["total_not_recognized"]
                    })
                    
                    # Add the monthly averages to the total sums
                    total_standing_sum += avg_behavior_month["total_standing"]
                    total_eating_sum += avg_behavior_month["total_eating"]
                    total_lying_sum += avg_behavior_month["total_lying"]
                    total_not_recognized_sum += avg_behavior_month["total_not_recognized"]
                    
                    # Move to the previous month
                    current_date = month_start - pd.DateOffset(months=1)

                # Calculate the overall average for the year (divide by 12 months)
                avg_data = {
                    "standing": total_standing_sum // 12,
                    "eating": total_eating_sum // 12,
                    "lyingDown": total_lying_sum // 12,
                    "not_reconized": total_not_recognized_sum // 12

                }

                # Return the monthly data and the average data
                return jsonify({
                    "monthlyData": monthly_data,
                    "average_data": avg_data,  
                    "selected_day":totals
                })

 
            else:

                return jsonify({"error": f"Cow ID '{cow_id}' not found"}), 404

        else:
            return jsonify({"error": f"Cow ID '{cow_id}' not found"}), 404
    else:
        return jsonify({'error': 'No data found for the given date range'}), 404


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



if __name__ == '__main__':
    app.run(debug=True)
    
    
#zone_image