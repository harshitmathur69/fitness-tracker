# app.py (Backend with Squat Tracking)
from flask import Flask, render_template, Response, jsonify
from flask_cors import CORS
import cv2
import mediapipe as mp
import numpy as np

app = Flask(__name__, template_folder='../frontend', static_folder='../frontend/static')
CORS(app)

# Initialize MediaPipe components
mp_drawing = mp.solutions.drawing_utils
mp_pose    = mp.solutions.pose

# Global variables for curl tracking
left_counter         = 0
right_counter        = 0
left_stage           = None
right_stage          = None
left_counted         = False
right_counted        = False
left_angle_smoothed  = None
right_angle_smoothed = None

# Global variables for squat tracking
squat_counter         = 0
squat_stage           = None
squat_counted         = False
# Smoothed-angle placeholders for each knee
left_knee_smoothed    = None
right_knee_smoothed   = None

def calculate_angle(a, b, c):
    """Calculate angle at point b formed by points a–b–c."""
    a = np.array(a); b = np.array(b); c = np.array(c)
    radians = np.arctan2(c[1]-b[1], c[0]-b[0]) - np.arctan2(a[1]-b[1], a[0]-b[0])
    angle   = np.abs(radians * 180.0 / np.pi)
    return 360 - angle if angle > 180 else angle  # Clamp to [0,180]

def smooth_angle(prev, curr, alpha=0.6):
    """Exponential moving average to reduce jitter."""
    return curr if prev is None else alpha * curr + (1 - alpha) * prev

def generate_frames():
    global left_counter, right_counter, left_stage, right_stage
    global left_counted, right_counted, left_angle_smoothed, right_angle_smoothed
    global squat_counter, squat_stage, squat_counted
    global left_knee_smoothed, right_knee_smoothed

    cap = cv2.VideoCapture(0)
    with mp_pose.Pose(min_detection_confidence=0.5,
                      min_tracking_confidence=0.5) as pose:
        while cap.isOpened():
            success, frame = cap.read()
            if not success:
                break

            # Convert BGR→RGB for MediaPipe processing
            img_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            img_rgb.flags.writeable = False
            results = pose.process(img_rgb)
            img_rgb.flags.writeable = True
            image = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2BGR)

            try:
                lm = results.pose_landmarks.landmark

                # --- CURL LOGIC (unchanged) ---
                # Left arm
                l_shoulder = [lm[mp_pose.PoseLandmark.LEFT_SHOULDER.value].x,
                              lm[mp_pose.PoseLandmark.LEFT_SHOULDER.value].y]
                l_elbow    = [lm[mp_pose.PoseLandmark.LEFT_ELBOW.value].x,
                              lm[mp_pose.PoseLandmark.LEFT_ELBOW.value].y]
                l_wrist    = [lm[mp_pose.PoseLandmark.LEFT_WRIST.value].x,
                              lm[mp_pose.PoseLandmark.LEFT_WRIST.value].y]
                l_angle    = calculate_angle(l_shoulder, l_elbow, l_wrist)
                left_angle_smoothed = smooth_angle(left_angle_smoothed, l_angle)

                if left_angle_smoothed > 160:
                    left_stage = "down"; left_counted = False
                if left_angle_smoothed < 30 and left_stage=='down' and not left_counted:
                    left_stage = "up"; left_counter += 1; left_counted = True

                # Right arm
                r_shoulder = [lm[mp_pose.PoseLandmark.RIGHT_SHOULDER.value].x,
                              lm[mp_pose.PoseLandmark.RIGHT_SHOULDER.value].y]
                r_elbow    = [lm[mp_pose.PoseLandmark.RIGHT_ELBOW.value].x,
                              lm[mp_pose.PoseLandmark.RIGHT_ELBOW.value].y]
                r_wrist    = [lm[mp_pose.PoseLandmark.RIGHT_WRIST.value].x,
                              lm[mp_pose.PoseLandmark.RIGHT_WRIST.value].y]
                r_angle    = calculate_angle(r_shoulder, r_elbow, r_wrist)
                right_angle_smoothed = smooth_angle(right_angle_smoothed, r_angle)

                if right_angle_smoothed > 160:
                    right_stage = "down"; right_counted = False
                if right_angle_smoothed < 30 and right_stage=='down' and not right_counted:
                    right_stage = "up"; right_counter += 1; right_counted = True

                # --- SQUAT LOGIC ADDED BELOW ---
                # Landmarks for both legs (hip → knee → ankle)
                lh = [lm[mp_pose.PoseLandmark.LEFT_HIP.value].x,
                      lm[mp_pose.PoseLandmark.LEFT_HIP.value].y]
                lk = [lm[mp_pose.PoseLandmark.LEFT_KNEE.value].x,
                      lm[mp_pose.PoseLandmark.LEFT_KNEE.value].y]
                la = [lm[mp_pose.PoseLandmark.LEFT_ANKLE.value].x,
                      lm[mp_pose.PoseLandmark.LEFT_ANKLE.value].y]

                rh = [lm[mp_pose.PoseLandmark.RIGHT_HIP.value].x,
                      lm[mp_pose.PoseLandmark.RIGHT_HIP.value].y]
                rk = [lm[mp_pose.PoseLandmark.RIGHT_KNEE.value].x,
                      lm[mp_pose.PoseLandmark.RIGHT_KNEE.value].y]
                ra = [lm[mp_pose.PoseLandmark.RIGHT_ANKLE.value].x,
                      lm[mp_pose.PoseLandmark.RIGHT_ANKLE.value].y]

                # Compute & smooth each knee angle
                left_knee_raw    = calculate_angle(lh, lk, la)
                right_knee_raw   = calculate_angle(rh, rk, ra)
                left_knee_smoothed  = smooth_angle(left_knee_smoothed, left_knee_raw)
                right_knee_smoothed = smooth_angle(right_knee_smoothed, right_knee_raw)

                # Detect full squat when both knees go up→down
                if left_knee_smoothed > 160 and right_knee_smoothed > 160:
                    squat_stage = "up"; squat_counted = False
                if left_knee_smoothed <  90 and right_knee_smoothed <  90 \
                   and squat_stage=="up" and not squat_counted:
                    squat_stage = "down"; squat_counter += 1; squat_counted = True

                # Draw smoothed knee angles near each knee
                lk_pos = tuple((np.array(lk)*[640,480]).astype(int))
                rk_pos = tuple((np.array(rk)*[640,480]).astype(int))
                cv2.putText(image, f"{int(left_knee_smoothed)}°",  lk_pos,
                            cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255,255,255), 2)
                cv2.putText(image, f"{int(right_knee_smoothed)}°", rk_pos,
                            cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255,255,255), 2)

            except Exception:
                pass

            # Encode & yield frame for MJPEG stream
            ret, buffer = cv2.imencode('.jpg', image)
            frame_bytes = buffer.tobytes()
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' +
                   frame_bytes + b'\r\n')

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
        'left_counter':  left_counter,
        'right_counter': right_counter,
        'left_stage':    left_stage,
        'right_stage':   right_stage,
        'squat_counter': squat_counter,
        'squat_stage':   squat_stage
    })
# Add to app.py
@app.route('/reset', methods=['POST'])
def reset_counters():
    global left_counter, right_counter, squat_counter
    left_counter = 0
    right_counter = 0
    squat_counter = 0
    return jsonify(success=True)

if __name__ == '__main__':
    app.run(debug=True)
