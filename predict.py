import sys
import joblib
import numpy as np

model = joblib.load('xgboost_model.pkl')
scaler = joblib.load('scaler.pkl')

features = list(map(float, sys.argv[1].split(',')))
X = np.array(features).reshape(1, -1)
X = scaler.transform(X)
pred = model.predict(X)[0]

print("Failure" if pred == 1 else "Healthy")