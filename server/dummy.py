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

# Generate behavior data for each 15-minute interval
def get_behavior_data(cow_id, not_recognized_intervals, current_interval):
    if current_interval in not_recognized_intervals:
        # If this interval is "Not Recognized"
        not_recognized_time = 15  # The entire interval is "Not Recognized"
        lying_time = standing_time = eating_time = 0  # No other behavior during this time
    else:
        not_recognized_time = 0  # Not "Not Recognized" during this interval
        
        # Determine eating time based on cow conditions
        if cow_id in ['Cow_1', 'Cow_3']:
            # Cow 1 and Cow 3 rarely eat less than 1-3 hours
            if random.random() < 0.002:  # 20% chance for rare eating pattern
                eating_time = random.randint(1, 3)  # Eating 1-3 mins
            else:
                eating_time = random.randint(4, 6)  # Eating 4-6 mins
        else:
            eating_time = random.randint(4, 6)  # Normal eating 4-6 mins

        # Determine lying time
        if cow_id == 'Cow_4' and random.random() < 0.002:  # 20% chance for Cow 4 to lie down 12-16 hours
            lying_time = random.randint(12, 15)  # Lying down 12-16 mins
        else:
            lying_time = random.randint(8, 12)  # Normal lying down 8-12 mins

        # Determine standing time
        if random.random() < 0.001:  # 5% chance for any cow to stand 8-16 mins
            standing_time = random.randint(8, 15)  # Standing 8-16 mins
        else:
            standing_time = random.randint(4, 8)  # Normal standing 4-8 mins

        # Ensure the total time doesn't exceed 15 mins
        total_time = lying_time + standing_time + eating_time
        if total_time > 15:
            # Normalize times if they exceed the 15-minute interval
            standing_time = max(standing_time - (total_time - 15), 0)

    # Ensure the total of all times equals 15 minutes
    total_time = lying_time + standing_time + eating_time + not_recognized_time
    if total_time != 15:
        adjustment = 15 - total_time
        standing_time = max(standing_time + adjustment, 0)  # Adjust standing time to balance

    return lying_time, standing_time, eating_time, not_recognized_time  # Return times within 15-minute intervals

# Create directory to save the CSV files
output_dir = 'cattle_behavior_data'
if not os.path.exists(output_dir):
    os.makedirs(output_dir)

# Adjusted start and end dates for three years of past data
end_date = datetime(2024, 9, 6)  # End date (current day in 2024)
start_date = end_date - timedelta(days=3*365)  # Start date (three years back from the end date)

# Generate data for every 15-minute interval
interval = timedelta(minutes=15)
current_date = start_date

while current_date <= end_date:
    daily_data = []  # Store data for a single day
    current_time = current_date
    
    # Assign 1-2 hours of "Not Recognized" time for each cow (equivalent to 4-8 intervals)
    not_recognized_time_per_cow = {
        cow: random.sample(range(96), random.randint(4, 8)) for cow in cows  # 4-8 intervals out of 96 per day
    }
    
    for interval_num in range(96):  # 96 intervals in a day (24 hours / 15-minute intervals)
        temperature, weather_condition = get_weather_data()
        for cow in cows:
            # Get the behavior data for each cow, including "Not Recognized" periods
            lying_time, standing_time, eating_time, not_recognized_time = get_behavior_data(cow, not_recognized_time_per_cow[cow], interval_num)
            daily_data.append({
                'Date': current_time.strftime('%Y-%m-%d'),
                'Time': current_time.strftime('%H:%M'),
                'Cow ID': cow,
                'Lying Time (min)': lying_time,  # Time in minutes
                'Standing Time (min)': standing_time,  # Time in minutes
                'Eating Time (min)': eating_time,  # Time in minutes
                'Not Recognized (min)': not_recognized_time,  # Time in minutes
                'Temperature (°C)': temperature,
                'Weather Condition': weather_condition
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

print("Dataset created for 15-minute intervals, including 'Not Recognized' time, saved to daily CSV files!")