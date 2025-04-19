from flask import Blueprint, Response, jsonify
import cv2
from utils.squat_utils import SquatCounter
import threading

# Use thread-local storage for serverless compatibility
squat_counter = threading.local()
squat_data_bp = Blueprint('squat_data_bp', __name__)

def get_squat_counter():
    if not hasattr(squat_counter, 'instance'):
        squat_counter.instance = SquatCounter()
    return squat_counter.instance

def generate_squat_frames():
    counter = get_squat_counter()
    
    # Important: Use different camera index for serverless
    cap = cv2.VideoCapture(0 if cv2.CAP_DSHOW else -1)  # Adjust for Vercel compatibility
    
    try:
        while cap.isOpened():
            success, frame = cap.read()
            if not success:
                break
                
            try:
                image = counter.process_frame(frame)
                ret, buffer = cv2.imencode('.jpg', image)
                yield (b'--frame\r\n'
                      b'Content-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')
            except Exception as e:
                print(f"Frame processing error: {str(e)}")
                break
                
    finally:
        cap.release()
        cv2.destroyAllWindows()

@squat_data_bp.route('/squat_video_feed')
def squat_video_feed():
    return Response(
        generate_squat_frames(),
        mimetype='multipart/x-mixed-replace; boundary=frame',
        headers={
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'Access-Control-Allow-Origin': '*'  # Explicit CORS header
        }
    )

@squat_data_bp.route('/squat_data')
def squat_data():
    counter = get_squat_counter()
    return jsonify({
        'squat_counter': counter.squat_counter,
        'stage': counter.stage
    }), 200, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'  # Explicit CORS header
    }
