import cv2
import mediapipe as mp
from .calculations import calculate_angle, smooth_angle

mp_drawing = mp.solutions.drawing_utils
mp_pose = mp.solutions.pose

class SquatCounter:
    def __init__(self):
        self.squat_counter = 0
        self.stage = None
        self.counted = False
        self.angle_smoothed = None

    def process_frame(self, frame):
        with mp_pose.Pose(min_detection_confidence=0.5, min_tracking_confidence=0.5) as pose:
            image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            image.flags.writeable = False
            results = pose.process(image)
            image.flags.writeable = True
            image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)

            try:
                landmarks = results.pose_landmarks.landmark
                left_hip = [landmarks[mp_pose.PoseLandmark.LEFT_HIP.value].x,
                            landmarks[mp_pose.PoseLandmark.LEFT_HIP.value].y]
                left_knee = [landmarks[mp_pose.PoseLandmark.LEFT_KNEE.value].x,
                             landmarks[mp_pose.PoseLandmark.LEFT_KNEE.value].y]
                left_ankle = [landmarks[mp_pose.PoseLandmark.LEFT_ANKLE.value].x,
                              landmarks[mp_pose.PoseLandmark.LEFT_ANKLE.value].y]
                knee_angle = calculate_angle(left_hip, left_knee, left_ankle)
                self.angle_smoothed = smooth_angle(self.angle_smoothed, knee_angle)

                # Squat counter logic
                if self.angle_smoothed > 160:
                    self.stage = "up"
                    self.counted = False
                if self.angle_smoothed < 90 and self.stage == 'up' and not self.counted:
                    self.stage = "down"
                    self.squat_counter += 1
                    self.counted = True

                # Draw angle
                cv2.putText(image, f"Knee Angle: {int(self.angle_smoothed)}", 
                            (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
            except:
                pass

            # Counter display
            cv2.rectangle(image, (0, 0), (250, 73), (245, 117, 16), -1)
            cv2.putText(image, 'SQUATS', (15, 20), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 1, cv2.LINE_AA)
            cv2.putText(image, str(self.squat_counter), 
                        (15, 60), cv2.FONT_HERSHEY_SIMPLEX, 2, (255, 255, 255), 2)
            mp_drawing.draw_landmarks(image, results.pose_landmarks, mp_pose.POSE_CONNECTIONS,
                                      mp_drawing.DrawingSpec(color=(245,117,66), thickness=2, circle_radius=2), 
                                      mp_drawing.DrawingSpec(color=(245,66,230), thickness=2, circle_radius=2))
            return image
