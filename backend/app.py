import datetime
from flask import Flask, Response, jsonify, request
from flask_cors import CORS
import cv2
import mediapipe as mp
import numpy as np
import os
from groq import Groq
from dotenv import load_dotenv
import json

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
exercise_data = {"bicep_curl": [], "squat": []}
diet = []  
feedback_list = []
current_id = 1
cap = cv2.VideoCapture(0).release()


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
    global current_mode, cap

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
                        
                        exercise_data["bicep_curl"].append({
                            "left_shoulder": l_shoulder,
                            "left_elbow": l_elbow,
                            "left_wrist": l_wrist,
                            "left_angle": left_angle_smoothed
                        })

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

                        exercise_data["bicep_curl"].append({
                            "right_shoulder": r_shoulder,
                            "right_elbow": r_elbow,
                            "right_wrist": r_wrist,
                            "right_angle": right_angle_smoothed
                        })

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

                        exercise_data["squat"].append({
                            "left_hip": lh,
                            "left_knee": lk,
                            "left_ankle": la,
                            "left_knee_angle": left_knee_smoothed,
                            "right_hip": rh,
                            "right_knee": rk,
                            "right_ankle": ra,
                            "right_knee_angle": right_knee_smoothed
                        })
                    


            except Exception:
                pass

            ret, buffer = cv2.imencode('.jpg', image)
            frame_bytes = buffer.tobytes()
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

def release_camera():
    global cap
    if cap.isOpened():
        cap = cv2.VideoCapture(0).release()
    print("Camera released.")

@app.route('/video_feed', methods=['GET', 'POST'])
def video_feed():
    """
    Video streaming generator function.
    Accepts a URL parameter: ?on=true or ?on=false
    Returns streaming video only if on=true.
    """
    global cap
    on_param = request.args.get('on', 'false').lower()
    if on_param == 'true':
        # Start streaming frames
        return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')
    else:
        # Return 204 No Content or a message indicating streaming is off
        # cap.release()  # Release the camera if it was opened
        return Response(release_camera(), status=204)
  
    
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
        As a professional nutritionist, create a personalized diet plan for 1 week based on:
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

        diet_entry = {
            "suggestion": chat_completion.choices[0].message.content,
            "analysis": None
        }

        diet.append(diet_entry)
        
        return jsonify({
            "success": True,
            "suggestion": chat_completion.choices[0].message.content
        })
    
    except Exception as e:
        app.logger.error(f"Diet suggestion error: {str(e)}")  # Add logging
        return jsonify({"success": False, "error": str(e)}), 500


