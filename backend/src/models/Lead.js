const mongoose = require('mongoose')
const defaultFollowUpStages = ['Initial Call', 'Property Visit', 'Follow-up', 'Site Visit', 'Closure']

const leadAnalysisSchema = new mongoose.Schema(
  {
    summary: { type: String, required: true },
    intentLevel: { type: String, enum: ['High', 'Medium', 'Low'], required: true },
    keyRequirements: [{ type: String, trim: true }],
    potentialObjections: [{ type: String, trim: true }],
    recommendedNextAction: { type: String, required: true },
    suggestedResponse: { type: String, required: true },
    analyzedAt: { type: Date, required: true },
    model: { type: String, required: true },
  },
  { _id: false }
)

const callPrepSchema = new mongoose.Schema(
  {
    opening: { type: String, required: true },
    qualifyingQuestions: [{ type: String, trim: true }],
    propertyMatch: { type: String, required: true },
    nextStep: { type: String, required: true },
    generatedAt: { type: Date, required: true },
    model: { type: String, required: true },
  },
  { _id: false }
)

const followUpPlanSchema = new mongoose.Schema(
  {
    nextAction: { type: String, required: true },
    priority: { type: String, enum: ['High', 'Medium', 'Low'], required: true },
    reason: { type: String, required: true },
    recommendedInDays: { type: Number, min: 0, max: 30, required: true },
    messageDraft: { type: String, required: true },
    generatedAt: { type: Date, required: true },
    model: { type: String, required: true },
  },
  { _id: false }
)

const followUpEntrySchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true, maxlength: 1000 },
    stage: { type: String, trim: true, maxlength: 60 },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
)

const followUpSchema = new mongoose.Schema(
  {
    stages: {
      type: [{ type: String, trim: true, maxlength: 60 }],
      default: () => [...defaultFollowUpStages],
    },
    stage: {
      type: String,
      default: 'Initial Call',
      maxlength: 60,
    },
    completedStages: [{ type: String, trim: true, maxlength: 60 }],
    isComplete: { type: Boolean, default: false },
    nextAction: { type: String, trim: true, maxlength: 240, default: 'Make initial contact' },
    scheduledAt: { type: Date, default: Date.now },
    channel: { type: String, enum: ['Phone', 'WhatsApp', 'Email'], default: 'Phone' },
    plan: { type: followUpPlanSchema },
    notes: { type: [followUpEntrySchema], default: [] },
    activity: { type: [followUpEntrySchema], default: [] },
  },
  { _id: false }
)

const chatMessageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true, trim: true, maxlength: 4000 },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
)

const leadSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      maxlength: 120,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      maxlength: 32,
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
      maxlength: 160,
    },
    propertyType: {
      type: String,
      required: [true, 'Property requirement is required'],
      enum: ['Apartment', 'Villa', 'Townhouse', 'Commercial', 'Land', 'Other'],
    },
    budgetRange: {
      type: String,
      required: [true, 'Budget range is required'],
      enum: ['Under 50 lakh', '50 lakh–1 crore', '1–2 crore', '2–5 crore', '5 crore+'],
    },
    buyingTimeline: {
      type: String,
      required: [true, 'Buying timeline is required'],
      enum: ['Immediately', '1–3 months', '3–6 months', '6+ months'],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
    score: {
      type: Number,
      min: 0,
      max: 100,
    },
    status: {
      type: String,
      enum: ['Hot', 'Warm', 'Cold'],
    },
    analysis: {
      type: leadAnalysisSchema,
    },
    callPrep: {
      type: callPrepSchema,
    },
    followUp: {
      type: followUpSchema,
      default: () => ({}),
    },
    chatHistory: {
      type: [chatMessageSchema],
      default: [],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Lead', leadSchema)