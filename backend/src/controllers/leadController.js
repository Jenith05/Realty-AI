const Lead = require('../models/Lead')
const { analyzeLead, generateCallPrep, generateFollowUpPlan, replyToLeadChat } = require('../services/geminiService')

const DEFAULT_FOLLOW_UP_STAGES = ['Initial Call', 'Property Visit', 'Follow-up', 'Site Visit', 'Closure']
const FOLLOW_UP_CHANNELS = ['Phone', 'WhatsApp', 'Email']
const FOLLOW_UP_STAGE_ADVICE = {
  'Initial Call': 'Confirm the lead’s requirements, budget, preferred location, and buying timeline.',
  'Property Visit': 'Share matching properties and agree on a date and time for the visit.',
  'Follow-up': 'Ask for feedback, answer concerns, and confirm which options best fit.',
  'Site Visit': 'Coordinate access, walk through the property, and record the lead’s feedback.',
  Closure: 'Confirm the preferred property, explain the next paperwork steps, and agree on a decision date.',
}

function getFollowUpStages(followUp) {
  return Array.isArray(followUp.stages) && followUp.stages.length
    ? [...followUp.stages]
    : [...DEFAULT_FOLLOW_UP_STAGES]
}

function addFollowUpActivity(lead, text) {
  lead.followUp.activity.push({ text, stage: lead.followUp.stage, createdAt: new Date() })
  if (lead.followUp.activity.length > 100) lead.followUp.activity.shift()
}

function applyJourneyChanges(lead, changes) {
  const followUp = lead.followUp
  const previousStages = getFollowUpStages(followUp)
  const stages = [...previousStages]
  const completed = new Set(followUp.completedStages || [])
  const applied = []
  let rejectedFinalStageRemoval = false

  for (const change of changes) {
    const requestedName = change.stage.trim()
    const matchingStage = stages.find((item) => item.toLowerCase() === requestedName.toLowerCase())

    if (change.action === 'add') {
      if (matchingStage || stages.length >= 12) continue
      const afterIndex = change.after
        ? stages.findIndex((item) => item.toLowerCase() === change.after.toLowerCase())
        : -1
      stages.splice(afterIndex >= 0 ? afterIndex + 1 : stages.length, 0, requestedName)
      applied.push({ action: 'add', stage: requestedName, ...(change.after ? { after: change.after } : {}) })
      continue
    }

    if (change.action === 'remove') {
      if (!matchingStage) continue
      if (stages.length === 1) {
        rejectedFinalStageRemoval = true
        continue
      }
      stages.splice(stages.indexOf(matchingStage), 1)
      completed.delete(matchingStage)
      applied.push({ action: 'remove', stage: matchingStage })
      continue
    }

    if (change.action === 'complete' && matchingStage) {
      const completedIndex = stages.indexOf(matchingStage)
      stages.slice(0, completedIndex + 1).forEach((item) => completed.add(item))
      applied.push({ action: 'complete', stage: matchingStage })
    }
  }

  if (!applied.length) return { applied, rejectedFinalStageRemoval }

  const previousStage = followUp.stage
  followUp.stages = stages
  followUp.completedStages = stages.filter((item) => completed.has(item))
  followUp.isComplete = followUp.completedStages.length === stages.length
  followUp.stage = followUp.isComplete
    ? stages[stages.length - 1]
    : stages.find((item) => !completed.has(item))

  if (followUp.stage !== previousStage || followUp.isComplete) {
    followUp.nextAction = followUp.isComplete
      ? 'Confirm handover and remain available for any final questions.'
      : FOLLOW_UP_STAGE_ADVICE[followUp.stage] || `Complete the ${followUp.stage} stage.`
  }
  for (const change of applied) {
    const description = change.action === 'add'
      ? `Added journey stage: ${change.stage}.`
      : change.action === 'remove'
        ? `Removed journey stage: ${change.stage}.`
        : `Marked ${change.stage} complete.`
    addFollowUpActivity(lead, description)
  }

  return { applied, rejectedFinalStageRemoval }
}

exports.getLead = async (req, res) => {
  try {
    const lead = await Lead.findOne({ _id: req.params.id, createdBy: req.user._id }).lean()
    if (!lead) return res.status(404).json({ message: 'Lead not found.' })
    res.status(200).json({ lead })
  } catch (err) {
    if (err.name === 'CastError') return res.status(404).json({ message: 'Lead not found.' })
    console.error('get lead error:', err)
    res.status(500).json({ message: 'Could not load this lead. Please try again.' })
  }
}

exports.listLeads = async (req, res) => {
  try {
    const leads = await Lead.find({ createdBy: req.user._id })
      .sort({ createdAt: -1 })
      .limit(500)
      .lean()
    res.status(200).json({ leads })
  } catch (err) {
    console.error('list leads error:', err)
    res.status(500).json({ message: 'Could not load leads. Please try again.' })
  }
}

