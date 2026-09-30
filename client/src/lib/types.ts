export type BusinessStatus = "draft" | "published" | "inactive";
export type AccessStatus = "pending" | "approved" | "revoked";
export type UserRole = "user" | "admin";
export type LinkKind = "site" | "email" | "phone" | "whatsapp" | "maps" | "other";
export type MediaType = "image" | "video";
export type AnalyticsSource = "instagram" | "whatsapp" | "google" | "placa" | "direct" | "other";
export type DeviceType = "mobile" | "tablet" | "desktop";
export type ProfilePosition = "top" | "cover" | "hidden";
export type ProfileShape = "rounded" | "circle" | "square";
export type ButtonStyle = "soft" | "pill" | "outline" | "glass";

export interface LayoutConfig {
  cover_enabled: boolean;
  profile_position: ProfilePosition;
  profile_shape: ProfileShape;
  text_align: "left" | "center";
  button_style: ButtonStyle;
  show_gallery: boolean;
  cover_treatment?: "original" | "dark" | "light" | "gray";
  logo_size?: "small" | "medium" | "large";
  logo_shape?: "circle" | "rounded" | "square";
  logo_fit?: "contain" | "cover";
  cover_opacity?: number;
  cover_position_x?: number;
  cover_position_y?: number;
  logo_offset_x?: number;
  logo_offset_y?: number;
  logo_scale?: number;
  cover_scale?: number;
  title_color?: string;
  tagline_color?: string;
  font_family?: string;
  title_font_size?: number;
  tagline_font_size?: number;
  section_spacing?: "compact" | "comfortable" | "airy";
  page_style?: "clean" | "editorial" | "glass" | "bold" | "minimal";
  hero_layout?: "classic" | "immersive" | "split" | "compact";
  button_size?: "compact" | "medium" | "large";
  button_shadow?: boolean;
  card_style?: "soft" | "solid" | "glass" | "flat";
  gallery_layout?: "floating" | "masonry" | "grid" | "editorial";
  gallery_radius?: number;
  gallery_gap?: number;
  gallery_background?: string;
  section_title_color?: string;
  body_text_color?: string;
  accent_color?: string;
  background_overlay?: number;
  title_offset_x?: number;
  title_offset_y?: number;
  tagline_offset_x?: number;
  tagline_offset_y?: number;
  section_order?: string[];
  hidden_sections?: string[];
}

export interface CatalogItem {
  id: string;
  item_type?: "product" | "service";
  title: string;
  description: string;
  price: string;
  original_price?: string;
  category?: string;
  badge?: string;
  duration?: string;
  image_url: string;
  button_label: string;
  button_url: string;
  featured?: boolean;
  features?: string[];
  image_position_x?: number;
  image_position_y?: number;
  image_scale?: number;
  file?: File;
}

export type PageBlockType = "text" | "image" | "video" | "quote" | "offer" | "social" | "map" | "hours" | "faq" | "divider" | "booking";

export interface PageBlock {
  id: string;
  type: PageBlockType;
  title?: string;
  text?: string;
  url?: string;
  image_url?: string;
  button_label?: string;
  button_url?: string;
  items?: string[];
  visible?: boolean;
  align?: "left" | "center" | "right";
  background?: string;
  text_color?: string;
  accent_color?: string;
  radius?: number;
  padding?: number;
  image_position_x?: number;
  image_position_y?: number;
  image_scale?: number;
  file?: File;
}

export interface FeatureConfig {
  lead_enabled: boolean;
  lead_title: string;
  lead_button: string;
  lead_description?: string;
  campaign_enabled: boolean;
  campaign_title: string;
  campaign_text: string;
  campaign_cta: string;
  campaign_url: string;
  catalog_text: string;
  catalog_items?: CatalogItem[];
  catalog_title?: string;
  catalog_subtitle?: string;
  testimonials_text: string;
  testimonials_title?: string;
  qr_label: string;
  show_badge: boolean;
  layout?: LayoutConfig;
  blocks?: PageBlock[];
}

export interface Profile { id: string; full_name: string | null; email: string | null; role: UserRole; access_status: AccessStatus; is_protected?: boolean; created_at: string; }
export interface Business { id: string; name: string; slug: string; logo_url: string | null; tagline: string; google_review_url: string | null; whatsapp_number: string | null; whatsapp_message: string | null; instagram_url: string | null; website_url: string | null; address: string | null; maps_url: string | null; primary_color: string; secondary_color: string; background_color: string; background_image_url: string | null; standard_button_color: string; custom_button_color: string; seo_title: string | null; seo_description: string | null; seo_image_url: string | null; features: FeatureConfig; status: BusinessStatus; published_at: string | null; created_at: string; updated_at: string; created_by: string | null; }
export interface BusinessLink { id?: string; business_id?: string; label: string; url: string; kind: LinkKind; color: string; position: number; }
export interface BusinessMedia { id?: string; business_id?: string; type: MediaType; url: string; storage_path?: string | null; alt: string; position: number; file?: File; object_position_x?: number; object_position_y?: number; }
export interface BusinessBundle { business: Business; links: BusinessLink[]; media: BusinessMedia[]; }
export interface AnalyticsEvent { business_id: string; event_type: "view" | "click" | "share"; target: string; source: AnalyticsSource; device_type: DeviceType; referrer?: string | null; }
export interface AnalyticsSummary { views: number; clicks: number; shares: number; uniqueDays: number; devices: Record<DeviceType, number>; sources: Record<AnalyticsSource, number>; daily: { day: string; views: number }[]; topClicks: { target: string; count: number }[]; }
export interface Lead { id?: string; business_id: string; name: string; whatsapp: string; email: string; message: string; source: string; status: "new" | "contacted" | "converted"; created_at?: string; }
export interface BusinessForm { name: string; slug: string; logo_url: string; tagline: string; google_review_url: string; whatsapp_number: string; whatsapp_message: string; instagram_url: string; website_url: string; address: string; maps_url: string; primary_color: string; secondary_color: string; background_color: string; background_image_url: string; standard_button_color: string; custom_button_color: string; seo_title: string; seo_description: string; seo_image_url: string; features: FeatureConfig; links: BusinessLink[]; media: BusinessMedia[]; }
