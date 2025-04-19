from flask import Blueprint, Response
from utils.mediapipe_utils import generate_frames

video_feed_bp = Blueprint('video_feed', __name__)

@video_feed_bp.route('/')
def video_feed():
    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')