exports.createLead = async (req, res) => {
  try {
    const lead = new Lead({
      fullName: req.body.fullName,
      phone: req.body.phone,
      location: req.body.location,
      propertyType: req.body.propertyType,
      budgetRange: req.body.budgetRange,
      buyingTimeline: req.body.buyingTimeline,
      notes: req.body.notes,
      createdBy: req.user._id,
    })

    await lead.validate([
      'fullName',
      'phone',
      'location',
      'propertyType',
      'budgetRange',
      'buyingTimeline',
      'notes',
      'createdBy',
    ])
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
    addFollowUpActivity(lead, 'Lead added and AI analysis completed.')
    await lead.save()
    res.status(201).json({ lead })
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message })
    }
    console.error('create lead error:', err)
    res.status(err.statusCode || 502).json({ message: err.statusCode === 503 ? err.message : 'AI lead analysis failed. No lead was saved; please retry.' })
  }
}

exports.generateLeadCallPrep = async (req, res) => {
  try {
    const lead = await Lead.findOne({ _id: req.params.id, createdBy: req.user._id })
    if (!lead) return res.status(404).json({ message: 'Lead not found.' })

    lead.callPrep = await generateCallPrep(lead)
    await lead.save()
    res.status(200).json({ callPrep: lead.callPrep })
  } catch (err) {
    if (err.name === 'CastError') return res.status(404).json({ message: 'Lead not found.' })
    console.error('generate call prep error:', err)
    res.status(err.statusCode || 502).json({
      message: err.statusCode === 503 ? err.message : 'AI call preparation failed. Please try again.',
    })
  }
}

exports.generateLeadFollowUpPlan = async (req, res) => {
  try {
    const lead = await Lead.findOne({ _id: req.params.id, createdBy: req.user._id })
    if (!lead) return res.status(404).json({ message: 'Lead not found.' })

    const plan = await generateFollowUpPlan(lead)
    lead.followUp.plan = plan
    lead.followUp.nextAction = plan.nextAction
    lead.followUp.channel = plan.channel
    lead.followUp.scheduledAt = new Date(Date.now() + plan.recommendedInDays * 24 * 60 * 60 * 1000)
    addFollowUpActivity(lead, `AI generated a follow-up plan: ${plan.nextAction}`)
    await lead.save()
    res.status(200).json({ followUp: lead.followUp })
  } catch (err) {
    if (err.name === 'CastError') return res.status(404).json({ message: 'Lead not found.' })
    console.error('generate follow-up plan error:', err)
    const providerStatus = Number(err.statusCode || err.status)
    const temporarilyUnavailable = [429, 500, 502, 503, 504].includes(providerStatus)
    res.status(err.statusCode || (temporarilyUnavailable ? 503 : 502)).json({
      message: err.statusCode === 503
        ? err.message
        : temporarilyUnavailable
          ? 'Gemini is temporarily busy. Please retry shortly.'
          : 'AI follow-up planning is unavailable. Please retry.',
    })
  }
}

