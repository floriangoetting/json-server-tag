const getAllEventData = require('getAllEventData');
const getTimestampMillis = require('getTimestampMillis');
const JSON = require('JSON');
const Object = require('Object');
const logToConsole = require('logToConsole');
const makeInteger = require('makeInteger');
const makeTableMap = require('makeTableMap');
const parseUrl = require('parseUrl');
const sendHttpRequest = require('sendHttpRequest');
const toBase64 = require('toBase64');
const sendMessage = require('sendMessage');
const encodeUriComponent = require('encodeUriComponent');

const HTTP_ENDPOINT = data.endpoint;
const LOG_PREFIX = '[JSON Server Tag] ';
const timestamp = getTimestampMillis();
const eventData = getAllEventData();
const newEventProperties = data.newEventProperties && data.newEventProperties.length ? makeTableMap(data.newEventProperties, 'key', 'value') : {};
const customRequestHeaders = data.customRequestHeaders && data.customRequestHeaders.length ? makeTableMap(data.customRequestHeaders, 'key', 'value') : {};

const log = msg => {
  logToConsole(LOG_PREFIX + msg);
};

const mergeObj = (fromObj, toObj) => {
  for (let key in fromObj) {
    if (fromObj.hasOwnProperty(key)) {
      toObj[key] = fromObj[key];
    }
  }
  return toObj;
};

const getHeaders = () => {
  const headers = {};
  if (data.standardRequestHeaders && data.standardRequestHeaders.length) {
    data.standardRequestHeaders.forEach(p => {
      if(p.key === 'Authorization'){
        headers.Authorization = 'Basic ' + toBase64(p.value);
      } else {
        headers[p.key] = p.value;
      }
    });
  }
  return mergeObj(customRequestHeaders, headers);
};

const getEventProps = () => {
  // add all event data if checkbox is enabled
  if (data.addAllEventData) {
    return mergeObj(newEventProperties, eventData);
  }
  // map event properties if applicable
  const props = {};
  if (data.eventProps && data.eventProps.length) {
    data.eventProps.forEach(p => {
      if (eventData[p.key]) props[(p.mapKey || p.key)] = eventData[p.key];
    });
  }
  return mergeObj(newEventProperties, props);
};

if (!HTTP_ENDPOINT) {
  log('No HTTP Endpoint provided!');
  return data.gtmOnFailure();
}

const postBody = getEventProps();
if(data.sendTimestamp){
  postBody[data.timestampEventKey] = timestamp;
}

const headerObj = getHeaders();

const sendJSONClientResponse = (responseBody) => {
  if(data.sendResponse && data.responseKey){
    const responseObject = {};
    responseObject[data.responseKey] = responseBody;
    sendMessage('send_response', responseObject);
  }
};

const sendJSONClientMonitorEvent = (status, responseBody) => {
  const monitorKey = data.monitorKey;
  const monitorEventName = data.monitorEventName;
  const monitorFailure = data.monitorFailure;
  const monitorSuccess = data.monitorSuccess;
  const monitorFailureRequestPayload = data.monitorFailureRequestPayload;
  const monitorSuccessRequestPayload = data.monitorSuccessRequestPayload;
  const monitorFailureResponsePayload = data.monitorFailureResponsePayload;
  const monitorSuccessResponsePayload = data.monitorSuccessResponsePayload;

  // Early exit if essential monitoring configuration is missing
  if (!monitorKey || !monitorEventName) return false;

  const isFailure = status === 'failure';
  const isSuccess = status === 'success';

  // Define explicit monitoring flags for each case
  const shouldMonitorFailure = isFailure && monitorFailure;
  const shouldMonitorSuccess = isSuccess && monitorSuccess;

  // If neither success nor failure monitoring applies, exit early
  if (!shouldMonitorFailure && !shouldMonitorSuccess) return false;

  const monitorPayload = {
    service: monitorKey,
    status: status,
    request_url: HTTP_ENDPOINT
  };

  // Include request payload only if configured for this specific event type
  const shouldIncludeRequestPayload =
    (shouldMonitorFailure && monitorFailureRequestPayload) ||
    (shouldMonitorSuccess && monitorSuccessRequestPayload);

  if (shouldIncludeRequestPayload) {
    monitorPayload.request_payload = postBody;
  }

  // Include response payload only if configured for this specific event type
  const shouldIncludeResponsePayload =
    (shouldMonitorFailure && monitorFailureResponsePayload) ||
    (shouldMonitorSuccess && monitorSuccessResponsePayload);

  if (shouldIncludeResponsePayload) {
    if (typeof responseBody === 'object') {
      monitorPayload.response = responseBody;
    } else {
      // If the response is not an object (e.g., plain text or HTML), include it as text
      monitorPayload.response_text = responseBody;
    }
  }

  // Finally, send the monitoring message
  sendMessage(monitorEventName, monitorPayload);
};

const safeParseJSON = (body) => {
  if (typeof body === 'undefined' || body === null || body === '') return 'empty';
  
  // Primitive heuristics: check whether string begins with { or [ → then JSON
  if ((body.charAt(0) === '{' && body.charAt(body.length - 1) === '}') ||
      (body.charAt(0) === '[' && body.charAt(body.length - 1) === ']')) {
    return JSON.parse(body);
  }

  // otherwise simply return the text
  return body;
};

const requestMethod = (data.requestMethod || 'POST').toUpperCase();

let requestUrl = HTTP_ENDPOINT;
let requestOptions = {
  headers: headerObj,
  method: requestMethod
};

let requestBody;

// if the request method is GET we need to add query parameters
if (requestMethod === 'GET') {
  const queryString = Object.keys(postBody)
    .map(key => encodeUriComponent(key) + '=' + encodeUriComponent(postBody[key]))
    .join('&');

  if (queryString) {
    requestUrl += (requestUrl.indexOf('?') === -1 ? '?' : '&') + queryString;
  }

} else {
  // default case which sends event data as post body
  requestBody = JSON.stringify(postBody);
}

sendHttpRequest(
  requestUrl,
  requestOptions,
  requestBody
).then((result) => {
  //result received
  const responseBody = safeParseJSON(result.body);

  if (result.statusCode >= 400) {
    // response body received but not successful request
    sendJSONClientResponse(responseBody);
    sendJSONClientMonitorEvent('failure', responseBody);
    return data.gtmOnFailure();
  }

  // success case
  sendJSONClientResponse(responseBody);
  sendJSONClientMonitorEvent('success', responseBody);
  return data.gtmOnSuccess();

}, (rejectedValue) => {
  //catch rejections
  sendJSONClientMonitorEvent('failure', rejectedValue);
  return data.gtmOnFailure();
});