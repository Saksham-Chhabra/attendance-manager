import mongoose from 'mongoose';

const studentFriendshipSchema = new mongoose.Schema({
  student1: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Student 1 ID is required']
  },
  student2: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Student 2 ID is required']
  },
  strength: {
    type: Number,
    default: 0,
    min: 0,
    max: 1,
    description: 'Proximity score from 0-1 (1 = closest seating)'
  },
  frequency: {
    type: Number,
    default: 1,
    description: 'Number of times students sat near each other'
  },
  proximityPattern: {
    averageDistance: {
      type: Number,
      description: 'Average pixel distance between face centers'
    },
    minDistance: {
      type: Number,
      description: 'Minimum distance recorded'
    },
    maxDistance: {
      type: Number,
      description: 'Maximum distance recorded'
    }
  },
  sessions: [{
    sessionId: mongoose.Schema.ObjectId,
    distance: Number,
    proximityScore: Number,
    timestamp: Date
  }],
  lastAnalyzed: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true,
    description: 'Whether this friendship is still active/current'
  },
  confidence: {
    type: Number,
    default: 0.5,
    min: 0,
    max: 1,
    description: 'Confidence score of the friendship connection'
  },
  notes: String // Additional metadata about the friendship
}, {
  timestamps: true,
  // Ensure unique pair (regardless of order)
  indexes: [
    {
      fields: {
        student1: 1,
        student2: 1
      },
      unique: true,
      sparse: true
    }
  ]
});

// Indexes for efficient queries
studentFriendshipSchema.index({ student1: 1, frequency: -1 });
studentFriendshipSchema.index({ student2: 1, frequency: -1 });
studentFriendshipSchema.index({ strength: -1 });
studentFriendshipSchema.index({ lastAnalyzed: -1 });

// Virtual for calculated friend strength based on multiple factors
studentFriendshipSchema.virtual('friendshipScore').get(function() {
  // Combine strength (proximity), frequency, and confidence
  return (this.strength * 0.5 + (Math.min(this.frequency / 10, 1)) * 0.3 + this.confidence * 0.2);
});

// Method to get both students in standardized order
studentFriendshipSchema.methods.getStudentPair = function() {
  return {
    student1: this.student1,
    student2: this.student2,
    pair: [this.student1, this.student2].sort((a, b) => a.toString().localeCompare(b.toString()))
  };
};

// Static method to find or create friendship record
studentFriendshipSchema.statics.findOrCreateFriendship = async function(student1Id, student2Id, data = {}) {
  // Normalize student IDs to ensure consistent ordering
  const [id1, id2] = [student1Id.toString(), student2Id.toString()].sort();
  
  return await this.findOneAndUpdate(
    {
      $or: [
        { student1: id1, student2: id2 },
        { student1: id2, student2: id1 }
      ]
    },
    {
      $set: { student1: id1, student2: id2, ...data },
      $inc: { frequency: 1 }
    },
    { upsert: true, new: true }
  );
};

// Static method to get friends of a student
studentFriendshipSchema.statics.getStudentFriends = async function(studentId, limit = 10) {
  return await this.find({
    $or: [
      { student1: studentId },
      { student2: studentId }
    ],
    isActive: true
  })
  .sort({ strength: -1, frequency: -1 })
  .limit(limit)
  .populate('student1', '_id name rollNumber')
  .populate('student2', '_id name rollNumber')
  .lean();
};

// Static method for friend group detection
studentFriendshipSchema.statics.detectFriendGroups = async function(minGroupSize = 3) {
  // Get active friendships
  const friendships = await this.find({ isActive: true }).lean();
  
  const adjacencyList = {};
  friendships.forEach(f => {
    const s1 = f.student1.toString();
    const s2 = f.student2.toString();
    
    if (!adjacencyList[s1]) adjacencyList[s1] = [];
    if (!adjacencyList[s2]) adjacencyList[s2] = [];
    
    adjacencyList[s1].push({ id: s2, strength: f.strength });
    adjacencyList[s2].push({ id: s1, strength: f.strength });
  });

  // Simple clustering to find groups
  const groups = [];
  const visited = new Set();

  for (const studentId in adjacencyList) {
    if (visited.has(studentId)) continue;
    
    // BFS to find connected component
    const group = [];
    const queue = [studentId];
    
    while (queue.length > 0) {
      const current = queue.shift();
      if (visited.has(current)) continue;
      
      visited.add(current);
      group.push(current);
      
      // Add neighbors with high strength
      const neighbors = adjacencyList[current]
        .filter(n => n.strength > 0.7 && !visited.has(n.id))
        .map(n => n.id);
      
      queue.push(...neighbors);
    }
    
    if (group.length >= minGroupSize) {
      groups.push({
        members: group,
        size: group.length,
        averageStrength: adjacencyList[group[0]].reduce((a, b) => a + b.strength, 0) / adjacencyList[group[0]].length
      });
    }
  }

  return groups;
};

const StudentFriendship = mongoose.model('StudentFriendship', studentFriendshipSchema);

export default StudentFriendship;
