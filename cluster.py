import pandas as pd
import os
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
import matplotlib.pyplot as plt

# Step 1: Combine all daily files into a single DataFrame
def combine_files(directory_path):
    combined_data = pd.DataFrame()
    for filename in os.listdir(directory_path):
        if filename.endswith(".csv"):
            file_path = os.path.join(directory_path, filename)
            # Read the CSV file
            daily_data = pd.read_csv(file_path)
            # Clean up column names if necessary
            daily_data.columns = daily_data.columns.str.strip()
            # Append to the master DataFrame
            combined_data = pd.concat([combined_data, daily_data], ignore_index=True)
    return combined_data



def calculate_averages(data):
    # Ensure that Cow ID and behavior columns exist in the dataset
    if not all(col in data.columns for col in ['Cow ID', 'Lying Time (min)', 'Standing Time (min)', 'Eating Time (min)']):
        raise ValueError("Required columns are missing in the dataset.")

    # Convert the time-related columns to numeric, forcing errors to NaN (in case non-numeric data exists)
    data['Lying Time (min)'] = pd.to_numeric(data['Lying Time (min)'], errors='coerce')
    data['Standing Time (min)'] = pd.to_numeric(data['Standing Time (min)'], errors='coerce')
    data['Eating Time (min)'] = pd.to_numeric(data['Eating Time (min)'], errors='coerce')
    
    # Check if the conversion resulted in NaN values and display a message
    if data[['Lying Time (min)', 'Standing Time (min)', 'Eating Time (min)']].isnull().any().any():
        print("Warning: Non-numeric values found and converted to NaN.")

    # Drop rows where Cow ID or any of the behavior columns are missing
    data_cleaned = data.dropna(subset=['Cow ID', 'Lying Time (min)', 'Standing Time (min)', 'Eating Time (min)'])
    
    # Group by Cow ID and calculate average time for lying, standing, and eating
    average_behavior = data_cleaned.groupby('Cow ID').mean()

    # Ensure that only numeric columns are retained for analysis
    return average_behavior[['Lying Time (min)', 'Standing Time (min)', 'Eating Time (min)']]


# Step 3: Perform K-means clustering
def perform_clustering(data, num_clusters):
    # Standardize the data
    scaler = StandardScaler()
    scaled_data = scaler.fit_transform(data)

    # Apply K-means clustering
    kmeans = KMeans(n_clusters=num_clusters, random_state=42)
    clusters = kmeans.fit_predict(scaled_data)

    # Add cluster labels to the data
    data['Cluster'] = clusters
    return data, kmeans

# Step 4: Visualize the clusters
def visualize_clusters(data):
    plt.figure(figsize=(10, 7))
    plt.scatter(data['Lying Time (min)'], data['Standing Time (min)'], c=data['Cluster'], cmap='viridis')
    plt.xlabel('Lying Time (min)')
    plt.ylabel('Standing Time (min)')
    plt.title('Clustering of Cow Behavior (Lying vs. Standing)')
    plt.colorbar(label='Cluster')
    plt.show()

# Main function to execute the steps
if __name__ == "__main__":
    
    directory_path = "cattle_behavior_data/"  # Replace with the directory containing the daily CSV files

    # # Combine files
    combined_data = combine_files(directory_path)
    # print(combined_data[['Cow ID', 'Lying Time (min)', 'Standing Time (min)', 'Eating Time (min)']].info())
    # Main function to check data and calculate averages
    # Assuming combined_data is already populated with data
    print(combined_data[['Cow ID', 'Lying Time (min)', 'Standing Time (min)', 'Eating Time (min)']].info())  # Debugging: Print data info
    average_behavior = calculate_averages(combined_data)
    print(average_behavior.head())  # Check the result


    # # Calculate average behavior per cow
    # average_behavior = calculate_averages(combined_data)

    # # Perform K-means clustering with an optimal number of clusters (e.g., 3)
    # clustered_data, kmeans_model = perform_clustering(average_behavior, num_clusters=3)

    # # Visualize the clusters
    # visualize_clusters(clustered_data)

