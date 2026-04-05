# Data Analytics & Predictive Features Documentation

## Overview

The ML-Attendance-Manager now includes comprehensive analytics and predictive features to help educators identify at-risk students, understand attendance patterns, and detect anomalous behavior.

## Features

### 1. **Attendance Analytics Dashboard**

Comprehensive visualization of attendance patterns and performance metrics.

**Location:** `/faculty/class/:id/analytics`

**What It Shows:**
- Total sessions conducted
- Total students enrolled
- Overall class attendance rate
- Session-by-session attendance trend (line chart)
- Top 10 performing students  
- Bottom 10 performing students with individual statistics

**Metrics Displayed:**
- Student name and roll number
- Present/absent counts
- Attendance percentage
- Trend indicators

---

### 2. **Logistic Regression: At-Risk Student Predictions**

Predictive ML model that identifies students likely to have low attendance.

**How It Works:**
- Analyzes attendance patterns for each student
- Considers factors like:
  - Overall attendance rate
  - Recent attendance trend (improving or declining)
  - Consecutive absences
  - Attendance regularity/consistency
  
- **Output:** Risk score (0-1) for each student
  - 0.0 = Low risk (good attendance)
  - 0.5 = Medium risk
  - 1.0 = High risk (poor attendance)

**Threshold:** Default 0.5 (students with risk >= 0.5 marked as "at-risk")

**Use Cases:**
- Identify students who need intervention
- Early warning system for academic support
- Monitor students on probation
- Personalized student success plans

**Example Output:**
```
Student ID: 12345
Attendance Rate: 68%
Risk Score: 0.68 (68% chance of low attendance)
Reasoning: Low attendance rate, declining trend over time
Is At-Risk: Yes
```

---

### 3. **K-Means Clustering: Student Grouping**

Groups students by attendance behavior patterns without predefined categories.

**How It Works:**
- Creates 3 clusters based on attendance characteristics:
  1. **Consistent Attenders** (85%+ attendance)
     - Reliable presence
     - Minimal absences
     - Positive trend
  
  2. **Regular Attenders** (75-85% attendance)
     - Generally consistent
     - Occasional absences
     - Stable pattern
  
  3. **Irregular Attenders** (60-75% attendance)
     - Inconsistent presence
     - Frequent absences
     - Variable trends
  
  4. **Frequent Absentees** (<60% attendance)
     - High absence rate
     - Needs support
     - At-risk status

**Features Analyzed:**
- Attendance rate
- Trend (improving/declining)
- Consecutive absences
- Attendance regularity

**Benefits:**
- Identify clusters needing targeted support programs
- Understand attendance behavior segments
- Customize interventions per cluster
- Monitor cluster size changes over time

---

### 4. **Anomaly Detection: Pattern Flagging**

ML-powered system using Isolation Forest to detect unusual attendance patterns.

**What Gets Flagged:**
- **PERFECT_ATTENDANCE**: 98%+ attendance (possible proxy fraud)
- **ZERO_ATTENDANCE**: 0-2% attendance (possible withdrawal)
- **LONG_ABSENCE_SEQUENCE**: 5+ consecutive absences
- **SHARP_DECLINE**: Sudden drop in attendance
- **HIGHLY_IRREGULAR**: Inconsistent pattern (not regular schedule)

**Sensitivity Levels:**
- **Low:** More lenient, fewer false positives
- **Normal:** Balanced detection
- **High:** Stricter, catches more anomalies

**Use Cases:**
- Detect proxy fraud (friends marking attendance)
- Identify students in crisis needing immediate support
- Catch data entry errors
- System manipulation attempts

**Example Anomaly:**
```
Student ID: 54321
Type: ZERO_ATTENDANCE
Attendance Rate: 0%
Description: Student has zero attendance - possible withdrawal or system error
Flag: HIGH SEVERITY
Action: Manual verification needed
```

---

## API Endpoints

