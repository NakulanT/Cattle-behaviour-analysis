import os
import pandas as pd
import random
from datetime import datetime, timedelta

# Sample data for cows
cows = [f'Cow_{i}' for i in range(1, 501)]

# Define possible camera fields
camera_fields = ['Field A', 'Field B', 'Field C']

# Generate random weather conditions and temperature for Tamil Nadu
def get_weather_data():
    conditions = ['Clear', 'Rainy', 'Cloudy', 'Sunny']
    temperature = random.uniform(23, 37)  # Wider temperature range
    weather_condition = random.choices(conditions, weights=[0.5, 0.2, 0.2, 0.1])[0]
    return round(temperature, 1), weather_condition

# Assign random camera field
def get_camera_field():
    return random.choice(camera_fields)

# Generate behavior data with more randomness for random cows
def get_behavior_data(cow_id, not_recognized_intervals, current_interval, special_cows):
    if current_interval in not_recognized_intervals:
        not_recognized_time = 15
        lying_time = standing_time = eating_time = 0
    else:
        not_recognized_time = 0
        if cow_id in special_cows:
            # More variability for special cows
            eating_time = random.randint(2, 10)
            lying_time = random.randint(5, 15)
            standing_time = random.randint(3, 12)
        else:
            # Regular cows with a standard range
            eating_time = random.randint(3, 8)
            lying_time = random.randint(5, 14)
            standing_time = random.randint(3, 10)

        # Ensure the total does not exceed 15 minutes
        total_time = lying_time + standing_time + eating_time
        if total_time > 15:
            overflow = total_time - 15
            adjust_choice = random.choice(['lying', 'standing', 'eating'])
            if adjust_choice == 'lying':
                lying_time = max(lying_time - overflow, 0)
            elif adjust_choice == 'standing':
                standing_time = max(standing_time - overflow, 0)
            else:
                eating_time = max(eating_time - overflow, 0)
        elif total_time < 15:
            adjustment = 15 - total_time
            adjust_choice = random.choice(['lying', 'standing', 'eating'])
            if adjust_choice == 'lying':
                lying_time += adjustment
            elif adjust_choice == 'standing':
                standing_time += adjustment
            else:
                eating_time += adjustment

    return lying_time, standing_time, eating_time, not_recognized_time

# Create directory to save the CSV files
output_dir = 'cattle_behavior_data'
if not os.path.exists(output_dir):
    os.makedirs(output_dir)

# Start and end dates
end_date = datetime(2024, 9, 6)
start_date = end_date - timedelta(days=3*365)

# Generate data
interval = timedelta(minutes=15)
current_date = start_date

while current_date <= end_date:
    daily_data = []
    current_time = current_date
    not_recognized_time_per_cow = {
        cow: random.sample(range(96), random.randint(4, 8)) for cow in cows
    }
    
    # Select random cows for special behavior on the current day
    special_cows = random.sample(cows, random.randint(20, 50))  # 20-50 random cows with altered behavior
    
    for interval_num in range(96):
        temperature, weather_condition = get_weather_data()
        for cow in cows:
            # Get behavior data for each cow
            lying_time, standing_time, eating_time, not_recognized_time = get_behavior_data(cow, not_recognized_time_per_cow[cow], interval_num, special_cows)
            camera_field = get_camera_field()
            
            daily_data.append({
                'Date': current_time.strftime('%Y-%m-%d'),
                'Time': current_time.strftime('%H:%M'),
                'Cow ID': cow,
                'Lying Time (min)': lying_time,
                'Standing Time (min)': standing_time,
                'Eating Time (min)': eating_time,
                'Not Recognized (min)': not_recognized_time,
                'Temperature (°C)': temperature,
                'Weather Condition': weather_condition,
                'Camera Field': camera_field
            })
        current_time += interval

    df = pd.DataFrame(daily_data)
    file_name = f"{current_date.strftime('%Y-%m-%d')}.csv"
    file_path = os.path.join(output_dir, file_name)
    df.to_csv(file_path, index=False)

    current_date += timedelta(days=1)

print("Dataset created with enhanced randomness for selected cows, saved to daily CSV files!")
