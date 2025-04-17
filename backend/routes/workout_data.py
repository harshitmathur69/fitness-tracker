from flask import Blueprint, jsonify
from utils.calculations import left_counter, right_counter, left_stage, right_stage

workout_data_bp = Blueprint('workout_data', __name__)

@workout_data_bp.route('/')
def workout_data():
    return jsonify({
        'left_counter': left_counter,
        'right_counter': right_counter,
        'left_stage': left_stage,
        'right_stage': right_stage
    })