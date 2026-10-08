export type ClientRole = "owner" | "editor" | "viewer";
export type ClientPermission = "edit_contact" | "edit_photos" | "edit_catalog" | "view_stats";

/** Contract for the future client portal. No client-facing database policy is enabled yet. */
export const CLIENT_PERMISSIONS: Record<ClientRole, ClientPermission[]> = {
  owner: ["edit_contact", "edit_photos", "edit_catalog", "view_stats"],
  editor: ["edit_contact", "edit_photos", "edit_catalog"],
  viewer: ["view_stats"],
};

export function canClient(role: ClientRole, permission: ClientPermission) {
  return CLIENT_PERMISSIONS[role].includes(permission);
}
