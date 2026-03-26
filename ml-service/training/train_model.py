from pathlib import Path
import sys
from datetime import datetime

import joblib
import pandas as pd
from sklearn.pipeline import FeatureUnion
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.append(str(PROJECT_ROOT))

from utils.preprocess import clean_text

DATASET_PATH = PROJECT_ROOT / "dataset" / "toxic_comments.csv"
MODELS_DIR = PROJECT_ROOT / "models"
LATEST_MODEL_INFO_PATH = MODELS_DIR / "latest_model.txt"


def load_dataset(path: Path) -> pd.DataFrame:
    if not path.exists():
        raise FileNotFoundError(f"Dataset not found at: {path}")

    df = pd.read_csv(path)
    expected_cols = {"comment_text", "toxic"}
    if not expected_cols.issubset(df.columns):
        raise ValueError("Dataset must contain 'comment_text' and 'toxic' columns")

    df = df.dropna(subset=["comment_text", "toxic"]).copy()
    df["comment_text"] = df["comment_text"].astype(str).map(clean_text)
    df["toxic"] = df["toxic"].astype(int)
    return df


def train() -> None:
    df = load_dataset(DATASET_PATH)

    if df["toxic"].nunique() < 2:
        raise ValueError("Training data must contain both classes (toxic=0 and toxic=1)")

    x_train, x_test, y_train, y_test = train_test_split(
        df["comment_text"],
        df["toxic"],
        test_size=0.2,
        random_state=42,
        stratify=df["toxic"],
    )

    vectorizer = FeatureUnion([
        (
            "word",
            TfidfVectorizer(
                analyzer="word",
                ngram_range=(1, 2),
                min_df=2,
                max_df=0.95,
                sublinear_tf=True,
            ),
        ),
        (
            "char",
            TfidfVectorizer(
                analyzer="char_wb",
                ngram_range=(3, 5),
                min_df=2,
                sublinear_tf=True,
            ),
        ),
    ])
    classifier = LogisticRegression(max_iter=1000, class_weight="balanced")

    pipeline = Pipeline([
        ("vectorizer", vectorizer),
        ("classifier", classifier),
    ])

    pipeline.fit(x_train, y_train)
    predictions = pipeline.predict(x_test)

    print("Training complete")
    print(classification_report(y_test, predictions, digits=4))

    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    model_filename = f"moderation_model_{timestamp}.pkl"
    model_path = MODELS_DIR / model_filename
    
    joblib.dump(pipeline, model_path)
    LATEST_MODEL_INFO_PATH.write_text(model_filename)

    print(f"Saved model pipeline: {model_path}")


if __name__ == "__main__":
    train()
