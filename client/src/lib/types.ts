export type BusinessStatus = "draft" | "published" | "inactive";
export type AccessStatus = "pending" | "approved" | "revoked";
export type UserRole = "user" | "admin";
export type LinkKind = "site" | "email" | "phone" | "whatsapp" | "maps" | "other";
export type MediaType = "image" | "video";
export type AnalyticsSource = "instagram" | "whatsapp" | "google" | "placa" | "direct" | "other";
export type DeviceType = "mobile" | "tablet" | "desktop";

export interface Profile { id: string; full_name: string | null; email: string | null; role: UserRole; access_status: AccessStatus; is_protected?: boolean; created_at: string; }
export interface Business { id: string; name: string; slug: string; logo_url: string | null; tagline: string; google_review_url: string | null; whatsapp_number: string | null; whatsapp_message: string | null; instagram_url: string | null; website_url: string | null; address: string | null; maps_url: string | null; primary_color: string; secondary_color: string; background_color: string; background_image_url: string | null; standard_button_color: string; custom_button_color: string; seo_title: string | null; seo_description: string | null; seo_image_url: string | null; status: BusinessStatus; published_at: string | null; created_at: string; updated_at: string; created_by: string | null; }
export interface BusinessLink { id?: string; business_id?: string; label: string; url: string; kind: LinkKind; color: string; position: number; }
export interface BusinessMedia { id?: string; business_id?: string; type: MediaType; url: string; storage_path?: string | null; alt: string; position: number; }
export interface BusinessBundle { business: Business; links: BusinessLink[]; media: BusinessMedia[]; }
export interface AnalyticsEvent { business_id: string; event_type: "view" | "click"; target: string; source: AnalyticsSource; device_type: DeviceType; referrer?: string | null; }
export interface AnalyticsSummary { views: number; clicks: number; uniqueDays: number; devices: Record<DeviceType, number>; sources: Record<AnalyticsSource, number>; daily: { day: string; views: number }[]; topClicks: { target: string; count: number }[]; }
export interface BusinessForm { name: string; slug: string; logo_url: string; tagline: string; google_review_url: string; whatsapp_number: string; whatsapp_message: string; instagram_url: string; website_url: string; address: string; maps_url: string; primary_color: string; secondary_color: string; background_color: string; background_image_url: string; standard_button_color: string; custom_button_color: string; seo_title: string; seo_description: string; seo_image_url: string; links: BusinessLink[]; media: BusinessMedia[]; }
