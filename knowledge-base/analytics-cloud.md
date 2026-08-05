# Analytics Cloud

## Product Overview

Analytics Cloud is TechCorp Solutions' cloud-based business intelligence and reporting platform.

It helps teams build dashboards, analyze operational data, schedule reports, and share insights across departments.

## Pricing Tiers

### Professional

- Price: $75 per user per month
- Minimum users: 10
- Standard dashboards
- Scheduled reports
- CSV and Excel exports
- Data refresh every 4 hours
- Up to 5 data sources
- Community support

### Enterprise

- Price: $150 per user per month
- Minimum users: 25
- Includes all Professional features
- Real-time dashboards
- Unlimited data sources
- SAML 2.0 single sign-on
- Row-level security
- Audit logs
- Private network connectivity
- Priority support

## Data Sources

Analytics Cloud supports:

- Oracle Database
- PostgreSQL
- Microsoft SQL Server
- MySQL
- Salesforce
- Google BigQuery
- Amazon Redshift
- Snowflake
- REST APIs
- CSV files
- Excel files

## Salesforce Integration

Requirements:

- Salesforce Enterprise Edition or Unlimited Edition
- Salesforce API version 58.0 or later
- Analytics Cloud version 4.0 or later
- Salesforce administrator access during initial setup

Supported capabilities:

- Account and opportunity analytics
- Pipeline dashboards
- Scheduled data synchronization
- Custom object import
- Incremental refresh
- Field mapping

## Authentication and Security

Analytics Cloud supports:

- SAML 2.0
- OAuth 2.0
- OpenID Connect
- Multi-factor authentication
- Role-based access control
- Row-level security
- IP allowlists
- Audit logs

SAML 2.0 and row-level security are available only in the Enterprise tier.

## REST API

Base URL:

```text
https://api.techcorp.example.com/analytics/v1

Authentication:

```text
Authorization: Bearer <access-token>
Authentication:

Authorization: Bearer <access-token>

Supported operations include:

- Create datasets
- Refresh datasets
- Retrieve dashboards
- Export reports
- Manage scheduled jobs
- Retrieve usage statistics

## API Rate Limits

### Professional Tier

- 2,000 requests per hour per organization

### Enterprise Tier

- 20,000 requests per hour per organization

When the rate limit is exceeded, the API returns:

HTTP 429 Too Many Requests

## Troubleshooting

### Dashboard Shows Stale Data

Check the following:

1. Confirm the dataset refresh completed successfully.
2. Verify the data source credentials are still valid.
3. Check whether the refresh schedule is enabled.
4. Confirm that the source database is reachable.
5. Review the refresh job logs for timeout or authentication errors.
6. Run a manual refresh to verify connectivity.

### 403 Forbidden Error

Check the following:

1. Verify the user has access to the dashboard or dataset.
2. Confirm the OAuth token includes the required scopes.
3. Check row-level security rules.
4. Confirm the request comes from an allowed IP address.
5. Review audit logs for denied access.
6. Verify the request is targeting the correct organization.

## Release Notes

### Version 4.2

Release date: April 8, 2026

New features:

- Natural-language dashboard search
- Real-time streaming datasets
- Custom KPI alerts
- Enhanced Salesforce pipeline templates
- New Oracle Database connector
- Scheduled report delivery to Microsoft Teams

Performance improvements:

- Dashboard rendering is up to 40% faster.
- Large dataset refreshes use less memory.
- Query caching reduces repeated database requests.

Bug fixes:

- Fixed incorrect totals in grouped reports.
- Fixed missing labels in exported PDF reports.
- Fixed intermittent Salesforce refresh failures.
- Fixed timezone issues in scheduled report delivery.

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

A Priority 1 issue means dashboards, reporting, or critical analytics capabilities are unavailable in production with no workaround.

