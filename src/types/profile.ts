// src/types/profile.ts

export interface Profile {
  id: string;
  full_name: string;
  birth_place: string | null;
  birth_date: string | null;
  avatar_url: string | null;
  phone_number: string | null;
  city: string | null;
  bio: string | null;
  created_at: string;
}

export interface ProfileFormData {
  full_name: string;
  birth_place: string;
  birth_date: string;
  phone_number: string;
  city: string;
  bio: string;
}
