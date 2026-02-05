export function setAdminToken(token: string) {
  localStorage.setItem("admin_token", token);
}

export function getAdminToken() {
  return typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
}

export function clearAdminToken() {
  localStorage.removeItem("admin_token");
}