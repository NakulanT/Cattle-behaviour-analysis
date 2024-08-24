
# Cattle Behavior Analysis

## Overview

This project is a Flask-based web application that uses YOLOv8 models for detecting and analyzing cattle behavior from uploaded images. The application supports behavior detection and shape classification of detected areas using pretrained models.

## Features

- **Upload Image**: Users can upload images of cattle.
- **Behavior Detection**: The application detects behaviors such as "Lying down", "Eating", and "Standing".
- **Shape Classification**: The application classifies shapes within the detected behavior areas.
- **Results Display**: Results are displayed on a web page with the detected behaviors and shapes.

## Installation

To set up the application, follow these steps:

1. **Clone the Repository**

   ```bash
   git clone https://github.com/yourusername/Cattle-behaviour-analysis.git
   cd Cattle-behaviour-analysis
   ```

2. **Create and Activate a Virtual Environment**

   ```bash
   conda create --name cattle-behaviour-analysis python=3.12
   conda activate cattle-behaviour-analysis
   ```

3. **Install Required Packages**

   Make sure you have `requirements.txt` in your project directory. Install the dependencies using:

   ```bash
   pip install -r requirements.txt
   ```

4. **Download YOLOv8 Models**

   Place your YOLOv8 model files (`behaviour_detection_model.pt` and `shape_detection_model.pt`) in the `models` directory.

5. **Run the Flask Application**

   Start the Flask server:

   ```bash
   python app.py
   ```

   The application will be available at `http://127.0.0.1:5000/`.

## Usage

1. **Open the Web Application**: Navigate to `http://127.0.0.1:5000/` in your web browser.
2. **Upload an Image**: Use the upload form to select and submit an image of cattle.
3. **View Results**: After processing, the results will be displayed showing the detected behavior and shape classifications.

## Configuration

- **Cache Directory**: The application uses a temporary directory to store uploaded images and cache results.
- **Environment Variables**: The following environment variables are used for setting up the models:
  - `KMP_DUPLICATE_LIB_OK`
  - `KMP_INIT_AT_FORK`

## Dependencies

The application requires the following Python packages:

- Flask
- opencv-python
- torch
- numpy
- ultralytics

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Contributing

Feel free to open issues or submit pull requests if you find any bugs or have improvements to suggest.

---