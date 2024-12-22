import numpy as np
from sklearn.cluster import DBSCAN
from sklearn.preprocessing import StandardScaler
from collections import defaultdict
import json
from scipy.spatial import distance

class ObstacleDetector:
    def __init__(self, simulation=True):
        self.simulation = simulation
        self.RADIUS_THRESHOLD = 2000  # mm
        self.object_tracker = {}
        self.cluster_movement_history = defaultdict(list)
        self.previous_clusters = []

    def generate_simulated_data(self, num_points=100):
        """Generate random LiDAR-like points with some clustered structure"""
        # Generate some random cluster centers
        n_clusters = np.random.randint(2, 5)
        cluster_centers = np.random.uniform(-15, 15, (n_clusters, 2))
        
        points = []
        for center in cluster_centers:
            # Generate points around each cluster center
            n_points = np.random.randint(10, 30)
            cluster_points = np.random.normal(center, 1, (n_points, 2))
            points.extend(cluster_points)
        
        return np.array(points)

    def calculate_bounding_box(self, cluster_points):
        """
        Calculate a bounding box for a given cluster of points.
        Parameters:
            cluster_points (np.ndarray): Array of points in the cluster (x, y).
        Returns:
            bounding_box (dict): Dictionary containing bounding box center (x, y),
                                width, height, and rotation angle theta.
        """
        x_coords, y_coords = cluster_points[:, 0], cluster_points[:, 1]
        x_min, x_max = x_coords.min(), x_coords.max()
        y_min, y_max = y_coords.min(), y_coords.max()
        
        # Calculate bounding box properties
        center_x, center_y = (x_min + x_max) / 2, (y_min + y_max) / 2
        width, height = x_max - x_min, y_max - y_min
        theta = 0  # Assume no rotation; set to 0 initially
        
        return {
            "center": (center_x, center_y),
            "width": width,
            "height": height,
            "theta": theta
        }

    def is_moving_towards_lidar(self, movement_history, threshold=4):
        """
        Determine if a cluster is consistently moving toward the LiDAR.
        """
        return sum(movement < 0 for movement in movement_history) >= threshold

    def process_frame(self):
        """Process a single frame of LiDAR data"""
        if self.simulation:
            points = self.generate_simulated_data()
        else:
            # Here you would get real LiDAR data
            pass

        # Perform clustering
        X_scaled = StandardScaler().fit_transform(points)
        db = DBSCAN(eps=0.3, min_samples=10).fit(X_scaled)
        
        labels = db.labels_
        unique_labels = set(labels)
        
        # Process clusters and create response data
        current_clusters = []
        clusters_data = []
        
        for k in unique_labels:
            if k == -1:  # Skip noise points
                continue
            
            class_member_mask = (labels == k)
            cluster_points = points[class_member_mask]
            
            # Calculate bounding box with theta
            bounding_box = self.calculate_bounding_box(cluster_points)
            current_clusters.append(bounding_box)
            
            clusters_data.append({
                "center": bounding_box["center"],
                "width": bounding_box["width"],
                "height": bounding_box["height"],
                "theta": bounding_box["theta"],
                "points": cluster_points.tolist()
            })

        # Match clusters with previous frame
        matches, unmatched_prev, unmatched_curr = self.match_clusters(
            current_clusters, self.previous_clusters
        )

        # Update tracking data
        for prev_idx, curr_idx in matches:
            prev_box = self.previous_clusters[prev_idx]
            curr_box = current_clusters[curr_idx]
            
            # Calculate movement toward LiDAR
            movement = float(
                np.linalg.norm(prev_box["center"]) - 
                np.linalg.norm(curr_box["center"])
            )
            
            object_id = self.object_tracker.get(
                str(prev_box["center"]), len(self.object_tracker) + 1
            )
            self.object_tracker[str(curr_box["center"])] = object_id
            
            # Update movement history
            self.cluster_movement_history[object_id].append(movement)
            if len(self.cluster_movement_history[object_id]) > 4:
                self.cluster_movement_history[object_id].pop(0)
            
            moving_towards = bool(self.is_moving_towards_lidar(
                self.cluster_movement_history[object_id]
            ))
            
            clusters_data[curr_idx]["id"] = object_id
            clusters_data[curr_idx]["movement"] = movement
            clusters_data[curr_idx]["moving_towards_lidar"] = moving_towards

        # Update previous clusters for next frame
        self.previous_clusters = current_clusters

        # Prepare response data
        response_data = {
            "points": points.tolist(),
            "clusters": clusters_data,
            "radius_threshold": float(self.RADIUS_THRESHOLD)
        }
        
        return response_data

    def match_clusters(self, current_clusters, previous_clusters, max_distance=200):
        matches = []
        unmatched_current = set(range(len(current_clusters)))
        unmatched_previous = set(range(len(previous_clusters)))

        for i, current in enumerate(current_clusters):
            min_dist = float("inf")
            matched_prev = None
            for j, previous in enumerate(previous_clusters):
                dist = distance.euclidean(
                    current["center"], previous["center"]
                )
                if dist < min_dist and dist <= max_distance:
                    min_dist = dist
                    matched_prev = j
            if matched_prev is not None:
                matches.append((matched_prev, i))
                unmatched_previous.discard(matched_prev)
                unmatched_current.discard(i)    

        return matches, list(unmatched_previous), list(unmatched_current)