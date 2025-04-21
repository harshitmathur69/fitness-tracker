import datetime
from flask import Flask, Response, jsonify, request
from flask_cors import CORS
import cv2
import mediapipe as mp
import numpy as np
import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

app = Flask(__name__)
CORS(app)

mp_pose = mp.solutions.pose

# Global state
current_mode = "bicep_curl"
left_counter = right_counter = squat_counter = 0
left_stage = right_stage = squat_stage = None
left_counted = right_counted = squat_counted = False
left_angle_smoothed = right_angle_smoothed = None
left_knee_smoothed = right_knee_smoothed = None
workouts = []


@app.route('/set_mode', methods=['POST'])
def set_mode():
    global current_mode
    data = request.get_json()
    if data and 'mode' in data and data['mode'] in ['bicep_curl', 'squat']:
        current_mode = data['mode']
        return jsonify(success=True, mode=current_mode)
    return jsonify(success=False, error="Invalid mode"), 400

def calculate_angle(a, b, c):
    a, b, c = np.array(a), np.array(b), np.array(c)
    radians = np.arctan2(c[1]-b[1], c[0]-b[0]) - np.arctan2(a[1]-b[1], a[0]-b[0])
    angle = np.abs(radians * 180.0 / np.pi)
    return 360 - angle if angle > 180 else angle

def smooth_angle(prev, curr, alpha=0.6):
    return curr if prev is None else alpha * curr + (1 - alpha) * prev

def generate_frames():
    global left_counter, right_counter, left_stage, right_stage
    global left_counted, right_counted, left_angle_smoothed, right_angle_smoothed
    global squat_counter, squat_stage, squat_counted
    global left_knee_smoothed, right_knee_smoothed
    global current_mode

    cap = cv2.VideoCapture(0)
    with mp_pose.Pose(min_detection_confidence=0.5, min_tracking_confidence=0.5) as pose:
        while cap.isOpened():
            success, frame = cap.read()
            if not success:
                break

            image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            image.flags.writeable = False
            results = pose.process(image)
            image.flags.writeable = True
            image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)

            try:
                lm = results.pose_landmarks.landmark

                if current_mode == "bicep_curl":
                    # Left arm
                    l_shoulder = [lm[mp_pose.PoseLandmark.LEFT_SHOULDER.value].x, lm[mp_pose.PoseLandmark.LEFT_SHOULDER.value].y]
                    l_elbow = [lm[mp_pose.PoseLandmark.LEFT_ELBOW.value].x, lm[mp_pose.PoseLandmark.LEFT_ELBOW.value].y]
                    l_wrist = [lm[mp_pose.PoseLandmark.LEFT_WRIST.value].x, lm[mp_pose.PoseLandmark.LEFT_WRIST.value].y]
                    l_angle = calculate_angle(l_shoulder, l_elbow, l_wrist)
                    left_angle_smoothed = smooth_angle(left_angle_smoothed, l_angle)
                    if left_angle_smoothed > 160:
                        left_stage = "down"; left_counted = False
                    if left_angle_smoothed < 30 and left_stage == 'down' and not left_counted:
                        left_stage = "up"; left_counter += 1; left_counted = True

                    # Right arm
                    r_shoulder = [lm[mp_pose.PoseLandmark.RIGHT_SHOULDER.value].x, lm[mp_pose.PoseLandmark.RIGHT_SHOULDER.value].y]
                    r_elbow = [lm[mp_pose.PoseLandmark.RIGHT_ELBOW.value].x, lm[mp_pose.PoseLandmark.RIGHT_ELBOW.value].y]
                    r_wrist = [lm[mp_pose.PoseLandmark.RIGHT_WRIST.value].x, lm[mp_pose.PoseLandmark.RIGHT_WRIST.value].y]
                    r_angle = calculate_angle(r_shoulder, r_elbow, r_wrist)
                    right_angle_smoothed = smooth_angle(right_angle_smoothed, r_angle)
                    if right_angle_smoothed > 160:
                        right_stage = "down"; right_counted = False
                    if right_angle_smoothed < 30 and right_stage == 'down' and not right_counted:
                        right_stage = "up"; right_counter += 1; right_counted = True

                elif current_mode == "squat":
                    # Left leg
                    lh = [lm[mp_pose.PoseLandmark.LEFT_HIP.value].x, lm[mp_pose.PoseLandmark.LEFT_HIP.value].y]
                    lk = [lm[mp_pose.PoseLandmark.LEFT_KNEE.value].x, lm[mp_pose.PoseLandmark.LEFT_KNEE.value].y]
                    la = [lm[mp_pose.PoseLandmark.LEFT_ANKLE.value].x, lm[mp_pose.PoseLandmark.LEFT_ANKLE.value].y]
                    left_knee_angle = calculate_angle(lh, lk, la)
                    left_knee_smoothed = smooth_angle(left_knee_smoothed, left_knee_angle)

                    # Right leg
                    rh = [lm[mp_pose.PoseLandmark.RIGHT_HIP.value].x, lm[mp_pose.PoseLandmark.RIGHT_HIP.value].y]
                    rk = [lm[mp_pose.PoseLandmark.RIGHT_KNEE.value].x, lm[mp_pose.PoseLandmark.RIGHT_KNEE.value].y]
                    ra = [lm[mp_pose.PoseLandmark.RIGHT_ANKLE.value].x, lm[mp_pose.PoseLandmark.RIGHT_ANKLE.value].y]
                    right_knee_angle = calculate_angle(rh, rk, ra)
                    right_knee_smoothed = smooth_angle(right_knee_smoothed, right_knee_angle)

                    if left_knee_smoothed > 160 and right_knee_smoothed > 160:
                        squat_stage = "up"; squat_counted = False
                    if left_knee_smoothed < 90 and right_knee_smoothed < 90 and squat_stage == 'up' and not squat_counted:
                        squat_stage = "down"; squat_counter += 1; squat_counted = True

            except Exception:
                pass

            ret, buffer = cv2.imencode('.jpg', image)
            frame_bytes = buffer.tobytes()
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')


