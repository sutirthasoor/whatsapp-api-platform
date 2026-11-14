import { ADDRESS, LANGS, SOCIAL, sec, type Schema } from './schema-kit'

const TZ = 'Asia/Kolkata,Asia/Dubai,Asia/Singapore,Europe/London,Europe/Berlin,America/New_York,America/Los_Angeles,Australia/Sydney'
const NOTIF = (k: string, l: string) => [`notify${k}:${l}:b`]

/** Singleton documents — edited on a full page and saved with one button. */
export const DOCS: Record<string, Schema> = {
  settings: { collection: 'settings', title: 'Profile & Business', singular: 'Settings', description: 'Your details, company information, invoice defaults and notifications', cols: [],
    sections: [
      sec('Your profile', ['name*:Full name', 'email*:Contact email:e', 'phone:Phone:p', 'altPhone:Alternate phone:p', 'jobTitle:Job title', 'dob:Date of birth:d', 'timezone:Timezone:s:' + TZ, 'language:Language:s:' + LANGS, 'dateFormat:Date format:s:DD/MM/YYYY,MM/DD/YYYY,YYYY-MM-DD', 'avatarUrl:Avatar URL:u']),
      sec('Business', ['business*:Business name', 'legalName:Legal name', 'businessType:Business type:s:,Sole proprietor,Partnership,Pvt Ltd,LLP,Public Ltd,NGO,Other', 'industry:Industry', 'companySize:Team size:s:,1-10,11-50,51-200,201-1000,1000+', 'foundedYear:Founded year:n', 'businessEmail:Business email:e', 'businessPhone:Business phone:p', 'supportEmail:Support email:e', 'supportPhone:Support phone:p', 'about:About the business:x']),
      sec('Address', ['address:Registered address', ...ADDRESS, 'mapUrl:Google Maps link:u', 'workingHours:Working hours', 'workingDays:Working days']),
      sec('Tax & legal', ['gst:GSTIN', 'pan:PAN', 'cin:CIN', 'msme:MSME / Udyam number', 'tan:TAN', 'taxRegion:Tax region:s:India,UAE,UK,USA,EU,Other', 'defaultTaxPercent:Default tax (%):n', 'pricesIncludeTax:Prices include tax:b']),
      sec('Branding & social', ['logoUrl:Logo URL:u', 'brandColor:Brand colour:c', 'tagline:Tagline', 'signatureName:Signature name', ...SOCIAL]),
      sec('Invoicing defaults', ['currency:Currency:s:INR,USD,EUR,AED,GBP', 'invoicePrefix:Invoice prefix', 'quotationPrefix:Quotation prefix', 'nextInvoiceNumber:Next invoice number:n', 'defaultPaymentTerms:Default payment terms:s:Due on receipt,Net 7,Net 15,Net 30,Net 45', 'defaultTerms:Default terms & conditions:x', 'bankName:Bank name', 'bankAccount:Account number', 'bankIfsc:IFSC', 'upiId:UPI ID', 'invoiceFooter:Invoice footer:x']),
      sec('Notifications', [...NOTIF('New', 'New lead or conversation'), ...NOTIF('Assign', 'Chat assigned to me'), ...NOTIF('Payment', 'Payment received'), ...NOTIF('Digest', 'Daily email digest'), ...NOTIF('Followup', 'Follow-up due'), ...NOTIF('Meeting', 'Meeting reminders'), ...NOTIF('Ticket', 'Support ticket updates'), 'digestTime:Digest time', 'notifyEmailTo:Send notifications to:e', 'quietHours:Quiet hours (e.g. 22:00-07:00)']),
    ] },
  waapi: { collection: 'waapi', title: 'WhatsApp API', singular: 'WhatsApp API', description: 'Connect your WhatsApp Business Cloud API number', cols: [],
    sections: [
      sec('Credentials', ['phoneNumberId*:Phone number ID', 'wabaId:WhatsApp Business Account ID', 'token*:Permanent access token:pw', 'appId:Meta App ID', 'appSecret:Meta App Secret (verifies webhooks):pw', 'apiVersion:Graph API version', 'businessId:Meta Business ID']),
      sec('Webhook', ['verifyToken*:Verify token', 'webhookFields:Subscribed fields', 'autoRepliesPaused:Pause chatbot & AI auto-replies:b', 'markReadOnOpen:Mark messages read when opened:b', 'storeMedia:Download inbound media:b']),
      sec('Number profile', ['connected:Connected:b', 'phoneNumber:Display phone number', 'verifiedName:Verified business name', 'quality:Quality rating:s:Green,Yellow,Red', 'tier:Messaging tier', 'profileAbout:Profile about text', 'profileAddress:Profile address', 'profileDescription:Profile description:x', 'profileEmail:Profile email:e', 'profileWebsite:Profile website:u', 'profileVertical:Business category']),
      sec('Messaging defaults', ['defaultCountryCode:Default country code', 'defaultLanguage:Default template language', 'sessionWindowHours:Customer-service window (hours):n', 'throttlePerSecond:Max messages per second:n', 'retryFailed:Retry failed sends:b', 'maxRetries:Max retries:n', 'optInRequired:Require opt-in before marketing:b', 'footerText:Default footer text', 'optOutKeywords:Opt-out keywords (comma separated)', 'optInKeywords:Opt-in keywords (comma separated)']),
      sec('Status', ['lastError:Last error:x', 'verifiedAt:Last verified:dt', 'lastWebhookAt:Last webhook received:dt', 'messagesThisMonth:Messages this month:n', 'notes:Internal notes:x']),
    ] },
  aiconfig: { collection: 'aiconfig', title: 'AI Assistant', singular: 'AI configuration', description: 'Configure the assistant that answers your customers on WhatsApp', cols: [],
    sections: [
      sec('Assistant', ['name*:Assistant name', 'tone:Tone:s:Friendly,Professional,Concise,Playful,Formal', 'greeting:Greeting message:x', 'language:Reply language:s:Same as customer,' + LANGS, 'persona:Persona / role', 'signoff:Sign-off line', 'emoji:Use emojis:b', 'maxWords:Max reply length (words):n']),
      sec('Model', ['provider:Provider:s:Rules only,Anthropic,OpenAI', 'apiKey:API key:pw', 'modelId:Model ID', 'temperature:Temperature (0-1):n', 'maxTokens:Max output tokens:n', 'timeoutSeconds:Timeout (seconds):n', 'fallbackToRules:Fall back to FAQ matching on error:b']),
      sec('Knowledge', ['useFaqs:Use FAQ knowledge:b', 'useProducts:Use products & prices:b', 'useTemplates:Suggest templates:b', 'instructions:Extra instructions:x', 'forbiddenTopics:Topics to avoid', 'businessSummary:Business summary:x', 'policyUrl:Policy / terms URL:u', 'catalogUrl:Catalogue URL:u']),
      sec('Behaviour', ['autoReply:Auto-reply to new chats:b', 'handoff:Hand off to human when unsure:b', 'handoffMessage:Hand-off message:x', 'fallback:Fallback message (no hand-off):x', 'handoffKeywords:Hand-off keywords', 'businessHoursOnly:Only reply in business hours:b', 'afterHoursMessage:After-hours message:x', 'maxRepliesPerChat:Max auto-replies per chat:n', 'replyDelaySeconds:Reply delay (seconds):n']),
      sec('Safety & logging', ['collectLeadDetails:Ask for name & phone:b', 'createLeads:Create leads from chats:b', 'redactSensitive:Redact card / Aadhaar numbers:b', 'logConversations:Log AI conversations:b', 'blockedWords:Blocked words', 'reviewMode:Draft only (agent approves):b', 'notes:Internal notes:x']),
    ] },
  siteTheme: { collection: 'siteTheme', title: 'Main Site · Theming', singular: 'Theme', description: 'Brand, colours and hero content of the public website', cols: [],
    sections: [
      sec('Brand', ['brand*:Brand name', 'tagline:Tagline', 'logoUrl:Logo URL:u', 'faviconUrl:Favicon URL:u', 'font:Font:s:Inter,Poppins,DM Sans,Georgia,Roboto', 'headingFont:Heading font:s:Inter,Poppins,DM Sans,Georgia,Roboto', 'primary:Primary colour:c', 'accent:Accent colour:c', 'background:Background colour:c', 'textColor:Text colour:c']),
      sec('Hero', ['headline:Hero headline', 'sub:Hero sub-text:x', 'cta:Primary button label', 'ctaUrl:Primary button URL:u', 'secondaryCta:Secondary button label', 'secondaryCtaUrl:Secondary button URL:u', 'heroImageUrl:Hero image URL:u', 'heroVideoUrl:Hero video URL:u', 'announcement:Announcement bar text']),
      sec('Style', ['radius:Corner radius (px):n', 'darkDefault:Dark mode by default:b', 'buttonStyle:Button style:s:Solid,Outline,Gradient', 'cardStyle:Card style:s:Flat,Elevated,Bordered', 'spacing:Density:s:Compact,Comfortable,Spacious', 'animations:Enable animations:b', 'customCss:Custom CSS:x']),
      sec('Sections', ['showFeatures:Show features:b', 'showPricing:Show pricing:b', 'showTestimonials:Show testimonials:b', 'showFaq:Show FAQ:b', 'showContact:Show contact form:b', 'showBlog:Show blog:b', 'footerText:Footer text', 'copyright:Copyright line']),
      sec('SEO & contact', ['metaTitle:Meta title', 'metaDescription:Meta description:x', 'ogImageUrl:Social share image URL:u', 'canonicalUrl:Canonical URL:u', 'contactEmail:Contact email:e', 'contactPhone:Contact phone:p', 'address:Address', 'googleAnalyticsId:Google Analytics ID', 'metaPixelId:Meta Pixel ID']),
    ] },
}
