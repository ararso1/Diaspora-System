// types/diaspora.ts
export type Gender = "MALE" | "FEMALE" | "OTHER";

export type Step1Basic = {
  user_first_name: string;
  user_last_name: string;
  user_email: string;
  user_phone: string; // primary_phone
  user_gender?: Gender;
  user_citizenship?: string;
  user_dob?: string; // YYYY-MM-DD
};

export type Step2More = {
  full_name: string; // auto from step1
  whatsapp?: string;
  country_of_residence?: string;
  city_of_residence?: string;
  arrival_date?: string; // YYYY-MM-DD
  expected_stay_duration?: string;
  is_returnee?: boolean;
  preferred_language?: string;
  preferred_language_other?: string;
  communication_opt_in?: boolean;
  address_local?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  passport_no?: string;
  id_number?: string;
  passport_scan?: File | null;
  id_scan?: File | null;
};

export type PurposeType =
  | "INVESTMENT"
  | "TOURISM"
  | "FAMILY"
  | "STUDY"
  | "CHARITY_NGO"
  | "OTHER";

export type Step3Purpose = {
  type?: PurposeType;
  description?: string;
  sector?: string;
  sub_sector?: string;
  investment_type?: string;
  estimated_capital?: number | null;
  currency?: string;
  jobs_expected?: number | null;
  land_requirement?: boolean;
  land_size?: number | null;
  preferred_location_note?: string;
};

export type DraftState = {
  step: number;
  step1: Step1Basic;
  step2: Step2More;
  step3: Step3Purpose;
};
