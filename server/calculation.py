import os
import pandas as pd

# Define the directory where your cattle behavior data is stored
DATA_DIR = 'cattle_behavior_data/'


def calculate_total_behavior(group):
    total_eating = group['Eating Time (min)'].sum()
    total_lying = group['Lying Time (min)'].sum()
    total_standing = group['Standing Time (min)'].sum()
    total_not_recognized = group.get('Not Recognized (min)', 0).sum()  # Handle Not Recognized time
    return {
        'total_eating': total_eating,
        'total_lying': total_lying,
        'total_standing': total_standing,
        'total_not_recognized': total_not_recognized
    }


def load_all_cow_data():
    """
    Loads all CSV files from the given directory and concatenates them into a single DataFrame.
    Returns the combined DataFrame.
    """
    all_data = []  # List to store data from all files

    # Loop through all files in the data directory
    for file_name in os.listdir(DATA_DIR):
        # Check if the file is a CSV file
        if file_name.endswith('.csv'):
            file_path = os.path.join(DATA_DIR, file_name)
            # Load the CSV file into a DataFrame and append it to the list
            df = pd.read_csv(file_path)
            all_data.append(df)

    # Concatenate all DataFrames into one DataFrame
    if all_data:
        combined_data = pd.concat(all_data, ignore_index=True)
    else:
        combined_data = pd.DataFrame()  # Empty DataFrame if no data is found

    return combined_data


def get_cow_data_by_id(cow_id):
    """
    Loads all cow data from the data directory and filters it by cow_id.
    Returns the filtered cow data for the specific cow_id.
    """
    # Load all the data from the directory
    all_data = load_all_cow_data()

    # Check if any data was loaded
    if all_data.empty:
        print("No data found in the folder.")
        return None

    # Filter the data based on cow_id
    cow_data = all_data[all_data['Cow ID'] == cow_id]

    # If no data is found for the given cow_id, return None
    if cow_data.empty:
        print(f"No data found for Cow ID: {cow_id}")
        return None

    return cow_data


def get_behavior_sums_by_day(cow_data):
    """
    Groups the cow data by date and calculates the sum of behaviors for each day.
    Returns a dictionary with the total behavior sums for each day.
    """
    behavior_sums_by_day = {}

    # Group the cow data by 'Date'
    grouped_by_date = cow_data.groupby('Date')

    # Iterate through each group (i.e., each date) and calculate total behavior
    for date, group in grouped_by_date:
        total_behavior = calculate_total_behavior(group)
        behavior_sums_by_day[date] = total_behavior

    return behavior_sums_by_day


def convert_to_serializable(data):
    """Convert int64 and other non-serializable types to serializable types."""
    if isinstance(data, dict):
        return {k: convert_to_serializable(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [convert_to_serializable(item) for item in data]
    elif isinstance(data, pd.Series):
        return data.to_dict()
    elif isinstance(data, pd.DataFrame):
        return data.to_dict(orient='records')
    elif isinstance(data, (pd.Timestamp, pd.Timedelta)):
        return str(data)
    elif isinstance(data, (pd.Int64Dtype, pd.Float64Dtype, pd.Int32Dtype, pd.Float32Dtype)):
        return int(data)
    elif isinstance(data, pd.api.extensions.ExtensionArray):
        return list(data)
    elif isinstance(data, (int, float, str, bool)):
        return data
    else:
        return int(data)
# # Usage example
# cow_id = 'Cow_1'
# cow_data = get_cow_data_by_id(cow_id)

# if cow_data is not None:
#     behavior_sums = get_behavior_sums_by_day(cow_data)

#     # Store the behavior sums for each day in a dictionary
#     cow_behavior_dict = {}

#     for date, totals in behavior_sums.items():
#         cow_behavior_dict[date] = {
#             "total_eating": totals['total_eating'],
#             "total_lying": totals['total_lying'],
#             "total_standing": totals['total_standing']
#         }

#     print(cow_behavior_dict)  # Output the dictionary with behavior sums
# else:
#     print(f"No data available for cow ID: {cow_id}")
