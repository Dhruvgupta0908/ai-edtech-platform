# ml_service/train_model.py
# Run this ONCE to train and save the model:
#   cd ml_service
#   python train_model.py
#
# What it does:
#   - Generates synthetic student score data that mirrors your real schema
#   - Engineers features from prerequisite scores and topic position
#   - Trains a Random Forest classifier to predict struggle (score < 40%)
#   - Saves the model + feature names to model.pkl
#
# Feature engineering rationale (explain this in your defence):
#   1. prerequisite_avg     — average score of all prerequisite topics
#                             (weaker foundations → more likely to struggle)
#   2. prerequisite_min     — minimum score among prerequisites
#                             (one very weak prereq can block understanding)
#   3. topic_position       — index of topic in the subject (0–9)
#                             (later topics are harder, sequential difficulty)
#   4. prereq_count         — number of prerequisites this topic has
#                             (more prereqs = more dependencies = more risk)
#   5. prior_struggle_rate  — fraction of earlier topics where student scored < 40%
#                             (past struggle pattern predicts future struggle)

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
import pickle
import random

random.seed(42)
np.random.seed(42)

# ── Topic structure mirrors your SubjectsData.js exactly ──
SUBJECTS = {
    "operating-systems": [
        {"title": "Introduction to Operating Systems",  "prereqs": []},
        {"title": "System Calls and OS Structure",      "prereqs": ["Introduction to Operating Systems"]},
        {"title": "Process Concept",                    "prereqs": ["System Calls and OS Structure"]},
        {"title": "Process Scheduling",                 "prereqs": ["Process Concept"]},
        {"title": "Threads and Multithreading",         "prereqs": ["Process Concept"]},
        {"title": "Process Synchronization",            "prereqs": ["Process Concept"]},
        {"title": "Deadlocks",                          "prereqs": ["Process Synchronization"]},
        {"title": "Memory Management",                  "prereqs": ["Process Concept"]},
        {"title": "Virtual Memory",                     "prereqs": ["Memory Management"]},
        {"title": "File Systems",                       "prereqs": ["Memory Management"]},
    ],
    "computer-networks": [
        {"title": "Introduction to Computer Networks",  "prereqs": []},
        {"title": "OSI and TCP/IP Models",              "prereqs": ["Introduction to Computer Networks"]},
        {"title": "Physical Layer",                     "prereqs": ["OSI and TCP/IP Models"]},
        {"title": "Data Link Layer",                    "prereqs": ["Physical Layer"]},
        {"title": "Network Layer",                      "prereqs": ["Data Link Layer"]},
        {"title": "Transport Layer",                    "prereqs": ["Network Layer"]},
        {"title": "Application Layer",                  "prereqs": ["Transport Layer"]},
        {"title": "Routing Algorithms",                 "prereqs": ["Network Layer"]},
        {"title": "Congestion Control",                 "prereqs": ["Transport Layer"]},
        {"title": "Network Security Basics",            "prereqs": ["Application Layer"]},
    ],
    "data-structures": [
        {"title": "Introduction to Data Structures",    "prereqs": []},
        {"title": "Arrays",                             "prereqs": ["Introduction to Data Structures"]},
        {"title": "Linked Lists",                       "prereqs": ["Arrays"]},
        {"title": "Stacks",                             "prereqs": ["Linked Lists"]},
        {"title": "Queues",                             "prereqs": ["Stacks"]},
        {"title": "Trees",                              "prereqs": ["Queues"]},
        {"title": "Binary Search Trees",                "prereqs": ["Trees"]},
        {"title": "Heaps and Priority Queues",          "prereqs": ["Trees"]},
        {"title": "Graphs",                             "prereqs": ["Trees"]},
        {"title": "Hashing",                            "prereqs": ["Arrays"]},
    ],
    "algorithms": [
        {"title": "Algorithm Analysis and Asymptotic Notations", "prereqs": []},
        {"title": "Recursion and Divide & Conquer",              "prereqs": ["Algorithm Analysis and Asymptotic Notations"]},
        {"title": "Greedy Algorithms",                           "prereqs": ["Recursion and Divide & Conquer"]},
        {"title": "Dynamic Programming",                         "prereqs": ["Recursion and Divide & Conquer"]},
        {"title": "Backtracking",                                "prereqs": ["Recursion and Divide & Conquer"]},
        {"title": "Branch and Bound",                            "prereqs": ["Backtracking"]},
        {"title": "Graph Algorithms",                            "prereqs": ["Dynamic Programming"]},
        {"title": "Shortest Path Algorithms",                    "prereqs": ["Graph Algorithms"]},
        {"title": "Minimum Spanning Tree",                       "prereqs": ["Graph Algorithms"]},
        {"title": "NP-Completeness",                             "prereqs": ["Dynamic Programming"]},
    ],
    "dbms": [
        {"title": "Introduction to DBMS",      "prereqs": []},
        {"title": "ER Model",                  "prereqs": ["Introduction to DBMS"]},
        {"title": "Relational Model",          "prereqs": ["ER Model"]},
        {"title": "SQL",                       "prereqs": ["Relational Model"]},
        {"title": "Relational Algebra",        "prereqs": ["Relational Model"]},
        {"title": "Normalization",             "prereqs": ["Relational Model"]},
        {"title": "Transaction Management",    "prereqs": ["Normalization"]},
        {"title": "Concurrency Control",       "prereqs": ["Transaction Management"]},
        {"title": "Indexing and Hashing",      "prereqs": ["SQL"]},
        {"title": "Recovery Techniques",       "prereqs": ["Transaction Management"]},
    ],
}

