export type UserRole = 'super_admin' | 'lead_analyst' | 'field_investigator';
export type CasePriority = 'low' | 'medium' | 'high' | 'critical';
export type CaseVerdict = 'pending' | 'under_investigation' | 'confirmed_smuggled' | 'cleared' | 'inconclusive';
export type PostStatus = 'new' | 'flagged' | 'verified_ncp' | 'dismissed';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: UserRole;
  hierarchy_level: 1 | 2 | 3;
  is_2fa_enabled: boolean;
  created_at?: string;
}

export interface ExtractedVehicleJson {
  make?: string;
  model?: string;
  year?: number;
  variant?: string;
  city?: string;
  asking_price?: number;
  chassis_number?: string;
  suspicious_phrases?: string[];
  nlp_smuggling_confidence?: number;
  source_platform?: string;
  author_name?: string;
}

export interface ScrapedPost {
  id: string;
  message_hash: string;
  group_name?: string;
  sender_phone?: string;
  seller_name?: string;
  image_url?: string;
  image_urls?: string[];
  raw_text: string;
  extracted_json: ExtractedVehicleJson;
  slang_flags: string[];
  llm_reasoning?: string;
  predicted_market_price?: number;
  price_deviation_pct?: number;
  risk_score: number;
  status: PostStatus;
  ocr_findings?: {
    phone_numbers?: string[];
    ncp_keywords?: string[];
    phones?: Array<{ phone: string; hash: string; source: string }>;
  };
  phone_records?: Array<{ phone: string; hash: string; source: string }>;
  created_at: string;
}

export interface InvestigationCase {
  id: string;
  post_id: string;
  assigned_to?: string;
  escalated_by?: string;
  priority: CasePriority;
  field_notes?: string;
  verdict: CaseVerdict;
  created_at: string;
  updated_at: string;
  scraped_posts?: ScrapedPost;
  assigned?: { full_name: string; email: string };
  escalated?: { full_name: string };
}

export interface DashboardStats {
  total_posts_monitored: number;
  flagged_suspicious: number;
  verified_ncp_units: number;
  active_investigations: number;
  critical_risk_units: number;
  analyst_on_duty: string;
  role_level: number;
}

export interface LiveLogEntry {
  timestamp: string;
  level: string;
  message: string;
}

export interface ScraperStatus {
  is_running: boolean;
  job_id?: string;
  current_url?: string;
  posts_scraped: number;
  flagged_count: number;
  live_logs: LiveLogEntry[];
}

export interface ForensicAnalysisResponse {
  message: string;
  post_id: string;
  analysis: {
    extracted_json: ExtractedVehicleJson;
    slang_flags: string[];
    llm_reasoning: string;
    predicted_market_price: number;
    price_deviation_pct: number;
    risk_score: number;
    status: PostStatus;
    is_outlier: boolean;
  };
}
