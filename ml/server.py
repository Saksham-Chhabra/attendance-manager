"""
Fast Persistent InsightFace ML Server
Employs Dynamic Batching for Lightning-Fast 66-face Buffalo_L Inference (~2s).
"""
import os
import sys
import json
import time
import numpy as np
import cv2
import onnxruntime as ort
from flask import Flask, request, jsonify
from insightface.app import FaceAnalysis
from insightface.utils import face_align

app = Flask(__name__)

# ── 1. Setup Models ──────────────────────────────────────
print("[ML Server] Loading InsightFace Buffalo_L (Batched) models...")
t0 = time.time()

# 1a. Detector (SCRFD ONLY) - Skips gender/age/3d for speed
det_app = FaceAnalysis(name='buffalo_l', allowed_modules=['detection'], providers=['CPUExecutionProvider'])
det_app.prepare(ctx_id=0, det_size=(512, 512)) # Slight downscale 640->512 cuts FLOPs by 36% with no loss on 1080p

# INJECT ONNX THREADING INTO INSIGHTFACE DETECTOR
if 'detection' in det_app.models:
    det_model = det_app.models['detection']
    det_opt = ort.SessionOptions()
    det_opt.intra_op_num_threads = 4  # Cap at 4 to prevent thread thrashing
    det_opt.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
    det_model.session = ort.InferenceSession(det_model.model_file, sess_options=det_opt, providers=['CPUExecutionProvider'])

# 1b. Recognizer (ArcFace R50) - Loaded manually for Batched Processing
model_dir = os.path.expanduser('~/.insightface/models/buffalo_l')
rec_model = os.path.join(model_dir, 'w600k_r50.onnx')

# ONNX Session Optimizations
sess_options = ort.SessionOptions()
sess_options.intra_op_num_threads = 4 # Sweet spot for ResNet50 on CPU
sess_options.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL

rec_sess = ort.InferenceSession(rec_model, sess_options=sess_options, providers=['CPUExecutionProvider'])
rec_input_name = rec_sess.get_inputs()[0].name

print(f"[ML Server] Models optimized & loaded in {time.time()-t0:.1f}s ✓")

# ── 2. Load known faces database ──────────────────────────────────────
KNOWN_DIR = os.path.join(os.path.dirname(__file__), 'known_faces1')

def get_batched_embeddings(img_rgb, faces):
    """
    Takes an image and InsightFace Detection objects,
    extracts all faces at once, and runs a SINGLE batched prediction.
    """
    if not faces: return []
    
    blobs = []
    for face in faces:
        # Align using InsightFace's built-in 5-point affine transform
        aligned = face_align.norm_crop(img_rgb, landmark=face.kps, image_size=112)
        # HWC -> CHW
        aligned = np.transpose(aligned, (2, 0, 1))
        blobs.append(aligned)
        
    # Create single batch tensor (N, 3, 112, 112)
    blob = np.stack(blobs).astype(np.float32)
    blob = (blob / 127.5) - 1.0
    
    # Run Batched Inference in ONNXRuntime (Chunked for CPU cache efficiency)
    embeddings = []
    chunk_size = 16 # Magic number for CNN cache friendly CPU batching
    for i in range(0, len(blob), chunk_size):
        chunk = blob[i:i+chunk_size]
        emb_chunk = rec_sess.run(None, {rec_input_name: chunk})[0]
        embeddings.extend(emb_chunk)
    return np.array(embeddings)

def load_known_faces():
    """Pre-compute embeddings for all known students."""
    known = []
    if not os.path.exists(KNOWN_DIR): return known
    
    for filename in os.listdir(KNOWN_DIR):
        if filename.lower().endswith(('.jpg', '.jpeg', '.png')):
            img_path = os.path.join(KNOWN_DIR, filename)
            img = cv2.imread(img_path)
            if img is None: continue
            
            img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            faces = det_app.get(img_rgb)
            if faces:
                emb = get_batched_embeddings(img_rgb, [faces[0]])[0]
                known.append({
                    "name": os.path.splitext(filename)[0],
                    "embedding": emb
                })
    return known

