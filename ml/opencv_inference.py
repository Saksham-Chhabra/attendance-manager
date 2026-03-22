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
        # We use the ArcFace R50 recognizer for high-precision 512-d embeddings
        rec_model = os.path.join(model_dir, 'w600k_r50.onnx')
        self.rec_sess = ort.InferenceSession(rec_model, providers=['CPUExecutionProvider'])
        self.rec_inputs = self.rec_sess.get_inputs()[0].name

    def preprocess(self, img, keypoints=None):
        """Alignment using 5 keypoints for ArcFace consistency."""
        if keypoints is not None and len(keypoints) >= 5:
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
            M = cv2.estimateAffinePartial2D(src, dst)[0] if hasattr(cv2, 'estimateAffinePartial2D') else cv2.getAffineTransform(src[:3], dst[:3])
            return cv2.warpAffine(img, M, (112, 112), borderValue=0.0)
        return cv2.resize(img, (112, 112))

    def get_embedding(self, img, keypoints=None):
        aligned = self.preprocess(img, keypoints)
        aligned = cv2.cvtColor(aligned, cv2.COLOR_BGR2RGB)
        aligned = aligned.astype(np.float32).transpose(2, 0, 1)
        aligned = np.expand_dims((aligned / 127.5) - 1.0, axis=0)
        return self.rec_sess.run(None, {self.rec_inputs: aligned})[0].flatten()

def cosine_similarity(v1, v2):
    return np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2))

def detect_and_recognize(image_path, ml_dir):
    try:
        model_dir = os.path.join(ml_dir, 'buffalo_l')
        ifface = InsightFaceONNX(model_dir)

        # 1. Load Pre-computed Database
        npz_path = os.path.join(ml_dir, 'embeddings.npz')
        if not os.path.exists(npz_path):
             return {"status": "error", "message": "embeddings.npz not found in ML dir."}
        
        db_data = np.load(npz_path)
        ref_names = db_data['names']
        ref_embeddings = db_data['embeddings']
        
        # Load Roll Numbers from students_list.json
        roll_map = {}
        sl_path = os.path.join(ml_dir, 'students_list.json')
        if os.path.exists(sl_path):
             with open(sl_path, 'r') as f:
                  sl_data = json.load(f)
                  # Mapping name -> roll (sl_data['0'] is names, sl_data['1'] is rolls)
                  names_dict = sl_data.get('0', {})
                  rolls_dict = sl_data.get('1', {})
                  for idx, name in names_dict.items():
                       roll_map[name] = rolls_dict.get(idx, "Unknown Roll")

        # 2. Setup Detection
        det_path = os.path.join(ml_dir, 'face_detector_full.tflite')
        detector = vision.FaceDetector.create_from_options(vision.FaceDetectorOptions(
            base_options=python.BaseOptions(model_asset_path=det_path), min_detection_confidence=0.15))

        # 3. Process Target Image
        input_img = cv2.imread(image_path)
        mp_input = mp.Image.create_from_file(image_path)
        det_res = detector.detect(mp_input)

        if not det_res.detections: return {"status": "success", "faces_count": 0, "data": []}

        detected_pool = []
        for i, dt in enumerate(det_res.detections):
            bbox = dt.bounding_box
            ix, iy, iw, ih = int(bbox.origin_x), int(bbox.origin_y), int(bbox.width), int(bbox.height)
            emb = iface.get_embedding(input_img, dt.keypoints)
            detected_pool.append({
                 "id": i, "bbox": [ix, iy, ix + iw, iy + ih], "embedding": emb,
                 "conf": float(dt.categories[0].score) if dt.categories else 0.9
            })

        # 4. Greedy Score Matrix matching against NPZ ref
        matches = []
        for df in detected_pool:
            # Vectorized similarity check
            sims = np.dot(ref_embeddings, df["embedding"]) / (np.linalg.norm(ref_embeddings, axis=1) * np.linalg.norm(df["embedding"]))
            for s_idx, sim in enumerate(sims):
                matches.append({"d_id": df["id"], "s_idx": s_idx, "score": float(sim)})

        matches.sort(key=lambda x: x['score'], reverse=True)
        assigned = {}; used = set()
        for m in matches:
            if m["d_id"] not in assigned and m["s_idx"] not in used:
                if m["score"] > 0.35: # InsightFace threshold
                    name = ref_names[m["s_idx"]]
                    roll = roll_map.get(name, "")
                    assigned[m["d_id"]] = {"name": f"{name},{roll}" if roll else name, "score": m["score"]}
                    used.add(m["s_idx"])

        # 5. Result Assembly
        final_data = []
        for df in detected_pool:
            match = assigned.get(df["id"])
            final_data.append({
                "bbox": df["bbox"], "confidence": df["conf"],
                "match_name": match["name"] if match else "Unknown Student",
                "match_score": match["score"] if match else 0.0
            })

        final_data.sort(key=lambda x: x['match_score'], reverse=True)
        return {"status": "success", "faces_count": len(final_data), "data": final_data, "engine": "InsightFace Database Match (Buffalo-L)"}

    except Exception as e: return {"status": "error", "message": str(e)}

if __name__ == "__main__":
    if len(sys.argv) < 3: sys.exit(1)
    print(json.dumps(detect_and_recognize(sys.argv[1], sys.argv[2])))
