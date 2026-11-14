import { ADDRESS, CUSTOM, META, UTM, sec, type Schema } from './schema-kit'

export const SCHEMAS_B: Schema[] = [
  { collection: 'conversations', title: 'Conversations', singular: 'Conversation', titleKey: 'name', subtitleKey: 'phone', filter: 'status', cols: ['name', 'phone', 'status!', 'priority!', 'assignee', 'lastMessageAt#'], defaults: { status: 'Open', priority: 'Normal', channel: 'WhatsApp', tags: [], messages: [], unread: 0 },
    sections: [
      sec('Contact', ['name*:Contact name', 'phone*:WhatsApp number:p', 'email:Email:e', 'company:Company', 'contactType:Contact type:s:New,Known contact,Customer,Lead', 'language:Language', 'city:City', 'country:Country']),
      sec('Handling', ['status*:Status:s:Open,Pending,Resolved,Spam', 'priority:Priority:s:Low,Normal,High,Urgent', 'assignee:Assigned to', 'team:Team / queue', 'channel:Channel:s:WhatsApp', 'category:Category:s:,Sales,Support,Billing,Feedback,Other', 'slaDueAt:SLA due at:dt', 'firstResponseMinutes:First response time (min):n']),
      sec('Context', ['source:Source', 'campaign:Campaign / broadcast', 'relatedDeal:Related deal', 'relatedInvoice:Related invoice', 'leadId:Linked lead ID', 'customerId:Linked customer ID', 'orderValue:Order value (₹):n']),
      sec('Resolution', ['resolvedAt:Resolved at:dt', 'resolvedBy:Resolved by', 'resolutionNote:Resolution note:x', 'csatScore:CSAT score (1-5):n', 'csatComment:CSAT comment:x', 'botHandled:Handled by bot:b', 'humanHandoff:Handed off to human:b', 'tagsText:Tags (comma separated)', 'notes:Internal notes:x']),
    ] },
  { collection: 'campaigns', title: 'Campaign Reports', singular: 'Campaign', description: 'Performance of your marketing sends', titleKey: 'name', subtitleKey: 'template', filter: 'status', cols: ['name', 'template', 'sent', 'delivered', 'read', 'replied', 'failed', 'status!', 'date@'], defaults: { status: 'Completed', objective: 'Promotion' },
    sections: [
      sec('Campaign', ['name*:Campaign name', 'objective:Objective:s:Promotion,Awareness,Lead generation,Retention,Feedback,Announcement,Payment reminder', 'status*:Status:s:Draft,Scheduled,Running,Completed,Paused,Failed', 'template:Template used', 'channel:Channel:s:WhatsApp,SMS,Email', 'date:Send date:d', 'owner:Owner', 'description:Description:x']),
      sec('Audience', ['audience:Audience', 'audienceSize:Audience size:n', 'segment:Segment / tag filter', 'excludedCount:Excluded (opted-out):n', 'geography:Geography', 'language:Language']),
      sec('Delivery results', ['sent:Sent:n', 'delivered:Delivered:n', 'read:Read:n', 'replied:Replied:n', 'failed:Failed:n', 'clicked:Link clicks:n', 'optOuts:Opt-outs:n', 'blocked:Blocked by user:n', 'pending:Still pending:n']),
      sec('Conversion', ['leadsGenerated:Leads generated:n', 'ordersGenerated:Orders generated:n', 'revenueInr:Revenue attributed (₹):n', 'costInr:Campaign cost (₹):n', 'roi:ROI (%):n', 'cpl:Cost per lead (₹):n', 'conversionRate:Conversion rate (%):n']),
      sec('Tracking', [...UTM.slice(0, 5), 'startedAt:Started at:dt', 'completedAt:Completed at:dt', 'tags:Tags (comma separated)', 'notes:Internal notes:x']),
    ] },
  { collection: 'leadforms', title: 'Lead Forms', singular: 'Lead form', description: 'Public forms that create leads automatically', titleKey: 'name', subtitleKey: 'slug', filter: 'status', cols: ['name', 'slug', 'source', 'submissions', 'status!', 'lastSubmissionAt#'], defaults: { status: 'Active', submitLabel: 'Submit', requiredFields: 'name,phone', collect: 'name,phone,email,message', source: 'Website' },
    sections: [
      sec('Form', ['name*:Internal name', 'slug*:URL slug', 'status*:Status:s:Active,Paused,Draft', 'source:Lead source:s:Website,Landing page,QR code,Social media,Event,Other', 'title:Public title', 'description:Public description:x', 'submitLabel:Submit button label', 'brandColor:Brand colour:c']),
      sec('Fields', ['collect*:Fields to collect (comma separated)', 'requiredFields:Required fields (comma separated)', 'namePlaceholder:Name placeholder', 'phonePlaceholder:Phone placeholder', 'messageLabel:Message label', 'consentText:Consent text', 'consentRequired:Require consent:b', 'captcha:Spam protection (honeypot):b']),
      sec('After submit', ['successMessage:Success message:x', 'redirectUrl:Redirect URL:u', 'assignTo:Assign new leads to', 'autoTag:Auto-tag leads', 'autoReply:Send WhatsApp auto-reply:b', 'autoReplyText:Auto-reply text:x', 'notifyEmail:Notify email:e', 'createFollowUp:Create follow-up task:b']),
      sec('Stats & tracking', ['submissions:Submissions:n', 'views:Page views:n', 'conversionRate:Conversion rate (%):n', 'lastSubmissionAt:Last submission:dt', ...UTM.slice(0, 3), 'notes:Internal notes:x']),
    ] },
  { collection: 'media', title: 'Media Library', singular: 'Media file', titleKey: 'name', filter: 'type', cols: ['name', 'type!', 'size', 'folder', 'createdAt@'], defaults: { status: 'Active' },
    sections: [
      sec('File', ['name*:File name', 'type:Type:s:image,video,audio,document', 'mime:MIME type', 'size:Size', 'folder:Folder', 'caption:Caption:x', 'altText:Alt text']),
      sec('Usage & organisation', ['tags:Tags (comma separated)', 'usedIn:Used in (templates / campaigns)', 'status:Status:s:Active,Archived', 'uploadedBy:Uploaded by', 'expiresAt:Expires on:d', 'source:Source:s:Upload,Link,Generated', 'externalUrl:External URL:u', 'licence:Licence / usage rights', 'description:Description:x']),
    ] },
  { collection: 'templates', title: 'Templates', singular: 'Template', description: 'WhatsApp message templates', titleKey: 'name', subtitleKey: 'category', filter: 'status', cols: ['name', 'category!', 'language', 'status!', 'updatedAt@'], defaults: { category: 'Utility', language: 'en', status: 'Draft', headerType: 'None' },
    sections: [
      sec('Template', ['name*:Template name (lowercase_with_underscores)', 'category*:Category:s:Utility,Marketing,Authentication', 'language*:Language code', 'status*:Status:s:Draft,Pending,Approved,Rejected,Paused', 'metaTemplateId:Meta template ID', 'rejectionReason:Rejection reason', 'description:Internal description:x']),
      sec('Header', ['headerType:Header type:s:None,Text,Image,Video,Document', 'headerText:Header text', 'headerMediaUrl:Header media URL:u', 'headerExample:Header example']),
      sec('Body', ['body*:Body (use {{1}}, {{2}} for variables):x', 'variableSamples:Variable samples (comma separated)', 'footer:Footer text']),
      sec('Buttons', ['button1Type:Button 1 type:s:None,Quick reply,URL,Phone', 'button1Text:Button 1 text', 'button1Value:Button 1 URL / phone', 'button2Type:Button 2 type:s:None,Quick reply,URL,Phone', 'button2Text:Button 2 text', 'button2Value:Button 2 URL / phone']),
      sec('Meta', ['allowCategoryChange:Allow category change:b', 'qualityScore:Quality score:s:,Green,Yellow,Red', 'sendCount:Times sent:n', 'tags:Tags (comma separated)', 'notes:Internal notes:x']),
    ] },
  { collection: 'waforms', title: 'WhatsApp Forms', singular: 'WhatsApp form', titleKey: 'name', filter: 'status', cols: ['name', 'screens', 'responses', 'status!', 'updatedAt@'], defaults: { status: 'Draft', screens: 1 },
    sections: [
      sec('Form', ['name*:Form name', 'status*:Status:s:Draft,Published,Deprecated', 'category:Category:s:Lead capture,Feedback,Booking,Order,Survey,Support,Other', 'metaFlowId:Meta Flow ID', 'screens:Number of screens:n', 'description:Description:x']),
      sec('Screens & questions', ['screen1Title:Screen 1 title', 'screen1Fields:Screen 1 fields (comma separated)', 'screen2Title:Screen 2 title', 'screen2Fields:Screen 2 fields (comma separated)', 'screen3Title:Screen 3 title', 'screen3Fields:Screen 3 fields (comma separated)', 'ctaLabel:Call-to-action label', 'footerText:Footer text']),
      sec('Behaviour', ['endpointUrl:Data endpoint URL:u', 'confirmationMessage:Confirmation message:x', 'createLead:Create lead from response:b', 'tagResponders:Tag responders', 'assignTo:Assign responses to', 'notifyEmail:Notify email:e']),
      sec('Results', ['responses:Responses:n', 'completionRate:Completion rate (%):n', 'avgCompletionSeconds:Avg completion time (s):n', 'lastResponseAt:Last response:dt', 'tags:Tags (comma separated)', 'notes:Internal notes:x']),
    ] },
  { collection: 'broadcasts', title: 'Broadcast Logs', singular: 'Broadcast', description: 'Send a template to many contacts and track delivery', titleKey: 'name', subtitleKey: 'template', filter: 'status', cols: ['name', 'template', 'audienceType', 'total', 'sent', 'failed', 'status!', 'at#'], defaults: { status: 'Draft', audienceType: 'All contacts' },
    sections: [
      sec('Broadcast', ['name*:Broadcast name', 'template*:Template name (approved)', 'status*:Status:s:Draft,Scheduled,Running,Completed,Failed,Cancelled', 'at:Scheduled / sent at:dt', 'objective:Objective:s:Promotion,Reminder,Announcement,Update,Feedback', 'owner:Owner', 'description:Description:x']),
      sec('Audience', ['audienceType*:Audience:s:All contacts,All leads,All customers,Tag,Custom list', 'audienceTag:Tag (when audience is Tag)', 'recipients:Custom list — one phone per line:x', 'excludeTag:Exclude tag', 'maxRecipients:Max recipients:n', 'onlyOptedIn:Only opted-in contacts:b', 'dedupe:Remove duplicates:b']),
      sec('Message', ['variables:Template variables, comma separated (use {{name}}, {{company}}, {{phone}})', 'language:Language', 'mediaUrl:Media URL:u', 'buttonUrl:Button URL:u', 'previewText:Preview text:x', 'testNumber:Test number:p']),
      sec('Delivery', ['total:Recipients:n', 'sent:Sent:n', 'delivered:Delivered:n', 'read:Read:n', 'failed:Failed:n', 'replied:Replied:n', 'optOuts:Opt-outs:n', 'lastError:Last error:x']),
      sec('Timing & cost', ['startedAt:Started at:dt', 'completedAt:Completed at:dt', 'ratePerMinute:Send rate (per minute):n', 'costInr:Estimated cost (₹):n', 'retryFailed:Retry failed sends:b', 'tags:Tags (comma separated)', 'notes:Internal notes:x']),
    ] },
  { collection: 'chatbot', title: 'Chatbot', singular: 'Rule', description: 'Keyword rules that reply automatically on WhatsApp', titleKey: 'trigger', subtitleKey: 'matchType', filter: 'status', cols: ['trigger', 'matchType', 'reply', 'status!', 'hits', 'priority'], defaults: { matchType: 'Contains', status: 'Active', priority: 5 },
    sections: [
      sec('Rule', ['name:Rule name', 'trigger*:Trigger keyword / phrase', 'matchType*:Match type:s:Exact,Contains,Starts with', 'status*:Status:s:Active,Inactive', 'priority:Priority (1 = first):n', 'caseSensitive:Case sensitive:b', 'description:Description:x']),
      sec('Reply', ['reply*:Reply message:x', 'replyType:Reply type:s:Text,Template,Media', 'templateName:Template name', 'mediaUrl:Media URL:u', 'buttons:Quick-reply buttons (comma separated)', 'typingDelay:Typing delay (seconds):n']),
      sec('Conditions', ['activeFrom:Active from:dt', 'activeTo:Active until:dt', 'businessHoursOnly:Business hours only:b', 'newContactsOnly:New contacts only:b', 'language:Language', 'channel:Channel:s:WhatsApp']),
      sec('Actions', ['addTag:Add tag to contact', 'assignTo:Assign conversation to', 'handoffToHuman:Hand off to human:b', 'createLead:Create lead:b', 'webhookUrl:Call webhook:u', 'stopProcessing:Stop other rules:b']),
      sec('Stats', ['hits:Times triggered:n', 'lastTriggeredAt:Last triggered:dt', 'successRate:Resolved without agent (%):n', 'tags:Tags (comma separated)', 'notes:Internal notes:x']),
    ] },
  { collection: 'faqs', title: 'FAQ Bot', singular: 'FAQ', description: 'Questions your AI & FAQ bot can answer', titleKey: 'question', subtitleKey: 'category', filter: 'category', cols: ['question', 'category', 'language', 'status!', 'hits'], defaults: { status: 'Active', language: 'English', category: 'General' },
    sections: [
      sec('FAQ', ['question*:Question', 'answer*:Answer:x', 'category:Category:s:General,Pricing,Account,Billing,Product,Shipping,Returns,Technical', 'language:Language', 'status*:Status:s:Active,Inactive,Draft', 'priority:Priority:n', 'audience:Audience:s:Everyone,Leads,Customers']),
      sec('Matching', ['keywords:Keywords (comma separated)', 'altQuestions:Alternative phrasings:x', 'confidenceThreshold:Minimum match score (%):n', 'exactMatchOnly:Exact match only:b', 'relatedFaqs:Related FAQs']),
      sec('Answer extras', ['linkUrl:Link to share:u', 'mediaUrl:Media to attach:u', 'followUpQuestion:Follow-up question', 'handoffIfUnresolved:Hand off if unresolved:b', 'sourceUrl:Source / reference URL:u']),
      sec('Review & stats', ['hits:Times used:n', 'helpfulCount:Marked helpful:n', 'unhelpfulCount:Marked unhelpful:n', 'lastReviewedAt:Last reviewed:d', 'reviewer:Reviewed by', 'notes:Internal notes:x']),
    ] },
]