### Get Class Analytics
```
GET /api/analytics/class/:classId
Authorization: Bearer {token}
Query Params: 
  - dateFrom (optional): Filter from date
  - dateTo (optional): Filter to date

Response:
{
  "status": "success",
  "data": {
    "classId": "...",
    "className": "CS382",
    "totalSessions": 20,
    "totalStudents": 30,
    "overallAttendanceRate": 0.82,
    "overallAttendancePercentage": "82.00",
    "studentStats": [...],
    "sessionTrend": [...]
  }
}
```

### Get At-Risk Predictions
```
POST /api/analytics/predict-at-risk
Authorization: Bearer {token}
Body:
{
  "classId": "...",
  "threshold": 0.5  // optional, default 0.5
}

Response:
{
  "status": "success",
  "data": {
    "classId": "...",
    "threshold": 0.5,
    "totalStudents": 30,
    "atRiskCount": 7,
    "predictions": [
      {
        "student_id": "...",
        "attendance_rate": 0.65,
        "attendance_percentage": "65.00",
        "risk_score": 0.65,
        "is_at_risk": true,
        "reasoning": "Low attendance rate | 3 consecutive absences"
      }
    ]
  }
}
```

### Get Student Clusters
```
POST /api/analytics/clustering
Authorization: Bearer {token}
Body:
{
  "classId": "...",
  "numClusters": 3  // optional, default 3
}

Response:
{
  "status": "success",
  "data": {
    "classId": "...",
    "numClusters": 3,
    "clusters": [
      {
        "cluster_id": 0,
        "name": "Consistent Attenders",
        "size": 15,
        "percentage": "50.00",
        "students": [...]
      }
    ]
  }
}
```

### Detect Anomalies
```
POST /api/analytics/anomalies
Authorization: Bearer {token}
Body:
{
  "classId": "...",
  "sensitivity": "normal"  // low, normal, high
}

Response:
{
  "status": "success",
  "data": {
    "classId": "...",
    "sensitivity": "normal",
    "anomalyCount": 3,
    "anomalyPercentage": "10.00",
    "anomalies": [
      {
        "student_id": "...",
        "attendance_rate": 0.98,
        "type": "PERFECT_ATTENDANCE",
        "severity": "medium",
        "description": "Suspiciously perfect attendance - possible proxy fraud?"
      }
    ]
  }
}
```

### Get Analytics Config (Admin)
```
GET /api/analytics/config
Authorization: Bearer {admin_token}

Response:
{
  "status": "success",
  "data": {
    "anomalyDetection": {
      "enabled": true,
      "sensitivity": "normal",
      "threshold": 0.5
    },
    "predictions": {
      "enabled": true,
      "riskThreshold": 0.5
    },
    "clustering": {
      "enabled": true,
      "numClusters": 3
    }
  }
}
```

### Update Analytics Config (Admin)
```
PUT /api/analytics/config
Authorization: Bearer {admin_token}
Body:
{
  "anomalyDetection": {
    "enabled": true,
    "sensitivity": "high",
    "threshold": 0.4
  }
}
```

---

## User Interface

### Analytics Dashboard Tabs

**Overview Tab:**
- Class-wide statistics (cards)
- Attendance trend over time (line chart)
- Top 10 performers (ranked list)
- Bottom 10 performers (ranked list)

**At-Risk Predictions Tab:**
- Generate Predictions button
- List of at-risk students
- Risk score and reasoning
- Visual risk meter
- Count of at-risk vs. total students

**Student Clusters Tab:**
- Analyze Clusters button
- Cluster cards showing:
  - Cluster name
  - Number of students in cluster
  - Percentage of class
  - Color-coded by cluster

**Anomalies Tab:**
- Scan for Anomalies button
- List of detected anomalies
- Anomaly type and severity
- Human-readable description
- Student ID and attendance rate

---

## Machine Learning Details

