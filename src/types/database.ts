export interface Profile {
  id: string;
  username: string;
  full_name?: string;
  branch_department?: string;
  created_at: string;
}

export interface Case {
  id: string;
  user_id: string;
  full_name: string;
  age?: number;
  gender?: string;
  description?: string;
  photo_url?: string;
  date_registered: string;
  last_seen_location?: string;
  last_seen_date?: string;
  status: string;
  is_public: boolean;
  branch_department?: string;
  contact_info?: string;
  additional_details?: string;
  created_at: string;
  updated_at: string;
}
