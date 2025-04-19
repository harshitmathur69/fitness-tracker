from flask import Flask, render_template
from flask_cors import CORS
from routes.video_feed import video_feed_bp
from routes.workout_data import workout_data_bp
from routes.squat_data import squat_data_bp

# Initialize Flask app and set the template folder
app = Flask(__name__, template_folder='../frontend', static_folder='../frontend/static')
CORS(app, resources={r"/*": {
    "origins": [
        "https://fitness-tracker-frontend-rust.vercel.app/",  # Replace with your actual frontend domain
        "http://localhost:8080"  # For local development
    ],
    "methods": ["GET", "POST", "OPTIONS"],
    "allow_headers": ["Content-Type", "Authorization"]
}})

# Register Blueprints
app.register_blueprint(video_feed_bp, url_prefix='/video_feed')
app.register_blueprint(workout_data_bp, url_prefix='/workout_data')
app.register_blueprint(squat_data_bp, url_prefix='/squat_data')

@app.route('/')
def index():
    return {"status": "API is running"}

# Special handling for OPTIONS requests (preflight)
@app.route('/', defaults={'path': ''}, methods=['OPTIONS'])
@app.route('/<path:path>', methods=['OPTIONS'])
def options_handler(path):
    return '', 200

if __name__ == '__main__':
    app.run(debug=True)

    