exports.updateLeadFollowUp = async (req, res) => {
  const { stage, nextAction, scheduledAt, channel, completedStages, noteStage, addStage, afterStage, removeStage } = req.body
  const note = typeof req.body.note === 'string' ? req.body.note.trim() : ''

  if (channel !== undefined && !FOLLOW_UP_CHANNELS.includes(channel)) {
    return res.status(400).json({ message: 'Choose Phone, WhatsApp, or Email as the contact channel.' })
  }
  if (nextAction !== undefined && (typeof nextAction !== 'string' || nextAction.trim().length > 240)) {
    return res.status(400).json({ message: 'Next action must be 240 characters or fewer.' })
  }
  if (note.length > 1000) return res.status(400).json({ message: 'Notes must be 1,000 characters or fewer.' })
  if (addStage !== undefined && (typeof addStage !== 'string' || !addStage.trim() || addStage.trim().length > 60)) {
    return res.status(400).json({ message: 'New stages must be between 1 and 60 characters.' })
  }
  if (removeStage !== undefined && (typeof removeStage !== 'string' || !removeStage.trim())) {
    return res.status(400).json({ message: 'Choose a stage to remove.' })
  }
  if (addStage !== undefined && removeStage !== undefined) {
    return res.status(400).json({ message: 'Add or remove one stage at a time.' })
  }

  let parsedDate
  if (scheduledAt !== undefined) {
    parsedDate = new Date(scheduledAt)
    if (!Number.isFinite(parsedDate.getTime())) {
      return res.status(400).json({ message: 'Choose a valid follow-up date.' })
    }
  }
  if (stage === undefined && completedStages === undefined && channel === undefined && nextAction === undefined && scheduledAt === undefined && addStage === undefined && removeStage === undefined && !note) {
    return res.status(400).json({ message: 'Update a stage, action, date, channel, or note.' })
  }

  try {
    const lead = await Lead.findOne({ _id: req.params.id, createdBy: req.user._id })
    if (!lead) return res.status(404).json({ message: 'Lead not found.' })

    const followUp = lead.followUp
    let stages = getFollowUpStages(followUp)

    if (stage !== undefined && !stages.includes(stage)) {
      return res.status(400).json({ message: 'Choose a valid stage for this lead.' })
    }
    if (completedStages !== undefined && (!Array.isArray(completedStages) || completedStages.some((item) => !stages.includes(item)))) {
      return res.status(400).json({ message: 'Completed stages must belong to this lead’s journey.' })
    }
    if (noteStage !== undefined && !stages.includes(noteStage)) {
      return res.status(400).json({ message: 'Choose a valid stage for this progress note.' })
    }

    const changes = []
    if (addStage !== undefined) {
      const stageName = addStage.trim()
      if (stages.length >= 12) return res.status(400).json({ message: 'A follow-up journey can have at most 12 stages.' })
      if (stages.some((item) => item.toLowerCase() === stageName.toLowerCase())) {
        return res.status(409).json({ message: 'That stage already exists in this journey.' })
      }
      if (afterStage !== undefined && !stages.includes(afterStage)) {
        return res.status(400).json({ message: 'Choose an existing stage to insert after.' })
      }
      changes.push({ action: 'add', stage: stageName, ...(afterStage ? { after: afterStage } : {}) })
    }
    if (removeStage !== undefined) {
      const stageName = removeStage.trim()
      if (!stages.includes(stageName)) return res.status(400).json({ message: 'That stage does not exist in this journey.' })
      if (stages.length <= 1) return res.status(400).json({ message: 'A journey must keep at least one stage.' })
      changes.push({ action: 'remove', stage: stageName })
    }
    if (changes.length) {
      applyJourneyChanges(lead, changes)
      stages = getFollowUpStages(followUp)
    }

    if (completedStages !== undefined) {
      const previousStage = followUp.stage
      const wasComplete = followUp.isComplete
      followUp.completedStages = stages.filter((item) => completedStages.includes(item))
      const nextStage = stages.find((item) => !followUp.completedStages.includes(item))
      followUp.isComplete = !nextStage
      followUp.stage = nextStage || stages[stages.length - 1]
      if (previousStage !== followUp.stage || wasComplete !== followUp.isComplete) {
        addFollowUpActivity(lead, followUp.isComplete ? 'All follow-up stages completed.' : `Follow-up stage updated to ${followUp.stage}.`)
      }
    } else if (stage !== undefined && stage !== followUp.stage) {
      const previousStage = followUp.stage
      const stageIndex = stages.indexOf(stage)
      followUp.stage = stage
      followUp.completedStages = stages.slice(0, stageIndex)
      followUp.isComplete = false
      addFollowUpActivity(lead, `Stage changed from ${previousStage} to ${stage}.`)
    }
    if (channel !== undefined && channel !== followUp.channel) {
      followUp.channel = channel
      addFollowUpActivity(lead, `Contact channel changed to ${channel}.`)
    }
    if (nextAction !== undefined) followUp.nextAction = nextAction.trim()
    if (parsedDate) followUp.scheduledAt = parsedDate
    if (note) {
      followUp.notes.push({ text: note, stage: noteStage || followUp.stage, createdAt: new Date() })
      if (followUp.notes.length > 100) followUp.notes.shift()
      addFollowUpActivity(lead, `Note added: ${note}`)
    }

    followUp.stages = stages
    await lead.save()
    res.status(200).json({ followUp })
  } catch (err) {
    if (err.name === 'CastError') return res.status(404).json({ message: 'Lead not found.' })
    if (err.name === 'ValidationError') return res.status(400).json({ message: err.message })
    console.error('update lead follow-up error:', err)
    res.status(500).json({ message: 'Could not update follow-up progress. Please retry.' })
  }
}

exports.chatWithLead = async (req, res) => {
  const message = typeof req.body.message === 'string' ? req.body.message.trim() : ''
  if (!message) return res.status(400).json({ message: 'Enter a message to chat about this lead.' })
  if (message.length > 4000) return res.status(400).json({ message: 'Messages must be 4,000 characters or fewer.' })

  try {
    const lead = await Lead.findOne({ _id: req.params.id, createdBy: req.user._id })
    if (!lead) return res.status(404).json({ message: 'Lead not found.' })

    const reply = await replyToLeadChat(lead, message)
    lead.chatHistory.push(
      { role: 'user', content: message },
      { role: 'assistant', content: reply }
    )
    await lead.save()
    res.status(200).json({ chatHistory: lead.chatHistory })
  } catch (err) {
    if (err.name === 'CastError') return res.status(404).json({ message: 'Lead not found.' })
    console.error('lead chat error:', err)
    const providerStatus = Number(err.statusCode || err.status)
    const temporarilyUnavailable = [429, 500, 502, 503, 504].includes(providerStatus)
    res.status(err.statusCode || (temporarilyUnavailable ? 503 : 502)).json({
      message: err.statusCode === 503
        ? err.message
        : temporarilyUnavailable
          ? 'Gemini is temporarily busy. Your message was not saved; please retry shortly.'
          : 'AI chat is unavailable. Your message was not saved; please retry.',
    })
  }
}