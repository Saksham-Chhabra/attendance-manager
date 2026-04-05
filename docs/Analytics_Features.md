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

---

# NEW: Advanced Analytics Features (v2.0)

## Feature 5: **Student Friendships & Closeness Analysis**

### Overview
Identifies students who frequently attend classes together, indicating potential friendships or study partnerships.

### How It Works
- **Logic:** Students attending the same sessions multiple times likely have social connections
- **Calculation:** Co-attendance frequency / Total opportunities to be together
- **Similarity Score:** 0-1 (0 = never together, 1 = always together)

### Friendship Strength Levels
- **CLOSE:** 75%+ similarity + 5+ sessions together
  - Strong friendship indicators
  - Likely study partners
  - Strong peer influence potential

- **MODERATE:** 60-74% similarity + 3-4 sessions together
  - Regular study partners
  - Similar schedules
  - Potential collaborative learning

- **CASUAL:** 40-59% similarity + 2+ sessions together
  - Occasional class interactions
  - Possible acquaintances
  - Low influence level

### API Endpoint
```
POST /api/analytics/friendships
Body: { "classId": "..." }

Response:
{
  "classId": "...",
  "totalFriendships": 12,
  "friendships": [
    {
      "student1_id": "...",
      "student2_id": "...",
      "sessions_together": 8,
      "similarity_score": 0.89,
      "friendship_strength": "CLOSE"
    }
  ],
  "friend_networks": [
    {
      "members": ["...", "...", "..."],
      "size": 3,
      "type": "CLOSE_PAIR"
    }
  ]
}
```

### Use Cases
- **Peer Tutoring:** Pair strong students with struggling ones (who are already friends)
- **Group Projects:** Form groups with existing friendships for better collaboration
- **Social Integration:** Identify isolated students lacking friend groups
- **Study Circles:** Recognize natural study groups forming
- **Intervention Teams:** Pair at-risk students with supportive friends

### Insights Provided
- Friendship strength (CLOSE/MODERATE/CASUAL)
- Sessions attended together
- Friend networks (clusters of close friends)
- Connection strength as percentage

---

## Feature 6: **Wellness & Health Risk Assessment**

### Overview
Detects students who may have health, personal, or family issues based on sudden attendance changes or frequent absences.

### How It Works
- **Indicators Monitored:**
  - Frequency of absences (>30% = frequent)
  - Consecutive absences (3+ = concerning)
  - Sudden attendance decline
  - Irregular attendance patterns

- **Risk Score:** 0-1.0
  - 0.0-0.5: Low risk
  - 0.5-0.75: Medium risk (monitoring needed)
  - 0.75-1.0: High risk (urgent intervention)

### Risk Levels
- **HIGH:** Requires urgent wellness check-in
  - Schedule 1-on-1 meeting with student & counselor
  - Assess mental health and well-being
  - Explore external factors

- **MEDIUM:** Important follow-up needed
  - Personal check-in with student
  - Understand challenges
  - Provide support resources

### Risk Factors Detected
- Frequent absences
- Consecutive absence streaks
- Rapid attendance decline
- Highly irregular patterns

### API Endpoint
```
POST /api/analytics/wellness-risk
Body: { "classId": "..." }

Response:
{
  "classId": "...",
  "total_at_risk": 3,
  "wellness_risks": [
    {
      "student_id": "...",
      "wellness_risk_score": 0.78,
      "risk_level": "HIGH",
      "risk_factors": [
        "3 consecutive absences detected",
        "Rapid attendance decline"
      ],
      "recommendation": "Urgent: Schedule meeting with student & counselor",
      "attendance_rate": 0.45
    }
  ]
}
```

### Use Cases
- **Student Support:** Identify students needing counselor or advisor assistance
- **Early Intervention:** Catch health/personal crises early
- **Wellness Programs:** Target support resources to at-risk students
- **Safety Monitoring:** Flag potential mental health concerns
- **Family Communication:** Initiate parent/guardian contact appropriately

### Ethical Considerations
- **Purpose:** Support, not surveillance
- **Privacy:** Treat sensitively and confidentially
- **Human Connection:** Always follow up with personal conversation
- **Holistic Approach:** Consider context (illness, family issues, emergencies)
- **Respect:** Maintain dignity and confidentiality

---

## Feature 7: **Performance Risk Prediction**

### Overview
Predicts students likely to perform poorly academically based on attendance patterns and consistency.

### How It Works
- **Assumption:** Consistent attendance → Better academic performance
- **Risk Factors:**
  - Low attendance (<70%)
  - High absence concentration (irregular pattern)
  - Declining attendance trend
  - Extended absence periods

- **Risk Score:** 0-1.0
  - Based on multiple absence indicators
  - Weighted by severity

### Risk Levels
- **CRITICAL:** Immediate action required
  - Mandatory tutoring/study sessions
  - Teacher-parent conference
  - Daily attendance tracking
  - Formal intervention plan

- **HIGH:** Significant concern
  - Weekly check-ins
  - Encourage attendance improvement
  - Offer peer mentoring
  - Monitor grades closely

- **MODERATE:** Monitor & support
  - Attendance trend monitoring
  - Encouragement & motivation
  - Academic progress review

### Performance Factors
- Attendance rate (primary indicator)
- Consistency of presence
- Absence count and pattern
- Recent trend direction