@app.route('/diet_analysis', methods=['POST'])
def diet_analysis():
    try:
        data = request.get_json()
        
        if not diet:
            return jsonify(success=False, error="No diet suggestions available"), 404

        # Get latest diet entry
        latest_diet = diet[-1]
        
        prompt = f"""
        Analyze this diet plan and calculate AVERAGE DAILY VALUES for:
        - Total calories (number only)
        - Proteins in grams (number only)
        - Carbohydrates in grams (number only)
        - Fats in grams (number only)

        Return STRICT JSON format:
        {{
            "monday": {{"calories": 2000, "protein": 150, "carbs": 250, "fats": 70}},
            "tuesday": {{"calories": 2100, "protein": 155, "carbs": 260, "fats": 75}},
            "wednesday": {{"calories": 2050, "protein": 152.5, "carbs": 255, "fats": 72.5}}
            "thursday": {{"calories": 2050, "protein": 152.5, "carbs": 255, "fats": 72.5}}
            "friday": {{"calories": 2050, "protein": 152.5, "carbs": 255, "fats": 72.5}}
            "saturday": {{"calories": 2050, "protein": 152.5, "carbs": 255, "fats": 72.5}}
            "sunday": {{"calories": 2050, "protein": 152.5, "carbs": 255, "fats": 72.5}}
        }}

        Diet Plan:
        {latest_diet['suggestion']}
        """
        
        chat_completion = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.3-70b-versatile",
            temperature=0.1,
            response_format={"type": "json_object"}
        )
        
        analysis = json.loads(chat_completion.choices[0].message.content)
        
        # Update diet entry with analysis
        latest_diet['analysis'] = analysis
        
        return jsonify({
            "success": True,
            "analysis": analysis,
            "diet_id": len(diet)-1
        })
    
    except json.JSONDecodeError:
        return jsonify({"success": False, "error": "Invalid JSON from AI"}), 500
    except Exception as e:
        app.logger.error(f"Diet analysis error: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500


@app.route('/form_feedback', methods=['GET'])
def form_feedback():
    global exercise_data
    global feedback_list
    print("Exercise data:", exercise_data)  # Debugging line
    workouts = exercise_data
    global current_id

    try:
        if not workouts["bicep_curl"] and not workouts["squat"]:
            return jsonify({"success": False, "error": "No workout data"}), 404

        for exercise_name in ["bicep_curl", "squat"]:
            if not workouts[exercise_name]:
                continue

            # 1. Get issue
            issue_prompt = f"""Analyze this {exercise_name} form data extracted by body tracking using mediapipe and identify the single most important form issue:
            {workouts[exercise_name]}
            Return ONLY a one line issue."""
            issue_response = client.chat.completions.create(
                messages=[{"role": "user", "content": issue_prompt}],
                model="llama-3.3-70b-versatile",
                temperature=0.3
            )
            issue = issue_response.choices[0].message.content.strip()

            # 2. Get tip
            tip_prompt = f"""For the following {exercise_name} form issue, provide a single, actionable corrective tip:
            Issue: "{issue}"
            Return one liner tip."""
            tip_response = client.chat.completions.create(
                messages=[{"role": "user", "content": tip_prompt}],
                model="llama-3.3-70b-versatile",
                temperature=0.3
            )
            tip = tip_response.choices[0].message.content.strip()

            # 3. Get severity
            severity_prompt = f"""For the following {exercise_name} form issue, assign a severity (low, medium, or high):
            Issue: "{issue}"
            Return just one word: low, medium, or high."""
            severity_response = client.chat.completions.create(
                messages=[{"role": "user", "content": severity_prompt}],
                model="llama-3.3-70b-versatile",
                temperature=0.2
            )
            severity = severity_response.choices[0].message.content.strip().strip('"').lower()

            # 4. Get score
            score_prompt = f"""For the following {exercise_name} form issue, assign a numeric score (0-100) indicating overall form quality (higher is better):
            Issue: "{issue}"
            Return just a number like 85."""
            score_response = client.chat.completions.create(
                messages=[{"role": "user", "content": score_prompt}],
                model="llama-3.3-70b-versatile",
                temperature=0.2
            )
            try:
                score = int(score_response.choices[0].message.content.strip().strip('"'))
            except ValueError:
                score = 0  # Default or log an error

            feedback_list.append({
                "id": current_id,
                "exercise": exercise_name,
                "issue": issue,
                "severity": severity,
                "tip": tip,
                "score": score
            })
            current_id += 1

            print(f"Feedback for {exercise_name}: {feedback_list[-1]}")

        return jsonify({"success": True, "feedback": feedback_list})

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/feedback', methods=['GET'])
def get_feedback():
    global feedback_list    
    # Return the latest feedback entry
    return jsonify({"success": True, "feedback": feedback_list[::-1]})


@app.route('/form_score', methods=['GET'])
def form_score():
    global feedback_list
    try:
        # Initialize default structure even with empty data
        scores_with_averages = {
            "bicep_curl": {"scores": [], "average_score": 0},
            "squat": {"scores": [], "average_score": 0}
        }

        if feedback_list:
            exercise_scores = {}
            for feedback in feedback_list:
                exercise = feedback['exercise']
                score = feedback['score']
                if exercise not in exercise_scores:
                    exercise_scores[exercise] = []
                exercise_scores[exercise].append(score)

            # Update structure with actual data
            for exercise, scores in exercise_scores.items():
                scores_with_averages[exercise] = {
                    "scores": scores,
                    "average_score": sum(scores)/len(scores) if scores else 0
                }

        return jsonify({
            "success": True,
            "scores": scores_with_averages
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e),
            "scores": {  # Fallback structure
                "bicep_curl": {"scores": [], "average_score": 0},
                "squat": {"scores": [], "average_score": 0}
            }
        }), 500


@app.route('/reset', methods=['POST'])
def reset_counters():
    global left_counter, right_counter, squat_counter
    left_counter = right_counter = squat_counter = 0
    return jsonify(success=True)


if __name__ == '__main__':
    app.run(debug=True)
