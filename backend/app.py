from flask import Flask, render_template
from routes.video_feed import video_feed_bp
from routes.workout_data import workout_data_bp

app = Flask(__name__)

# Register Blueprints
app.register_blueprint(video_feed_bp, url_prefix='/video_feed')
app.register_blueprint(workout_data_bp, url_prefix='/workout_data')

@app.route('/')
def index():
    return render_template('index.html')

if __name__ == '__main__':
    app.run(debug=True)