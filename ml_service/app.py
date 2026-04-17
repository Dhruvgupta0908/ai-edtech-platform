# ml_service/app.py
# Start this with:
#   cd ml_service
#   python app.py
#
# Runs on http://localhost:5001
# Your Node.js backend calls this — React never calls it directly.

from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import numpy as np
import os

app = Flask(__name__)
CORS(app)  # allow Node.js backend to call this

# ── Load model once at startup ──
MODEL_PATH = os.path.join(os.path.dirname(__file__), "model.pkl")

try:
    with open(MODEL_PATH, "rb") as f:
        saved = pickle.load(f)
    model         = saved["model"]
    FEATURE_NAMES = saved["feature_names"]
    print(f"✅ Model loaded from {MODEL_PATH}")
except FileNotFoundError:
    print("❌ model.pkl not found — run train_model.py first")
    model = None


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "model_loaded": model is not None})


@app.route("/predict", methods=["POST"])
def predict():
    """
    Expects JSON body:
    {
      "subject": "operating-systems",
      "topics": [
        {
          "title": "Deadlocks",
          "position": 6,
          "prereq_count": 1,
          "prerequisite_scores": [55, 70],   // scores of prerequisite topics
          "prior_scores": [80, 60, 45, 55, 50, 38]  // all scores so far in order
        },
        ...
      ]
    }

    Returns:
    {
      "predictions": [
        {
          "title": "Deadlocks",
          "will_struggle": true,
          "confidence": 0.73
        },
        ...
      ]
    }
    """
    if model is None:
        return jsonify({"error": "Model not loaded. Run train_model.py first."}), 503

    data = request.get_json(force=True, silent=True)

    if not data or "topics" not in data or not isinstance(data["topics"], list):
        return jsonify({"error": "Invalid input"}), 400

    predictions = []

    for topic in data["topics"]:
        try:
            prereq_scores = topic.get("prerequisite_scores", [])
            prior_scores  = topic.get("prior_scores", [])

            prereq_avg = float(np.mean(prereq_scores)) if prereq_scores else 50.0
            prereq_min = float(np.min(prereq_scores))  if prereq_scores else 50.0

            prior_struggle_rate = (
                sum(1 for s in prior_scores if s < 40) / len(prior_scores)
                if prior_scores else 0.0
            )

            features = np.array([[
                prereq_avg,
                prereq_min,
                topic.get("position", 0),
                topic.get("prereq_count", 0),
                prior_struggle_rate,
            ]])

            prob          = model.predict_proba(features)[0]
            struggle_prob = float(prob[1])           # probability of struggling
            will_struggle = bool(struggle_prob >= 0.5)

            predictions.append({
                "title":        topic["title"],
                "will_struggle": will_struggle,
                "confidence":   round(struggle_prob, 3),
            })

        except Exception as e:
            predictions.append({
                "title":        topic.get("title", "unknown"),
                "will_struggle": False,
                "confidence":   0.0,
                "error":        str(e),
            })

    return jsonify({"predictions": predictions})


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    app.run(host="0.0.0.0", port=port)