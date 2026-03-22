import cv2
import sys
import os
import json
import numpy as np
import onnxruntime as ort
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision

class InsightFaceONNX:
    def __init__(self, model_dir):
        # Recognizer (ArcFace R50) is the key for Buffalo-L accuracy
        rec_model = os.path.join(model_dir, 'w600k_r50.onnx')
        self.rec_sess = ort.InferenceSession(rec_model, providers=['CPUExecutionProvider'])
        self.rec_inputs = self.rec_sess.get_inputs()[0].name

    def preprocess(self, img, keypoints=None):
        """Standard InsightFace alignment using 5 keypoints (if available)."""
        if keypoints is not None and len(keypoints) >= 5:
            # Standard InsightFace crop target points (112x112)
            # Coordinates for: Left Eye, Right Eye, Nose, Left Mouth, Right Mouth
            src = np.array([
                [keypoints[0].x * img.shape[1], keypoints[0].y * img.shape[0]],
                [keypoints[1].x * img.shape[1], keypoints[1].y * img.shape[0]],
                [keypoints[2].x * img.shape[1], keypoints[2].y * img.shape[0]],
                [keypoints[3].x * img.shape[1], keypoints[3].y * img.shape[0]],
                [keypoints[4].x * img.shape[1], keypoints[4].y * img.shape[0]]
            ], dtype=np.float32)
            
            dst = np.array([
                [38.2946, 51.6963], [73.5318, 51.5014], [56.0252, 71.7366],
                [41.5493, 92.3655], [70.7299, 92.2041]
            ], dtype=np.float32)
            
            if hasattr(cv2, 'estimateAffinePartial2D'):
                M, _ = cv2.estimateAffinePartial2D(src, dst)
            else:
                M = cv2.getAffineTransform(src[:3], dst[:3])
                
            warped = cv2.warpAffine(img, M, (112, 112), borderValue=0.0)
            return warped
        else:
            return cv2.resize(img, (112, 112))

    def get_embedding(self, face_img, keypoints=None):
        """ArcFace R50 embedding extraction."""
        aligned = self.preprocess(face_img, keypoints)
        aligned = cv2.cvtColor(aligned, cv2.COLOR_BGR2RGB)
        aligned = aligned.astype(np.float32)
        aligned = (aligned / 127.5) - 1.0
        aligned = aligned.transpose(2, 0, 1)
        aligned = np.expand_dims(aligned, axis=0)
        
        embedding = self.rec_sess.run(None, {self.rec_inputs: aligned})[0]
        return embedding.flatten()

def cosine_similarity(v1, v2):
    return np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2))

def detect_and_recognize(image_path, known_faces_dir):
    try:
        model_dir = os.path.join(os.path.dirname(__file__), 'buffalo_l')
        iface = InsightFaceONNX(model_dir)

        # Initialize MediaPipe Detector (Highest density detection)
        det_path = os.path.join(os.path.dirname(__file__), 'face_detector_full.tflite')
        detector = vision.FaceDetector.create_from_options(vision.FaceDetectorOptions(
            base_options=python.BaseOptions(model_asset_path=det_path), min_detection_confidence=0.15))

        # 1. Load Students (Pre-compute high-fidelity embeddings)
        known_students = []
        if os.path.exists(known_faces_dir):
            for filename in os.listdir(known_faces_dir):
                if filename.lower().endswith(('.png', '.jpg', '.jpeg')):
                    path = os.path.join(known_faces_dir, filename)
                    k_img = cv2.imread(path)
                    if k_img is not None:
                        # For reference photos, we detect keypoints for a perfect "clean" embedding
                        mp_ref = mp.Image.create_from_file(path)
                        ref_det = detector.detect(mp_ref)
                        kps = ref_det.detections[0].keypoints if ref_det.detections else None
                        known_students.append({
                            "name": filename.split('.')[0],
                            "embedding": iface.get_embedding(k_img, kps)
                        })

        # 2. Process Input
        input_img = cv2.imread(image_path)
        mp_image = mp.Image.create_from_file(image_path)
        det_result = detector.detect(mp_image)

        if not det_result.detections: return {"status": "success", "faces_count": 0, "data": []}

        # 3. Recognition Pipeline
        results = []
        # Multi-feature embeddings for greedy matching
        detected_pool = []
        for i, dt in enumerate(det_result.detections):
            bbox = dt.bounding_box
            ix, iy, iw, ih = int(bbox.origin_x), int(bbox.origin_y), int(bbox.width), int(bbox.height)
            roi = input_img[max(0, iy):min(input_img.shape[0], iy+ih), max(0, ix):min(input_img.shape[1], ix+iw)]
            
            if roi.size > 0:
                # Use det highlights for alignment
                emb = iface.get_embedding(input_img, dt.keypoints)
                detected_pool.append({
                    "id": i, "bbox": [ix, iy, ix + iw, iy + ih], "embedding": emb,
                    "conf": float(dt.categories[0].score) if dt.categories else 0.9
                })

        # 4. Greedy Score Matrix
        matches = []
        for d_face in detected_pool:
            for s_idx, st in enumerate(known_students):
                sim = cosine_similarity(d_face["embedding"], st["embedding"])
                matches.append({"d_id": d_face["id"], "s_idx": s_idx, "score": float(sim)})

        matches.sort(key=lambda x: x['score'], reverse=True)
        assigned = {}; used = set()
        for m in matches:
            if m["d_id"] not in assigned and m["s_idx"] not in used:
                if m["score"] > 0.32: # ArcFace threshold
                    assigned[m["d_id"]] = {"name": known_students[m["s_idx"]]["name"], "score": m["score"]}
                    used.add(m["s_idx"])

        # 5. Result Assembly
        final_data = []
        for d_face in detected_pool:
            match = assigned.get(d_face["id"])
            final_data.append({
                "bbox": d_face["bbox"], "confidence": d_face["conf"],
                "match_name": match["name"] if match else "Unknown Student",
                "match_score": match["score"] if match else 0.0
            })

        final_data.sort(key=lambda x: x['match_score'], reverse=True)
        return {
            "status": "success", "faces_count": len(final_data), "data": final_data,
            "engine": "InsightFace Pro (Buffalo-L Aligned)"
        }

    except Exception as e: return {"status": "error", "message": str(e)}

if __name__ == "__main__":
    if len(sys.argv) < 3: sys.exit(1)
    print(json.dumps(detect_and_recognize(sys.argv[1], sys.argv[2])))
