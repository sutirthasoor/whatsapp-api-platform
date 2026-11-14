import { ADDRESS, LANGS, PLAN_OPT, SOCIAL, UTM, sec, type Schema } from './schema-kit'

const platformSchemas = (p: 'flow' | 'auto', name: string): Schema[] => [
  { collection: `${p}_users`, title: `${name} Users`, singular: 'User', titleKey: 'name', subtitleKey: 'email', filter: 'status', cols: ['name', 'email', 'org', 'role!', 'status!', 'lastActive#'], defaults: { role: 'Member', status: 'Active' },
    sections: [
      sec('Identity', ['name*:Name', 'email*:Email:e', 'phone:Phone:p', 'org:Organisation', 'role*:Role:s:Owner,Admin,Member,Viewer', 'status*:Status:s:Active,Invited,Suspended', 'jobTitle:Job title', 'department:Department']),
      sec('Access', ['externalUserId:Platform user ID', 'apiAccess:API access:b', 'mfaEnabled:MFA enabled:b', 'seatType:Seat type:s:Full,Limited,Read-only', 'permissions:Permissions (comma separated)', 'allowedIps:Allowed IPs', 'invitedBy:Invited by', 'inviteSentAt:Invite sent:dt']),
      sec('Activity', ['lastActive:Last active:dt', 'loginCount:Logins:n', 'flowsCreated:Flows / bots created:n', 'runsThisMonth:Runs this month:n', 'lastIp:Last IP', 'lastDevice:Last device', 'timezone:Timezone', 'language:Language']),
      sec('Notes', ['source:Source:s:Self sign-up,Admin created,Invite,Import', 'tags:Tags (comma separated)', 'notes:Internal notes:x', 'internalRef:Internal reference']),
    ] },
  { collection: `${p}_orgs`, title: `${name} Organisations`, singular: 'Organisation', titleKey: 'name', subtitleKey: 'owner', filter: 'status', cols: ['name', 'owner', 'members', 'plan!', 'status!', 'createdAt@'], defaults: { plan: 'Unified', status: 'Active', members: 1 },
    sections: [
      sec('Organisation', ['name*:Name', 'slug:Slug', 'owner:Owner name', 'ownerEmail:Owner email:e', 'plan:Plan:s:' + PLAN_OPT, 'status*:Status:s:Active,Trial,Suspended,Cancelled', 'industry:Industry', 'size:Company size:s:,1-10,11-50,51-200,201-1000,1000+']),
      sec('Contact & address', ['phone:Phone:p', 'billingEmail:Billing email:e', 'website:Website:u', ...ADDRESS.slice(2), 'gstin:GSTIN']),
      sec('Limits & usage', ['members:Members:n', 'seatLimit:Seat limit:n', 'workflows:Workflows / bots:n', 'workflowLimit:Workflow limit:n', 'runsThisMonth:Runs this month:n', 'runLimit:Run limit / month:n', 'storageMb:Storage used (MB):n', 'storageLimitMb:Storage limit (MB):n']),
      sec('Lifecycle', ['trialEndsAt:Trial ends:d', 'renewsOn:Renews on:d', 'customDomain:Custom domain', 'ssoEnabled:SSO enabled:b', 'whiteLabel:White-label:b', 'accountManager:Account manager', 'tags:Tags (comma separated)', 'notes:Internal notes:x']),
    ] },
  { collection: `${p}_training`, title: `${name} Training`, description: 'Courses and onboarding material for customers', singular: 'Course', titleKey: 'title', subtitleKey: 'type', filter: 'status', cols: ['title', 'type', 'duration', 'level', 'enrolled', 'status!'], defaults: { type: 'Video', status: 'Draft', level: 'Beginner', enrolled: 0 },
    sections: [
      sec('Course', ['title*:Title', 'type*:Type:s:Video,Document,Live session,Workshop,Webinar', 'status*:Status:s:Draft,Published,Archived', 'level:Level:s:Beginner,Intermediate,Advanced', 'category:Category', 'duration:Duration', 'language:Language:s:' + LANGS, 'description:Description:x']),
      sec('Content', ['contentUrl:Content URL:u', 'thumbnailUrl:Thumbnail URL:u', 'instructor:Instructor', 'modules:Modules / chapters:n', 'prerequisites:Prerequisites', 'resources:Downloadable resources (links)', 'transcriptUrl:Transcript URL:u', 'captionsAvailable:Captions available:b']),
      sec('Schedule & access', ['scheduledAt:Live session at:dt', 'audience:Audience:s:All customers,New customers,Admins only,Partners', 'plans:Included in plans', 'mandatory:Mandatory:b', 'certificate:Issues certificate:b', 'passMark:Pass mark (%):n', 'enrollmentLimit:Enrollment limit:n']),
      sec('Stats', ['enrolled:Enrolled:n', 'completed:Completed:n', 'avgRating:Average rating:n', 'avgScore:Average score (%):n', 'publishedAt:Published at:dt', 'tags:Tags (comma separated)', 'notes:Internal notes:x']),
    ] },
  { collection: `${p}_credentials`, title: `${name} Credentials`, description: 'API keys and secrets used by the platform', singular: 'Credential', titleKey: 'service', subtitleKey: 'keyName', filter: 'status', cols: ['service', 'keyName', 'value', 'environment!', 'status!', 'updated@'], defaults: { environment: 'Production', status: 'Active' },
    sections: [
      sec('Credential', ['service*:Service', 'keyName*:Key name', 'value*:Value:pw', 'environment:Environment:s:Production,Staging,Development', 'status:Status:s:Active,Inactive,Expired,Revoked', 'description:Description:x']),
      sec('Provider', ['provider:Provider', 'accountId:Account / project ID', 'region:Region', 'endpointUrl:Endpoint URL:u', 'username:Username / client ID', 'scopes:Scopes / permissions']),
      sec('Rotation & ownership', ['updated:Last updated:d', 'expiresAt:Expires on:d', 'rotationDays:Rotate every (days):n', 'lastRotatedAt:Last rotated:dt', 'owner:Owner', 'usedBy:Used by (service / module)', 'tags:Tags (comma separated)', 'notes:Internal notes:x']),
    ] },
]