FEATURE_NAMES = [
    "prerequisite_avg",
    "prerequisite_min",
    "topic_position",
    "prereq_count",
    "prior_struggle_rate",
]


def simulate_student_scores(subject_topics, n_students=400):
    """
    Simulates n_students worth of score data for one subject.
    Score generation rules (reflect real learning patterns):
      - Base ability drawn from Beta distribution (skewed toward moderate)
      - Topics with weak prerequisites get lower scores (propagation effect)
      - Later topics get harder (position penalty)
      - Some students are consistently strong, some consistently weak
    """
    rows = []
    topic_titles = [t["title"] for t in subject_topics]

    for student_id in range(n_students):
        # Each student has a base ability: 0.0 to 1.0
        base_ability = np.random.beta(2, 2)  # peaks around 0.5, realistic spread

        # Simulate scores in order
        student_scores = {}

        for i, topic in enumerate(subject_topics):
            prereq_scores = [student_scores.get(p, 50) for p in topic["prereqs"]]

            if not prereq_scores:
                # No prerequisites — score depends on base ability
                score = base_ability * 100 + np.random.normal(0, 12)
            else:
                prereq_avg = np.mean(prereq_scores)
                prereq_min = np.min(prereq_scores)

                # If prerequisites were weak, propagate that weakness
                prereq_factor = (prereq_avg / 100) * 0.6 + (prereq_min / 100) * 0.4
                position_penalty = i * 2.5  # harder later topics

                score = (
                    base_ability * 60
                    + prereq_factor * 35
                    - position_penalty
                    + np.random.normal(0, 10)
                )

            score = float(np.clip(score, 0, 100))
            student_scores[topic["title"]] = score

            # ── Build features for this (student, topic) pair ──
            prereq_scores_used = [student_scores.get(p, 0) for p in topic["prereqs"]]

            prior_scores = [student_scores[t] for t in topic_titles[:i] if t in student_scores]
            prior_struggle_rate = (
                sum(1 for s in prior_scores if s < 40) / len(prior_scores)
                if prior_scores else 0.0
            )

            rows.append({
                "prerequisite_avg":   float(np.mean(prereq_scores_used)) if prereq_scores_used else 50.0,
                "prerequisite_min":   float(np.min(prereq_scores_used))  if prereq_scores_used else 50.0,
                "topic_position":     i,
                "prereq_count":       len(topic["prereqs"]),
                "prior_struggle_rate": prior_struggle_rate,
                "label":              1 if score < 40 else 0,   # 1 = will struggle
            })

    return rows


def build_dataset():
    all_rows = []
    for subject, topics in SUBJECTS.items():
        rows = simulate_student_scores(topics, n_students=400)
        all_rows.extend(rows)
    return pd.DataFrame(all_rows)


def train():
    print("Building dataset...")
    df = build_dataset()
    print(f"Dataset size: {len(df)} samples")
    print(f"Struggle rate: {df['label'].mean():.2%}")

    X = df[FEATURE_NAMES]
    y = df["label"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    print("\nTraining Random Forest...")
    model = RandomForestClassifier(
        n_estimators=150,
        max_depth=8,
        min_samples_split=10,
        min_samples_leaf=5,
        class_weight="balanced",   # handles class imbalance
        random_state=42,
        n_jobs=-1
    )
    model.fit(X_train, y_train)

    # ── Evaluation ──
    y_pred = model.predict(X_test)
    print(f"\nTest Accuracy: {accuracy_score(y_test, y_pred):.4f}")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=["No Struggle", "Struggle"]))

    # ── Feature importances (show in defence) ──
    print("\nFeature Importances:")
    for name, imp in sorted(zip(FEATURE_NAMES, model.feature_importances_), key=lambda x: -x[1]):
        print(f"  {name:<25} {imp:.4f}")

    # ── Save model ──
    with open("model.pkl", "wb") as f:
        pickle.dump({"model": model, "feature_names": FEATURE_NAMES}, f)

    print("\n✅ Model saved to ml_service/model.pkl")


if __name__ == "__main__":
    train()