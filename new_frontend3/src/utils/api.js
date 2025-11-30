const baseURL = '/api'


const buildRequestOptions = (method, body, customHeaders = {}) => {
  const token = localStorage.getItem('token')
  const isFormData = body instanceof FormData
  const headers = {}
  
  
  for (const [key, value] of Object.entries(customHeaders)) {
    if (!(isFormData && key.toLowerCase() === 'content-type')) {
      headers[key] = value
    }
  }
  
  
  if (!isFormData && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  
  const options = {
    method: method,
    headers: headers
  }
  
  if (body) {
    if (isFormData) {
      options.body = body
    } else {
      options.body = JSON.stringify(body)
    }
  }
  
  return options
}


const handleResponse = async (response) => {
  if (response.status === 401) {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    location.href = '#/login'
    throw new Error('Unauthorized')
  }
  
  if (!response.ok) {
    const error = new Error(`HTTP error! status: ${response.status}`)
    error.response = {
      status: response.status,
      data: await response.json().catch(() => ({ message: 'Unknown error' }))
    }
    throw error
  }
  
  const contentType = response.headers.get('content-type')
  if (contentType && contentType.includes('application/json')) {
    const data = await response.json()
    return { data }
  }
  
  return { data: await response.text() }
}


const api = {
  get: async (url, config = {}) => {
    const fullUrl = baseURL + url
    const options = buildRequestOptions('GET', null, config.headers || {})
    const response = await fetch(fullUrl, options)
    return handleResponse(response)
  },
  
  post: async (url, data = null, config = {}) => {
    const fullUrl = baseURL + url
    const options = buildRequestOptions('POST', data, config.headers || {})
    const response = await fetch(fullUrl, options)
    return handleResponse(response)
  },
  
  put: async (url, data = null, config = {}) => {
    const fullUrl = baseURL + url
    const options = buildRequestOptions('PUT', data, config.headers || {})
    const response = await fetch(fullUrl, options)
    return handleResponse(response)
  },
  
  delete: async (url, config = {}) => {
    const fullUrl = baseURL + url
    const options = buildRequestOptions('DELETE', null, config.headers || {})
    const response = await fetch(fullUrl, options)
    return handleResponse(response)
  },
  
  patch: async (url, data = null, config = {}) => {
    const fullUrl = baseURL + url
    const options = buildRequestOptions('PATCH', data, config.headers || {})
    const response = await fetch(fullUrl, options)
    return handleResponse(response)
  }
}

export default api

