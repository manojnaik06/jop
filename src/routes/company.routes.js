const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth.middleware');
const {
  getCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany,
} = require('../controllers/company.controller');

// Get all companies (any authenticated user)
router.get('/', protect, getCompanies);

// Get company by ID (any authenticated user)
router.get('/:id', protect, getCompanyById);

// Create company (placement_officer/admin only)
router.post('/', protect, authorize('placement_officer', 'admin'), createCompany);

// Update company (placement_officer/admin only)
router.patch('/:id', protect, authorize('placement_officer', 'admin'), updateCompany);

// Delete company (placement_officer/admin only)
router.delete('/:id', protect, authorize('placement_officer', 'admin'), deleteCompany);

module.exports = router;
