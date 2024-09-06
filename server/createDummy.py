import numpy as np
import pandas as pd

# Generate a dummy dataset for one cattle's full 24-hour continuous data
np.random.seed(42)

# Dummy data for 24 hours (each minute)
timestamps = pd.date_range(start="2024-08-16 00:00:00", end="2024-08-16 23:59:00", freq='1T')

# CattleID remains the same for this dummy data
cattle_id = 1

# Age of the cattle remains constant (let's assume age 4)
age = 4

# Generate random Breed (using numeric labels as in training)
breed = label_encoder_breed.transform(['Guernsey'] * len(timestamps))  # Use constant breed for the cattle

# Behavior type randomly assigned for each minute (Lying Down, Eating, Standing)
behavior_types = np.random.choice(label_encoder_behavior.transform(['Lying Down', 'Eating', 'Standing']), len(timestamps))

# Duration for each behavior (in minutes)
# In real scenarios, duration is cumulative, but here it’s for illustrative purposes (1 minute per behavior for simplicity)
durations = np.ones(len(timestamps))  # Each behavior lasts for 1 minute

# Latitude and Longitude (using random values within a reasonable range for field movements)
latitudes = np.random.uniform(35.0, 36.0, len(timestamps))
longitudes = np.random.uniform(-120.0, -121.0, len(timestamps))

# Creating the DataFrame
dummy_data = pd.DataFrame({
    'CattleID': cattle_id,
    'Age': age,
    'Breed': breed,
    'BehaviorType': behavior_types,
    'Duration (minutes)': durations,
    'Latitude': latitudes,
    'Longitude': longitudes,
    'Timestamp': timestamps
})

# Adjusting the dataset to have random duration between behaviors (in minutes and seconds)
# Generating random durations for each behavior, between 1 minute to 10 minutes
durations_minutes = np.random.randint(1, 10, len(timestamps))
durations_seconds = np.random.randint(0, 59, len(timestamps))

# Adjusting the timestamps based on random durations
adjusted_timestamps = [timestamps[0]]
for i in range(1, len(timestamps)):
    # Adding random minutes and seconds to the previous timestamp
    new_time = adjusted_timestamps[i-1] + pd.Timedelta(minutes=durations_minutes[i-1], seconds=durations_seconds[i-1])
    adjusted_timestamps.append(new_time)

# Update the dataframe with the adjusted timestamps
dummy_data['Duration (minutes)'] = durations_minutes + durations_seconds / 60  # Duration in fractional minutes
dummy_data['Timestamp'] = adjusted_timestamps

# Display the updated dataframe to the user
import ace_tools as tools; tools.display_dataframe_to_user(name="Updated Cattle 24-hour Continuous Data", dataframe=dummy_data)


# import ace_tools as tools; tools.display_dataframe_to_user(name="Cattle 24-hour Continuous Data", dataframe=dummy_data)
