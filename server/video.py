import os
import cv2
from matplotlib.patches import Rectangle
import torch
import numpy as np
import matplotlib.pyplot as plt
from ultralytics import YOLO

def check_cuda():
    return torch.device("cuda" if torch.cuda.is_available() else "cpu")

device = check_cuda()
print(f"Using device: {device}")

# Set environment variables to avoid OpenMP issues
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"
os.environ["KMP_INIT_AT_FORK"] = "FALSE"

# Load YOLO models
behaviour_model = YOLO("models/behaviour_detection_model.pt")
shape_model = YOLO("models/shape_detection_model.pt")

# Map behavior class IDs to names
behaviours = {0: "Lying down", 1: "Eating", 2: "Standing"}

def distance_to_center(x1, y1, x2, y2, img_center):
    box_center_x = (x1 + x2) / 2
    box_center_y = (y1 + y2) / 2
    return np.sqrt((box_center_x - img_center[0]) ** 2 + (box_center_y - img_center[1]) ** 2)

def shape_finder(detected_area, x_offset, y_offset, ax, original_size):
    shape_model_results = shape_model.predict(detected_area)
    boxes = shape_model_results[0].boxes.xyxy.cpu().numpy()
    class_ids = shape_model_results[0].boxes.cls.cpu().numpy()
    predicted_classes = [shape_model_results[0].names[int(class_id)] for class_id in class_ids]

    img_center = (detected_area.shape[1] / 2, detected_area.shape[0] / 2)  # Image center point

    if len(boxes) > 1:
        distances = [distance_to_center(*box, img_center) for box in boxes]
        min_index = np.argmin(distances)
        boxes = [boxes[min_index]]
        predicted_classes = [predicted_classes[min_index]]

    for box, class_id in zip(boxes, predicted_classes):
        x1, y1, x2, y2 = map(int, box)
        x1, y1 = max(0, x1 + x_offset), max(0, y1 + y_offset)
        x2, y2 = min(original_size[1], x2 + x_offset), min(original_size[0], y2 + y_offset)
        
        ax.text(x1, y1, class_id, color='white', fontsize=12, bbox=dict(facecolor='red', alpha=0.5))
        ax.add_patch(Rectangle((x1, y1), x2 - x1, y2 - y1, fill=False, edgecolor='red', linewidth=2))

    return predicted_classes

def display_cropped_images(result):
    detected_areas = []
    for behavior_box in result.boxes:
        x1, y1, x2, y2 = map(int, behavior_box.xyxy[0])
        detected_area = result.orig_img[y1:y2, x1:x2]
        detected_areas.append((detected_area, x1, y1, behavior_box.cls))

    return detected_areas

# Process video input
video_path = 'sampleVideo.mp4'
cap = cv2.VideoCapture(video_path)

if not cap.isOpened():
    print("Error: Could not open video.")
    exit()

fps = int(cap.get(cv2.CAP_PROP_FPS))
frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

# Check if FPS is zero
if fps == 0:
    print("Error: FPS is zero, which indicates an issue with the video file.")
    cap.release()
    exit()

duration = frame_count / fps
print(f"Video FPS: {fps}, Total Frames: {frame_count}, Duration: {duration:.2f} seconds")

frame_number = 0
results = []

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break

    # Process one frame per second
    if frame_number % fps == 0:
        print(f"Processing frame {frame_number // fps + 1}...")

        detection_model_result = behaviour_model.predict(frame, conf=0.45)
        for result in detection_model_result:
            cropped_images = display_cropped_images(result)
            
            for detected_area, x_offset, y_offset, behavior_class_id in cropped_images:
                fig, ax = plt.subplots(figsize=(10, 10))
                
                img = cv2.cvtColor(detected_area, cv2.COLOR_BGR2RGB)
                ax.imshow(img)
                ax.axis('off')

                shape_classes = shape_finder(detected_area, x_offset, y_offset, ax, result.orig_img.shape)

                behavior_name = behaviours.get(int(behavior_class_id.item()), "Unknown")
                print(f"Frame {frame_number // fps + 1}: Behavior: {behavior_name} (ID: {behavior_class_id.item()}) has the following shape classes: {shape_classes}")
                results.append(f"Frame {frame_number // fps + 1}: Behavior: {behavior_name} (ID: {behavior_class_id.item()}) has the following shape classes: {shape_classes}")
                
                plt.close(fig)  # Close the figure to avoid displaying it

    frame_number += 1

cap.release()
print("All frames processed.")
for result in results:
    print(result)
