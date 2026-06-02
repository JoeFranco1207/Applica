// PSGC API utility for fetching Philippine geographic data
const PSGC_API_BASE = "https://psgc.gitlab.io/api";

// Cache for API responses to avoid repeated requests
const cache = {
  regions: null,
  provinces: null,
  cities: {}, // indexed by regionCode
  barangays: {}, // indexed by cityCode
};

/**
 * Fetch all regions in the Philippines
 */
export const fetchAllRegions = async () => {
  if (cache.regions) {
    return cache.regions;
  }

  try {
    const response = await fetch(`${PSGC_API_BASE}/regions.json`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const data = await response.json();
    
    // Transform data to simpler format
    cache.regions = data
      .map((region) => ({
        code: region.code,
        name: region.name,
        regionName: region.regionName,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
    
    return cache.regions;
  } catch (error) {
    console.error("Error fetching regions:", error);
    throw error;
  }
};

/**
 * Fetch provinces for a specific region
 */
export const fetchProvincesByRegion = async (regionCode) => {
  if (!cache.provinces) {
    try {
      const response = await fetch(`${PSGC_API_BASE}/provinces.json`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      cache.provinces = data.map((province) => ({
        code: province.code,
        name: province.name,
        regionCode: province.regionCode,
      }));
    } catch (error) {
      console.error(`Error fetching provinces:`, error);
      throw error;
    }
  }

  return cache.provinces
    .filter((province) => province.regionCode === regionCode)
    .sort((a, b) => a.name.localeCompare(b.name));
};

/**
 * Fetch cities/municipalities for a specific region
 */
export const fetchCitiesByRegion = async (regionCode) => {
  if (cache.cities[regionCode]) {
    return cache.cities[regionCode];
  }

  try {
    const response = await fetch(
      `${PSGC_API_BASE}/regions/${regionCode}/cities-municipalities.json`
    );
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const data = await response.json();
    
    // Transform data to simpler format and keep province information for filtering by province
    cache.cities[regionCode] = data
      .map((city) => ({
        code: city.code,
        name: city.name,
        provinceCode: city.provinceCode,
        regionCode: city.regionCode,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
    
    return cache.cities[regionCode];
  } catch (error) {
    console.error(`Error fetching cities for region ${regionCode}:`, error);
    throw error;
  }
};

/**
 * Fetch barangays for a specific city/municipality
 */
export const fetchBarangaysByCity = async (cityCode) => {
  if (cache.barangays[cityCode]) {
    return cache.barangays[cityCode];
  }

  try {
    const response = await fetch(
      `${PSGC_API_BASE}/cities-municipalities/${cityCode}/barangays.json`
    );
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const data = await response.json();
    
    // Transform data to simpler format
    cache.barangays[cityCode] = data
      .map((barangay) => ({
        code: barangay.code,
        name: barangay.name,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
    
    return cache.barangays[cityCode];
  } catch (error) {
    console.error(`Error fetching barangays for city ${cityCode}:`, error);
    throw error;
  }
};

/**
 * Get region display name (fallback to region code if fetch fails)
 */
export const getRegionDisplayName = (region) => {
  if (typeof region === "object") {
    return region.name || region.regionName || region.code;
  }
  return region;
};

/**
 * Get city display name
 */
export const getCityDisplayName = (city) => {
  if (typeof city === "object") {
    return city.name || city.code;
  }
  return city;
};

/**
 * Get barangay display name
 */
export const getBarangayDisplayName = (barangay) => {
  if (typeof barangay === "object") {
    return barangay.name || barangay.code;
  }
  return barangay;
};

/**
 * Clear cache (useful for testing or refreshing data)
 */
export const clearCache = () => {
  cache.regions = null;
  cache.cities = {};
  cache.barangays = {};
};
