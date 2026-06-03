const express = require('express');
const router = express.Router();
const taskRoutes = require('./tasks.routes');
const syncRoutes = require('./sync.routes');
const statsRoutes = require('./stats.routes');
const healthRoutes = require('./health.routes');
const authRoutes = require('./auth.routes');
const driveRoutes = require('./placementDrive.routes');
const profileRoutes = require('./studentProfile.routes');
const studentRoutes = require('./students.routes');
const applicationRoutes = require('./application.routes');
const interviewRoutes = require('./interviewRound.routes');
const analyticsRoutes = require('./analytics.routes');
const companyRoutes = require('./company.routes');

router.use('/tasks', taskRoutes);
router.use('/sync', syncRoutes);
router.use('/stats', statsRoutes);
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/companies', companyRoutes);
router.use('/drives', driveRoutes);
router.use('/profiles', profileRoutes);
router.use('/students', studentRoutes);
router.use('/applications', applicationRoutes);
router.use('/interviews', interviewRoutes);
router.use('/analytics', analyticsRoutes);

router.get('/', (req, res) => {
  res.status(200).json({ success: true, message: 'Placement Recruitment API Running' });
});

module.exports = router;
