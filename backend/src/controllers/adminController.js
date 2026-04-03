import User from '../models/User.js';
import Class from '../models/Class.js';

/**
 * @desc    Get all teachers mapped tightly to the currently logged in admin's explicit root domain.
 * @route   GET /api/admin/teachers
 * @access  Private (Admin only)
 */
export const getDomainTeachers = async (req, res) => {
  try {
    const adminEmail = req.user.email;
    const domain = adminEmail.split('@')[1];

    if (!domain) {
      return res.status(400).json({ status: 'fail', message: 'Admin boundary domain undefined.' });
    }

    // Regex binds string to effectively check "*@nith.ac.in$"
    const domainRegex = new RegExp(`@${domain}$`, 'i');

    const teachers = await User.find({
       role: 'teacher',
       email: { $regex: domainRegex }
    }).select('name email createdAt');

    const totalStudents = await User.countDocuments({
       role: 'student',
       email: { $regex: domainRegex }
    });

    const totalClasses = await Class.countDocuments();

    res.status(200).json({
      status: 'success',
      data: {
         domain,
         teachers,
         stats: {
           totalStudents,
           totalClasses
         }
      }
    });

  } catch (error) {
    res.status(400).json({ status: 'fail', message: error.message });
  }
};
