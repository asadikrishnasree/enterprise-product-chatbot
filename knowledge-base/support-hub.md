# Support Hub

## Product Overview

Support Hub is TechCorp Solutions' customer service and case management platform.

It helps support teams manage customer tickets, service requests, knowledge articles, escalations, and SLA tracking from a centralized workspace.

## Pricing Tiers

### Professional

- Price: $59 per agent per month
- Minimum agents: 10
- Ticket and case management
- Email-to-case
- Standard knowledge base
- Basic SLA management
- REST API access
- Community support
- Up to 50,000 active tickets per organization

### Enterprise

- Price: $119 per agent per month
- Minimum agents: 25
- Includes all Professional features
- SAML 2.0 single sign-on
- Advanced SLA policies
- Custom escalation workflows
- Audit logging
- Sandbox environment
- Priority support
- Unlimited active tickets

## Integrations

Support Hub supports:

- Salesforce
- CRM Pro
- Slack
- Microsoft Teams
- Jira
- ServiceNow
- Microsoft Outlook
- Google Workspace
- Azure Active Directory

## Salesforce Integration

Support Hub integrates with Salesforce using the TechCorp Salesforce Support Connector.

Requirements:

- Salesforce Enterprise Edition or Unlimited Edition
- Salesforce API version 58.0 or later
- Support Hub version 3.5 or later
- Salesforce administrator access during initial configuration

Supported capabilities:

- Customer account synchronization
- Contact synchronization
- Case synchronization
- Case status updates
- Configurable field mapping
- Customer activity history

## Authentication and Security

Support Hub supports:

- SAML 2.0
- OAuth 2.0
- OpenID Connect
- Multi-factor authentication
- Role-based access control
- IP allowlists
- Audit logging

SAML 2.0 and advanced audit logging are available in the Enterprise tier.

## REST API

Base URL:

```text
https://api.techcorp.example.com/support/v1

Authentication:

```text
Authorization: Bearer <access-token>
Authentication:

Authorization: Bearer <access-token>

Supported operations include:

- Create tickets
- Retrieve tickets
- Update ticket status
- Add ticket comments
- Search knowledge articles
- Retrieve SLA information
- Manage customer contacts

## API Rate Limits

### Professional Tier

- 1,500 requests per hour per organization

### Enterprise Tier

- 15,000 requests per hour per organization

When the rate limit is exceeded, the API returns:

HTTP 429 Too Many Requests

## Troubleshooting

### 403 Forbidden Error

A 403 response indicates that the authenticated user or API client does not have permission to perform the requested operation.

Check the following:

1. Verify that the access token is valid.
2. Confirm that the user has permission to access the requested ticket or knowledge article.
3. Verify that the OAuth application contains the required scopes.
4. Check whether an IP allowlist is blocking the request.
5. Confirm that the API request is targeting the correct Support Hub environment.
6. Review audit logs for authorization failures.

### Email-to-Case Not Creating Tickets

Check the following:

1. Confirm that the support mailbox is active.
2. Verify that email forwarding is configured correctly.
3. Confirm that the sender is not blocked.
4. Check email processing logs.
5. Verify that the organization has not exceeded its ticket limit.
6. Confirm that required ticket fields have default values.

## SLA Policies

### Priority 1 — Critical

Production service is unavailable or a critical customer business process is completely blocked with no workaround.

Enterprise target:

- Initial response: 30 minutes
- Status updates: Every 60 minutes
- Support availability: 24/7

### Priority 2 — High

A major product capability is unavailable, but a workaround exists.

Enterprise target:

- Initial response: 2 hours
- Status updates: Every 4 hours

### Priority 3 — Normal

A non-critical feature is impaired or the customer requires technical assistance.

Enterprise target:

- Initial response: 8 business hours

## Release Notes

### Version 3.8

Release date: May 12, 2026

New features:

- AI-assisted ticket classification
- Automatic ticket summarization
- Microsoft Teams ticket notifications
- Advanced SLA dashboard
- Improved Salesforce case synchronization
- Bulk ticket reassignment

Performance improvements:

- Ticket search is up to 30% faster.
- Large knowledge-base searches use less memory.
- Case synchronization retries now use exponential backoff.

Bug fixes:

- Fixed duplicate tickets created from retried emails.
- Fixed incorrect SLA timers after ticket reassignment.
- Fixed missing attachments on some Salesforce-synchronized cases.
- Fixed timezone errors in SLA reports.

## Support

### Standard Support

Included with Professional:

- Monday through Friday, 8:00 AM to 6:00 PM Central Time
- Email and community support
- Target response time: 8 business hours

### Priority Support

Included with Enterprise:

- 24 hours a day, 7 days a week
- Phone, email, and portal support
- Priority 1 target response time: 30 minutes
- Priority 2 target response time: 2 hours
- Priority 3 target response time: 8 business hours

