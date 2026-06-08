/**
 * User Helper Functions
 * Centralized user identity management using email as the single source of truth
 */

/**
 * Get the current user's email from localStorage
 * @returns {string} The user's email
 * @throws {Error} If user is not logged in or email is missing
 */
export function getCurrentUserEmail() {
  const storedUser = localStorage.getItem('property_dna_user');
  if (!storedUser) {
    throw new Error('User not logged in. Please sign in to continue.');
  }
  
  const user = JSON.parse(storedUser);
  if (!user.email) {
    throw new Error('User email is missing. Please sign in again.');
  }
  
  return user.email;
}

/**
 * Get the current user's full object from localStorage
 * @returns {Object} The user object with name and email
 * @throws {Error} If user is not logged in
 */
export function getCurrentUser() {
  const storedUser = localStorage.getItem('property_dna_user');
  if (!storedUser) {
    throw new Error('User not logged in. Please sign in to continue.');
  }
  
  return JSON.parse(storedUser);
}

/**
 * Check if a user is currently logged in
 * @returns {boolean} True if user is logged in
 */
export function isUserLoggedIn() {
  const storedUser = localStorage.getItem('property_dna_user');
  return storedUser !== null;
}

/**
 * Clear the current user session
 */
export function clearUserSession() {
  localStorage.removeItem('property_dna_user');
}
