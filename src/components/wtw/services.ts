export type ServiceId =
  | "netflix"
  | "prime"
  | "disney"
  | "hulu"
  | "appletv"
  | "max";

export interface ServiceDef {
  id: ServiceId;
  name: string;
  colorVar: string; // CSS variable name for brand color (HSL)
  logoText: string; // simple badge text logo
}

export const SERVICES: ServiceDef[] = [
  { id: "netflix", name: "Netflix", colorVar: "--brand-netflix", logoText: "N" },
  { id: "prime", name: "Prime Video", colorVar: "--brand-prime", logoText: "P" },
  { id: "disney", name: "Disney+", colorVar: "--brand-disney", logoText: "D+" },
  { id: "hulu", name: "Hulu", colorVar: "--brand-hulu", logoText: "H" },
  { id: "appletv", name: "Apple TV+", colorVar: "--brand-appletv", logoText: "TV" },
  { id: "max", name: "HBO MAX", colorVar: "--brand-max", logoText: "M" },
];

export const REGIONS = [
  { code: "US", label: "United States" },
  { code: "CA", label: "Canada" },
  { code: "BR", label: "Brazil" },
  { code: "UK", label: "United Kingdom" },
  { code: "AU", label: "Australia" },
  { code: "DK", label: "Denmark" },
  { code: "SG", label: "Singapore" },
];
