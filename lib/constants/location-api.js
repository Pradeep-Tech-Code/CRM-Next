// app/utils/location-api.js
const API_BASE_URL = 'https://csc.sidsworld.co.in/api'

// Helper function to handle API responses
async function handleApiResponse(url) {
  try {
    console.log('Fetching from:', url)
    const response = await fetch(url)
    
    if (!response.ok) {
      console.warn(`HTTP error! status: ${response.status} for URL: ${url}`)
      return null
    }
    
    // Check if response is JSON
    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      console.warn(`API returned non-JSON response from ${url}`)
      return null
    }
    
    const data = await response.json()
    console.log('API response received for:', url)
    return data
  } catch (error) {
    console.error(`API call failed for ${url}:`, error)
    return null
  }
}

export async function fetchCountries() {
  try {
    const data = await handleApiResponse(`${API_BASE_URL}/countries`)
    
    if (data && data.status === 200 && data.countries) {
      console.log('Countries loaded:', data.countries.length)
      return data.countries.map(country => ({
        id: country.id,
        name: country.name || country.status,
        iso2: country.iso2,
        iso3: country.iso3,
        phonecode: country.phonecode,
        currency: country.currency,
        emoji: country.emoji
      }))
    }
    
    console.warn('No countries data found in response')
    return []
  } catch (error) {
    console.error('Error in fetchCountries:', error)
    return []
  }
}

export async function fetchPhoneCountries() {
  try {
    const data = await handleApiResponse(`${API_BASE_URL}/countries`)
    
    if (data && data.status === 200 && data.countries) {
      return data.countries.map(country => ({
        code: country.iso2,
        label: country.name || country.status,
        dial: country.phonecode ? `+${country.phonecode}` : '+1',
        len: 10,
        emoji: country.emoji
      })).filter(country => country.dial)
          .sort((a, b) => a.label.localeCompare(b.label))
    }
    
    return []
  } catch (error) {
    console.error('Error in fetchPhoneCountries:', error)
    return []
  }
}

export async function fetchStates(countryId) {
  try {
    console.log('Fetching states for country:', countryId)
    
    // Try different possible endpoints
    const endpoints = [
      `${API_BASE_URL}/states/${countryId}`,
      `${API_BASE_URL}/countries/${countryId}/states`,
      `${API_BASE_URL}/states?country_id=${countryId}`
    ]
    
    let data = null
    for (const endpoint of endpoints) {
      data = await handleApiResponse(endpoint)
      if (data && data.status === 200 && (data.states || data.data)) {
        console.log('States found from endpoint:', endpoint)
        break
      }
    }
    
    if (data && (data.states || data.data)) {
      const statesArray = data.states || data.data || []
      console.log('States loaded:', statesArray.length)
      
      return statesArray.map(state => ({
        id: state.id,
        name: state.name,
        country_id: state.country_id,
        country_code: state.country_code
      })).sort((a, b) => a.name.localeCompare(b.name))
    }
    
    console.warn('No states data found for country:', countryId)
    return []
  } catch (error) {
    console.error('Error in fetchStates:', error)
    return []
  }
}

export async function fetchCities(stateId) {
  try {
    console.log('Fetching cities for state:', stateId)
    
    // Try different possible endpoints
    const endpoints = [
      `${API_BASE_URL}/cities/${stateId}`,
      `${API_BASE_URL}/states/${stateId}/cities`,
      `${API_BASE_URL}/cities?state_id=${stateId}`
    ]
    
    let data = null
    for (const endpoint of endpoints) {
      data = await handleApiResponse(endpoint)
      if (data && data.status === 200 && (data.cities || data.countries || data.data)) {
        console.log('Cities found from endpoint:', endpoint)
        break
      }
    }
    
    if (data && (data.cities || data.countries || data.data)) {
      const citiesArray = data.cities || data.countries || data.data || []
      console.log('Cities loaded:', citiesArray.length)
      
      return citiesArray.map(city => ({
        id: city.id,
        name: city.name,
        state_id: city.state_id || stateId,
        state_code: city.state_code,
        country_id: city.country_id
      })).sort((a, b) => a.name.localeCompare(b.name))
    }
    
    console.warn('No cities data found for state:', stateId)
    return []
  } catch (error) {
    console.error('Error in fetchCities:', error)
    return []
  }
}