### Models Used

1. **Logistic Regression**
   - Purpose: Binary classification (at-risk vs. not at-risk)
   - Training: Automatically trained on available data
   - Features: Attendance rate, trend, consecutive absences, regularity
   - Output: Probability (0-1) of being at-risk

2. **K-Means Clustering**
   - Purpose: Unsupervised grouping by behavior
   - K: Default 3 clusters
   - Features: Same as logistic regression
   - Output: Cluster assignment per student

3. **Isolation Forest**
   - Purpose: Anomaly detection
   - Contamination: Default 0.1 (10% expected anomalies)
   - Features: Attendance patterns
   - Output: Anomaly score and binary classification

### Data Processing

**Features Engineered:**
- **Attendance Rate:** % of sessions attended
- **Trend:** Change in attendance (recent vs. earlier)
- **Consecutive Absences:** Longest absence streak
- **Regularity:** Consistency of attendance (inverse of variance)

**Data Requirements:**
- Minimum 2 attendance records for training
- At least 3 students for clustering
- At least 5 students for anomaly detection

---

## Best Practices

### For Teachers

1. **Use Predictions Weekly:**
   - Run at-risk predictions to identify students needing support
   - Reach out to at-risk students proactively
   - Document interventions

2. **Monitor Anomalies:**
   - Check anomaly alerts regularly
   - Verify unusual patterns (could be legitimate absences)
   - Escalate serious cases (zero attendance, perfect attendance) to admin

3. **Interpret Clusters:**
   - Don't use clusters as a "permanent" label
   - Students can move between clusters over time
   - Customize support programs per cluster
   - Celebrate "consistent attenders" publicly

4. **Regular Review:**
   - Check dashboard weekly
   - Track intervention effectiveness
   - Adjust support strategies based on results

### For Administrators

1. **Configure Appropriately:**
   - Set anomaly sensitivity based on institution needs
   - Adjust risk threshold for your student population
   - Monitor system-wide patterns

2. **Privacy & Ethics:**
   - Use data for support, not punishment
   - Ensure student privacy in reports
   - Focus on intervention, not surveillance

3. **Validation:**
   - Periodically validate model predictions
   - Check if flagged anomalies are real issues
   - Refine sensitivity levels based on feedback

---

## Limitations & Considerations

### What This **Doesn't** Detect
- Legitimate absences (illness, family emergency)
- Reasons for low attendance
- Learning disabilities or barriers
- Mental health challenges
- External life circumstances

### Model Limitations
- Requires historical data (better after 1+ month of classes)
- Assumes patterns will continue (can't predict sudden changes)
- Works best for regular scheduling
- May have high false positives with small class sizes

### Ethical Considerations
- Data is for **support**, not punishment
- Predictions are statistical, not absolute
- Always follow up with students personally
- Respect privacy and dignity
- Consider context before assuming fraud

---

## Troubleshooting

### No Data Available
**Problem:** "Not enough attendance data available"
**Solution:** System needs at least one attendance session before analytics can run

### Poor Predictions
**Problem:** Clusters or predictions don't match expectations
**Solution:** 
- Need more historical data (at least 2-3 weeks)
- Check if attendance patterns are truly random
- Try adjusting sensitivity/threshold

### False Positives
**Problem:** Too many false anomaly alerts
**Solution:**
- Lower sensitivity from "high" to "normal"
- Investigate flagged cases manually
- Update configuration based on your context

---

## Future Enhancements

Potential features to add:
- [ ] Semester/course comparison analytics
- [ ] Export reports (PDF, Excel)
- [ ] Student-facing dashboard (view own analytics)
- [ ] Email alerts for at-risk students
- [ ] Custom clustering parameters
- [ ] Time-series forecasting (predict future attendance)
- [ ] Integration with grade data
- [ ] Comparative class/teacher analytics
- [ ] Mobile app dashboard
- [ ] Real-time notification system
