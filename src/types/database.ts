export type EventRow = {
  id: string;
  title: string;
  slug: string;
  is_open: boolean;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
};

export type MatchRow = {
  id: string;
  event_id: string;
  title: string;
  korea_team_name: string;
  opponent_team_name: string;
  match_at: string | null;
  prediction_closes_at: string | null;
  is_open: boolean;
  display_order: number;
  actual_korea_score: number | null;
  actual_opponent_score: number | null;
  created_at: string;
};

export type ParticipantRow = {
  id: string;
  event_id: string;
  nickname: string;
  phone_hash: string;
  phone_last4: string;
  encrypted_phone: string | null;
  created_at: string;
};

export type PredictionRow = {
  id: string;
  event_id: string;
  participant_id: string;
  match_id: string;
  korea_score: number;
  opponent_score: number;
  created_at: string;
};

export type ScoreDistributionRow = {
  event_id: string;
  match_id: string;
  korea_score: number;
  opponent_score: number;
  prediction_count: number;
  percentage: number;
};
