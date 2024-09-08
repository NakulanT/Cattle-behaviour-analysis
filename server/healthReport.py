import pandas as pd
import os
from datetime import datetime, timedelta

# Health thresholds in minutes (for easier comparison with raw data)
HEALTH_THRESHOLDS = {
    'Lying Time': {'low': 480, 'high': 720},  # Low: 8 hours (480 mins), High: 12 hours (720 mins)
    'Eating Time': {'low': 180, 'high': 360},  # Low: 3 hours (180 mins), High: 6 hours (360 mins)
    'Standing Time': {'low': 240, 'high': 480}  # Low: 4 hours (240 mins), High: 8 hours (480 mins)
}

# Function to check health indicators
def check_health_indicators(behavior_data):
    health_flags = []
    
    for cow_id, row in behavior_data.iterrows():
        cow_health = {'Cow ID': cow_id}
        
        # Check Lying Time
        lying_time = row['Lying Time (min)']
        if lying_time < HEALTH_THRESHOLDS['Lying Time']['low']:
            cow_health['Lying Time'] = 'Possible discomfort or heat stress (less than 8 hours)'
        elif lying_time > HEALTH_THRESHOLDS['Lying Time']['high']:
            cow_health['Lying Time'] = 'Possible postpartum fatigue or illness (more than 12 hours)'

        # Check Eating Time
        eating_time = row['Eating Time (min)']
        if eating_time < HEALTH_THRESHOLDS['Eating Time']['low']:
            cow_health['Eating Time'] = 'Possible anorexia or illness (less than 3 hours)'
        elif eating_time > HEALTH_THRESHOLDS['Eating Time']['high']:
            cow_health['Eating Time'] = 'Possible overeating due to stress or deficiency (more than 6 hours)'

        # Check Standing Time
        standing_time = row['Standing Time (min)']
        if standing_time < HEALTH_THRESHOLDS['Standing Time']['low']:
            cow_health['Standing Time'] = 'Possible lameness or fatigue (less than 4 hours)'
        elif standing_time > HEALTH_THRESHOLDS['Standing Time']['high']:
            cow_health['Standing Time'] = 'Possible heat stress or inadequate lying area (more than 8 hours)'

        # Additional health indicators
        if lying_time > HEALTH_THRESHOLDS['Lying Time']['high'] and standing_time < HEALTH_THRESHOLDS['Standing Time']['low']:
            cow_health['Lameness Detection'] = 'Possible lameness (high lying, low standing time)'

        health_flags.append(cow_health)
    
    return pd.DataFrame(health_flags)

# Function to load behavior data for a date range
def load_behavior_data(start_date, end_date):
    all_data = []
    date_range = pd.date_range(start=start_date, end=end_date)
    
    for date in date_range:
        file_path = f'cattle_behavior_data/{date.strftime("%Y-%m-%d")}.csv'
        if os.path.exists(file_path):
            daily_data = pd.read_csv(file_path)
            all_data.append(daily_data)
    
    if all_data:
        combined_data = pd.concat(all_data, ignore_index=True)
        return combined_data
    return None

# Function to aggregate behavior data by time period (daily, weekly, monthly)
def aggregate_behavior_data(data, time_period):
    if time_period == 'daily':
        return data.groupby('Cow ID')[['Lying Time (min)', 'Eating Time (min)', 'Standing Time (min)']].mean()
    elif time_period == 'weekly':
        return data.groupby('Cow ID')[['Lying Time (min)', 'Eating Time (min)', 'Standing Time (min)']].mean()
    elif time_period == 'monthly':
        return data.groupby('Cow ID')[['Lying Time (min)', 'Eating Time (min)', 'Standing Time (min)']].mean()

# API endpoint to get health report
def get_health_report(time_period='daily', start_date=None, end_date=None):
    # Load data for the selected period
    data = load_behavior_data(start_date, end_date)

    if data is not None:
        # Aggregate the data based on the selected time period (daily, weekly, monthly)
        aggregated_data = aggregate_behavior_data(data, time_period)
        
        # Check health indicators for each cow
        health_report = check_health_indicators(aggregated_data)
        return health_report
    else:
        return "No data available for the selected period."

# Example usage to get a health report for a specific period
# Daily report for a specific date
daily_report = get_health_report('daily', '2024-09-06', '2024-09-06')

# Weekly report (e.g., from 2024-09-01 to 2024-09-07)
weekly_report = get_health_report('weekly', '2024-09-01', '2024-09-07')

# Monthly report for September 2024
monthly_report = get_health_report('monthly', '2024-09-01', '2024-09-30')

print("Daily Report:")
print(daily_report)
print("\nWeekly Report:")
print(weekly_report)
print("\nMonthly Report:")
print(monthly_report)
