/* Proxies http(s) requests to any endpoint even if doesn't allow CORS */
import axios from 'axios'
import qs from 'qs'

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
    var response = await axios(targetUrl, { 
      method: event.httpMethod,
      headers: { ...event.headers }, 
      // API services may require host header so we probably need to supply it as well as Postman does
        //'Host' : new URL(targetUrl).host }, 
      params: event.queryStringParameters,
      data: event.body
    })
  } catch (error) {
    console.error(error)
    return {
      statusCode: 500, 
      body: JSON.stringify(error)
    }
  }

  return {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*"
    },
    body: JSON.stringify(response.data)
  }
}