print("[ML Server] Pre-computing known face embeddings...")
t0 = time.time()
known_faces = load_known_faces()
# Convert to numpy arrays for vectorized similarity
known_names = np.array([kf["name"] for kf in known_faces])
known_embs = np.array([kf["embedding"] for kf in known_faces]) if known_faces else np.array([])
print(f"[ML Server] {len(known_faces)} students loaded in {time.time()-t0:.1f}s ✓")

import threading

inference_lock = threading.Lock()

# ── 3. API Endpoint ───────────────────────────────────────────────────
@app.route('/analyze', methods=['POST'])
def analyze():
    if 'photo' not in request.files:
        return jsonify({"status": "error", "message": "No photo uploaded"}), 400

    t_start = time.time()
    file = request.files['photo']
    
    # Read image directly from memory
    img_bytes = file.read()
    nparr = np.frombuffer(img_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if img is None:
        return jsonify({"status": "error", "message": "Could not read image"}), 400

    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    
    # 0. Fast Hi-Res Scaling (Cap at 1080p equivalent)
    scale = 1.0
    max_dim = 1920
    h, w = img_rgb.shape[:2]
    if max(h, w) > max_dim:
        scale = max_dim / max(h, w)
        img_rgb = cv2.resize(img_rgb, (int(w * scale), int(h * scale)))
    
    with inference_lock:
        # 1. Fast Bounding Box Detection
        t_detect = time.time()
        faces = det_app.get(img_rgb)
        print(f"[ML Server] Found {len(faces)} boxes in {time.time()-t_detect:.2f}s")
        
        if not faces:
            return jsonify({"status": "success", "faces_count": 0, "data": [], "inference_time": round(time.time() - t_start, 2)})

        # 2. Dynamic Batched Deep Learning Embedding
        t_embed = time.time()
        embeddings = get_batched_embeddings(img_rgb, faces)
        print(f"[ML Server] Generated {len(embeddings)} ArcFace Embeddings in {time.time()-t_embed:.2f}s (Batched!)")

    # Scale back all bounding boxes for the frontend if image was scaled
    if scale != 1.0:
        for face in faces:
            face.bbox = face.bbox / scale

    # 3. Vectorized Similarity Matching
    t_match = time.time()
    results = []
    
    if len(known_embs) > 0:
        # Cosine Similarity Vectorized Matrix Multiplication
        # shape: (num_detected, num_known)
        norms_detected = np.linalg.norm(embeddings, axis=1)
        norms_known = np.linalg.norm(known_embs, axis=1)
        
        # dot product matrix
        dot_product = np.dot(embeddings, known_embs.T)
        
        # normalized similarities
        sim_matrix = dot_product / np.outer(norms_detected, norms_known)
        
        best_match_indices = np.argmax(sim_matrix, axis=1)
        best_match_scores = np.max(sim_matrix, axis=1)
    else:
        best_match_indices = [-1] * len(faces)
        best_match_scores = [0.0] * len(faces)

    for i, face in enumerate(faces):
        match_name = "Unknown"
        max_sim = float(best_match_scores[i])
        
        if max_sim > 0.35 and best_match_indices[i] != -1:
            match_name = known_names[best_match_indices[i]]

        results.append({
            "bbox": face.bbox.tolist(),
            "confidence": float(face.det_score),
            "match_name": match_name,
            "match_score": max_sim
        })
    
    print(f"[ML Server] Matrix Match: {time.time()-t_match:.2f}s | Total Pipeline: {time.time()-t_start:.2f}s")

    return jsonify({
        "status": "success",
        "faces_count": len(results),
        "data": results,
        "known_faces_loaded": len(known_names),
        "inference_time": round(time.time() - t_start, 2)
    })

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok", "model": "buffalo_l (batched)", "known_faces": len(known_names)})

if __name__ == '__main__':
    print("[ML Server] Starting Dynamic Batching Server on port 5050...")
    app.run(host='0.0.0.0', port=5050, debug=False)
