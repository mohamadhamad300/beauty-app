import sys
import struct
import signal

running = True

def handle_signal(sig, frame):
    global running
    running = False

signal.signal(signal.SIGTERM, handle_signal)

import cv2
import numpy as np
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision

model_path = None

for candidate in [
    "face_landmarker.task",
    __file__.rsplit("/", 1)[0] + "/face_landmarker.task",
    __file__.rsplit("\\", 1)[0] + "\\face_landmarker.task",
]:
    import os
    if os.path.exists(candidate):
        model_path = candidate
        break

if model_path is None:
    raise RuntimeError("face_landmarker.task not found")

options = vision.FaceLandmarkerOptions(
    base_options=python.BaseOptions(model_asset_path=model_path),
    running_mode=vision.RunningMode.IMAGE,
    output_face_blendshapes=False,
    output_facial_transformation_matrixes=False,
    num_faces=1,
)
landmarker = vision.FaceLandmarker.create_from_options(options)

LEFT_EYE_IDS = [33, 133, 155, 154, 153, 145, 144, 163, 7, 173, 157, 158, 159, 160, 161, 246]
RIGHT_EYE_IDS = [362, 263, 387, 386, 385, 373, 374, 380, 381, 382, 383, 384, 385, 386, 466, 388]
LIPS_INNER = [78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308, 324, 318, 402, 317, 14, 87, 178, 88, 95]
LIPS_OUTER = [61, 146, 91, 181, 184, 17, 314, 405, 321, 375, 291, 409, 270, 269, 267, 0, 37, 39, 40, 185]
FACE_OVAL = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109, 10]

def get_pts(landmarks, w, h, indices):
    return [(int(landmarks[i].x * w), int(landmarks[i].y * h)) for i in indices if i < len(landmarks)]

DRAW_LANDMARKS = True
LANDMARK_COLOR = (0, 255, 0)
EYE_OUTLINE_COLOR = (255, 255, 0)
LIP_OUTLINE_COLOR = (0, 200, 255)

def draw_contour(img, pts, color, thickness=2):
    if len(pts) < 2:
        return
    pts_arr = np.array(pts, dtype=np.int32)
    hull = cv2.convexHull(pts_arr)
    cv2.polylines(img, [hull], isClosed=True, color=color, thickness=thickness)

def draw_makeup(img, face_landmarks):
    h, w, _ = img.shape
    overlay = img.copy()
    detection = img.copy()

    for name, indices, color in [
        ("lips", LIPS_OUTER + LIPS_INNER, (60, 60, 220)),
        ("left_eye", LEFT_EYE_IDS, (180, 100, 200)),
        ("right_eye", RIGHT_EYE_IDS, (180, 100, 200)),
    ]:
        pts = get_pts(face_landmarks, w, h, indices)
        if pts:
            hull = cv2.convexHull(np.array(pts))
            cv2.fillConvexPoly(overlay, hull, color)

    all_pts = [(int(lm.x * w), int(lm.y * h)) for lm in face_landmarks]
    if all_pts:
        face_hull = cv2.convexHull(np.array(all_pts))
        face_mask = np.zeros((h, w), dtype=np.uint8)
        cv2.fillConvexPoly(face_mask, face_hull, 255)

        lips_mask = np.zeros((h, w), dtype=np.uint8)
        lips_pts = get_pts(face_landmarks, w, h, LIPS_OUTER + LIPS_INNER)
        if lips_pts:
            cv2.fillConvexPoly(lips_mask, cv2.convexHull(np.array(lips_pts)), 255)

        foundation_mask = cv2.subtract(face_mask, lips_mask)
        overlay[np.where(foundation_mask > 0)] = (220, 180, 160)

    result = cv2.addWeighted(overlay, 0.45, img, 0.55, 0)

    for name, indices, color in [
        ("blush_left", [50, 117, 118, 119, 120, 121, 123, 50], (200, 140, 180)),
        ("blush_right", [280, 425, 426, 427, 428, 429, 430, 280], (200, 140, 180)),
    ]:
        pts = get_pts(face_landmarks, w, h, indices)
        if pts:
            hull = cv2.convexHull(np.array(pts))
            m = np.zeros((h, w, 3), dtype=np.uint8)
            cv2.fillConvexPoly(m, hull, color)
            result = cv2.addWeighted(result, 1.0, m, 0.25, 0)

    if DRAW_LANDMARKS:
        for name, indices, color, label in [
            ("left_eye", LEFT_EYE_IDS, EYE_OUTLINE_COLOR, "L-EYE"),
            ("right_eye", RIGHT_EYE_IDS, EYE_OUTLINE_COLOR, "R-EYE"),
            ("lips", LIPS_OUTER, LIP_OUTLINE_COLOR, "LIPS"),
        ]:
            pts = get_pts(face_landmarks, w, h, indices)
            if pts:
                draw_contour(detection, pts, color, 2)
                cx = int(np.mean([p[0] for p in pts]))
                cy = int(np.mean([p[1] for p in pts]))
                cv2.putText(detection, label, (cx - 20, cy - 10),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)

        for lm in face_landmarks:
            x, y = int(lm.x * w), int(lm.y * h)
            cv2.circle(detection, (x, y), 1, LANDMARK_COLOR, -1)

        result = cv2.addWeighted(result, 0.7, detection, 0.3, 0)

    return result

def process_frame(jpeg_bytes):
    np_arr = np.frombuffer(jpeg_bytes, np.uint8)
    img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    if img is None:
        return jpeg_bytes

    rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
    result = landmarker.detect(mp_image)

    if result and result.face_landmarks:
        result_img = draw_makeup(img, result.face_landmarks[0])
    else:
        result_img = img

    ret, buf = cv2.imencode('.jpg', result_img, [cv2.IMWRITE_JPEG_QUALITY, 80])
    if not ret:
        return jpeg_bytes
    return buf.tobytes()

def main():
    while running:
        size_bytes = sys.stdin.buffer.read(4)
        if not size_bytes or len(size_bytes) < 4:
            break
        size = struct.unpack('>I', size_bytes)[0]
        jpeg_bytes = sys.stdin.buffer.read(size)
        if len(jpeg_bytes) < size:
            break

        result = process_frame(jpeg_bytes)

        sys.stdout.buffer.write(struct.pack('>I', len(result)))
        sys.stdout.buffer.write(result)
        sys.stdout.buffer.flush()

if __name__ == '__main__':
    main()
