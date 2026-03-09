# JSON Server Tag Template

**Tag Template for server-side Google Tag Manager**

This is a Tag Template for Server Side Google Tag Manager. It can be used to send data to any HTTP Endpoint using POST or GET. The event data can be mapped and additional properties or headers can be added to the event data as well. It complements JSON Client and JSON Tag.

![Community Template Gallery Status](https://img.shields.io/badge/Community%20Template%20Gallery%20Status-pending-orange)

## Usage and Configuration Options
Typically, this tag is triggered by events coming from **JSON Client** (which receives the JSON payload sent from **JSON Tag** in client-side GTM). The **JSON Server Tag** takes data from Event Data, builds a request payload, and forwards it to any HTTP endpoint.

For details on how JSON Client monitoring and tag responses work, see the JSON Client README in `json-client/README.md`.

### Request Settings
#### HTTP Endpoint
The URL of the HTTP Endpoint.

#### Request Method
Please specify the Request Method to be used in the request.

Supported methods:
- **POST** (default): sends the payload as JSON in the request body.
- **GET**: converts the payload into query parameters and appends them to the URL.

### Header Settings
#### Standard Request Headers
This section contains commonly used headers that can be configured without using custom key/value pairs.

##### Content Type (POST only)
Select the Content-Type that is sent with POST requests.

Default: `application/json`

##### Accept Header
- **Add Accept Header**: Enables sending an `Accept` header.
- **Accept all Headers**: Sends `Accept: */*`.
- **Specific Accept Header(s)**: If "Accept all Headers" is disabled, you can add one or multiple accepted formats. They will be sent as a comma-separated list.

##### Basic Authentication Header
- **Add Basic Authentication Header**: Sends `Authorization: Basic <base64(username:password)>`.
- **Username** / **Password**: Enter raw credentials; the template will base64-encode `username:password` automatically.

#### Custom Request Headers
Use this table to add any additional headers you need (e.g. bearer tokens, custom API keys, etc.).

Notes:
- Custom headers override standard headers when the same header key is used.
- If you want to override the standard POST `Content-Type`, use the header key `Content-Type` (same casing).

### Event Data Settings
#### Add all Event Data
This checkbox let's you control if all event data should be added to the payload or not. If enabled, the mapping of specific event properties is disabled.

#### Map Event Properties
Map keys in the Event Data object to event properties you want to send to the HTTP Endpoint.

- If you don't specify an Event Property name, the event data key will be used instead.
- Only Event Data keys included in this table will be sent with the HTTP API request.
- This section is disabled when **Add all Event Data** is enabled.

#### Add Event Properties
Use this table to add completely new event properties to the hit sent to the HTTP Endpoint. Each property needs a key and a value.

### Payload Settings
#### Send Timestamp with Request
If this option is activated a timestamp in milliseconds is sent with the payload to the defined HTTP Endpoint.

#### Timestamp Event Key
The Key to be used in the payload to send the timestamp to the defined HTTP Endpoint.

Default: `timestamp`

### Response Settings
#### Send Response to JSON Client
If this option is enabled, the full response is sent to JSON Client and returned to the actual client which initiated the request.

#### Response Key
Key under which the response should be added via `sendMessage('send_response', ...)`.

Tip: Use a stable tag identifier here (for example `amplitude`, `adobe`, `custom_api`) so you can find the response easily in the JSON Client response.

### Monitoring Settings
This tag can send a monitoring message to JSON Client via `sendMessage(<monitor event name>, <monitor payload>)`.

The default monitor event name is `server_monitor` and the payload always contains:
- `service`: your configured **Monitor Key**
- `status`: `success` or `failure`
- `request_url`: the resolved request URL (including query parameters for GET)

Depending on your settings it can also include:
- `request_payload`
- `response` (when the response is JSON)
- `response_text` (when the response is not JSON)

#### Activate Failure Monitoring
If enabled, monitoring data is sent on failed requests (HTTP status code >= 400 and request rejections).

#### Failure Monitoring Settings
Choose whether to include the **request payload** and/or **response payload** in failure monitoring events.

#### Activate Success Monitoring
If enabled, monitoring data is sent on successful requests.

#### Success Monitoring Settings
Choose whether to include the **request payload** and/or **response payload** in success monitoring events.

#### General Monitoring Settings
Note: In the current template UI, these fields are only shown when both **Activate Failure Monitoring** and **Activate Success Monitoring** are enabled.

##### Monitor Event Name
You can customize the name of the monitor event here. The default event name is `server_monitor`.

##### Monitor Key
The key to be used to identify the tag in the monitoring event data which will be populated by the monitor event.

Tip: Use a stable tag identifier here (for example `amplitude`, `adobe`, `custom_api`) so you can find the response easily in the Monitor Event.

## Permissions
This template requires:
- Logging permission (debug)
- Read Event Data (`any`)
- Send HTTP requests (`any`)
- Use messages (`any`) for monitoring and responses