export const SCHEMAS_D: Schema[] = [
  { collection: 'users', title: 'User Management', singular: 'User', description: 'Every account that can sign in — customers, resellers and admins', titleKey: 'name', subtitleKey: 'email', filter: 'status', cols: ['name', 'email', 'company', 'plan!', 'accountType!', 'status!', 'lastLogin#'], defaults: { accountType: 'Customer', status: 'Active', plan: 'Unified', country: 'India' },
    sections: [
      sec('Sign-in', ['name*:Full name', 'email*:Email (login):e', 'password:Password (min 8 characters; leave blank to keep):pw', 'accountType*:Account type:s:Customer,Reseller,Admin', 'status*:Status:s:Active,Trial,Suspended', 'plan:Plan:s:' + PLAN_OPT]),
      sec('Profile', ['phone:Phone:p', 'altPhone:Alternate phone:p', 'jobTitle:Job title', 'dob:Date of birth:d', 'gender:Gender:s:,Male,Female,Other', 'language:Language:s:' + LANGS, 'timezone:Timezone', 'avatarUrl:Avatar URL:u']),
      sec('Company', ['company:Company', 'industry:Industry', 'companySize:Company size:s:,1-10,11-50,51-200,201-1000,1000+', 'gstin:GSTIN', 'pan:PAN', 'website:Website:u', ...ADDRESS]),
      sec('Account & billing', ['trialEnds:Trial ends:d', 'billingEmail:Billing email:e', 'billingCycle:Billing cycle:s:Monthly,Yearly', 'creditBalance:Credit balance (₹):n', 'discountPercent:Discount (%):n', 'resellerId:Reseller ID', 'accountManager:Account manager', 'referralCode:Referral code', 'whiteLabel:White-label:b']),
      sec('Acquisition & notes', ['source:Source:s:Self sign-up,Enquiry,Admin created,Referral,Reseller', 'utmSource:UTM source', 'utmCampaign:UTM campaign', 'referredBy:Referred by', 'suspensionReason:Suspension reason', 'tags:Tags (comma separated)', 'notes:Internal notes:x']),
    ] },
  { collection: 'plans', title: 'Plans', singular: 'Plan', description: 'Pricing plans offered at checkout', titleKey: 'name', subtitleKey: 'tagline', filter: 'status', cols: ['name', 'priceMonthly$', 'priceYearly$', 'seats', 'messages', 'trialDays', 'status!'], defaults: { name: 'Automation', priceMonthly: 999, priceYearly: 9990, currency: 'INR', taxPercent: 18, status: 'Active', visibility: 'Public', trialDays: 14, seats: 3, messages: 5000, contacts: 5000, storageGb: 5 },
    sections: [
      sec('Plan', ['name*:Plan name', 'code:Plan code', 'tagline:Tagline', 'description:Description:x', 'status*:Status:s:Active,Hidden,Retired', 'visibility:Visibility:s:Public,Private,Invite only', 'badge:Badge label', 'highlighted:Highlight on pricing page:b', 'sortOrder:Sort order:n']),
      sec('Pricing', ['priceMonthly*:Monthly price (₹):n', 'priceYearly*:Yearly price (₹):n', 'currency:Currency:s:INR,USD,EUR,AED', 'taxPercent:Tax (%):n', 'setupFee:One-time setup fee (₹):n', 'trialDays:Free trial (days):n', 'overagePerMessage:Overage per message (₹):n', 'discountYearlyPercent:Yearly discount (%):n']),
      sec('Limits', ['seats:Team seats:n', 'messages:Messages / month:n', 'contacts:Contacts:n', 'storageGb:Storage (GB):n', 'automations:Automations / bots:n', 'broadcastsPerMonth:Broadcasts / month:n', 'whatsappNumbers:WhatsApp numbers:n', 'apiRequestsPerDay:API requests / day:n']),
      sec('Features', ['features:Feature list (comma separated):x', 'apiAccess:API access:b', 'customDomain:Custom domain:b', 'prioritySupport:Priority support:b', 'whiteLabel:White-label:b', 'sso:Single sign-on:b', 'aiAssistant:AI assistant:b', 'dedicatedManager:Dedicated manager:b']),
    ] },
  { collection: 'subscriptions', title: 'Subscriptions', singular: 'Subscription', description: 'Recurring plans per customer', titleKey: 'user', subtitleKey: 'plan', filter: 'status', cols: ['user', 'plan', 'cycle', 'amount$', 'status!', 'started@', 'renewsOn@'], defaults: { plan: 'Unified', cycle: 'Monthly', status: 'Active', autoRenew: true },
    sections: [
      sec('Subscription', ['user*:Customer name', 'userEmail:Customer email:e', 'ownerId:Account ID', 'plan*:Plan:s:' + PLAN_OPT, 'cycle*:Billing cycle:s:Monthly,Yearly', 'amount*:Amount (₹):n', 'status*:Status:s:Active,Trialing,Pending,Past due,Cancelled,Expired', 'source:Source']),
      sec('Dates', ['started:Started on:d', 'renewsOn:Renews on:d', 'trialEnds:Trial ends:d', 'cancelledAt:Cancelled on:d', 'lastRenewedAt:Last renewed:dt', 'nextInvoiceDate:Next invoice date:d', 'pausedUntil:Paused until:d']),
      sec('Billing', ['autoRenew:Auto-renew:b', 'discountPercent:Discount (%):n', 'couponCode:Coupon code', 'taxPercent:Tax (%):n', 'gateway:Gateway', 'paymentMethod:Payment method', 'billingEmail:Billing email:e', 'seats:Seats purchased:n', 'addOns:Add-ons']),
      sec('Cancellation & notes', ['cancelReason:Cancellation reason:s:,Too expensive,Missing features,Switched provider,Closed business,Other', 'cancelFeedback:Cancellation feedback:x', 'dunningAttempts:Failed payment attempts:n', 'accountManager:Account manager', 'tags:Tags (comma separated)', 'notes:Internal notes:x']),
    ] },
  { collection: 'payments', title: 'Payments', singular: 'Payment', titleKey: 'ref', subtitleKey: 'user', filter: 'status', cols: ['ref', 'user', 'plan', 'amount$', 'method', 'gateway', 'status!', 'date@'], defaults: { status: 'Paid', method: 'UPI', currency: 'INR' },
    sections: [
      sec('Payment', ['ref*:Reference', 'user*:Customer name', 'userEmail:Customer email:e', 'ownerId:Account ID', 'plan:Plan:s:' + PLAN_OPT, 'cycle:Cycle:s:Monthly,Yearly', 'status*:Status:s:Paid,Pending,Failed,Refunded', 'date:Payment date:d']),
      sec('Amount', ['amount*:Amount (₹):n', 'currency:Currency:s:INR,USD,EUR,AED', 'taxAmount:Tax included (₹):n', 'feeAmount:Gateway fee (₹):n', 'netAmount:Net received (₹):n', 'discountAmount:Discount (₹):n', 'couponCode:Coupon code']),
      sec('Gateway', ['gateway:Gateway', 'method:Method', 'gatewayOrderId:Gateway order ID', 'gatewayPaymentId:Gateway payment ID', 'intentId:Checkout ID', 'cardLast4:Card last 4', 'bankReference:Bank / UTR reference', 'failureReason:Failure reason']),
      sec('Refund & verification', ['refundedAmount:Refunded amount (₹):n', 'refundedAt:Refunded at:dt', 'refundReason:Refund reason', 'verifiedBy:Verified by', 'verifiedAt:Verified at:dt', 'invoiceNo:Invoice number', 'tags:Tags (comma separated)', 'notes:Internal notes:x']),
    ] },
  { collection: 'gateways', title: 'Payment Gateways', singular: 'Gateway', titleKey: 'name', subtitleKey: 'provider', filter: 'mode', cols: ['name', 'provider', 'mode!', 'currency', 'fee', 'enabled', 'isDefault'], defaults: { mode: 'Test', enabled: false, fee: 2, currency: 'INR' },
    sections: [
      sec('Gateway', ['name*:Display name', 'provider*:Provider:s:razorpay,stripe,offline', 'mode:Mode:s:Test,Live', 'enabled:Enabled:b', 'isDefault:Default gateway:b', 'currency:Currency:s:INR,USD,EUR,AED', 'supportedMethods:Supported methods', 'description:Description:x']),
      sec('Credentials', ['keyId:Key ID / publishable key', 'secret:Secret key:pw', 'webhookSecret:Webhook secret:pw', 'merchantId:Merchant / account ID', 'accountName:Account holder name', 'apiVersion:API version', 'webhook:Webhook URL:u', 'callbackUrl:Return URL:u']),
      sec('Fees & limits', ['fee:Gateway fee (%):n', 'fixedFee:Fixed fee (₹):n', 'minAmount:Minimum amount (₹):n', 'maxAmount:Maximum amount (₹):n', 'settlementDays:Settlement time (days):n', 'gstOnFee:GST on fee (%):n', 'surchargePercent:Customer surcharge (%):n']),
      sec('Checkout experience', ['displayOrder:Display order:n', 'logoUrl:Logo URL:u', 'instructions:Customer instructions (shown at checkout):x', 'bankName:Bank name (offline)', 'accountNumber:Account number (offline)', 'ifsc:IFSC (offline)', 'upiId:UPI ID (offline)', 'notes:Internal notes:x']),
    ] },
  { collection: 'enquiries', title: 'Enquiries', singular: 'Enquiry', description: 'Leads from the public contact page', titleKey: 'name', subtitleKey: 'email', filter: 'status', cols: ['name', 'email', 'phone', 'interest!', 'source', 'status!', 'created#'], defaults: { status: 'New', source: 'Website', priority: 'Normal' },
    sections: [
      sec('Contact', ['name*:Name', 'email:Email:e', 'phone:Phone:p', 'company:Company', 'jobTitle:Job title', 'city:City', 'country:Country', 'website:Website:u']),
      sec('Interest', ['interest:Interested in:s:,' + PLAN_OPT, 'teamSize:Team size:s:,1-5,6-20,21-50,51-200,200+', 'budget:Budget (₹ / month):n', 'timeline:Timeline:s:,Immediately,1 month,3 months,Just exploring', 'currentTool:Current tool', 'message:Message:x', 'useCase:Use case:x']),
      sec('Pipeline', ['status*:Status:s:New,Contacted,Qualified,Closed', 'priority:Priority:s:Low,Normal,High', 'owner:Assigned to', 'source:Source:s:Website,Pricing page,WhatsApp,Referral,Event,Other', 'lastContactedAt:Last contacted:dt', 'nextFollowUp:Next follow-up:dt', 'lostReason:Lost reason', 'convertedTo:Converted account ID']),
      sec('Attribution & notes', [...UTM.slice(0, 5), 'created:Received at:dt', 'tags:Tags (comma separated)', 'notes:Internal notes:x']),
    ] },
  ...platformSchemas('flow', 'Flow'), ...platformSchemas('auto', 'Automation'),
  { collection: 'site_credentials', title: 'Main Site Credentials', description: 'Keys used by the public website', singular: 'Credential', titleKey: 'service', subtitleKey: 'keyName', filter: 'status', cols: ['service', 'keyName', 'value', 'environment!', 'status!', 'updated@'], defaults: { environment: 'Production', status: 'Active' },
    sections: platformSchemas('flow', '')[3].sections },
]
