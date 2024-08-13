import matplotlib
matplotlib.use('Agg')

import os
import tempfile
import pandas as pd
import matplotlib.pyplot as plt
from flask import Flask, render_template, request, send_from_directory

app = Flask(__name__)

# Create a temporary cache directory
cache_dir = tempfile.mkdtemp()

# Function to extract the date from the file name
def extract_date(filename):
    parts = filename.split('_')
    try:
        return pd.to_datetime(f"20{parts[0]}-{parts[1]}-{parts[2].split('.')[0]}")
    except:
        print(f"Unexpected file format: {filename}")
        return pd.NaT

@app.route('/', methods=['GET', 'POST'])
def index():
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
    average_index = []
    time_sequence = []

    # Iterate through each file to compute the average index
    for i, file in enumerate(csv_files):
        df = pd.read_csv(os.path.join(csv_dir, file))
        eating_time = df[selected_cattle].value_counts().get('E', 0) / 12
        lying_time = df[selected_cattle].value_counts().get('L', 0) / 12
        average_index.append((eating_time + (lying_time / 2)) / 2)
        time_sequence.append(i + 1)

    # Plot the average index
    plot_path = os.path.join(cache_dir, 'behavior_analysis.png')
    plt.figure(figsize=(10, 6))
    plt.plot(time_sequence, average_index, label='Average Index based on Eating and Lying Down time(Eating + Lying Down / 2)', marker='o')
    plt.xlabel('Days')
    plt.ylabel('Index')
    plt.title('Average Index of Eating and Lying Down Time Over Days')
    plt.legend()
    plt.grid(True)
    plt.savefig(plot_path)
    plt.close()

    return render_template('csv.html', cattle_columns=cattle_columns, selected_cattle=selected_cattle,
                           lying_less_than_8=lying_less_than_8,
                           eating_less_than_4=eating_less_than_4,
                           lying_more_than_12=lying_more_than_12,
                           pie_chart='pie_chart.png', bar_chart_eating='bar_chart_eating.png', 
                           bar_chart_lying='bar_chart_lying.png',
                           behavior_analysis='behavior_analysis.png')

@app.route('/cache/<filename>')
def cached_image(filename):
    return send_from_directory(cache_dir, filename)

if __name__ == '__main__':
    app.run(debug=True)