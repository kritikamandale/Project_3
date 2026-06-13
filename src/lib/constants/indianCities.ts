export const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh',
  'Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka',
  'Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram',
  'Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana',
  'Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
  'Andaman and Nicobar Islands','Chandigarh','Dadra and Nagar Haveli and Daman and Diu',
  'Delhi','Jammu and Kashmir','Ladakh','Lakshadweep','Puducherry',
] as const;

export type IndianState = typeof INDIAN_STATES[number];

export const TIER1_CITIES = [
  'Mumbai','Delhi','Bengaluru','Hyderabad','Ahmedabad','Chennai',
  'Kolkata','Surat','Pune','Jaipur',
] as const;

export const TIER2_CITIES = [
  'Lucknow','Kanpur','Nagpur','Indore','Thane','Bhopal','Visakhapatnam',
  'Pimpri-Chinchwad','Patna','Vadodara','Ghaziabad','Ludhiana','Agra',
  'Nashik','Faridabad','Meerut','Rajkot','Kalyan-Dombivali','Vasai-Virar',
  'Varanasi','Srinagar','Aurangabad','Dhanbad','Amritsar','Navi Mumbai',
  'Allahabad','Ranchi','Howrah','Coimbatore','Jabalpur','Gwalior',
  'Vijayawada','Jodhpur','Madurai','Raipur','Kota','Guwahati','Chandigarh',
  'Solapur','Hubli–Dharwad','Bareilly','Moradabad','Mysore','Gurgaon',
  'Aligarh','Jalandhar','Tiruchirappalli','Bhubaneswar','Salem','Mira-Bhayandar',
  'Thiruvananthapuram','Bhiwandi','Saharanpur','Gorakhpur','Guntur','Bikaner',
  'Amravati','Noida','Jamshedpur','Bhilai','Cuttack','Firozabad','Kochi',
  'Dehradun','Durgapur','Asansol','Nanded','Kolhapur','Ajmer','Gulbarga',
] as const;

export const ALL_CITIES = [...TIER1_CITIES, ...TIER2_CITIES] as const;

export type IndianCity = typeof ALL_CITIES[number];

export const CITY_STATE_MAP: Record<string, IndianState> = {
  Mumbai: 'Maharashtra', Delhi: 'Delhi', Bengaluru: 'Karnataka',
  Hyderabad: 'Telangana', Ahmedabad: 'Gujarat', Chennai: 'Tamil Nadu',
  Kolkata: 'West Bengal', Surat: 'Gujarat', Pune: 'Maharashtra',
  Jaipur: 'Rajasthan', Lucknow: 'Uttar Pradesh', Chandigarh: 'Chandigarh',
  Gurgaon: 'Haryana', Noida: 'Uttar Pradesh', Kochi: 'Kerala',
  Bhubaneswar: 'Odisha', Dehradun: 'Uttarakhand', Guwahati: 'Assam',
};
