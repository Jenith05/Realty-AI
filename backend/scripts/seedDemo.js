require('dotenv').config()
const mongoose = require('mongoose')
const User = require('../src/models/User')
const Lead = require('../src/models/Lead')
const { analyzeLead } = require('../src/services/geminiService')

const credentials = {
  name: 'RealtyAI Demo Agent',
  email: 'demo@realtyai.test',
  password: 'RealtyAI-Demo-2026',
}

const demoLeads = [
  { fullName: 'Asha Mehta', phone: 'TEST-LEAD-01', location: 'Bandra, Mumbai', propertyType: 'Apartment', budgetRange: '1–2 crore', buyingTimeline: '1–3 months', notes: 'Synthetic demo record. Looking for a two-bedroom apartment near transit, prefers a ready-to-move home, and wants to compare maintenance costs before scheduling a visit.', stage: 'Property Visit', completedStages: ['Initial Call'], nextAction: 'Confirm the preferred viewing time and share two matching listings.', daysUntilFollowUp: 1, channel: 'WhatsApp' },
  { fullName: 'Rahul Kapoor', phone: 'TEST-LEAD-02', location: 'Powai, Mumbai', propertyType: 'Villa', budgetRange: '2–5 crore', buyingTimeline: '3–6 months', notes: 'Synthetic demo record. Exploring a family villa with outdoor space and convenient access to schools. Needs time to compare neighborhoods and financing options.', stage: 'Follow-up', completedStages: ['Initial Call', 'Property Visit'], nextAction: 'Collect viewing feedback and clarify the move-in date.', daysUntilFollowUp: 2, channel: 'Phone' },
  { fullName: 'Sana Patel', phone: 'TEST-LEAD-03', location: 'Andheri, Mumbai', propertyType: 'Apartment', budgetRange: '1–2 crore', buyingTimeline: 'Immediately', notes: 'Synthetic demo record. Wants a two-bedroom apartment close to a metro station and is ready to view suitable listings this week.', stage: 'Site Visit', completedStages: ['Initial Call', 'Property Visit', 'Follow-up'], nextAction: 'Confirm site access and prepare the property walkthrough.', daysUntilFollowUp: 1, channel: 'Phone' },
  { fullName: 'Vikram Khanna', phone: 'TEST-LEAD-04', location: 'Thane, Mumbai', propertyType: 'Apartment', budgetRange: '50 lakh–1 crore', buyingTimeline: '3–6 months', notes: 'Synthetic demo record. First-time buyer searching for a two-bedroom apartment, prioritizes security, parking, and a clear breakdown of monthly costs.', stage: 'Closure', completedStages: ['Initial Call', 'Property Visit', 'Follow-up', 'Site Visit'], nextAction: 'Review the offer terms and confirm the paperwork checklist.', daysUntilFollowUp: 3, channel: 'Email' },
  { fullName: 'Nisha Rao', phone: 'TEST-LEAD-05', location: 'Koregaon Park, Pune', propertyType: 'Townhouse', budgetRange: '2–5 crore', buyingTimeline: '6+ months', notes: 'Synthetic demo record. Comparing townhouses for a future move and wants to understand local inventory before arranging an in-person visit.', stage: 'Initial Call', completedStages: [], nextAction: 'Make initial contact and confirm requirements.', daysUntilFollowUp: 1, channel: 'Phone' },
  { fullName: 'Kabir Shah', phone: 'TEST-LEAD-06', location: 'BKC, Mumbai', propertyType: 'Commercial', budgetRange: '5 crore+', buyingTimeline: 'Immediately', notes: 'Synthetic demo record. Looking for a commercial space for an expanding team. Needs available floor area, parking details, and lease-versus-purchase options.', stage: 'Follow-up', completedStages: ['Initial Call', 'Property Visit'], nextAction: 'Answer financing questions and agree on a next meeting.', daysUntilFollowUp: 4, channel: 'Email' },
  { fullName: 'Meera Das', phone: 'TEST-LEAD-07', location: 'Navi Mumbai', propertyType: 'Apartment', budgetRange: '50 lakh–1 crore', buyingTimeline: '3–6 months', notes: 'Synthetic demo record. Searching for a two-bedroom home near rail connections, with nearby schools and a manageable commute.', stage: 'Property Visit', completedStages: ['Initial Call'], nextAction: 'Arrange a weekday viewing and confirm parking needs.', daysUntilFollowUp: 2, channel: 'WhatsApp' },
  { fullName: 'Rohan Sen', phone: 'TEST-LEAD-08', location: 'Khar, Mumbai', propertyType: 'Villa', budgetRange: '2–5 crore', buyingTimeline: '1–3 months', notes: 'Synthetic demo record. Wants a compact villa with outdoor space and is comparing renovated and move-in-ready options.', stage: 'Initial Call', completedStages: [], nextAction: 'Call to confirm location and budget priorities.', daysUntilFollowUp: 2, channel: 'Phone' },
  { fullName: 'Leela Iyer', phone: 'TEST-LEAD-09', location: 'South Mumbai', propertyType: 'Other', budgetRange: '5 crore+', buyingTimeline: '6+ months', notes: 'Synthetic demo record. Exploring a long-term investment property and needs guidance comparing asset types, locations, and expected ownership costs.', stage: 'Closure', completedStages: ['Initial Call', 'Property Visit', 'Follow-up', 'Site Visit', 'Closure'], nextAction: 'Confirm handover and remain available for final questions.', daysUntilFollowUp: 0, channel: 'Email', isComplete: true },
  { fullName: 'Arjun Malhotra', phone: 'TEST-LEAD-10', location: 'Baner, Pune', propertyType: 'Apartment', budgetRange: 'Under 50 lakh', buyingTimeline: '6+ months', notes: 'Synthetic demo record. Early-stage buyer exploring a one-bedroom apartment and wants to understand realistic options within budget.', stage: 'Follow-up', completedStages: ['Initial Call', 'Property Visit'], nextAction: 'Share a revised shortlist based on the lead’s feedback.', daysUntilFollowUp: 5, channel: 'WhatsApp' },
]

