
import os
import cv2
from matplotlib.patches import Rectangle
import torch
import numpy as np
import matplotlib.pyplot as plt
from ultralytics import YOLO

def check_cuda():
    if torch.cuda.is_available():
        print("CUDA is available. Activating CUDA.")
        return torch.device("cuda")
    else:
        print("CUDA is not available. Using CPU.")
        return torch.device("cpu")

device = check_cuda()
print(f"Using device: {device}")

# Set environment variables to avoid OpenMP issues
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"
os.environ["KMP_INIT_AT_FORK"] = "FALSE"

# Load your YOLO models
behaviour_model = YOLO("behaviour_detection_model.pt")
shape_model = YOLO("shape_detection_model.pt")

# Function to perform prediction and display results
behaviours = {
    0: "Lying down",
    1: "Eating",
    2: "Standing",
}
d = {}

def predict_and_display(input_image_path):
    # Load the input image
    input_image = cv2.imread(input_image_path)
    input_image_rgb = cv2.cvtColor(input_image, cv2.COLOR_BGR2RGB)

    # Predict using the behaviour model
    behaviour_results = behaviour_model(input_image_rgb)

    # Initialize the plot
    fig, ax = plt.subplots(1, figsize=(12, 8))
    ax.imshow(input_image_rgb)

    # Extract all bounding boxes and class IDs for behaviour model
    for behaviour_result in behaviour_results:
        boxes = behaviour_result.boxes.xyxy.cpu().numpy()
        class_ids = behaviour_result.boxes.cls.cpu().numpy()

        for i in range(len(boxes)):
            x1, y1, x2, y2 = map(int, boxes[i])
            behaviour_class_id = int(class_ids[i])

            # Draw the bounding box and label for the behaviour model
            rect = Rectangle((x1, y1), x2 - x1, y2 - y1, linewidth=2, edgecolor='red', facecolor='none')
            ax.add_patch(rect)
            ax.text(x1, y1, behaviours[behaviour_class_id], color='red', fontsize=12, bbox=dict(facecolor='white', alpha=0.7))

            # Crop the image based on the bounding box
            cropped_image = input_image_rgb[y1:y2, x1:x2]

            # Predict using the shape model on the cropped image
            shape_results = shape_model(cropped_image)

            for shape_result in shape_results:
                shape_boxes = shape_result.boxes.xyxy.cpu().numpy()
                shape_class_ids = shape_result.boxes.cls.cpu().numpy()

                for j in range(len(shape_boxes)):
                    shape_x1, shape_y1, shape_x2, shape_y2 = map(int, shape_boxes[j])
                    shape_x1 += x1
                    shape_y1 += y1
                    shape_x2 += x1
                    shape_y2 += y1
                    shape_class_id = int(shape_class_ids[j])

                    # Draw the bounding box and label for the shape model
                    rect = Rectangle((shape_x1, shape_y1), shape_x2 - shape_x1, shape_y2 - shape_y1, linewidth=2, edgecolor='blue', facecolor='none')
                    ax.add_patch(rect)
                    ax.text(shape_x1, shape_y1, shape_class_id, color='blue', fontsize=12, bbox=dict(facecolor='white', alpha=0.7))

                    print(f"Behaviour class: {behaviour_class_id} Shape class: {shape_class_id}")
                    d[shape_class_id] = behaviours[behaviour_class_id]

    # Display the image with annotations
    print(d)
    plt.axis('off')
    plt.show()

# Example usage
input_image_path = 'sampleImage.png'
predict_and_display(input_image_path)