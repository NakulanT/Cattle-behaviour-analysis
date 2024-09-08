import os
import pandas as pd
import random
from datetime import datetime, timedelta

# Sample data for cows
cows = [f'Cow_{i}' for i in range(1, 11)]

# Generate random weather conditions and temperature for Tamil Nadu
def get_weather_data():
    conditions = ['Clear', 'Rainy', 'Cloudy', 'Sunny']
    temperature = random.uniform(25, 35)  # Range of temperatures in Tamil Nadu
    weather_condition = random.choice(conditions)
    return round(temperature, 1), weather_condition

# Generate random behavior data for lying, standing, and eating time (in minutes)
def get_behavior_data():
    lying_time = random.randint(0, 15)
    standing_time = random.randint(0, 15 - lying_time)
    eating_time = 15 - (lying_time + standing_time)
    return lying_time, standing_time, eating_time

# Create directory to save the CSV files
output_dir = 'cattle_behavior_data'
if not os.path.exists(output_dir):
    os.makedirs(output_dir)

# Starting date for 2 years of data collection
start_date = datetime(2022, 9, 7)  # Start date
end_date = start_date + timedelta(days=730)  # 2 years later

# Generate data for every 15-minute interval
interval = timedelta(minutes=15)
current_date = start_date

while current_date <= end_date:
    daily_data = []  # Store data for a single day
    current_time = current_date
    for _ in range(96):  # 96 intervals in a day (24 hours / 15-minute intervals)
        temperature, weather_condition = get_weather_data()
        for cow in cows:
            lying_time, standing_time, eating_time = get_behavior_data()
            daily_data.append({
                'Date': current_time.strftime('%Y-%m-%d'),
                'Time': current_time.strftime('%H:%M'),
                'Cow ID': cow,
                'Lying Time (min)': lying_time,
                'Standing Time (min)': standing_time,
                'Eating Time (min)': eating_time,
                'Temperature (°C)': temperature,
                'Weather Condition': weather_condition,
                'Notes': ''
            })
        current_time += interval

    # Convert daily data into a pandas DataFrame
    df = pd.DataFrame(daily_data)

    # Save the data to a CSV file named by the date
    file_name = f"{current_date.strftime('%Y-%m-%d')}.csv"
    file_path = os.path.join(output_dir, file_name)
    df.to_csv(file_path, index=False)

    # Move to the next day
    current_date += timedelta(days=1)

print("Dataset created and saved to individual daily CSV files!")
