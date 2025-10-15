// app/utils/location-api.js
import axios from 'axios'

const API_BASE_URL = 'https://csc.sidsworld.co.in/api'

export async function fetchCountries() {
  try {
    const response = await axios.get(`${API_BASE_URL}/countries`)
    const data = response.data
    
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
    const response = await axios.get(`${API_BASE_URL}/countries`)
    const data = response.data
    
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
    
    const response = await axios.get(`${API_BASE_URL}/states/${countryId}`)
    const data = response.data
    
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
    console.log('API URL:', `${API_BASE_URL}/cities/${stateId}`)
    
    const response = await axios.get(`${API_BASE_URL}/cities/${stateId}`)
    const data = response.data
    
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
    console.error('State ID:', stateId)
    console.error('Error details:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url
    })
    
    // Return empty array instead of throwing error
    return []
  }
}