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
    console.log('\n')
    console.log('Sending proxied request to', targetUrl, '\n')
    console.log('Request Params:', event.queryStringParameters, '\n')
    // Some servers require Host header to be origin of server, so does Postman
    //event.headers.host = new URL(targetUrl).host
    console.log('Request Headers:', event.headers, '\n')

    var response = await axios(targetUrl, { 
      method: event.httpMethod,
      headers: event.headers, 
      params: event.queryStringParameters,
      data: event.body,
      // prevents binary data to be corrupted, doesn't affect json or text data
      responseType: 'arraybuffer',
      httpsAgent: new https.Agent({  
        rejectUnauthorized: false
      })
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