@app.route('/video_feed')
def video_feed():
    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')


@app.route('/workout_data')
def workout_data():
    return jsonify({
        'left_counter': left_counter,
        'right_counter': right_counter,
        'left_stage': left_stage,
        'right_stage': right_stage,
        'squat_counter': squat_counter,
        'squat_stage': squat_stage
    })


@app.route('/diet_suggestion', methods=['POST'])
def diet_suggestion():
    """Get AI-powered diet suggestions using Groq"""
    try:
        data = request.get_json()
        
        # Validate required fields from frontend form
        required_fields = ['age', 'weight', 'height', 'goal', 'preferences']
        for field in required_fields:
            if field not in data:
                return jsonify(success=False, error=f"Missing required field: {field}"), 400

        prompt = f"""
        As a professional nutritionist, create a personalized diet plan based on:
        - Age: {data['age']}
        - Weight: {data['weight']}kg
        - Height: {data['height']}cm
        - Fitness Goal: {data['goal']}
        - Dietary Preferences: {data['preferences']}
        
        Provide specific meal suggestions with portion sizes and timing.
        """
        
        chat_completion = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.3-70b-versatile",
            temperature=0.5
        )
        
        return jsonify({
            "success": True,
            "suggestion": chat_completion.choices[0].message.content
        })
    
    except Exception as e:
        app.logger.error(f"Diet suggestion error: {str(e)}")  # Add logging
        return jsonify({"success": False, "error": str(e)}), 500


@app.route('/form_score', methods=['POST'])
def form_score():
    """Calculate and store form score with workout data"""
    try:
        data = request.get_json()
        
        # Simple form scoring logic (you can enhance this)
        score = 100 - abs(data['target_angle'] - data['actual_angle'])
        
        workout_data = {
            "date": datetime.now().isoformat(),
            "exercise": data['exercise'],
            "reps": data['reps'],
            "score": max(0, min(100, score)),
            "angles": data.get('angles', []),
            "joint_data": data.get('joint_data', {})
        }
        
        workouts.append(workout_data)
        
        return jsonify({
            "success": True,
            "score": workout_data['score'],
            "workout": workout_data
        })
    
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400


@app.route('/form_feedback', methods=['GET'])
def form_feedback():
    """Get AI-generated form feedback using workout data"""
    try:
        if not workouts:
            return jsonify({"success": False, "error": "No workout data"}), 404
            
        latest = workouts[-1]
        
        prompt = f"""
        As a professional fitness trainer, analyze this workout data:
        - Exercise: {latest['exercise']}
        - Form Score: {latest['score']}/100
        - Key Angles: {latest['angles']}
        - Repetitions: {latest['reps']}
        
        Provide specific feedback on form improvements and injury prevention tips.
        Highlight 2-3 key areas for improvement with practical exercises.
        """
        
        chat_completion = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="mixtral-8x7b-32768",
            temperature=0.3
        )
        
        return jsonify({
            "success": True,
            "feedback": chat_completion.choices[0].message.content,
            "workout": latest
        })
    
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/reset', methods=['POST'])
def reset_counters():
    global left_counter, right_counter, squat_counter
    left_counter = right_counter = squat_counter = 0
    return jsonify(success=True)

if __name__ == '__main__':
    app.run(debug=True)
