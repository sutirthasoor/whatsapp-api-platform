import { ADDRESS, CONSENT, CUSTOM, LANGS, META, SOCIAL, UTM, sec, type Schema } from './schema-kit'

const BILL = ['billingName:Billing name', 'billingEmail:Billing email:e', 'gstin:GSTIN', 'pan:PAN', 'paymentTerms:Payment terms:s:Due on receipt,Net 7,Net 15,Net 30,Net 45,Net 60', 'creditLimit:Credit limit (₹):n', 'taxExempt:Tax exempt:b']
const PREF = ['language:Preferred language:s:' + LANGS, 'preferredChannel:Preferred channel:s:WhatsApp,Call,Email,SMS', 'bestTimeToContact:Best time to contact', 'timezone:Timezone:s:Asia/Kolkata,Asia/Dubai,Europe/London,America/New_York,Asia/Singapore']

export const SCHEMAS_A: Schema[] = [
  { collection: 'leads', title: 'Leads', singular: 'Lead', description: 'Everyone who showed interest — track them to a deal', titleKey: 'name', subtitleKey: 'company', filter: 'status',
    cols: ['name', 'phone', 'company', 'source', 'status!', 'value$', 'owner', 'createdAt@'], defaults: { whatsappOptIn: true },
    sections: [
      sec('Contact', ['name*:Full name', 'jobTitle:Job title', 'phone*:Phone:p', 'altPhone:Alternate phone:p', 'whatsapp:WhatsApp number:p', 'email:Email:e', 'altEmail:Alternate email:e', 'dob:Date of birth:d', 'gender:Gender:s:,Male,Female,Other', ...PREF.slice(0, 1)]),
      sec('Company', ['company:Company', 'industry:Industry:s:,Retail,Education,Healthcare,Real estate,Manufacturing,Logistics,Hospitality,IT services,Finance,Other', 'companySize:Company size:s:,1-10,11-50,51-200,201-1000,1000+', 'annualRevenue:Annual revenue (₹):n', 'department:Department', 'gstin:GSTIN', ...SOCIAL.slice(0, 2)]),
      sec('Address', ADDRESS),
      sec('Sales pipeline', ['status*:Status:s:New,Contacted,Qualified,Proposal,Won,Lost', 'value:Expected deal value (₹):n', 'probability:Win probability (%):n', 'priority:Priority:s:Low,Medium,High,Hot', 'score:Lead score:n', 'owner:Owner / assigned to', 'expectedClose:Expected close date:d', 'interestedIn:Interested in', 'budget:Budget (₹):n', 'requirement:Requirement:x', 'lostReason:Lost reason', 'competitor:Competitor in play']),
      sec('Source & attribution', ['source:Source:s:WhatsApp,Website,Referral,Instagram,Google Ads,Facebook,Walk-in,Cold call,Event,API,Other', 'sourceDetail:Source detail', 'campaign:Campaign', 'referredBy:Referred by', ...UTM.slice(0, 4)]),
      sec('Engagement', ['lastContactedAt:Last contacted:dt', 'nextFollowUp:Next follow-up:dt', 'contactAttempts:Contact attempts:n', 'bestTimeToContact:Best time to contact', 'preferredChannel:Preferred channel:s:WhatsApp,Call,Email,SMS', ...CONSENT.slice(0, 4)]),
      sec('Notes & custom', [...META, ...CUSTOM]),
    ] },
  { collection: 'deals', title: 'Deals', singular: 'Deal', titleKey: 'title', subtitleKey: 'contact', filter: 'stage', cols: ['title', 'contact', 'value$', 'stage!', 'owner', 'closeDate@'], defaults: { stage: 'New Lead', currency: 'INR' },
    sections: [
      sec('Deal', ['title*:Deal title', 'contact*:Contact name', 'company:Company', 'stage*:Stage:s:New Lead,Qualified,Proposal,Negotiation,Won,Lost', 'value*:Deal value (₹):n', 'currency:Currency:s:INR,USD,EUR,AED', 'probability:Win probability (%):n', 'dealType:Deal type:s:New business,Renewal,Upsell,Cross-sell', 'priority:Priority:s:Low,Medium,High', 'owner:Owner / assigned to']),
      sec('Contact details', ['contactPhone:Contact phone:p', 'contactEmail:Contact email:e', 'contactRole:Contact role / designation', 'decisionMaker:Decision maker:b', 'leadId:Linked lead ID']),
      sec('Timeline', ['createdOn:Opened on:d', 'closeDate:Expected close date:d', 'actualCloseDate:Actual close date:d', 'nextStep:Next step', 'nextStepDate:Next step date:d', 'lastActivityAt:Last activity:dt']),
      sec('Commercials', ['products:Products / services', 'quantity:Quantity:n', 'discountPercent:Discount (%):n', 'taxPercent:Tax (%):n', 'recurring:Recurring revenue:b', 'billingCycle:Billing cycle:s:One-time,Monthly,Quarterly,Yearly', 'contractLength:Contract length (months):n', 'paymentTerms:Payment terms:s:Due on receipt,Net 15,Net 30,Net 45']),
      sec('Outcome', ['source:Lead source', 'competitor:Competitor', 'lostReason:Lost reason', 'winReason:Win reason', 'forecastCategory:Forecast category:s:Pipeline,Best case,Commit,Closed', 'description:Description:x', 'tags:Tags (comma separated)', 'notes:Internal notes:x']),
    ] },
  { collection: 'customers', title: 'Customers', singular: 'Customer', titleKey: 'name', subtitleKey: 'company', filter: 'status', cols: ['name', 'company', 'phone', 'email', 'city', 'totalSpent$', 'status!', 'since@'], defaults: { status: 'Active', whatsappOptIn: true, country: 'India' },
    sections: [
      sec('Contact', ['name*:Full name', 'jobTitle:Job title', 'phone*:Phone:p', 'altPhone:Alternate phone:p', 'whatsapp:WhatsApp number:p', 'email:Email:e', 'altEmail:Alternate email:e', 'dob:Date of birth:d', 'anniversary:Anniversary:d', 'gender:Gender:s:,Male,Female,Other']),
      sec('Company', ['company:Company', 'industry:Industry', 'companySize:Company size:s:,1-10,11-50,51-200,201-1000,1000+', 'department:Department', ...SOCIAL]),
      sec('Address', ADDRESS),
      sec('Account', ['status*:Status:s:Active,Inactive,Churned,VIP', 'customerType:Customer type:s:Individual,Business,Reseller,Partner', 'tier:Tier:s:Standard,Silver,Gold,Platinum', 'owner:Account manager', 'since:Customer since:d', 'totalSpent:Lifetime value (₹):n', 'ordersCount:Orders placed:n', 'lastPurchaseAt:Last purchase:d', 'averageOrderValue:Average order value (₹):n', 'loyaltyPoints:Loyalty points:n', 'npsScore:NPS score (0-10):n', 'renewalDate:Renewal date:d']),
      sec('Billing', BILL),
      sec('Preferences & consent', [...PREF, ...CONSENT.slice(0, 4)]),
      sec('Notes & custom', [...META, ...CUSTOM]),
    ] },
  { collection: 'followups', title: 'Follow Ups', singular: 'Follow-up', titleKey: 'task', subtitleKey: 'contact', filter: 'status', cols: ['task', 'contact', 'type', 'dueAt#', 'priority!', 'status!', 'assignee'], defaults: { status: 'Pending', priority: 'Medium', type: 'Call' },
    sections: [
      sec('Task', ['task*:Task', 'type:Type:s:Call,WhatsApp,Email,Meeting,Visit,Payment follow-up,Other', 'priority:Priority:s:Low,Medium,High', 'status*:Status:s:Pending,Overdue,Done,Cancelled', 'dueAt*:Due at:dt', 'duration:Estimated minutes:n', 'assignee:Assigned to', 'description:Description:x']),
      sec('Related to', ['contact*:Contact name', 'contactPhone:Contact phone:p', 'contactEmail:Contact email:e', 'company:Company', 'relatedType:Related to:s:Lead,Customer,Deal,Invoice,Quotation,Other', 'relatedId:Related record ID', 'dealValue:Deal value (₹):n']),
      sec('Reminders', ['remind:Send reminder:b', 'remindBefore:Remind before (minutes):n', 'remindVia:Remind via:s:In-app,WhatsApp,Email', 'repeat:Repeat:s:No,Daily,Weekly,Monthly', 'repeatUntil:Repeat until:d', 'snoozeUntil:Snoozed until:dt']),
      sec('Outcome', ['completedAt:Completed at:dt', 'completedBy:Completed by', 'outcome:Outcome:s:,Connected,No answer,Busy,Rescheduled,Won,Lost', 'outcomeNotes:Outcome notes:x', 'nextAction:Next action', 'nextActionDate:Next action date:d', 'attempts:Attempts made:n', 'tags:Tags (comma separated)', 'notes:Internal notes:x', 'internalRef:Internal reference']),
    ] },
  { collection: 'meetings', title: 'Meetings', singular: 'Meeting', titleKey: 'title', subtitleKey: 'contact', filter: 'status', cols: ['title', 'contact', 'at#', 'duration', 'mode', 'status!'], defaults: { status: 'Scheduled', mode: 'Google Meet', duration: 30 },
    sections: [
      sec('Meeting', ['title*:Title', 'type:Type:s:Demo,Onboarding,Discovery,Negotiation,Review,Support,Other', 'at*:Starts at:dt', 'duration:Duration (minutes):n', 'timezone:Timezone:s:Asia/Kolkata,Asia/Dubai,Europe/London,America/New_York', 'status*:Status:s:Scheduled,Completed,Cancelled,No-show,Rescheduled', 'agenda:Agenda:x']),
      sec('Attendee', ['contact*:Contact name', 'contactPhone:Contact phone:p', 'contactEmail:Contact email:e', 'company:Company', 'attendees:Other attendees (emails)', 'host:Host / organiser', 'relatedDeal:Related deal']),
      sec('Location', ['mode:Mode:s:Google Meet,Zoom,Phone,In person,Microsoft Teams,WhatsApp call', 'link:Meeting link:u', 'location:Location / address', 'dialIn:Dial-in number:p', 'meetingPassword:Meeting passcode', 'recordingUrl:Recording URL:u']),
      sec('Reminders', ['reminderBefore:Remind before (minutes):n', 'reminderVia:Remind via:s:WhatsApp,Email,In-app', 'reminderSent:Reminder sent:b', 'confirmed:Attendee confirmed:b', 'rescheduledFrom:Rescheduled from:dt']),
      sec('Outcome', ['summary:Summary / minutes:x', 'outcome:Outcome:s:,Positive,Neutral,Negative', 'actionItems:Action items:x', 'nextMeeting:Next meeting:dt', 'cancelReason:Cancellation reason', 'rating:Meeting rating (1-5):n', 'tags:Tags (comma separated)', 'notes:Internal notes:x']),
    ] },
  { collection: 'calls', title: 'Calls', singular: 'Call', titleKey: 'contact', subtitleKey: 'phone', filter: 'status', cols: ['contact', 'phone', 'direction!', 'duration', 'status!', 'at#', 'outcome'], defaults: { direction: 'Outbound', status: 'Completed' },
    sections: [
      sec('Call', ['contact*:Contact name', 'phone*:Phone:p', 'direction*:Direction:s:Outbound,Inbound', 'status*:Status:s:Completed,Missed,Scheduled,Voicemail,Busy,Failed', 'at*:Date & time:dt', 'duration:Duration (minutes):n', 'agent:Agent', 'extension:Extension / line', 'callType:Call type:s:Sales,Support,Follow-up,Collection,Survey']),
      sec('Linked records', ['company:Company', 'relatedType:Related to:s:Lead,Customer,Deal,Invoice,Other', 'relatedId:Related record ID', 'leadStage:Lead stage at call', 'dealValue:Deal value (₹):n']),
      sec('Outcome', ['outcome:Outcome:s:,Interested,Not interested,Callback,Meeting booked,Wrong number,Payment promised,Closed won', 'sentiment:Sentiment:s:,Positive,Neutral,Negative', 'notes:Notes:x', 'nextAction:Next action', 'nextActionDate:Next action date:dt', 'followUpCreated:Follow-up created:b', 'promisedAmount:Promised amount (₹):n', 'promisedDate:Promise date:d']),
      sec('Recording & quality', ['recordingUrl:Recording URL:u', 'transcript:Transcript:x', 'qualityScore:Quality score (1-10):n', 'disposition:Disposition code', 'ringDuration:Ring time (seconds):n', 'callerId:Caller ID', 'costInr:Cost (₹):n', 'tags:Tags (comma separated)', 'internalRef:Internal reference']),
    ] },
]
