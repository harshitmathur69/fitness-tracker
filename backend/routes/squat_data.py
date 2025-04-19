from flask import Blueprint, Response, jsonify
import cv2
from utils.squat_utils import SquatCounter

squat_counter = SquatCounter()
squat_data_bp = Blueprint('squat_data_bp', __name__)

def generate_squat_frames():
    cap = cv2.VideoCapture(0)
    while cap.isOpened():
        success, frame = cap.read()
        if not success:
            break
        image = squat_counter.process_frame(frame)
        ret, buffer = cv2.imencode('.jpg', image)
        frame = buffer.tobytes()
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')

@squat_data_bp.route('/squat_video_feed')
def squat_video_feed():
    return Response(generate_squat_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

@squat_data_bp.route('/squat_data')
def squat_data():
    return jsonify({
        'squat_counter': squat_counter.squat_counter,
        'stage': squat_counter.stage
    })
