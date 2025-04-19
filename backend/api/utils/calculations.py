import numpy as np

# Global variables
left_counter = 0
right_counter = 0
left_stage = None
right_stage = None


def calculate_angle(a, b, c): # type: ignore
    a = np.array(a) # type: ignore
    b = np.array(b) # type: ignore
    c = np.array(c) # type: ignore
    radians = np.arctan2(c[1]-b[1], c[0]-b[0]) - np.arctan2(a[1]-b[1], a[0]-b[0])
    angle = np.abs(radians * 180.0 / np.pi)
    if angle > 180.0:
        angle = 360 - angle
    return angle

def smooth_angle(prev_angle: float | None, new_angle: float, alpha: float = 0.7) -> float:
    if prev_angle is None:
        return new_angle
    return alpha * new_angle + (1 - alpha) * prev_angle