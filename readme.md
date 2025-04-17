# Fitness Tracker Backend with AI Integration

## Overview

This project is a Python-based backend application powered by Flask, integrated with a **Next.js frontend**. It tracks workout progress using a webcam and provides users with real-time feedback on their exercise routines. The application also uses AI to generate personalized **diet plans** and **exercise routines** based on user input such as age, weight, fitness goals, and dietary preferences.

The backend and frontend work together to deliver a seamless and modern user experience.

---

## Features

### Workout Tracking
- Real-time pose estimation using **MediaPipe**.
- Counts repetitions for exercises like curls and squats.
- Tracks progress for both left and right arms.
- Smoothes angle calculations for better accuracy.

### AI-Powered Recommendations
- **Diet Plan Generator**: Recommends meals and nutrition plans tailored to user input (e.g., calorie goals, dietary restrictions, weight goals).
- **Exercise Routine Planner**: Provides customized workout routines based on fitness level, age, and goals (e.g., muscle building, weight loss, general fitness).

### Webcam Integration
- Streams video directly to the browser.
- Overlays visual feedback using OpenCV for guiding users during workouts.

---

## Project Structure

```
fitness-tracker/
├──backend/
│   ├── app.py                  # Main Flask app
│   ├── routes/                 # Route handlers for API endpoints
│   │   ├── __init__.py         # Initializes routes package
│   │   ├── video_feed.py       # Handles video streaming
│   │   ├── workout_data.py     # Serves workout progress data
│   ├── utils/                  # Utility modules for calculations and AI logic
│   │   ├── __init__.py         # Initializes utils package
│   │   ├── calculations.py     # Logic for angle calculations and smoothing
│   │   ├── mediapipe_utils.py  # Pose estimation and frame processing
│   │   ├── ai_planner.py       # AI-based logic for diet and exercise plans
│   ├── templates/              # HTML templates (e.g., index.html)
│   │   └── index.html
│   ├── static/                 # Static assets (CSS, images, etc.)
│   ├── requirements.txt        # Project dependencies
├──frontend/
│   ├── pages/                  # Next.js pages
│   │   ├── index.js            # Homepage
│   │   ├── workout.js          # Workout tracking page
│   │   ├── diet.js             # Diet plan page
│   ├── components/             # Reusable React components
│   ├── styles/                 # CSS/SCSS files
│   ├── package.json            # Frontend dependencies
├── README.md                   # Project documentation
```

---

## Installation

### Backend Setup

1. Clone the repository:
    ```bash
    git clone https://github.com/harshitmathur69/fitness-tracker.git
    cd fitness-tracker/backend
    ```

2. Set up a virtual environment:
    ```bash
    python -m venv .venv
    source .venv/bin/activate  # On Windows: .venv\Scripts\activate
    ```

3. Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```

4. Run the Flask application:
    ```bash
    python app.py
    ```

5. Access the backend locally at `http://127.0.0.1:5000`.

### Frontend Setup

1. Navigate to the `frontend` directory:
    ```bash
    cd ../frontend
    ```

2. Install dependencies:
    ```bash
    npm install
    ```

3. Start the Next.js development server:
    ```bash
    npm run dev
    ```

4. Access the frontend locally at `http://localhost:3000`.

---

## API Endpoints

### Backend Endpoints

#### `/`
- Renders the homepage.

#### `/video_feed`
- Streams live video from the webcam with pose estimation overlays.

#### `/workout_data`
- Provides workout progress data as JSON.

#### `/ai/diet_plan` *(New)*
- Accepts user input (e.g., age, weight, dietary preferences) and returns a personalized diet plan.

#### `/ai/exercise_plan` *(New)*
- Accepts fitness goals and user details to generate a tailored exercise routine.

### Frontend Integration

- The Next.js frontend communicates with the Flask backend via REST API calls to the above endpoints.
- Pages like `workout.js` and `diet.js` fetch data from `/video_feed`, `/workout_data`, `/ai/diet_plan`, and `/ai/exercise_plan` to display real-time feedback and AI-generated recommendations.

---

## How to Use AI Features

1. Send a POST request to `/ai/diet_plan` with JSON data:
    ```json
    {
      "age": 25,
      "weight": 70,
      "height": 175,
      "goal": "weight_loss",
      "preferences": ["vegetarian", "low-carb"]
    }
    ```
    Response:
    ```json
    {
      "breakfast": "Avocado toast with scrambled eggs",
      "lunch": "Grilled vegetable salad with quinoa",
      "dinner": "Vegetable stir-fry with tofu",
      "snacks": "Mixed nuts and a protein shake"
    }
    ```

2. Send a POST request to `/ai/exercise_plan` with JSON data:
    ```json
    {
      "fitness_level": "beginner",
      "goal": "muscle_building",
      "available_time": 45
    }
    ```
    Response:
    ```json
    {
      "routine": [
         {"exercise": "Push-ups", "reps": "3 sets of 10"},
         {"exercise": "Squats", "reps": "3 sets of 15"},
         {"exercise": "Plank", "duration": "3 sets of 30 seconds"}
      ]
    }
    ```

---

## Dependencies

### Backend
- Flask
- Flask-CORS
- Mediapipe
- OpenCV
- NumPy
- AI Libraries (e.g., TensorFlow, PyTorch, or Scikit-learn) for diet and exercise recommendations.

### Frontend
- Next.js
- React
- Axios (for API calls)
- Tailwind CSS or CSS Modules (for styling)

---

## Future Enhancements

- Add user authentication to save progress and preferences.
- Integrate with fitness wearables for more accurate tracking.
- Expand AI features to include mental wellness and meditation guides.
- Add PWA support for offline functionality.

---