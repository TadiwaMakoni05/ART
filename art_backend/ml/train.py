import os
import joblib
import numpy as np
from sklearn.ensemble import RandomForestClassifier

def generate_synthetic_data(num_samples=1000):
    np.random.seed(42)
    
    # Generate features
    # adherence_rate (0-100)
    adherence_rate = np.random.randint(40, 101, num_samples)
    
    # missed_doses (0-30)
    missed_doses = np.random.randint(0, 15, num_samples)
    
    # time_on_art_months (1-240)
    time_on_art_months = np.random.randint(1, 240, num_samples)
    
    # previous_viral_load (10-100000)
    previous_viral_load = np.random.exponential(scale=5000, size=num_samples)
    
    X = np.column_stack([adherence_rate, missed_doses, time_on_art_months, previous_viral_load])
    
    # Generate labels
    # "Suppressed" means viral load < 1000 copies/ml
    # We create a realistic logic for who is suppressed based on features
    y = []
    for i in range(num_samples):
        prob = 0.5
        
        # High adherence -> higher suppression prob
        if adherence_rate[i] >= 85:
            prob += 0.3
        else:
            prob -= 0.3
            
        # Many missed doses -> lower suppression prob
        if missed_doses[i] > 3:
            prob -= 0.2
            
        # High previous viral load -> lower suppression prob
        if previous_viral_load[i] > 1000:
            prob -= 0.2
        else:
            prob += 0.2
            
        prob = max(0.0, min(1.0, prob))
        label = 1 if np.random.rand() < prob else 0
        y.append(label)
        
    return X, np.array(y)

def main():
    print("Generating synthetic dataset...")
    X, y = generate_synthetic_data()
    print(f"Dataset shape: {X.shape}")
    
    print("Training RandomForestClassifier...")
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X, y)
    
    score = model.score(X, y)
    print(f"Training accuracy: {score:.2f}")
    
    # Save the dataset to a CSV file
    current_dir = os.path.dirname(os.path.abspath(__file__))
    dataset_path = os.path.join(current_dir, 'viral_load_dataset.csv')
    
    # Combine features and labels
    dataset = np.column_stack([X, y])
    np.savetxt(
        dataset_path, 
        dataset, 
        delimiter=",", 
        header="adherence_rate,missed_doses,time_on_art_months,previous_viral_load,is_suppressed",
        comments='',
        fmt="%.2f"
    )
    print(f"Dataset securely saved to {dataset_path}")
    
    # Save the model
    # Ensure directory exists
    current_dir = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(current_dir, 'viral_model.pkl')
    
    joblib.dump(model, model_path)
    print(f"Model saved to {model_path}")

if __name__ == '__main__':
    main()
