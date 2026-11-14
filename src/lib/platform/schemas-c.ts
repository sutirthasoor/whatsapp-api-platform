import { sec, type Schema } from './schema-kit'

const PARTY = (p: string) => [`${p}*:Customer name`, `customerCompany:Company`, `customerPhone:Phone:p`, `customerEmail:Email:e`, `customerGstin:Customer GSTIN`, `customerAddress:Billing address:x`, `shippingAddress:Shipping address:x`, `placeOfSupply:Place of supply`]
const DOCCOMMON = ['lineItems:Line items:ln', 'discountPercent:Discount (%):n', 'discountAmount:Flat discount (₹):n', 'shipping:Shipping / other charges (₹):n', 'currency:Currency:s:INR,USD,EUR,AED', 'amount:Subtotal (₹):n', 'taxAmount:Tax (₹):n', 'total:Grand total (₹):n']

export const SCHEMAS_C: Schema[] = [
  { collection: 'products', title: 'Products & Services', singular: 'Product', titleKey: 'name', subtitleKey: 'sku', filter: 'type', cols: ['name', 'type!', 'sku', 'category', 'price$', 'tax', 'stock', 'status!'], defaults: { type: 'Product', status: 'Active', tax: 18, unit: 'Nos', currency: 'INR' },
    sections: [
      sec('Basics', ['name*:Name', 'type*:Type:s:Product,Service,Subscription,Bundle', 'sku:SKU', 'barcode:Barcode / EAN', 'category:Category', 'brand:Brand', 'status*:Status:s:Active,Inactive,Draft,Discontinued', 'unit:Unit:s:Nos,Kg,Litre,Hour,Day,Month,Pack,Metre', 'description:Description:x']),
      sec('Pricing', ['price*:Selling price (₹):n', 'mrp:MRP (₹):n', 'costPrice:Cost price (₹):n', 'currency:Currency:s:INR,USD,EUR,AED', 'tax:GST / tax (%):n', 'hsn:HSN / SAC code', 'taxInclusive:Price includes tax:b', 'discountPercent:Default discount (%):n', 'minPrice:Minimum price (₹):n', 'wholesalePrice:Wholesale price (₹):n']),
      sec('Inventory', ['stock:Stock on hand:n', 'lowStockAlert:Low-stock alert at:n', 'reorderQty:Reorder quantity:n', 'warehouse:Warehouse / location', 'trackInventory:Track inventory:b', 'allowBackorder:Allow backorder:b', 'weightKg:Weight (kg):n', 'dimensions:Dimensions (L×W×H)']),
      sec('Catalogue & WhatsApp', ['imageUrl:Image URL:u', 'productUrl:Product page URL:u', 'whatsappCatalog:Show in WhatsApp catalogue:b', 'catalogId:Catalogue / retailer ID', 'featured:Featured:b', 'tags:Tags (comma separated)', 'seoKeywords:Keywords (for AI answers)', 'warranty:Warranty']),
      sec('Subscription & supplier', ['billingCycle:Billing cycle:s:One-time,Monthly,Quarterly,Yearly', 'trialDays:Trial days:n', 'setupFee:Setup fee (₹):n', 'supplier:Supplier', 'supplierSku:Supplier SKU', 'leadTimeDays:Lead time (days):n', 'notes:Internal notes:x', 'internalRef:Internal reference']),
    ] },
  { collection: 'quotations', title: 'Quotations', singular: 'Quotation', titleKey: 'number', subtitleKey: 'customer', filter: 'status', cols: ['number', 'customer', 'validTill@', 'total$', 'status!', 'createdAt@'], defaults: { status: 'Draft', currency: 'INR', lineItems: [{ desc: '', qty: 1, rate: 0, tax: 18 }] },
    sections: [
      sec('Quotation', ['number:Quotation number (auto)', 'status*:Status:s:Draft,Sent,Accepted,Rejected,Expired', 'issueDate:Issue date:d', 'validTill*:Valid until:d', 'reference:Reference / PO number', 'subject:Subject', 'salesperson:Salesperson', 'dealId:Linked deal ID']),
      sec('Customer', PARTY('customer')),
      sec('Line items & totals', DOCCOMMON),
      sec('Terms', ['paymentTerms:Payment terms:s:Due on receipt,Net 7,Net 15,Net 30,Net 45,Net 60', 'deliveryTerms:Delivery terms', 'deliveryDate:Expected delivery:d', 'warranty:Warranty', 'terms:Terms & conditions:x', 'notesToCustomer:Notes to customer:x', 'bankDetails:Bank details to print:x']),
      sec('Tracking', ['sentAt:Sent at:dt', 'sentVia:Sent via:s:,WhatsApp,Email,Print', 'viewedAt:First viewed:dt', 'acceptedAt:Accepted at:dt', 'rejectedReason:Rejection reason', 'convertedInvoice:Converted to invoice', 'revision:Revision number:n', 'tags:Tags (comma separated)', 'internalNotes:Internal notes:x']),
    ] },
  { collection: 'invoices', title: 'Invoices', singular: 'Invoice', titleKey: 'number', subtitleKey: 'customer', filter: 'status', cols: ['number', 'customer', 'issued@', 'due@', 'total$', 'paid$', 'status!'], defaults: { status: 'Unpaid', currency: 'INR', paid: 0, lineItems: [{ desc: '', qty: 1, rate: 0, tax: 18 }] },
    sections: [
      sec('Invoice', ['number:Invoice number (auto)', 'status*:Status:s:Draft,Unpaid,Partial,Paid,Overdue,Cancelled', 'issued*:Issue date:d', 'due*:Due date:d', 'poNumber:PO / reference number', 'subject:Subject', 'salesperson:Salesperson', 'quotationNo:From quotation', 'recurring:Recurring invoice:b']),
      sec('Customer', PARTY('customer')),
      sec('Line items & totals', DOCCOMMON),
      sec('Payment', ['paid:Amount paid (₹):n', 'paymentMethod:Payment method:s:,UPI,Card,Net Banking,Bank transfer,Cash,Cheque,Wallet', 'paymentRef:Payment reference', 'paidOn:Paid on:d', 'paymentLink:Payment link:u', 'lateFeePercent:Late fee (% per month):n', 'tdsPercent:TDS (%):n', 'paymentTerms:Payment terms:s:Due on receipt,Net 7,Net 15,Net 30,Net 45,Net 60']),
      sec('Terms & delivery', ['terms:Terms & conditions:x', 'notesToCustomer:Notes to customer:x', 'bankDetails:Bank details to print:x', 'eInvoiceIrn:e-Invoice IRN', 'ewayBill:E-way bill number', 'dispatchDate:Dispatch date:d']),
      sec('Tracking', ['sentAt:Sent at:dt', 'sentVia:Sent via:s:,WhatsApp,Email,Print', 'lastReminderAt:Last reminder:dt', 'remindersSent:Reminders sent:n', 'cancelledReason:Cancellation reason', 'tags:Tags (comma separated)', 'internalNotes:Internal notes:x']),
    ] },
  { collection: 'reminders', title: 'Payment Reminders', singular: 'Reminder', titleKey: 'invoice', subtitleKey: 'customer', filter: 'status', cols: ['invoice', 'customer', 'channel', 'sendOn#', 'status!', 'sentAt#'], defaults: { channel: 'WhatsApp', status: 'Scheduled', message: 'Hi {{name}}, a gentle reminder that your invoice is pending. Please complete the payment at your earliest convenience.' },
    sections: [
      sec('Reminder', ['invoice*:Invoice number', 'customer*:Customer name', 'customerPhone*:WhatsApp number:p', 'customerEmail:Email:e', 'channel:Channel:s:WhatsApp,Email,SMS', 'status*:Status:s:Scheduled,Sent,Failed,Cancelled', 'sendOn*:Send on:dt', 'reminderType:Type:s:Before due,On due date,After due,Final notice']),
      sec('Message', ['message*:Message:x', 'templateName:Template (optional)', 'includePaymentLink:Include payment link:b', 'paymentLink:Payment link:u', 'attachInvoice:Attach invoice PDF link:b', 'tone:Tone:s:Friendly,Neutral,Firm']),
      sec('Invoice context', ['amountDue:Amount due (₹):n', 'dueDate:Due date:d', 'daysOverdue:Days overdue:n', 'currency:Currency:s:INR,USD,EUR,AED', 'invoiceUrl:Invoice URL:u']),
      sec('Repeat & result', ['repeat:Repeat:s:No,Daily,Every 3 days,Weekly', 'repeatCount:Max repeats:n', 'sentAt:Sent at:dt', 'error:Delivery error', 'readAt:Read at:dt', 'repliedAt:Replied at:dt', 'createdBy:Created by', 'notes:Internal notes:x', 'internalRef:Internal reference']),
    ] },
  { collection: 'team', title: 'Team', singular: 'Team member', description: 'People who can sign in to your workspace', titleKey: 'name', subtitleKey: 'email', filter: 'teamRole', cols: ['name', 'email', 'teamRole!', 'department', 'status!', 'lastLogin#'], defaults: { teamRole: 'Agent', status: 'Active' },
    sections: [
      sec('Sign-in', ['name*:Full name', 'email*:Email (login):e', 'password:Password (min 8 characters; leave blank to keep):pw', 'teamRole*:Role:s:Admin,Agent,Viewer', 'status*:Status:s:Active,Invited,Suspended']),
      sec('Profile', ['phone:Phone:p', 'jobTitle:Job title', 'department:Department', 'employeeId:Employee ID', 'reportsTo:Reports to', 'joiningDate:Joining date:d', 'workLocation:Work location', 'language:Language']),
      sec('Work settings', ['maxOpenChats:Max open chats:n', 'workingHours:Working hours', 'timezone:Timezone', 'canExport:Can export data:b', 'canBroadcast:Can send broadcasts:b', 'canSeeBilling:Can see billing:b', 'autoAssign:Include in auto-assignment:b', 'signature:Message signature:x', 'notes:Internal notes:x']),
    ] },
  { collection: 'apikeys', title: 'API Keys', singular: 'API key', titleKey: 'name', filter: 'status', cols: ['name', 'key', 'scopes', 'status!', 'lastUsed#', 'created@'], defaults: { status: 'Active', scopes: 'read,write' },
    sections: [
      sec('Key', ['name*:Key name', 'status*:Status:s:Active,Revoked', 'scopes:Scopes:s:read,write,read+write', 'environment:Environment:s:Production,Staging,Development', 'description:Description:x', 'owner:Owner']),
      sec('Restrictions', ['ipAllowlist:Allowed IPs (comma separated)', 'allowedOrigins:Allowed origins', 'rateLimitPerMinute:Rate limit (per minute):n', 'expiresAt:Expires on:d', 'webhookUrl:Event webhook URL:u']),
      sec('Usage', ['key:Key (generated)', 'created:Created:dt', 'lastUsed:Last used:dt', 'usageCount:Total requests:n', 'lastIp:Last used from (IP)', 'integration:Integration name', 'notes:Internal notes:x', 'tags:Tags (comma separated)', 'rotatedAt:Last rotated:dt']),
    ] },
  { collection: 'tickets', title: 'Help & Support', singular: 'Ticket', titleKey: 'subject', subtitleKey: 'user', filter: 'status', cols: ['subject', 'user', 'category', 'priority!', 'status!', 'assignee', 'created#'], defaults: { category: 'Technical', priority: 'Medium', status: 'Open', assignee: 'Unassigned' },
    sections: [
      sec('Ticket', ['subject*:Subject', 'category:Category:s:Technical,Billing,Templates,Sales,Account,Feature request,Other', 'priority:Priority:s:Low,Medium,High,Urgent', 'status:Status:s:Open,In progress,Waiting on customer,Resolved,Closed', 'description*:Describe the problem:x']),
      sec('Environment', ['product:Product area:s:Inbox,Broadcasts,Templates,WhatsApp API,Billing,Automation,AI Assistant,Other', 'pageUrl:Page URL where it happened:u', 'browser:Browser / device', 'errorMessage:Error message shown:x', 'stepsToReproduce:Steps to reproduce:x', 'expectedResult:Expected result', 'actualResult:Actual result', 'impact:Impact:s:Just me,My team,All customers,Revenue blocked']),
      sec('Contact', ['contactPhone:Preferred phone:p', 'contactEmail:Preferred email:e', 'preferredChannel:Preferred channel:s:Email,WhatsApp,Call', 'bestTime:Best time to reach', 'language:Language', 'attachmentUrl:Attachment link:u']),
      sec('Handling (staff)', ['assignee:Assignee', 'slaDueAt:SLA due:dt', 'firstResponseAt:First response:dt', 'resolvedAt:Resolved at:dt', 'resolution:Resolution notes:x', 'csat:Customer satisfaction (1-5):n', 'reopenedCount:Times reopened:n', 'tags:Tags (comma separated)', 'internalNotes:Internal notes:x']),
    ] },
]