async function getDemoUser() {
  let user = await User.findOne({ email: credentials.email }).select('+password')
  if (user) {
    if (!(await user.comparePassword(credentials.password))) {
      throw new Error('The demo account already exists with a different password; refusing to overwrite it.')
    }
    return user
  }
  user = await User.create(credentials)
  return User.findById(user._id).select('+password')
}

async function seedLead(user, seed) {
  const existing = await Lead.findOne({ createdBy: user._id, phone: seed.phone })
  if (existing) return false

  const scheduledAt = new Date(Date.now() + seed.daysUntilFollowUp * 86400000)
  const lead = new Lead({
    fullName: seed.fullName,
    phone: seed.phone,
    location: seed.location,
    propertyType: seed.propertyType,
    budgetRange: seed.budgetRange,
    buyingTimeline: seed.buyingTimeline,
    notes: seed.notes,
    createdBy: user._id,
    followUp: {
      stage: seed.stage,
      completedStages: seed.completedStages,
      isComplete: Boolean(seed.isComplete),
      nextAction: seed.nextAction,
      scheduledAt,
      channel: seed.channel,
      notes: [{ text: seed.notes, stage: seed.stage }],
      activity: [{ text: 'Synthetic demo lead created for testing.', stage: seed.stage }],
    },
  })

  await lead.validate()
  const analysis = await analyzeLead(lead.toObject())
  lead.score = analysis.score
  lead.status = analysis.score >= 68 ? 'Hot' : analysis.score >= 35 ? 'Warm' : 'Cold'
  lead.analysis = {
    summary: analysis.summary,
    intentLevel: analysis.intentLevel,
    keyRequirements: analysis.keyRequirements,
    potentialObjections: analysis.potentialObjections,
    recommendedNextAction: analysis.recommendedNextAction,
    suggestedResponse: analysis.suggestedResponse,
    analyzedAt: analysis.analyzedAt,
    model: analysis.model,
  }
  await lead.save()
  console.log(`Created ${seed.fullName}: ${lead.status}, score ${lead.score}`)
  return true
}

async function main() {
  if (!process.env.MONGO_URI) throw new Error('Set MONGO_URI in backend/.env before seeding the demo account.')
  await mongoose.connect(process.env.MONGO_URI)
  const user = await getDemoUser()
  let createdCount = 0
  for (const seed of demoLeads) {
    if (await seedLead(user, seed)) createdCount += 1
  }
  console.log(`Demo account ready: ${credentials.email}. Added ${createdCount} leads; existing demo leads were left unchanged.`)
}

main()
  .catch((error) => {
    console.error(`Demo seed failed: ${error.message}`)
    process.exitCode = 1
  })
  .finally(async () => {
    await mongoose.disconnect()
  })