import sys
import os
import json
import numpy as np
import cv2
import insightface
from insightface.app import FaceAnalysis

def cosine_similarity(v1, v2):
    return np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2))

def load_known_faces(app, directory):
    known_embeddings = []
    known_labels = []
    
    if not os.path.exists(directory):
        return [], []

    for filename in os.listdir(directory):
        if filename.lower().endswith(('.jpg', '.jpeg', '.png')):
            img_path = os.path.join(directory, filename)
            img = cv2.imread(img_path)
            if img is None: continue
            
            img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            faces = app.get(img_rgb)
            
            if faces:
                # Use the first face detected in the reference photo
                known_embeddings.append(faces[0].embedding)
                # Label is the filename without extension
                known_labels.append(os.path.splitext(filename)[0])
                
    return known_embeddings, known_labels

def main(image_path, known_dir=None):
    try:
        # Initialize InsightFace
        app = FaceAnalysis(name='buffalo_l', providers=['CPUExecutionProvider'])
        app.prepare(ctx_id=0, det_size=(640, 640))

        # Load input image
        img = cv2.imread(image_path)
        if img is None:
            return {"status": "error", "message": f"Could not read image: {image_path}"}

        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        faces = app.get(img_rgb)

        if not faces:
            return {"status": "success", "faces_count": 0, "data": [], "message": "No face detected"}

        # Load known faces if directory provided
        known_embeddings, known_labels = [], []
        if known_dir:
            known_embeddings, known_labels = load_known_faces(app, known_dir)

        results = []
        for face in faces:
            match_name = "Unknown"
            max_sim = 0.0
            
            # Perform matching
            if known_embeddings:
                similarities = [cosine_similarity(face.embedding, ke) for ke in known_embeddings]
                if similarities:
                    idx = np.argmax(similarities)
                    max_sim = float(similarities[idx])
                    # Threshold from original model.ipynb was 0.35
                    if max_sim > 0.35:
                        match_name = known_labels[idx]

            results.append({
                "bbox": face.bbox.tolist(),
                "confidence": float(face.det_score),
                "match_name": match_name,
                "match_score": max_sim
            })

        return {
            "status": "success",
            "faces_count": len(results),
            "data": results,
            "known_faces_loaded": len(known_labels)
        }

    except Exception as e:
        return {"status": "error", "message": str(e)}

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"status": "error", "message": "No image path provided"}))
        sys.exit(1)

    img_path = sys.argv[1]
    # Check if known_faces directory is passed as 2nd arg
    known_dir_path = sys.argv[2] if len(sys.argv) > 2 else None
    
    result = main(img_path, known_dir_path)
    print(json.dumps(result))