### API Endpoint
```
POST /api/analytics/performance-risk
Body: { "classId": "..." }

Response:
{
  "classId": "...",
  "total_at_risk": 5,
  "poor_performers": [
    {
      "student_id": "...",
      "performance_risk_score": 0.72,
      "risk_level": "HIGH",
      "risk_reasons": [
        "Low attendance: 62.5%",
        "High absence count"
      ],
      "attendance_rate": 0.625,
      "action_items": [
        "Weekly check-ins",
        "Offer peer mentoring",
        "Monitor grades closely"
      ]
    }
  ]
}
```

### Use Cases
- **Early Intervention:** Identify struggling students before grades drop
- **Tutoring Programs:** Target additional academic support
- **GPA Protection:** Help maintain satisfactory standing
- **Probation Support:** Monitor probationed students
- **Parent Communication:** Proactive family engagement
- **Resource Allocation:** Distribute tutoring wisely

### Limitations
- **Correlation, Not Causation:** Low attendance correlates with poor performance but doesn't prove it
- **Missing Context:** Doesn't account for learning disabilities, external factors
- **Historical Patterns:** Works best with established history
- **Individual Variation:** Some students can succeed with less attendance

---

## Feature 8: **Engagement Score & Profiles**

### Overview
Comprehensive engagement metric combining attendance frequency and consistency to provide holistic student engagement picture.

### How It Works
**Engagement Score = (Attendance Rate × 0.6) + (Consistency × 0.4)**

- **Attendance Component (60%):** How often student attends
  - Range: 0-1.0 (0% to 100% attendance)

- **Consistency Component (40%):** How regular the attendance is
  - Range: 0-1.0 (highly erratic to perfectly consistent)
  - Measures predictability of presence

### Engagement Levels
- **EXCELLENT:** 85-100% engagement
  - Highly engaged student
  - Excellent role model
  - Strong presence every session

- **GOOD:** 70-84% engagement
  - Consistently engaged
  - Maintain current momentum
  - Reliable attendance

- **FAIR:** 50-69% engagement
  - Moderate engagement
  - If improving trend: "Keep encouraging"
  - If declining: "Needs attention"

- **LOW:** 30-49% engagement
  - Low engagement overall
  - Needs structured support
  - Potential intervention candidate

- **VERY_LOW:** <30% engagement
  - Critical low engagement
  - Requires intervention
  - Major attendance issues

### Insights Provided
- Overall engagement score (0-100)
- Attendance component breakdown
- Consistency component breakdown
- Personalized insight suggestions
- Trend interpretation

### API Endpoint
```
POST /api/analytics/engagement
Body: { "classId": "..." }

Response:
{
  "classId": "...",
  "total_students": 30,
  "engagement_profiles": [
    {
      "student_id": "...",
      "engagement_score": 0.88,
      "engagement_level": "EXCELLENT",
      "attendance_component": 0.95,
      "consistency_component": 0.75,
      "total_sessions": 20,
      "present_count": 19,
      "insight": "Highly engaged student - excellent role model"
    }
  ]
}
```

### Use Cases
- **Holistic Assessment:** View overall student engagement
- **Trend Analysis:** Track engagement changes over time
- **Recognition Programs:** Celebrate excellent engagement
- **Intervention Targeting:** Focus support on disengaged students
- **Parent Reports:** Provide comprehensive engagement metrics
- **Class Composition:** Understand overall class engagement health
- **Strategic Pairing:** Pair highly engaged with low-engagement students

### Advantages Over Raw Attendance
- **Balanced View:** Considers both frequency AND consistency
- **Contextual:** Recognizes irregular students vs. consistently absent
- **Fair Assessment:** Doesn't penalize one missed session
- **Actionable:** Provides clear leveling for intervention
- **Motivating:** Can be shared positively with students

---

## Combined Usage Scenarios

### Scenario 1: At-Risk Student Support Program
1. **Performance Risk Prediction** - Identify poor performers
2. **Wellness Assessment** - Check for health/personal issues
3. **Friendships Analysis** - Find supportive friends
4. **Engagement Score** - Assess overall engagement
5. **Action:** Pair with high-engagement friend for tutoring support

### Scenario 2: Class Intervention Program
1. **Cluster Analysis** - Identify "Frequent Absentees" cluster
2. **Engagement Scores** - See overall engagement trend
3. **Performance Risk** - Determine which need academic support
4. **Wellness Risk** - Identify who need counseling
5. **Action:** Design cluster-specific support program

### Scenario 3: Social Integration Initiative
1. **Friendships Analysis** - Identify isolated students
2. **Friend Networks** - See existing study groups
3. **Engagement Scores** - Find well-engaged peers
4. **Action:** Connect isolated students with engaged friend groups

### Scenario 4: Early Semester Intervention
1. **Performance Risk** - Flag potential poor performers early
2. **Wellness Assessment** - Identify struggling students
3. **Engagement Scores** - Benchmark expected engagement
4. **Action:** Early intervention before course gets too far

---

## Implementation Notes

### Data Quality
- All features require accurate attendance data
- Requires minimum 2 weeks of attendance history for meaningful results
- Works best with regular, scheduled classes
- Irregular class schedules may affect accuracy

### Performance Considerations
- All calculations done in real-time
- No pre-training required (unsupervised)
- Works with existing MongoDB data
- Suitable for classes up to 500+ students

### Privacy & Ethics
- **Use for Support:** All features designed to HELP students
- **Confidentiality:** Treat all data as sensitive information
- **Human Judgment:** Always verify findings with personal conversation
- **Intervention-Focused:** Data is tool for intervention, not punishment
- **Student Dignity:** Maintain respect throughout process
