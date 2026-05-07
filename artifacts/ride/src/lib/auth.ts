export type UserRole = "passenger" | "driver" | "pending";

export function getUserRole(): UserRole {
  return (localStorage.getItem("phato_user_role") as UserRole) ?? "passenger";
}

export function setUserRole(role: UserRole): void {
  localStorage.setItem("phato_user_role", role);
  window.dispatchEvent(new Event("phato_role_changed"));
}
