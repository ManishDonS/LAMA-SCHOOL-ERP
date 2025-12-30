# Traccar GPS Integration Setup

This document explains how to configure Traccar GPS tracking integration with the Transport Service.

## Prerequisites

1. Access to a Traccar GPS tracking server (e.g., https://system.geotrack.com.np)
2. Valid Traccar user credentials (email/username and password)

## Configuration

### Option 1: Environment Variables (Recommended for Production)

Update your `.env` file with your actual Traccar credentials:

```bash
# Traccar Configuration
TRACCAR_API_URL=https://system.geotrack.com.np/api
TRACCAR_USER=your-email@example.com
TRACCAR_PASSWORD=your-actual-password
```

### Option 2: Database Settings (Runtime Configuration)

You can also configure Traccar credentials via the Settings API:

```bash
curl -X PUT http://localhost:3009/api/v1/transport/settings \
  -H "Content-Type: application/json" \
  -d '{
    "traccar_url": "https://system.geotrack.com.np/api",
    "traccar_username": "your-email@example.com",
    "traccar_password": "your-actual-password"
  }'
```

## Testing Configuration

### Validate Credentials

Test if your Traccar credentials are correctly configured:

```bash
curl http://localhost:3009/api/v1/transport/validate-traccar
```

**Success Response:**
```json
{
  "valid": true,
  "message": "Traccar credentials are valid"
}
```

**Error Response:**
```json
{
  "valid": false,
  "error": "invalid credentials - authentication failed"
}
```

### Get Authentication Token

Once configured, you can get an authentication token:

```bash
curl http://localhost:3009/api/v1/transport/traccar/token
```

## Common Issues

### 1. Invalid Credentials Error

**Error Message:**
```
INVALID_CREDENTIALS: Please update Traccar credentials in settings or environment variables
```

**Solution:**
- Check that `TRACCAR_USER` and `TRACCAR_PASSWORD` are set correctly
- Ensure you're not using default values like "admin" or "change-in-production"
- Verify credentials by logging into Traccar web interface

### 2. Connection Failed

**Error Message:**
```
connection failed: dial tcp: lookup system.geotrack.com.np...
```

**Solution:**
- Verify the Traccar server URL is accessible
- Check network connectivity
- Ensure the service can resolve DNS

### 3. Authentication Failed (401)

**Error Message:**
```
invalid credentials - authentication failed
```

**Solution:**
- Double-check username/email and password
- Verify the account exists in Traccar
- Try logging in via Traccar web interface to confirm credentials

## Authentication Methods

The service attempts multiple authentication strategies:

1. **Standard Traccar Auth** (GET /api/session with Basic Auth)
2. **Session-based Auth** (POST /api/session with form data)
3. **Alternative URL Format** (for different Traccar configurations)

The first successful method is used for subsequent API calls.

## API Endpoints

### Get Traccar Token
- **Endpoint:** `GET /api/v1/transport/traccar/token`
- **Description:** Authenticates with Traccar and returns an auth token
- **Response:** JSON with authentication token or error message

### Validate Credentials
- **Endpoint:** `GET /api/v1/transport/validate-traccar`
- **Description:** Tests if Traccar credentials are valid
- **Response:** JSON with validation status

### Proxy Traccar Requests
- **Endpoint:** `ALL /api/v1/transport/traccar/*`
- **Description:** Proxies requests to Traccar API with authentication
- **Example:** `GET /api/v1/transport/traccar/devices` → `GET https://system.geotrack.com.np/api/devices`

## Security Notes

- Never commit actual credentials to version control
- Use environment variables or encrypted secrets for production
- Rotate credentials regularly
- Use HTTPS for all Traccar API communications
- Restrict Traccar API access to necessary IP addresses only

## Support

For issues related to:
- Traccar server access: Contact your Traccar administrator or GeoTrack support
- Integration setup: Check service logs with `docker logs school-erp-transport`
- API errors: Review error messages and consult this documentation
