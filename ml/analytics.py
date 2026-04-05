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
