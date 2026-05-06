from flask import Flask, request, jsonify
import joblib
import numpy as np

# Initialisation de l'application Flask
app = Flask(__name__)

# Chargement du modèle XGBoost et du scaler
model = joblib.load(r'C:\Users\ayasi\OneDrive\Desktop\My firt app\backend\xgboost_model.pkl')
scaler = joblib.load(r'C:\Users\ayasi\OneDrive\Desktop\My firt app\backend\scaler.pkl')

# Route de prédiction
@app.route('/predict', methods=['POST'])
def predict():

    # Récupération des données envoyées par Flutter
    data = request.json

    # Création du tableau de features
    features = np.array([[
        data['temperature'],
        data['pressure'],
        data['vibration'],
        data['humidity'],
        data['power_consumption'],
        data['hour'],
        data['day'],
        data['month']
    ]])

    # Normalisation
    features = scaler.transform(features)

    # Prédiction
    prediction = model.predict(features)[0]
    probability = model.predict_proba(features)[0][1]

    # Retour du résultat
    return jsonify({
        'prediction': int(prediction),
        'probability': round(float(probability) * 100, 2),
        'status': 'En panne' if prediction == 1 else 'Normale'
    })

# Lancement du serveur
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)