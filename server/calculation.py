def calculate_total_behavior(data):
    total_eating = data['Eating Time (min)'].sum()
    total_lying = data['Lying Time (min)'].sum()
    total_standing = data['Standing Time (min)'].sum()
    
    return  {
        "total_eating": total_eating,
        "total_lying": total_lying,
        "total_standing": total_standing
    }