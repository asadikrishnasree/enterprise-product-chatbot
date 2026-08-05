# CRM Pro

## Product Overview

CRM Pro is TechCorp Solutions' customer relationship management platform for sales, account management, and customer success teams.

It helps employees manage leads, customer accounts, opportunities, sales pipelines, activities, and customer communications.

## Pricing Tiers

### Professional

- Price: $49 per user per month
- Minimum users: 10
- Lead and opportunity management
- Email and calendar synchronization
- Standard reports and dashboards
- REST API access
- Community support
- Data storage: 10 GB per organization

### Enterprise

- Price: $99 per user per month
- Minimum users: 25
- Includes all Professional features
- SAML 2.0 single sign-on
- Advanced role-based access control
- Custom workflows and approval rules
- Audit logging
- Sandbox environment
- Priority support
- Data storage: 100 GB per organization

## Integrations

CRM Pro supports the following integrations:

- Salesforce
- Microsoft Dynamics 365
- Microsoft Outlook
- Google Workspace
- Slack
- Microsoft Teams
- SAP ERP
- DocuSign
- Azure Active Directory

### Salesforce Integration

CRM Pro supports Salesforce integration through the TechCorp Salesforce Connector.

Requirements:

- Salesforce Enterprise Edition or Unlimited Edition
- Salesforce API version 58.0 or later
- CRM Pro version 4.0 or later
- Salesforce administrator access during setup

The integration supports:

- Account synchronization
- Contact synchronization
- Opportunity synchronization
- Configurable field mapping
- Scheduled synchronization every 15 minutes
- Manual synchronization on demand

## Authentication and Security

CRM Pro supports:

- SAML 2.0
- OAuth 2.0
- OpenID Connect
- Multi-factor authentication
- Role-based access control
- IP allowlists
- Audit logs

SAML 2.0 single sign-on is available only in the Enterprise tier.

## REST API

Base URL:

```text
https://api.techcorp.example.com/crm/v1

Authentication:

```text
Authorization: Bearer <access-token>
Authentication:

Authorization: Bearer <access-token>

Supported operations include:

- Retrieve accounts
- Create contacts
- Update opportunities
- Search leads
- Retrieve activity history
- Create custom objects

## API Rate Limits

### Professional Tier

- 1,000 requests per hour per organization

### Enterprise Tier

- 10,000 requests per hour per organization

When the rate limit is exceeded, the API returns:

HTTP 429 Too Many Requests

## Troubleshooting

### 403 Forbidden Error

A 403 response usually means the user or API client is authenticated but does not have permission to perform the requested action.

Check the following:

1. Confirm that the access token has not expired.
2. Verify that the user has permission for the requested CRM object.
3. Confirm that the OAuth application includes the required scopes.
4. Check whether the organization's IP allowlist blocks the request.
5. Verify that the API endpoint belongs to the correct CRM environment.
6. Review the audit log for denied authorization events.

### Salesforce Synchronization Failure

Check the following:

1. Confirm that the Salesforce connector is enabled.
2. Verify Salesforce API version 58.0 or later.
3. Confirm the Salesforce integration user is active.
4. Check whether the Salesforce API limit has been exceeded.
5. Review field mappings for deleted or renamed Salesforce fields.
6. Retry the synchronization from the CRM Pro administration console.

## Release Notes

### Version 4.2

Release date: March 18, 2026

New features:

- AI-assisted opportunity scoring
- Bulk contact import supporting up to 50,000 records
- Custom dashboard widgets
- Improved Salesforce field mapping
- Enhanced audit log filters
- New Microsoft Teams notifications

Performance improvements:

- Account search is up to 35% faster.
- Dashboard loading time is reduced by approximately 25%.
- Salesforce synchronization retries now use exponential backoff.

Bug fixes:

- Fixed duplicate contacts created during interrupted imports.
- Fixed incorrect timezone conversion in activity reports.
- Fixed an issue where some SAML users were logged out unexpectedly.

## Support

### Standard Support

Included with Professional:

- Business hours: Monday through Friday, 8:00 AM to 6:00 PM Central Time
- Email and community support
- Target response time: 8 business hours

### Priority Support

Included with Enterprise:

- 24 hours a day, 7 days a week
- Phone, email, and portal support
- Priority 1 target response time: 30 minutes
- Priority 2 target response time: 2 hours
- Priority 3 target response time: 8 business hours

A Priority 1 issue means the production service is unavailable or a critical business process is completely blocked with no workaround.

