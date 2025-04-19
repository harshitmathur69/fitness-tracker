from flask import Blueprint, request, jsonify
import os
from utils.groq_utils import get_groq_client

# Initialize blueprint
fitness_recommendations_bp = Blueprint('fitness_recommendations', __name__)

@fitness_recommendations_bp.route('/diet', methods=['POST'])
def diet_recommendations():
    """Generate diet recommendations based on user data"""
    try:
        # Check if request contains JSON data
        if not request.is_json:
            return jsonify({"error": "Request must contain JSON data", "status": "failed"}), 400
            
        user_data = request.json
        
        # Construct prompt for the LLM
        prompt = f"""
        As a fitness nutrition expert, provide a personalized diet plan based on the following information:
        - Weight: {user_data.get('weight', 'Not specified')}
        - Height: {user_data.get('height', 'Not specified')}
        - Age: {user_data.get('age', 'Not specified')}
        - Fitness Goal: {user_data.get('goal', 'Not specified')}
        - Dietary Restrictions: {user_data.get('restrictions', 'None')}
        - Current Activity Level: {user_data.get('activity_level', 'Not specified')}
        
        Include daily calorie targets, macronutrient breakdown, meal timing recommendations, 
        and a sample 3-day meal plan.
        """
        
        # Call Groq API
        client = get_groq_client()
        response = client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You are a certified nutritionist and fitness expert."},
                {"role": "user", "content": prompt}
            ],
            model="llama3-8b-8192",  # You can change the model as needed
        )
        
        return jsonify({
            "recommendations": response.choices[0].message.content,
            "status": "success"
        })
    
    except Exception as e:
        return jsonify({"error": str(e), "status": "failed"}), 500

@fitness_recommendations_bp.route('/exercises', methods=['POST'])
def exercise_recommendations():
    """Generate exercise recommendations based on user data"""
    try:
        # Check if request contains JSON data
        if not request.is_json:
            return jsonify({"error": "Request must contain JSON data", "status": "failed"}), 400
            
        user_data = request.json
        
        # Construct prompt for the LLM
        prompt = f"""
        As a fitness trainer, provide a personalized workout plan based on the following information:
        - Fitness Level: {user_data.get('fitness_level', 'Not specified')}
        - Available Equipment: {user_data.get('equipment', 'Not specified')}
        - Time Available Per Day: {user_data.get('time_available', 'Not specified')}
        - Fitness Goal: {user_data.get('goal', 'Not specified')}
        - Any Injuries or Limitations: {user_data.get('limitations', 'None')}
        - Preferred Workout Style: {user_data.get('preferred_style', 'Not specified')}
        
        Include a weekly workout schedule with specific exercises, sets, reps, 
        and rest periods. Also provide progression recommendations.
        """
        
        # Call Groq API
        client = get_groq_client()
        response = client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You are a certified personal trainer with expertise in exercise science."},
                {"role": "user", "content": prompt}
            ],
            model="llama3-8b-8192",  # You can change the model as needed
        )
        
        return jsonify({
            "recommendations": response.choices[0].message.content,
            "status": "success"
        })
    
    except Exception as e:
        return jsonify({"error": str(e), "status": "failed"}), 500
