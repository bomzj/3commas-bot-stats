/* Proxies http(s) requests to any endpoint even if doesn't allow CORS */
import axios from 'axios'
import qs from 'qs'
import https from 'https'
import http from 'http'
import fetch from 'node-fetch'

// Serialize query params that represents object with props
axios.defaults.paramsSerializer = params => qs.stringify(params)

export async function handler (event, context) {
  // Handle CORS preflight request
  if (event.httpMethod == 'OPTIONS') return { 
	  statusCode: 200, 
	  headers: {
      "Access-Control-Allow-Origin": "*",
	    "Access-Control-Allow-Headers": "*"
	  }
  }

  // Extract target URL from request URL
  let targetUrlStartIndex = event.path.indexOf('http://', 1)
  if (targetUrlStartIndex == -1) { 
    targetUrlStartIndex = event.path.indexOf('https://', 1)
  }
  
  if (targetUrlStartIndex == -1) {
    const noTargetError = "Target URL not found. Ensure CORS proxy request URL has the following format: " + 
                          "protocol://host/path-to-cors-proxy-function/target-url"
    console.log(noTargetError)
    
    return {
      statusCode: 400,
      headers: {
        "Access-Control-Allow-Origin": "*"
      },
      body: noTargetError
    }
  }

  const targetUrl = event.path.substring(targetUrlStartIndex)
  
  try {
    console.log('\n')
    console.log('Sending proxied request to', targetUrl, '\n')
    console.log('Request Params:', event.queryStringParameters, '\n')
    console.log('Request Headers:', event.headers, '\n')

    // Remove Host header that can cause failure in HTTPS handshake
    delete event.headers.host

    var response = await axios(targetUrl, { 
      method: event.httpMethod,
      headers: event.headers,
      // Workaround for 3commas requires correct order of query string parameters, but 
      // Netlify functions is running old Node runtime that changes order 
      // of query string parameters.
      // Sure, Netlify will update runtime so we can use event.queryStringParameters again.
      params: Object.fromEntries(new URLSearchParams(event.rawQuery)),
      data: event.body,
      // prevents binary data to be corrupted, doesn't affect json or text data
      responseType: 'arraybuffer',
    })
  } catch (error) {
    console.log(error.toString())
    
    return {
      statusCode: error.response?.status || 500, 
      body: error.toString()
    }
  }
  
  let data = response.data?.toString('Base64')
  
  console.info('Sending the response back to the client\n')                                       
  console.log('Response Headers', response.headers, '\n')
  
  return {
    statusCode: response.status,
    headers: {
      ...response.headers,
      "Access-Control-Allow-Origin": "*"
    },
    body: data,
    isBase64Encoded: true
  }
}