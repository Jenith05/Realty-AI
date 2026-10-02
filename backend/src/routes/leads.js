const express = require('express')
const { chatWithLead, createLead, generateLeadCallPrep, generateLeadFollowUpPlan, getLead, listLeads, updateLeadFollowUp } = require('../controllers/leadController')
const protect = require('../middleware/auth')

const router = express.Router()

router.get('/', protect, listLeads)
router.get('/:id', protect, getLead)
router.post('/:id/chat', protect, chatWithLead)
router.post('/:id/call-prep', protect, generateLeadCallPrep)
router.post('/:id/follow-up/plan', protect, generateLeadFollowUpPlan)
router.patch('/:id/follow-up', protect, updateLeadFollowUp)
router.post('/', protect, createLead)

module.exports = router