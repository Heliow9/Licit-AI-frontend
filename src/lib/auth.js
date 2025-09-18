const TOKEN_KEY = "auth_token";

export function setToken(t) {
  localStorage.setItem(TOKEN_KEY, t);
}
export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}
export function isAuthenticated() {
  return !!getToken();
}
