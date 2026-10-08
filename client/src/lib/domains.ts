import type { Business } from "./types";

export function normalizeHostname(value: string) {
  const host = value.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/\.$/, "");
  return /^(?=.{4,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(host) ? host : "";
}

/** Public address used in delivery. A custom domain is used only after an administrator marks it active. */
export function publicUrlFor(business: Pick<Business, "slug" | "features">, origin: string) {
  const meta = business.features?.meta;
  const host = meta?.domain_status === "active" && meta.custom_domain ? normalizeHostname(meta.custom_domain) : "";
  return host ? `https://${host}/` : new URL(`/${business.slug}`, origin).href;
}
