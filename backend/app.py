# app.py (Backend)
from flask import Flask, render_template, Response, jsonify
from flask_cors import CORS
import cv2
import mediapipe as mp
import numpy as np
import base64

app = Flask(__name__, template_folder='../frontend', static_folder='../frontend/static')
CORS(app)

# Initialize MediaPipe components
mp_drawing = mp.solutions.drawing_utils
mp_pose = mp.solutions.pose

# Global variables for workout tracking
left_counter = 0
right_counter = 0
left_stage = None
right_stage = None
left_counted = False
right_counted = False
left_angle_smoothed = None
right_angle_smoothed = None

def calculate_angle(a, b, c):
    a = np.array(a)
    b = np.array(b)
    c = np.array(c)
    radians = np.arctan2(c[1]-b[1], c[0]-b[0]) - np.arctan2(a[1]-b[1], a[0]-b[0])
    angle = np.abs(radians*180.0/np.pi)
    if angle > 180.0:
        angle = 360 - angle
    return angle

def smooth_angle(prev_angle, new_angle, alpha=0.6):
    if prev_angle is None:
        return new_angle
    return alpha * new_angle + (1 - alpha) * prev_angle

def generate_frames():
    global left_counter, right_counter, left_stage, right_stage
    global left_counted, right_counted, left_angle_smoothed, right_angle_smoothed
    
    cap = cv2.VideoCapture(0)
    with mp_pose.Pose(min_detection_confidence=0.5, min_tracking_confidence=0.5) as pose:
        while cap.isOpened():
            success, frame = cap.read()
            if not success:
                break

            # Process frame with MediaPipe
            image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            image.flags.writeable = False
            results = pose.process(image)
            image.flags.writeable = True
            image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)

            try:
                landmarks = results.pose_landmarks.landmark
                
                # Left arm processing
                left_shoulder = [landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value].x,
                                landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value].y]
                left_elbow = [landmarks[mp_pose.PoseLandmark.LEFT_ELBOW.value].x,
                             landmarks[mp_pose.PoseLandmark.LEFT_ELBOW.value].y]
                left_wrist = [landmarks[mp_pose.PoseLandmark.LEFT_WRIST.value].x,
                             landmarks[mp_pose.PoseLandmark.LEFT_WRIST.value].y]
                left_angle = calculate_angle(left_shoulder, left_elbow, left_wrist)
                left_angle_smoothed = smooth_angle(left_angle_smoothed, left_angle)

                # Right arm processing
                right_shoulder = [landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER.value].x,
                                 landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER.value].y]
                right_elbow = [landmarks[mp_pose.PoseLandmark.RIGHT_ELBOW.value].x,
                              landmarks[mp_pose.PoseLandmark.RIGHT_ELBOW.value].y]
                right_wrist = [landmarks[mp_pose.PoseLandmark.RIGHT_WRIST.value].x,
                              landmarks[mp_pose.PoseLandmark.RIGHT_WRIST.value].y]
                right_angle = calculate_angle(right_shoulder, right_elbow, right_wrist)
                right_angle_smoothed = smooth_angle(right_angle_smoothed, right_angle)

                # Rep counting logic
                if left_angle_smoothed > 160:
                    left_stage = "down"
                    left_counted = False
                if left_angle_smoothed < 30 and left_stage == 'down' and not left_counted:
                    left_stage = "up"
                    left_counter += 1
                    left_counted = True

                if right_angle_smoothed > 160:
                    right_stage = "down"
                    right_counted = False
                if right_angle_smoothed < 30 and right_stage == 'down' and not right_counted:
                    right_stage = "up"
                    right_counter += 1
                    right_counted = True

            except:
                pass

            # Encode frame for web display
            ret, buffer = cv2.imencode('.jpg', image)
            frame = buffer.tobytes()
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/video_feed')
def video_feed():
    return Response(generate_frames(), 
                    mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/workout_data')
def workout_data():
    return jsonify({
        'left_counter': left_counter,
        'right_counter': right_counter,
        'left_stage': left_stage,
        'right_stage': right_stage
    })

if __name__ == '__main__':
    app.run(debug=True)
