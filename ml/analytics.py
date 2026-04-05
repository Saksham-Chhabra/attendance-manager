"""
Machine Learning Analytics Module
Handles attendance predictions, clustering, and anomaly detection
"""
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.cluster import KMeans
from sklearn.ensemble import IsolationForest
from datetime import datetime, timedelta
import json

class AttendanceAnalytics:
    """Analytics engine for attendance data"""
    
    def __init__(self):
        self.scaler = StandardScaler()
        self.lr_model = None
        self.kmeans_model = None
        self.iso_forest = None
    
    def prepare_student_features(self, attendance_data):
        """
        Convert attendance records into ML-ready features
        attendance_data: List of {date, student_id, status}
        Returns: DataFrame with features per student
        """
        df = pd.DataFrame(attendance_data)
        
        if df.empty:
            return pd.DataFrame()
        
        # Convert date to datetime
        df['date'] = pd.to_datetime(df['date'])
        
        # Group by student
        student_stats = []
        for student_id, group in df.groupby('student_id'):
            total_sessions = len(group)
            present = (group['status'] == 'present').sum()
            absent = (group['status'] == 'absent').sum()
            
            if total_sessions == 0:
                continue
            
            attendance_rate = present / total_sessions
            
            # Calculate trend (is attendance improving or declining?)
            sorted_dates = group.sort_values('date')
            if len(sorted_dates) >= 2:
                first_half = (sorted_dates.iloc[:len(sorted_dates)//2]['status'] == 'present').sum()
                second_half = (sorted_dates.iloc[len(sorted_dates)//2:]['status'] == 'present').sum()
                trend = second_half - first_half
            else:
                trend = 0
            
            # Consecutive absences
            consecutive_absences = self._count_consecutive_absences(group)
            
            # Regularity (how consistent is attendance?)
            regularity = self._calculate_regularity(sorted_dates)
            
            student_stats.append({
                'student_id': student_id,
                'total_sessions': total_sessions,
                'attendance_rate': attendance_rate,
                'present_count': present,
                'absent_count': absent,
                'trend': trend,
                'consecutive_absences': consecutive_absences,
                'regularity': regularity
            })
        
        return pd.DataFrame(student_stats)
    
    def _count_consecutive_absences(self, attendance_group):
        """Count max consecutive absences"""
        statuses = attendance_group.sort_values('date')['status'].values
        max_consecutive = 0
        current_consecutive = 0
        
        for status in statuses:
            if status == 'absent':
                current_consecutive += 1
                max_consecutive = max(max_consecutive, current_consecutive)
            else:
                current_consecutive = 0
        
        return max_consecutive
    
    def _calculate_regularity(self, attendance_dates):
        """Calculate attendance regularity (std dev of days between classes)"""
        if len(attendance_dates) < 2:
            return 0
        
        days_between = attendance_dates.diff().dt.days.dropna().values
        if len(days_between) == 0:
            return 0
        
        regularity = 1 / (1 + np.std(days_between))  # Normalize to 0-1
        return float(regularity)
    
    def predict_at_risk_students(self, attendance_data, threshold=0.5):
        """
        Logistic Regression: Predict students at risk of low attendance
        Returns: List of students with risk scores
        """
        features_df = self.prepare_student_features(attendance_data)
        
        if features_df.empty:
            return []
        
        # Prepare features
        X = features_df[[
            'attendance_rate', 
            'trend', 
            'consecutive_absences', 
            'regularity'
        ]].values
        
        # Create binary target: 1 if attendance < 75%, 0 otherwise
        y = (features_df['attendance_rate'] < 0.75).astype(int).values
        
        if len(np.unique(y)) < 2 or len(X) < 5:
            # Not enough data for training, use simple heuristics
            return self._simple_at_risk_prediction(features_df)
        
        # Scale features
        X_scaled = self.scaler.fit_transform(X)
        
        # Train logistic regression
        self.lr_model = LogisticRegression(random_state=42)
        self.lr_model.fit(X_scaled, y)
        
        # Get risk probabilities
        risk_probabilities = self.lr_model.predict_proba(X_scaled)[:, 1]
        
        # Return results
        results = []
        for idx, row in features_df.iterrows():
            risk_score = float(risk_probabilities[idx])
            results.append({
                'student_id': row['student_id'],
                'risk_score': risk_score,
                'is_at_risk': risk_score >= threshold,
                'attendance_rate': float(row['attendance_rate']),
                'reasoning': self._generate_risk_reasoning(row, risk_score)
            })
        
        # Sort by risk score (highest first)
        results.sort(key=lambda x: x['risk_score'], reverse=True)
        
        return results
    
    def _simple_at_risk_prediction(self, features_df):
        """Simple heuristic-based prediction when not enough data"""
        results = []
        for _, row in features_df.iterrows():
            # Simple scoring: lower attendance = higher risk
            risk_score = 1 - row['attendance_rate']
            results.append({
                'student_id': row['student_id'],
                'risk_score': float(risk_score),
                'is_at_risk': row['attendance_rate'] < 0.75,
                'attendance_rate': float(row['attendance_rate']),
                'reasoning': f"Attendance rate: {row['attendance_rate']*100:.1f}%"
            })
        
        results.sort(key=lambda x: x['risk_score'], reverse=True)
        return results
    
    def _generate_risk_reasoning(self, row, risk_score):
        """Generate human-readable risk explanation"""
        reasons = []
        
        if row['attendance_rate'] < 0.75:
            reasons.append(f"Low attendance rate: {row['attendance_rate']*100:.1f}%")
        
        if row['consecutive_absences'] >= 3:
            reasons.append(f"{int(row['consecutive_absences'])} consecutive absences")
        
        if row['trend'] < 0:
            reasons.append("Declining attendance trend")
        
        if row['regularity'] < 0.3:
            reasons.append("Irregular attendance pattern")
        
        return " | ".join(reasons) if reasons else "Monitor closely"
    
    def cluster_students(self, attendance_data, n_clusters=3):
        """
        K-Means Clustering: Group students by attendance behavior
        Returns: Cluster assignments and characteristics
        """
        features_df = self.prepare_student_features(attendance_data)
        
        if features_df.empty or len(features_df) < n_clusters:
            return {'clusters': [], 'error': 'Not enough data'}
        
        # Prepare features
        X = features_df[[
            'attendance_rate',
            'trend',
            'consecutive_absences',
            'regularity'
        ]].values
        
        # Scale features
        X_scaled = self.scaler.fit_transform(X)
        
        # K-Means clustering
        self.kmeans_model = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
        clusters = self.kmeans_model.fit_predict(X_scaled)
        
        # Analyze clusters
        results = {
            'clusters': [],
            'cluster_names': self._generate_cluster_names(features_df, clusters)
        }
        
        for cluster_id in range(n_clusters):
            mask = clusters == cluster_id
            cluster_students = features_df[mask]
            
            # Cluster characteristics
            avg_attendance = cluster_students['attendance_rate'].mean()
            avg_trend = cluster_students['trend'].mean()
            size = len(cluster_students)
            
            cluster_info = {
                'cluster_id': int(cluster_id),
                'name': results['cluster_names'][cluster_id],
                'size': int(size),
                'percentage': float(size / len(features_df) * 100),
                'avg_attendance_rate': float(avg_attendance),
                'avg_trend': float(avg_trend),
                'students': cluster_students['student_id'].tolist()
            }
            results['clusters'].append(cluster_info)
        
        return results
    
    def _generate_cluster_names(self, features_df, clusters):
        """Generate descriptive names for clusters"""
        names = {}
        for cluster_id in range(len(set(clusters))):
            mask = clusters == cluster_id
            avg_attendance = features_df[mask]['attendance_rate'].mean()
            
            if avg_attendance >= 0.85:
                names[cluster_id] = "Consistent Attenders"
            elif avg_attendance >= 0.75:
                names[cluster_id] = "Regular Attenders"
            elif avg_attendance >= 0.60:
                names[cluster_id] = "Irregular Attenders"
            else:
                names[cluster_id] = "Frequent Absentees"
        
        return names
    
    def detect_anomalies(self, attendance_data, contamination=0.1, custom_threshold=None):
        """
        Isolation Forest: Detect anomalous attendance patterns
        contamination: Expected % of anomalies (0-1)
        custom_threshold: Optional custom anomaly score threshold
        Returns: List of anomalies with explanations
        """
        features_df = self.prepare_student_features(attendance_data)
        
        if features_df.empty or len(features_df) < 5:
            return {'anomalies': [], 'total_students': len(features_df)}
        
        # Prepare features
        X = features_df[[
            'attendance_rate',
            'trend',
            'consecutive_absences',
            'regularity'
        ]].values
        
        # Isolation Forest
        self.iso_forest = IsolationForest(
            contamination=min(contamination, 0.5),
            random_state=42
        )
        anomaly_labels = self.iso_forest.fit_predict(X)
        anomaly_scores = self.iso_forest.score_samples(X)
        
        anomalies = []
        for idx, row in features_df.iterrows():
            score = float(anomaly_scores[idx])
            is_anomaly = anomaly_labels[idx] == -1
            
            # Apply custom threshold if provided
            if custom_threshold is not None:
                is_anomaly = score < custom_threshold
            
            if is_anomaly:
                anomalies.append({
                    'student_id': row['student_id'],
                    'anomaly_score': score,
                    'attendance_rate': float(row['attendance_rate']),
                    'flags': self._generate_anomaly_flags(row),
                    'explanation': self._explain_anomaly(row)
                })
        
        # Sort by anomaly score
        anomalies.sort(key=lambda x: x['anomaly_score'])
        
        return {
            'total_students': len(features_df),
            'anomaly_count': len(anomalies),
            'anomaly_percentage': float(len(anomalies) / len(features_df) * 100),
            'anomalies': anomalies
        }
    
    def _generate_anomaly_flags(self, row):
        """Generate flags for anomalies"""
        flags = []
        
        if row['consecutive_absences'] >= 5:
            flags.append('LONG_ABSENCE_SEQUENCE')
        
        if row['trend'] < -3:
            flags.append('SHARP_DECLINE')
        
        if row['regularity'] < 0.2:
            flags.append('HIGHLY_IRREGULAR')
        
        if row['attendance_rate'] == 0:
            flags.append('ZERO_ATTENDANCE')
        
        if row['attendance_rate'] == 1:
            flags.append('PERFECT_ATTENDANCE')
        
        return flags
    
    def _explain_anomaly(self, row):
        """Generate human-readable anomaly explanation"""
        if row['attendance_rate'] == 0:
            return "Student has zero attendance - possible withdrawal or system error"
        
        if row['attendance_rate'] == 1:
            return "Suspiciously perfect attendance - possible proxy fraud?"
        
        if row['consecutive_absences'] >= 5 and row['attendance_rate'] < 0.3:
            return "Extreme absence pattern - possible health issue or dropout"
        
        if row['trend'] < -3:
            return "Sharp decline in attendance - check for recent changes"
        
        if row['regularity'] < 0.2 and row['attendance_rate'] < 0.5:
            return "Highly irregular pattern - inconsistent attendance"
        
        return "Unusual statistical pattern detected"
    
    def get_class_analytics(self, class_id, attendance_data):
        """
        Get comprehensive analytics for a specific class
        """
        # Filter data for this class
        class_data = [a for a in attendance_data if a.get('class_id') == class_id]
        
        if not class_data:
            return {}
        
        df = pd.DataFrame(class_data)
        df['date'] = pd.to_datetime(df['date'])
        
        # Class-level statistics
        total_sessions = df['date'].nunique()
        total_records = len(df)
        unique_students = df['student_id'].nunique()
        
        # Attendance rate per session
        session_stats = df.groupby('date').apply(
            lambda x: {
                'date': x['date'].iloc[0].strftime('%Y-%m-%d'),
                'present': (x['status'] == 'present').sum(),
                'absent': (x['status'] == 'absent').sum(),
                'attendance_rate': (x['status'] == 'present').sum() / len(x)
            }
        ).tolist()
        
        overall_attendance = (df['status'] == 'present').sum() / len(df) if len(df) > 0 else 0
        
        return {
            'class_id': class_id,
            'total_sessions': int(total_sessions),
            'unique_students': int(unique_students),
            'overall_attendance_rate': float(overall_attendance),
            'session_stats': session_stats
        }

    # ===================== ADVANCED FEATURES =====================

    def analyze_student_friendships(self, attendance_data):
        """
        Friendship/Closeness Analysis: Identifies students who sit close together
        Logic: Students with consistent close seating positions are likely friends
        Uses face position data from classroom photos for spatial analysis
        Returns: Network of student pairs with seating proximity scores
        """
        if not attendance_data or len(attendance_data) == 0:
            return {'friendships': [], 'networks': []}
        
        # attendance_data format: List of {
        #   student_id, session_date, status, 
        #   facePosition: { x, y, width, height, left, top, right, bottom, confidence }
        # }
        
        # Filter only present students (absent students have no face position)
        present_records = [a for a in attendance_data if a.get('status') == 'present' and a.get('facePosition')]
        
        if len(present_records) == 0:
            return {'friendships': [], 'networks': []}
        
        # Group by session to analyze seating in each photo
        sessions = {}
        for record in present_records:
            session_id = str(record.get('session_id', 'default'))
            if session_id not in sessions:
                sessions[session_id] = []
            sessions[session_id].append(record)
        
        # Calculate pairwise distances within each session
        pairwise_distances = {}  # (student1, student2) -> list of distances
        
        for session_id, session_records in sessions.items():
            # For each pair of students in this session
            for i, record1 in enumerate(session_records):
                for record2 in session_records[i+1:]:
                    student1_id = str(record1['student_id'])
                    student2_id = str(record2['student_id'])
                    
                    # Skip if same student
                    if student1_id == student2_id:
                        continue
                    
                    # Calculate Euclidean distance between face centers
                    pos1 = record1.get('facePosition', {})
                    pos2 = record2.get('facePosition', {})
                    
                    if not pos1 or not pos2:
                        continue
                    
                    x1, y1 = pos1.get('x', 0), pos1.get('y', 0)
                    x2, y2 = pos2.get('x', 0), pos2.get('y', 0)
                    
                    # Euclidean distance
                    distance = np.sqrt((x2 - x1)**2 + (y2 - y1)**2)
                    
                    # Store in consistent key (lower ID first)
                    key = tuple(sorted([student1_id, student2_id]))
                    if key not in pairwise_distances:
                        pairwise_distances[key] = []
                    pairwise_distances[key].append(distance)
        
        # Calculate friendship strength based on seating proximity
        friendships = []
        MAX_DISTANCE = 300  # Maximum pixel distance to consider "sitting together"
        
        for (student1_id, student2_id), distances in pairwise_distances.items():
            if len(distances) < 2:  # Need at least 2 sessions together
                continue
            
            # Average distance across all sessions they attended together
            avg_distance = np.mean(distances)
            proximity_score = 1.0 - (avg_distance / MAX_DISTANCE)  # Inverse: smaller distance = higher score
            proximity_score = max(0, min(1, proximity_score))  # Clamp to 0-1
            
            # Consistency: how often are they at similar distances?
            distance_variance = np.std(distances)
            consistency = 1.0 / (1.0 + distance_variance)  # Lower variance = higher consistency
            
            # CO-SEATING SCORE (primary indicator)
            # How close do they sit WHEN they're in the same class?
            close_sessions = sum(1 for d in distances if d < MAX_DISTANCE * 0.7)  # Very close sessions
            close_ratio = close_sessions / len(distances)
            
            # Final friendship score combines:
            # - Proximity (how close they sit)
            # - Consistency (how regularly they sit close)
            # - Frequency (how many sessions together)
            friendship_score = (proximity_score * 0.4) + (consistency * 0.3) + (close_ratio * 0.3)
            
            # Determine friendship strength
            if friendship_score >= 0.75 and len(distances) >= 5:
                strength = 'CLOSE'
                reason = f'Consistently sit very close ({avg_distance:.0f}px avg)'
            elif friendship_score >= 0.60 and len(distances) >= 3:
                strength = 'MODERATE'
                reason = f'Regular close seating ({avg_distance:.0f}px avg)'
            elif friendship_score >= 0.45:
                strength = 'CASUAL'
                reason = f'Occasional nearby seating ({avg_distance:.0f}px avg)'
            else:
                continue  # Don't report weak friendships
            
            friendships.append({
                'student1_id': student1_id,
                'student2_id': student2_id,
                'sessions_together': len(distances),
                'avg_seating_distance': float(avg_distance),
                'proximity_score': float(proximity_score),
                'consistency_score': float(consistency),
                'friendship_score': float(friendship_score),
                'friendship_strength': strength,
                'reason': reason,
                'close_sessions_count': int(close_sessions)
            })
        
        # Sort by friendship score
        friendships.sort(key=lambda x: x['friendship_score'], reverse=True)
        
        # Identify friend groups (clusters of students who sit together)
        networks = self._identify_friend_networks(friendships, pairwise_distances.keys())
        
        return {
            'friendships': friendships[:25],  # Top 25 friendships
            'total_friendships': len(friendships),
            'friend_networks': networks
        }
    
    def _identify_friend_networks(self, friendships, all_pairs):
        """Identify clusters of students who sit together (friend groups)"""
        if not friendships:
            return []
        
        from collections import defaultdict
        adj = defaultdict(set)
        
        # Build adjacency graph (only strong friendships)
        for fs in friendships:
            if fs['friendship_strength'] in ['CLOSE', 'MODERATE']:
                adj[fs['student1_id']].add(fs['student2_id'])
                adj[fs['student2_id']].add(fs['student1_id'])
        
        # Find connected components
        visited = set()
        groups = []
        
        for student in adj:
            if student not in visited:
                group = self._dfs_group(student, adj, visited)
                if len(group) >= 2:
                    groups.append({
                        'members': list(group),
                        'group_size': len(group),
                        'cohesion': 'VERY_HIGH' if len(group) >= 4 else 'HIGH' if len(group) == 3 else 'MEDIUM',
                        'type': 'STUDY_GROUP' if len(group) >= 3 else 'FRIEND_PAIR'
                    })
        
        return groups
    
    def _dfs_group(self, student, adj, visited):
        """DFS to find connected components (friend groups)"""
        visited.add(student)
        group = {student}
        
        for neighbor in adj[student]:
            if neighbor not in visited:
                group.update(self._dfs_group(neighbor, adj, visited))
        
        return group
    
    def assess_wellness_risk(self, attendance_data):
        """
        Health/Wellness Risk Score: Detects sudden absence patterns
        Logic: Sudden increase in absences or frequent absences indicates health/personal issues
        Returns: Students needing wellness check-in
        """
        features_df = self.prepare_student_features(attendance_data)
        if features_df.empty:
            return {'at_wellness_risk': []}
        
        wellness_risks = []
        
        for _, row in features_df.iterrows():
            risk_factors = []
            wellness_score = 0  # Higher = more at-risk
            
            # Factor 1: Frequent absences
            if row['absent_count'] >= row['total_sessions'] * 0.3:
                risk_factors.append('Frequent absences detected')
                wellness_score += 25
            
            # Factor 2: Consecutive absences
            if row['consecutive_absences'] >= 3:
                risk_factors.append(f'{int(row["consecutive_absences"])} consecutive absences')
                wellness_score += 30
            
            # Factor 3: Declining trend (attendance getting worse)
            if row['trend'] < -2:
                risk_factors.append('Attendance declining rapidly')
                wellness_score += 25
            
            # Factor 4: Irregular pattern (suggests uncertainty/health issues)
            if row['regularity'] < 0.25:
                risk_factors.append('Highly irregular attendance pattern')
                wellness_score += 20
            
            if wellness_score >= 50:
                wellness_risks.append({
                    'student_id': str(row['student_id']),
                    'wellness_risk_score': float(wellness_score / 100),
                    'risk_level': 'HIGH' if wellness_score >= 75 else 'MEDIUM',
                    'risk_factors': risk_factors,
                    'recommendation': self._wellness_recommendation(wellness_score, risk_factors),
                    'attendance_rate': float(row['attendance_rate'])
                })
        
        wellness_risks.sort(key=lambda x: x['wellness_risk_score'], reverse=True)
        
        return {
            'total_students_at_risk': len(wellness_risks),
            'at_wellness_risk': wellness_risks
        }
    
    def _wellness_recommendation(self, risk_score, risk_factors):
        """Generate wellness check-in recommendation"""
        if risk_score >= 75:
            return 'Urgent: Schedule 1-on-1 meeting with student & counselor'
        elif risk_score >= 60:
            return 'Important: Follow-up needed, check on student well-being'
        else:
            return 'Monitor: Track attendance improvements'
    
    def predict_poor_performers(self, attendance_data, grade_data=None):
        """
        Performance Predictor: Identifies students likely to perform poorly
        Logic: Inconsistent attendance + declining trend = poor academic performance risk
        Returns: Students at risk of poor grades
        """
        features_df = self.prepare_student_features(attendance_data)
        if features_df.empty:
            return {'poor_performers_risk': []}
        
        poor_performers = []
        
        for _, row in features_df.iterrows():
            performance_risk = 0
            risk_reasons = []
            
            # Criterion 1: Low attendance rate
            if row['attendance_rate'] < 0.70:
                performance_risk += 30
                risk_reasons.append(f'Low attendance: {row["attendance_rate"]*100:.1f}%')
            elif row['attendance_rate'] < 0.80:
                performance_risk += 15
                risk_reasons.append(f'Below average attendance: {row["attendance_rate"]*100:.1f}%')
            
            # Criterion 2: High absence concentration (irregular pattern)
            if row['regularity'] < 0.40:
                performance_risk += 25
                risk_reasons.append('Inconsistent/irregular attendance')
            
            # Criterion 3: Declining attendance trend
            if row['trend'] < -1:
                performance_risk += 20
                risk_reasons.append('Recent attendance decline')
            
            # Criterion 4: Long absence streaks
            if row['consecutive_absences'] >= 4:
                performance_risk += 25
                risk_reasons.append(f'Extended absence period detected')
            
            if performance_risk >= 40:
                poor_performers.append({
                    'student_id': str(row['student_id']),
                    'performance_risk_score': float(performance_risk / 100),
                    'risk_level': 'CRITICAL' if performance_risk >= 80 else 'HIGH' if performance_risk >= 60 else 'MODERATE',
                    'risk_reasons': risk_reasons,
                    'attendance_rate': float(row['attendance_rate']),
                    'action_items': self._performance_action_items(performance_risk)
                })
        
        poor_performers.sort(key=lambda x: x['performance_risk_score'], reverse=True)
        
        return {
            'total_at_risk': len(poor_performers),
            'poor_performers_risk': poor_performers
        }
    
    def _performance_action_items(self, risk_score):
        """Generate action items based on performance risk"""
        if risk_score >= 80:
            return [
                'Mandatory attendance tutoring sessions',
                'Teacher-parent conference',
                'Daily attendance tracking',
                'Consider academic support plan'
            ]
        elif risk_score >= 60:
            return [
                'Weekly check-ins on attendance',
                'Encourage attendance improvement',
                'Offer peer mentoring',
                'Monitor grades closely'
            ]
        else:
            return [
                'Monitor attendance trends',
                'Provide encouragement',
                'Review academic progress'
            ]
    
    def calculate_engagement_score(self, attendance_data):
        """
        Engagement Score: Combines attendance rate + consistency
        Logic: Good attendance + consistent pattern = high engagement
        Returns: Student engagement profiles
        """
        features_df = self.prepare_student_features(attendance_data)
        if features_df.empty:
            return {'engagement_profiles': []}
        
        engagement_scores = []
        
        for _, row in features_df.iterrows():
            # Engagement = 60% attendance rate + 40% consistency/regularity
            attendance_score = row['attendance_rate'] * 0.6
            consistency_score = row['regularity'] * 0.4
            engagement = attendance_score + consistency_score
            
            # Cap at 1.0
            engagement = min(engagement, 1.0)
            
            profile = {
                'student_id': str(row['student_id']),
                'engagement_score': float(engagement),
                'engagement_level': self._classify_engagement(engagement),
                'attendance_component': float(row['attendance_rate']),
                'consistency_component': float(row['regularity']),
                'total_sessions': int(row['total_sessions']),
                'present_count': int(row['present_count']),
                'engagement_insight': self._engagement_insight(engagement, row)
            }
            engagement_scores.append(profile)
        
        engagement_scores.sort(key=lambda x: x['engagement_score'], reverse=True)
        
        return {
            'total_students': len(engagement_scores),
            'engagement_profiles': engagement_scores
        }
    
    def _classify_engagement(self, score):
        """Classify engagement level"""
        if score >= 0.85:
            return 'EXCELLENT'
        elif score >= 0.70:
            return 'GOOD'
        elif score >= 0.50:
            return 'FAIR'
        elif score >= 0.30:
            return 'LOW'
        else:
            return 'VERY_LOW'
    
    def _engagement_insight(self, score, row):
        """Generate insight about engagement"""
        if score >= 0.85:
            return f'Highly engaged student - excellent role model'
        elif score >= 0.70:
            return f'Consistently engaged - maintain momentum'
        elif score >= 0.50 and row['trend'] >= 0:
            return f'Improving engagement - keep encouraging'
        elif row['regularity'] < 0.3:
            return f'Unpredictable attendance - needs structured support'
        else:
            return f'Low engagement - needs intervention'
