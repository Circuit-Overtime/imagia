import cv2
import numpy as np
import mediapipe as mp

def remove_background(image, lower_color=np.array([25, 100, 100]), upper_color=np.array([35, 255, 255])):
    """
    Remove a solid yellow-green background using HSV thresholding.
    Adjust lower_color and upper_color to fit your background.
    """
    hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
    # Create a mask for the background
    bg_mask = cv2.inRange(hsv, lower_color, upper_color)
    # Refine the mask with morphological operations
    kernel = np.ones((3, 3), np.uint8)
    bg_mask = cv2.morphologyEx(bg_mask, cv2.MORPH_OPEN, kernel, iterations=2)
    bg_mask = cv2.morphologyEx(bg_mask, cv2.MORPH_DILATE, kernel, iterations=1)
    # Invert to get the foreground
    fg_mask = cv2.bitwise_not(bg_mask)
    b, g, r = cv2.split(image)
    alpha = fg_mask
    design_rgba = cv2.merge([b, g, r, alpha])
    return design_rgba

# Load and process the design image
design_img = cv2.imread("design_solid_bg.png")  # Replace with your image filename
design_rgba = remove_background(design_img,
                                lower_color=np.array([25, 100, 100]),
                                upper_color=np.array([35, 255, 255]))
design_h, design_w = design_rgba.shape[:2]
# Define source points from the design image corners
design_pts = np.array([[0, 0], [design_w, 0], [design_w, design_h], [0, design_h]], dtype=np.float32)

# Initialize MediaPipe Pose for real-time torso detection
mp_pose = mp.solutions.pose
pose = mp_pose.Pose(static_image_mode=False, min_detection_confidence=0.6, min_tracking_confidence=0.6)

# Start the camera
cap = cv2.VideoCapture(0)

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break

    # Flip for mirror view and convert to RGB
    frame = cv2.flip(frame, 1)
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = pose.process(rgb_frame)

    if results.pose_landmarks:
        landmarks = results.pose_landmarks.landmark
        h, w, _ = frame.shape

        # Choose landmarks to approximate the torso.
        # We use left/right shoulders and left/right hips.
        left_shoulder = landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value]
        right_shoulder = landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER.value]
        left_hip = landmarks[mp_pose.PoseLandmark.LEFT_HIP.value]
        right_hip = landmarks[mp_pose.PoseLandmark.RIGHT_HIP.value]

        torso_pts = np.array([
            [int(left_shoulder.x * w), int(left_shoulder.y * h)],
            [int(right_shoulder.x * w), int(right_shoulder.y * h)],
            [int(right_hip.x * w), int(right_hip.y * h)],
            [int(left_hip.x * w), int(left_hip.y * h)]
        ], dtype=np.float32)

        # Compute the perspective transform matrix to warp design image onto torso
        matrix = cv2.getPerspectiveTransform(design_pts, torso_pts)
        warped_design = cv2.warpPerspective(design_rgba, matrix, (w, h),
                                             flags=cv2.INTER_LINEAR,
                                             borderMode=cv2.BORDER_TRANSPARENT)
        
        # Blend warped design with the frame using the alpha channel
        if warped_design.shape[2] == 4:
            alpha_mask = warped_design[:, :, 3] / 255.0
            for c in range(3):
                frame[:, :, c] = (1 - alpha_mask) * frame[:, :, c] + alpha_mask * warped_design[:, :, c]

        # Optional: Draw torso outline for debugging
        cv2.polylines(frame, [torso_pts.astype(np.int32)], isClosed=True, color=(0, 255, 0), thickness=2)

    cv2.imshow("Real-Time AR T-Shirt Projection", frame)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
