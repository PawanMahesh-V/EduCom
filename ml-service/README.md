# ML Moderation Service

This service trains and serves a toxic-text classifier used by the Node backend.

## Folder Structure

- `dataset/toxic_comments.csv` - training data (`comment_text`, `toxic`)
- `training/train_model.py` - training script
- `models/` - generated model artifacts
- `api/moderation_api.py` - FastAPI endpoint
- `utils/preprocess.py` - text cleaning utilities
- `main.py` - app entrypoint

## 1) Add Dataset

Place your dataset in `dataset/toxic_comments.csv` with this schema:

```csv
comment_text,toxic
"You are stupid",1
"I like your work",0
```

Use a larger dataset such as the Jigsaw Toxic Comment dataset for real performance.

## 2) Install Dependencies

```bash
cd ml-service
pip install -r requirements.txt
```

## 3) Train Model

```bash
python training/train_model.py
```

This creates:

- `models/moderation_model.pkl`
- `models/vectorizer.pkl`

## 4) Run API

```bash
python main.py
```

Service runs on `http://localhost:8001`.

## API Example

Request:

```json
{
  "text": "You are stupid"
}
```

Response:

```json
{
  "toxic": true,
  "confidence": 0.98
}
```
