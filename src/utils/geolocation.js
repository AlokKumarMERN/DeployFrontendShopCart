// Geolocation utility for getting user's current location - FREE VERSION
// Uses OpenStreetMap Nominatim (No API Key Required!)

/**
 * Get user's current coordinates
 * @returns {Promise<{latitude: number, longitude: number}>}
 */
export const getCurrentPosition = () => {
  return new Promise((resolve, reject) => {
    console.log('🔍 Checking geolocation support...');
    
    if (!navigator.geolocation) {
      console.error('❌ Geolocation not supported');
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    console.log('✅ Geolocation supported, requesting position...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('✅ Position obtained:', {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        console.error('❌ Geolocation error:', error);
        let errorMessage = 'Unable to get your location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied. Please enable location access in your browser.';
            console.error('Permission denied by user');
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable. Please check your device location settings.';
            console.error('Position unavailable');
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out. Please try again.';
            console.error('Request timeout');
            break;
        }
        reject(new Error(errorMessage));
      },
      {
        enableHighAccuracy: true,
        timeout: 15000, // Increased timeout
        maximumAge: 0,
      }
    );
  });
};

/**
 * Reverse geocode coordinates to get address details using OpenStreetMap Nominatim (FREE)
 * @param {number} latitude 
 * @param {number} longitude 
 * @returns {Promise<Object>} Address components
 */
export const reverseGeocode = async (latitude, longitude) => {
  try {
    console.log('🌍 Detecting location for coordinates:', { latitude, longitude });
    
    // Using OpenStreetMap Nominatim - 100% FREE, No API Key Required!
    // zoom=18 gives more precise address details
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
      {
        headers: {
          'Accept-Language': 'en',
          'User-Agent': 'AlokGeneralStore/1.0' // Required by Nominatim usage policy
        }
      }
    );

    if (!response.ok) {
      throw new Error('Geocoding request failed');
    }

    const data = await response.json();
    console.log('📍 Nominatim response:', data);

    if (!data || data.error) {
      throw new Error('No address found for this location');
    }

    // Extract address components from Nominatim response
    const address = data.address || {};
    
    // Build street address with better Indian address support
    const streetParts = [
      address.house_number,
      address.road || address.street || address.pedestrian || address.footway,
      address.neighbourhood || address.suburb || address.locality
    ].filter(Boolean);
    
    const streetAddress = streetParts.join(', ').trim();
    
    // Extract city with priority for Indian address structure
    const city = address.city || 
                 address.town || 
                 address.village || 
                 address.municipality || 
                 address.county || 
                 address.district || 
                 '';
    
    // Extract state with fallbacks
    const state = address.state || 
                  address.state_district || 
                  address['ISO3166-2-lvl4']?.split('-')[1] || 
                  '';
    
    // Extract postal code
    const zipCode = address.postcode || address.postal_code || '';

    const addressData = {
      fullAddress: data.display_name || '',
      streetAddress,
      city,
      state,
      country: address.country || '',
      zipCode,
      latitude,
      longitude,
      // Debug info
      _raw: address // Keep raw data for debugging
    };

    console.log('✅ Extracted address:', addressData);
    return addressData;
  } catch (error) {
    console.error('❌ Reverse geocoding error:', error);
    throw new Error('Could not get address for your location. Please try again.');
  }
};

/**
 * Get user's location and address details
 * @returns {Promise<Object>} Location with address
 */
export const getUserLocationAndAddress = async () => {
  try {
    const coords = await getCurrentPosition();
    const address = await reverseGeocode(coords.latitude, coords.longitude);
    return address;
  } catch (error) {
    console.error('Get user location error:', error);
    throw error;
  }
};

/**
 * Format address for display
 * @param {Object} address 
 * @returns {string}
 */
export const formatAddress = (address) => {
  const parts = [
    address.streetAddress,
    address.city,
    address.state,
    address.zipCode,
    address.country,
  ].filter(Boolean);

  return parts.join(', ');
};
