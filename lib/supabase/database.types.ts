export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  api: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      admin_leagues: {
        Row: {
          club_count: number | null
          club_ids: string[] | null
          club_names: string[] | null
          has_predictions: boolean | null
          id: string | null
          name: string | null
          status: Database["app"]["Enums"]["league_season_status"] | null
          version: number | null
          year_label: string | null
        }
        Relationships: []
      }
      admin_schedule: {
        Row: {
          away_club_id: string | null
          away_club_logo_url: string | null
          away_club_name: string | null
          away_goals: number | null
          can_enter_result: boolean | null
          decision: Database["app"]["Enums"]["result_decision"] | null
          display_name: string | null
          display_status: string | null
          home_club_id: string | null
          home_club_logo_url: string | null
          home_club_name: string | null
          home_goals: number | null
          kickoff_at: string | null
          league_id: string | null
          league_name: string | null
          match_has_predictions: boolean | null
          match_id: string | null
          match_status: Database["app"]["Enums"]["match_status"] | null
          match_version: number | null
          matchday_has_predictions: boolean | null
          matchday_id: string | null
          matchday_number: number | null
          matchday_status: Database["app"]["Enums"]["matchday_status"] | null
          matchday_version: number | null
          phase: Database["app"]["Enums"]["matchday_phase"] | null
          revision_no: number | null
          year_label: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matchdays_league_season_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "admin_leagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matchdays_league_season_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "competition_catalog"
            referencedColumns: ["league_season_id"]
          },
          {
            foreignKeyName: "matchdays_league_season_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "published_league_seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_away_club_id_fkey"
            columns: ["away_club_id"]
            isOneToOne: false
            referencedRelation: "club_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_away_club_id_fkey"
            columns: ["away_club_id"]
            isOneToOne: false
            referencedRelation: "matchday_prediction_sheet"
            referencedColumns: ["away_club_id"]
          },
          {
            foreignKeyName: "matches_away_club_id_fkey"
            columns: ["away_club_id"]
            isOneToOne: false
            referencedRelation: "matchday_prediction_sheet"
            referencedColumns: ["home_club_id"]
          },
          {
            foreignKeyName: "matches_home_club_id_fkey"
            columns: ["home_club_id"]
            isOneToOne: false
            referencedRelation: "club_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_home_club_id_fkey"
            columns: ["home_club_id"]
            isOneToOne: false
            referencedRelation: "matchday_prediction_sheet"
            referencedColumns: ["away_club_id"]
          },
          {
            foreignKeyName: "matches_home_club_id_fkey"
            columns: ["home_club_id"]
            isOneToOne: false
            referencedRelation: "matchday_prediction_sheet"
            referencedColumns: ["home_club_id"]
          },
        ]
      }
      club_catalog: {
        Row: {
          id: string | null
          logo_path: string | null
          logo_url: string | null
          name: string | null
          short_name: string | null
          status: Database["app"]["Enums"]["club_status"] | null
          version: number | null
        }
        Insert: {
          id?: string | null
          logo_path?: string | null
          logo_url?: string | null
          name?: string | null
          short_name?: string | null
          status?: Database["app"]["Enums"]["club_status"] | null
          version?: number | null
        }
        Update: {
          id?: string | null
          logo_path?: string | null
          logo_url?: string | null
          name?: string | null
          short_name?: string | null
          status?: Database["app"]["Enums"]["club_status"] | null
          version?: number | null
        }
        Relationships: []
      }
      competition_catalog: {
        Row: {
          ends_on: string | null
          league_id: string | null
          league_name: string | null
          league_season_id: string | null
          league_season_status:
            | Database["app"]["Enums"]["league_season_status"]
            | null
          league_season_version: number | null
          league_short_name: string | null
          league_status: Database["app"]["Enums"]["catalog_status"] | null
          league_version: number | null
          season_id: string | null
          season_label: string | null
          season_status: Database["app"]["Enums"]["catalog_status"] | null
          season_version: number | null
          starts_on: string | null
        }
        Relationships: []
      }
      league_catalog: {
        Row: {
          id: string | null
          name: string | null
          short_name: string | null
          status: Database["app"]["Enums"]["catalog_status"] | null
          version: number | null
        }
        Insert: {
          id?: string | null
          name?: string | null
          short_name?: string | null
          status?: Database["app"]["Enums"]["catalog_status"] | null
          version?: number | null
        }
        Update: {
          id?: string | null
          name?: string | null
          short_name?: string | null
          status?: Database["app"]["Enums"]["catalog_status"] | null
          version?: number | null
        }
        Relationships: []
      }
      matchday_prediction_sheet: {
        Row: {
          away_club_id: string | null
          away_club_name: string | null
          away_club_short_name: string | null
          away_logo_path: string | null
          away_logo_url: string | null
          display_name: string | null
          home_club_id: string | null
          home_club_name: string | null
          home_club_short_name: string | null
          home_logo_path: string | null
          home_logo_url: string | null
          is_open: boolean | null
          kickoff_at: string | null
          match_id: string | null
          match_status: Database["app"]["Enums"]["match_status"] | null
          matchday_id: string | null
          matchday_number: number | null
          matchday_status: Database["app"]["Enums"]["matchday_status"] | null
          phase: Database["app"]["Enums"]["matchday_phase"] | null
          predicted_away_goals: number | null
          predicted_home_goals: number | null
          prediction_points: number | null
          prediction_saved_at: string | null
          result_away_goals: number | null
          result_decision: Database["app"]["Enums"]["result_decision"] | null
          result_home_goals: number | null
          result_is_correction: boolean | null
          result_revision_no: number | null
          round_id: string | null
        }
        Relationships: []
      }
      matchday_ranking: {
        Row: {
          display_name: string | null
          exact_scores: number | null
          is_current_user: boolean | null
          matchday_id: string | null
          matchday_number: number | null
          membership_id: string | null
          membership_status:
            | Database["app"]["Enums"]["membership_status"]
            | null
          nickname: string | null
          points: number | null
          rank: number | null
          round_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "round_memberships_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "matchday_prediction_sheet"
            referencedColumns: ["round_id"]
          },
          {
            foreignKeyName: "round_memberships_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "my_rounds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "round_memberships_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "round_overview"
            referencedColumns: ["round_id"]
          },
          {
            foreignKeyName: "round_memberships_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "round_results"
            referencedColumns: ["round_id"]
          },
        ]
      }
      my_profile: {
        Row: {
          app_role: Database["app"]["Enums"]["app_role"] | null
          created_at: string | null
          display_name: string | null
          last_active_round_id: string | null
          status: Database["app"]["Enums"]["profile_status"] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          app_role?: Database["app"]["Enums"]["app_role"] | null
          created_at?: string | null
          display_name?: string | null
          last_active_round_id?: string | null
          status?: Database["app"]["Enums"]["profile_status"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          app_role?: Database["app"]["Enums"]["app_role"] | null
          created_at?: string | null
          display_name?: string | null
          last_active_round_id?: string | null
          status?: Database["app"]["Enums"]["profile_status"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_last_active_round_fk"
            columns: ["last_active_round_id"]
            isOneToOne: false
            referencedRelation: "matchday_prediction_sheet"
            referencedColumns: ["round_id"]
          },
          {
            foreignKeyName: "profiles_last_active_round_fk"
            columns: ["last_active_round_id"]
            isOneToOne: false
            referencedRelation: "my_rounds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_last_active_round_fk"
            columns: ["last_active_round_id"]
            isOneToOne: false
            referencedRelation: "round_overview"
            referencedColumns: ["round_id"]
          },
          {
            foreignKeyName: "profiles_last_active_round_fk"
            columns: ["last_active_round_id"]
            isOneToOne: false
            referencedRelation: "round_results"
            referencedColumns: ["round_id"]
          },
        ]
      }
      my_rounds: {
        Row: {
          created_at: string | null
          id: string | null
          league_name: string | null
          league_season_id: string | null
          membership_id: string | null
          name: string | null
          nickname: string | null
          role: Database["app"]["Enums"]["round_role"] | null
          season_label: string | null
          status: Database["app"]["Enums"]["round_status"] | null
          version: number | null
        }
        Relationships: [
          {
            foreignKeyName: "prediction_rounds_league_season_id_fkey"
            columns: ["league_season_id"]
            isOneToOne: false
            referencedRelation: "admin_leagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prediction_rounds_league_season_id_fkey"
            columns: ["league_season_id"]
            isOneToOne: false
            referencedRelation: "competition_catalog"
            referencedColumns: ["league_season_id"]
          },
          {
            foreignKeyName: "prediction_rounds_league_season_id_fkey"
            columns: ["league_season_id"]
            isOneToOne: false
            referencedRelation: "published_league_seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      my_support_audit: {
        Row: {
          action: string | null
          id: number | null
          occurred_at: string | null
        }
        Insert: {
          action?: string | null
          id?: number | null
          occurred_at?: string | null
        }
        Update: {
          action?: string | null
          id?: number | null
          occurred_at?: string | null
        }
        Relationships: []
      }
      overall_ranking: {
        Row: {
          exact_scores: number | null
          is_current_user: boolean | null
          membership_id: string | null
          membership_status:
            | Database["app"]["Enums"]["membership_status"]
            | null
          nickname: string | null
          points: number | null
          rank: number | null
          round_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "round_memberships_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "matchday_prediction_sheet"
            referencedColumns: ["round_id"]
          },
          {
            foreignKeyName: "round_memberships_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "my_rounds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "round_memberships_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "round_overview"
            referencedColumns: ["round_id"]
          },
          {
            foreignKeyName: "round_memberships_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "round_results"
            referencedColumns: ["round_id"]
          },
        ]
      }
      published_league_seasons: {
        Row: {
          ends_on: string | null
          id: string | null
          league_name: string | null
          league_short_name: string | null
          season_label: string | null
          starts_on: string | null
          status: Database["app"]["Enums"]["league_season_status"] | null
          version: number | null
        }
        Relationships: []
      }
      round_members: {
        Row: {
          ended_at: string | null
          id: string | null
          joined_at: string | null
          nickname: string | null
          role: Database["app"]["Enums"]["round_role"] | null
          round_id: string | null
          status: Database["app"]["Enums"]["membership_status"] | null
        }
        Insert: {
          ended_at?: string | null
          id?: string | null
          joined_at?: string | null
          nickname?: string | null
          role?: Database["app"]["Enums"]["round_role"] | null
          round_id?: string | null
          status?: Database["app"]["Enums"]["membership_status"] | null
        }
        Update: {
          ended_at?: string | null
          id?: string | null
          joined_at?: string | null
          nickname?: string | null
          role?: Database["app"]["Enums"]["round_role"] | null
          round_id?: string | null
          status?: Database["app"]["Enums"]["membership_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "round_memberships_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "matchday_prediction_sheet"
            referencedColumns: ["round_id"]
          },
          {
            foreignKeyName: "round_memberships_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "my_rounds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "round_memberships_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "round_overview"
            referencedColumns: ["round_id"]
          },
          {
            foreignKeyName: "round_memberships_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "round_results"
            referencedColumns: ["round_id"]
          },
        ]
      }
      round_overview: {
        Row: {
          league_season_id: string | null
          name: string | null
          next_kickoff_at: string | null
          predicted_matches: number | null
          round_id: string | null
          status: Database["app"]["Enums"]["round_status"] | null
          total_matches: number | null
          version: number | null
        }
        Relationships: [
          {
            foreignKeyName: "prediction_rounds_league_season_id_fkey"
            columns: ["league_season_id"]
            isOneToOne: false
            referencedRelation: "admin_leagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prediction_rounds_league_season_id_fkey"
            columns: ["league_season_id"]
            isOneToOne: false
            referencedRelation: "competition_catalog"
            referencedColumns: ["league_season_id"]
          },
          {
            foreignKeyName: "prediction_rounds_league_season_id_fkey"
            columns: ["league_season_id"]
            isOneToOne: false
            referencedRelation: "published_league_seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      round_results: {
        Row: {
          away_club_name: string | null
          away_goals: number | null
          away_logo_url: string | null
          decision: Database["app"]["Enums"]["result_decision"] | null
          display_name: string | null
          display_status: string | null
          home_club_name: string | null
          home_goals: number | null
          home_logo_url: string | null
          is_correction: boolean | null
          kickoff_at: string | null
          match_id: string | null
          match_status: Database["app"]["Enums"]["match_status"] | null
          matchday_id: string | null
          matchday_number: number | null
          phase: Database["app"]["Enums"]["matchday_phase"] | null
          revision_no: number | null
          round_id: string | null
          updated_at: string | null
        }
        Relationships: []
      }
      schedule: {
        Row: {
          away_club_id: string | null
          away_club_name: string | null
          away_goals: number | null
          decision: Database["app"]["Enums"]["result_decision"] | null
          display_name: string | null
          home_club_id: string | null
          home_club_name: string | null
          home_goals: number | null
          kickoff_at: string | null
          league_season_id: string | null
          match_id: string | null
          match_status: Database["app"]["Enums"]["match_status"] | null
          match_version: number | null
          matchday_id: string | null
          matchday_number: number | null
          matchday_status: Database["app"]["Enums"]["matchday_status"] | null
          matchday_version: number | null
          revision_no: number | null
        }
        Relationships: [
          {
            foreignKeyName: "matchdays_league_season_id_fkey"
            columns: ["league_season_id"]
            isOneToOne: false
            referencedRelation: "admin_leagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matchdays_league_season_id_fkey"
            columns: ["league_season_id"]
            isOneToOne: false
            referencedRelation: "competition_catalog"
            referencedColumns: ["league_season_id"]
          },
          {
            foreignKeyName: "matchdays_league_season_id_fkey"
            columns: ["league_season_id"]
            isOneToOne: false
            referencedRelation: "published_league_seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_away_club_id_fkey"
            columns: ["away_club_id"]
            isOneToOne: false
            referencedRelation: "club_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_away_club_id_fkey"
            columns: ["away_club_id"]
            isOneToOne: false
            referencedRelation: "matchday_prediction_sheet"
            referencedColumns: ["away_club_id"]
          },
          {
            foreignKeyName: "matches_away_club_id_fkey"
            columns: ["away_club_id"]
            isOneToOne: false
            referencedRelation: "matchday_prediction_sheet"
            referencedColumns: ["home_club_id"]
          },
          {
            foreignKeyName: "matches_home_club_id_fkey"
            columns: ["home_club_id"]
            isOneToOne: false
            referencedRelation: "club_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_home_club_id_fkey"
            columns: ["home_club_id"]
            isOneToOne: false
            referencedRelation: "matchday_prediction_sheet"
            referencedColumns: ["away_club_id"]
          },
          {
            foreignKeyName: "matches_home_club_id_fkey"
            columns: ["home_club_id"]
            isOneToOne: false
            referencedRelation: "matchday_prediction_sheet"
            referencedColumns: ["home_club_id"]
          },
        ]
      }
      season_catalog: {
        Row: {
          ends_on: string | null
          id: string | null
          label: string | null
          starts_on: string | null
          status: Database["app"]["Enums"]["catalog_status"] | null
          version: number | null
        }
        Insert: {
          ends_on?: string | null
          id?: string | null
          label?: string | null
          starts_on?: string | null
          status?: Database["app"]["Enums"]["catalog_status"] | null
          version?: number | null
        }
        Update: {
          ends_on?: string | null
          id?: string | null
          label?: string | null
          starts_on?: string | null
          status?: Database["app"]["Enums"]["catalog_status"] | null
          version?: number | null
        }
        Relationships: []
      }
      visible_predictions: {
        Row: {
          away_goals: number | null
          home_goals: number | null
          kickoff_at: string | null
          match_id: string | null
          membership_id: string | null
          nickname: string | null
          round_id: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "predictions_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "admin_schedule"
            referencedColumns: ["match_id"]
          },
          {
            foreignKeyName: "predictions_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matchday_prediction_sheet"
            referencedColumns: ["match_id"]
          },
          {
            foreignKeyName: "predictions_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "round_results"
            referencedColumns: ["match_id"]
          },
          {
            foreignKeyName: "predictions_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "schedule"
            referencedColumns: ["match_id"]
          },
          {
            foreignKeyName: "predictions_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "matchday_ranking"
            referencedColumns: ["membership_id"]
          },
          {
            foreignKeyName: "predictions_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "my_rounds"
            referencedColumns: ["membership_id"]
          },
          {
            foreignKeyName: "predictions_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "overall_ranking"
            referencedColumns: ["membership_id"]
          },
          {
            foreignKeyName: "predictions_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "round_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "predictions_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "matchday_prediction_sheet"
            referencedColumns: ["round_id"]
          },
          {
            foreignKeyName: "predictions_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "my_rounds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "predictions_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "round_overview"
            referencedColumns: ["round_id"]
          },
          {
            foreignKeyName: "predictions_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "round_results"
            referencedColumns: ["round_id"]
          },
        ]
      }
    }
    Functions: {
      archive_round: {
        Args: { p_expected_version: number; p_round_id: string }
        Returns: number
      }
      assign_club: {
        Args: {
          p_club_id: string
          p_league_season_id: string
          p_status?: Database["app"]["Enums"]["league_season_club_status"]
        }
        Returns: undefined
      }
      create_admin_league: {
        Args: { p_club_ids: string[]; p_name: string; p_year_label: string }
        Returns: string
      }
      create_club: {
        Args: { p_name: string; p_short_name: string }
        Returns: string
      }
      create_club_simple: {
        Args: { p_logo_url?: string; p_name: string }
        Returns: string
      }
      create_league: {
        Args: { p_name: string; p_short_name?: string }
        Returns: string
      }
      create_league_season: {
        Args: { p_league_id: string; p_season_id: string }
        Returns: string
      }
      create_match: {
        Args: {
          p_away_club_id: string
          p_home_club_id: string
          p_kickoff_at: string
          p_matchday_id: string
        }
        Returns: string
      }
      create_match_simple: {
        Args: {
          p_away_club_id: string
          p_home_club_id: string
          p_kickoff_at: string
          p_matchday_id: string
        }
        Returns: string
      }
      create_matchday: {
        Args: {
          p_display_name?: string
          p_league_season_id: string
          p_number: number
        }
        Returns: string
      }
      create_matchday_auto: {
        Args: {
          p_league_id: string
          p_phase: Database["app"]["Enums"]["matchday_phase"]
        }
        Returns: string
      }
      create_round: {
        Args: {
          p_idempotency_key: string
          p_league_season_id: string
          p_name: string
          p_nickname: string
        }
        Returns: string
      }
      create_season: {
        Args: { p_ends_on: string; p_label: string; p_starts_on: string }
        Returns: string
      }
      create_support_access: {
        Args: {
          p_case_reference: string
          p_duration_minutes?: number
          p_reason: string
          p_round_id: string
        }
        Returns: {
          expires_at: string
          grant_id: string
        }[]
      }
      delete_match_simple: {
        Args: { p_expected_version: number; p_id: string }
        Returns: undefined
      }
      delete_matchday_simple: {
        Args: { p_expected_version: number; p_id: string }
        Returns: undefined
      }
      get_invitation_preview: {
        Args: { p_token_hash: string }
        Returns: {
          expires_at: string
          league_name: string
          round_name: string
          season_label: string
        }[]
      }
      get_support_metadata: {
        Args: { p_grant_id: string }
        Returns: {
          active_invitation: boolean
          active_member_count: number
          created_at: string
          expires_at: string
          has_prediction_activity: boolean
          league_season_id: string
          member_count: number
          object_id: string
          round_status: Database["app"]["Enums"]["round_status"]
        }[]
      }
      hard_delete_round: {
        Args: {
          p_confirmation_name: string
          p_expected_version: number
          p_round_id: string
        }
        Returns: undefined
      }
      join_round: {
        Args: {
          p_idempotency_key: string
          p_nickname: string
          p_token_hash: string
        }
        Returns: string
      }
      leave_round: { Args: { p_round_id: string }; Returns: undefined }
      move_matchday_phase: {
        Args: {
          p_expected_version: number
          p_id: string
          p_phase: Database["app"]["Enums"]["matchday_phase"]
        }
        Returns: number
      }
      prepare_account_deletion: { Args: never; Returns: string }
      publish_admin_league: {
        Args: { p_expected_version: number; p_id: string }
        Returns: number
      }
      reactivate_round: {
        Args: { p_expected_version: number; p_round_id: string }
        Returns: number
      }
      rebuild_all_scores: { Args: never; Returns: number }
      remove_round_member: {
        Args: { p_membership_id: string; p_round_id: string }
        Returns: undefined
      }
      revoke_round_invitation: {
        Args: { p_round_id: string }
        Returns: undefined
      }
      revoke_support_access: {
        Args: { p_grant_id: string }
        Returns: undefined
      }
      rotate_round_invitation: {
        Args: { p_round_id: string; p_token_hash: string }
        Returns: {
          expires_at: string
          invitation_id: string
        }[]
      }
      save_prediction: {
        Args: {
          p_away_goals: number
          p_home_goals: number
          p_idempotency_key: string
          p_match_id: string
          p_round_id: string
        }
        Returns: {
          prediction_id: string
          saved_at: string
        }[]
      }
      save_predictions_batch: {
        Args: { p_predictions: Json; p_round_id: string }
        Returns: {
          saved_at: string
          saved_count: number
        }[]
      }
      set_club_logo_path: {
        Args: { p_expected_version: number; p_id: string; p_logo_path: string }
        Returns: number
      }
      set_match_result: {
        Args: {
          p_away_goals?: number
          p_decision: Database["app"]["Enums"]["result_decision"]
          p_expected_match_version: number
          p_expected_revision: number
          p_home_goals?: number
          p_match_id: string
          p_reason?: string
        }
        Returns: {
          match_version: number
          recalculated_count: number
          revision_no: number
        }[]
      }
      set_match_results_batch: {
        Args: { p_results: Json }
        Returns: {
          match_id: string
          match_version: number
          recalculated_count: number
          revision_no: number
        }[]
      }
      transfer_round_ownership: {
        Args: {
          p_expected_version: number
          p_round_id: string
          p_target_membership_id: string
        }
        Returns: number
      }
      transition_league_season: {
        Args: {
          p_expected_version: number
          p_id: string
          p_status: Database["app"]["Enums"]["league_season_status"]
        }
        Returns: number
      }
      update_admin_league: {
        Args: {
          p_club_ids: string[]
          p_expected_version: number
          p_id: string
          p_name: string
          p_reason?: string
          p_year_label: string
        }
        Returns: number
      }
      update_club: {
        Args: {
          p_expected_version: number
          p_id: string
          p_name: string
          p_short_name: string
          p_status: Database["app"]["Enums"]["club_status"]
        }
        Returns: number
      }
      update_club_simple: {
        Args: {
          p_expected_version: number
          p_id: string
          p_logo_url?: string
          p_name: string
        }
        Returns: number
      }
      update_league: {
        Args: {
          p_expected_version: number
          p_id: string
          p_name: string
          p_short_name: string
          p_status: Database["app"]["Enums"]["catalog_status"]
        }
        Returns: number
      }
      update_match: {
        Args: {
          p_away_club_id: string
          p_expected_version: number
          p_home_club_id: string
          p_id: string
          p_kickoff_at: string
          p_matchday_id: string
          p_status: Database["app"]["Enums"]["match_status"]
        }
        Returns: number
      }
      update_match_simple: {
        Args: {
          p_away_club_id: string
          p_expected_version: number
          p_home_club_id: string
          p_id: string
          p_kickoff_at: string
          p_status: Database["app"]["Enums"]["match_status"]
        }
        Returns: number
      }
      update_matchday: {
        Args: {
          p_display_name: string
          p_expected_version: number
          p_id: string
          p_number: number
          p_status: Database["app"]["Enums"]["matchday_status"]
        }
        Returns: number
      }
      update_my_profile: {
        Args: { new_display_name: string }
        Returns: {
          app_role: Database["app"]["Enums"]["app_role"] | null
          created_at: string | null
          display_name: string | null
          last_active_round_id: string | null
          status: Database["app"]["Enums"]["profile_status"] | null
          updated_at: string | null
          user_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "my_profile"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      update_my_round_nickname: {
        Args: { p_nickname: string; p_round_id: string }
        Returns: undefined
      }
      update_round: {
        Args: {
          p_expected_version: number
          p_league_season_id: string
          p_name: string
          p_round_id: string
        }
        Returns: number
      }
      update_season: {
        Args: {
          p_ends_on: string
          p_expected_version: number
          p_id: string
          p_label: string
          p_starts_on: string
          p_status: Database["app"]["Enums"]["catalog_status"]
        }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  app: {
    Tables: {
      admin_access_events: {
        Row: {
          action: string
          actor_id: string
          grant_id: string
          id: number
          object_id: string
          occurred_at: string
        }
        Insert: {
          action: string
          actor_id: string
          grant_id: string
          id?: never
          object_id: string
          occurred_at?: string
        }
        Update: {
          action?: string
          actor_id?: string
          grant_id?: string
          id?: never
          object_id?: string
          occurred_at?: string
        }
        Relationships: []
      }
      clubs: {
        Row: {
          created_at: string
          id: string
          logo_path: string | null
          logo_url: string | null
          name: string
          short_name: string | null
          status: Database["app"]["Enums"]["club_status"]
          updated_at: string
          version: number
        }
        Insert: {
          created_at?: string
          id?: string
          logo_path?: string | null
          logo_url?: string | null
          name: string
          short_name?: string | null
          status?: Database["app"]["Enums"]["club_status"]
          updated_at?: string
          version?: number
        }
        Update: {
          created_at?: string
          id?: string
          logo_path?: string | null
          logo_url?: string | null
          name?: string
          short_name?: string | null
          status?: Database["app"]["Enums"]["club_status"]
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      league_season_clubs: {
        Row: {
          club_id: string
          created_at: string
          league_season_id: string
          status: Database["app"]["Enums"]["league_season_club_status"]
          updated_at: string
        }
        Insert: {
          club_id: string
          created_at?: string
          league_season_id: string
          status?: Database["app"]["Enums"]["league_season_club_status"]
          updated_at?: string
        }
        Update: {
          club_id?: string
          created_at?: string
          league_season_id?: string
          status?: Database["app"]["Enums"]["league_season_club_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "league_season_clubs_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "league_season_clubs_league_season_id_fkey"
            columns: ["league_season_id"]
            isOneToOne: false
            referencedRelation: "league_seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      league_seasons: {
        Row: {
          archived_at: string | null
          completed_at: string | null
          created_at: string
          id: string
          league_id: string
          published_at: string | null
          season_id: string
          status: Database["app"]["Enums"]["league_season_status"]
          updated_at: string
          version: number
        }
        Insert: {
          archived_at?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          league_id: string
          published_at?: string | null
          season_id: string
          status?: Database["app"]["Enums"]["league_season_status"]
          updated_at?: string
          version?: number
        }
        Update: {
          archived_at?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          league_id?: string
          published_at?: string | null
          season_id?: string
          status?: Database["app"]["Enums"]["league_season_status"]
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "league_seasons_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "league_seasons_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      leagues: {
        Row: {
          created_at: string
          id: string
          name: string
          short_name: string | null
          status: Database["app"]["Enums"]["catalog_status"]
          updated_at: string
          version: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          short_name?: string | null
          status?: Database["app"]["Enums"]["catalog_status"]
          updated_at?: string
          version?: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          short_name?: string | null
          status?: Database["app"]["Enums"]["catalog_status"]
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      match_results: {
        Row: {
          away_goals: number | null
          decision: Database["app"]["Enums"]["result_decision"]
          home_goals: number | null
          match_id: string
          revision_no: number
          updated_at: string
          updated_by: string
        }
        Insert: {
          away_goals?: number | null
          decision: Database["app"]["Enums"]["result_decision"]
          home_goals?: number | null
          match_id: string
          revision_no: number
          updated_at?: string
          updated_by: string
        }
        Update: {
          away_goals?: number | null
          decision?: Database["app"]["Enums"]["result_decision"]
          home_goals?: number | null
          match_id?: string
          revision_no?: number
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_results_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: true
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_results_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      matchdays: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          league_season_id: string
          number: number
          phase: Database["app"]["Enums"]["matchday_phase"]
          status: Database["app"]["Enums"]["matchday_status"]
          updated_at: string
          version: number
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id?: string
          league_season_id: string
          number: number
          phase?: Database["app"]["Enums"]["matchday_phase"]
          status?: Database["app"]["Enums"]["matchday_status"]
          updated_at?: string
          version?: number
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          league_season_id?: string
          number?: number
          phase?: Database["app"]["Enums"]["matchday_phase"]
          status?: Database["app"]["Enums"]["matchday_status"]
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "matchdays_league_season_id_fkey"
            columns: ["league_season_id"]
            isOneToOne: false
            referencedRelation: "league_seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          away_club_id: string
          created_at: string
          home_club_id: string
          id: string
          kickoff_at: string
          matchday_id: string
          status: Database["app"]["Enums"]["match_status"]
          updated_at: string
          version: number
        }
        Insert: {
          away_club_id: string
          created_at?: string
          home_club_id: string
          id?: string
          kickoff_at: string
          matchday_id: string
          status?: Database["app"]["Enums"]["match_status"]
          updated_at?: string
          version?: number
        }
        Update: {
          away_club_id?: string
          created_at?: string
          home_club_id?: string
          id?: string
          kickoff_at?: string
          matchday_id?: string
          status?: Database["app"]["Enums"]["match_status"]
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "matches_away_club_id_fkey"
            columns: ["away_club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_home_club_id_fkey"
            columns: ["home_club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_matchday_id_fkey"
            columns: ["matchday_id"]
            isOneToOne: false
            referencedRelation: "matchdays"
            referencedColumns: ["id"]
          },
        ]
      }
      prediction_rounds: {
        Row: {
          created_at: string
          has_predictions: boolean
          id: string
          league_season_id: string
          name: string
          owner_membership_id: string
          status: Database["app"]["Enums"]["round_status"]
          updated_at: string
          version: number
        }
        Insert: {
          created_at?: string
          has_predictions?: boolean
          id?: string
          league_season_id: string
          name: string
          owner_membership_id: string
          status?: Database["app"]["Enums"]["round_status"]
          updated_at?: string
          version?: number
        }
        Update: {
          created_at?: string
          has_predictions?: boolean
          id?: string
          league_season_id?: string
          name?: string
          owner_membership_id?: string
          status?: Database["app"]["Enums"]["round_status"]
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "prediction_rounds_league_season_id_fkey"
            columns: ["league_season_id"]
            isOneToOne: false
            referencedRelation: "league_seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prediction_rounds_owner_membership_fk"
            columns: ["owner_membership_id"]
            isOneToOne: false
            referencedRelation: "round_memberships"
            referencedColumns: ["id"]
          },
        ]
      }
      prediction_scores: {
        Row: {
          calculated_at: string
          calculation_version: number
          match_id: string
          matchday_id: string
          membership_id: string
          points: number
          prediction_id: string
          result_revision: number
          round_id: string
        }
        Insert: {
          calculated_at?: string
          calculation_version: number
          match_id: string
          matchday_id: string
          membership_id: string
          points: number
          prediction_id: string
          result_revision: number
          round_id: string
        }
        Update: {
          calculated_at?: string
          calculation_version?: number
          match_id?: string
          matchday_id?: string
          membership_id?: string
          points?: number
          prediction_id?: string
          result_revision?: number
          round_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prediction_scores_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prediction_scores_matchday_id_fkey"
            columns: ["matchday_id"]
            isOneToOne: false
            referencedRelation: "matchdays"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prediction_scores_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "round_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prediction_scores_prediction_id_fkey"
            columns: ["prediction_id"]
            isOneToOne: true
            referencedRelation: "predictions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prediction_scores_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "prediction_rounds"
            referencedColumns: ["id"]
          },
        ]
      }
      predictions: {
        Row: {
          away_goals: number
          created_at: string
          home_goals: number
          id: string
          match_id: string
          membership_id: string
          round_id: string
          updated_at: string
        }
        Insert: {
          away_goals: number
          created_at?: string
          home_goals: number
          id?: string
          match_id: string
          membership_id: string
          round_id: string
          updated_at?: string
        }
        Update: {
          away_goals?: number
          created_at?: string
          home_goals?: number
          id?: string
          match_id?: string
          membership_id?: string
          round_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "predictions_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "predictions_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "round_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "predictions_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "prediction_rounds"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          app_role: Database["app"]["Enums"]["app_role"]
          created_at: string
          deletion_pending_at: string | null
          display_name: string
          last_active_round_id: string | null
          status: Database["app"]["Enums"]["profile_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          app_role?: Database["app"]["Enums"]["app_role"]
          created_at?: string
          deletion_pending_at?: string | null
          display_name: string
          last_active_round_id?: string | null
          status?: Database["app"]["Enums"]["profile_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          app_role?: Database["app"]["Enums"]["app_role"]
          created_at?: string
          deletion_pending_at?: string | null
          display_name?: string
          last_active_round_id?: string | null
          status?: Database["app"]["Enums"]["profile_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_last_active_round_fk"
            columns: ["last_active_round_id"]
            isOneToOne: false
            referencedRelation: "prediction_rounds"
            referencedColumns: ["id"]
          },
        ]
      }
      result_revisions: {
        Row: {
          changed_at: string
          changed_by: string
          id: number
          match_id: string
          new_away_goals: number | null
          new_decision: Database["app"]["Enums"]["result_decision"]
          new_home_goals: number | null
          old_away_goals: number | null
          old_decision: Database["app"]["Enums"]["result_decision"] | null
          old_home_goals: number | null
          reason: string | null
          revision_no: number
        }
        Insert: {
          changed_at?: string
          changed_by: string
          id?: never
          match_id: string
          new_away_goals?: number | null
          new_decision: Database["app"]["Enums"]["result_decision"]
          new_home_goals?: number | null
          old_away_goals?: number | null
          old_decision?: Database["app"]["Enums"]["result_decision"] | null
          old_home_goals?: number | null
          reason?: string | null
          revision_no: number
        }
        Update: {
          changed_at?: string
          changed_by?: string
          id?: never
          match_id?: string
          new_away_goals?: number | null
          new_decision?: Database["app"]["Enums"]["result_decision"]
          new_home_goals?: number | null
          old_away_goals?: number | null
          old_decision?: Database["app"]["Enums"]["result_decision"] | null
          old_home_goals?: number | null
          reason?: string | null
          revision_no?: number
        }
        Relationships: [
          {
            foreignKeyName: "result_revisions_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "result_revisions_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      round_memberships: {
        Row: {
          anonymization_key: string | null
          created_at: string
          ended_at: string | null
          id: string
          joined_at: string
          nickname: string
          role: Database["app"]["Enums"]["round_role"]
          round_id: string
          status: Database["app"]["Enums"]["membership_status"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          anonymization_key?: string | null
          created_at?: string
          ended_at?: string | null
          id?: string
          joined_at?: string
          nickname: string
          role: Database["app"]["Enums"]["round_role"]
          round_id: string
          status?: Database["app"]["Enums"]["membership_status"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          anonymization_key?: string | null
          created_at?: string
          ended_at?: string | null
          id?: string
          joined_at?: string
          nickname?: string
          role?: Database["app"]["Enums"]["round_role"]
          round_id?: string
          status?: Database["app"]["Enums"]["membership_status"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "round_memberships_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "prediction_rounds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "round_memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      seasons: {
        Row: {
          created_at: string
          ends_on: string
          id: string
          label: string
          starts_on: string
          status: Database["app"]["Enums"]["catalog_status"]
          updated_at: string
          version: number
        }
        Insert: {
          created_at?: string
          ends_on: string
          id?: string
          label: string
          starts_on: string
          status?: Database["app"]["Enums"]["catalog_status"]
          updated_at?: string
          version?: number
        }
        Update: {
          created_at?: string
          ends_on?: string
          id?: string
          label?: string
          starts_on?: string
          status?: Database["app"]["Enums"]["catalog_status"]
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      app_role: "user" | "app_admin"
      catalog_status: "draft" | "active" | "archived"
      club_status: "active" | "archived"
      league_season_club_status: "active" | "withdrawn"
      league_season_status: "draft" | "published" | "completed" | "archived"
      match_status:
        | "draft"
        | "published"
        | "postponed"
        | "cancelled"
        | "completed"
        | "abandoned"
      matchday_phase: "first_leg" | "second_leg"
      matchday_status: "draft" | "published" | "completed" | "archived"
      membership_status: "active" | "left" | "removed" | "anonymized"
      profile_status: "active" | "deletion_pending" | "disabled"
      result_decision: "official" | "excluded"
      round_role: "owner" | "member"
      round_status: "active" | "archived"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  api: {
    Enums: {},
  },
  app: {
    Enums: {
      app_role: ["user", "app_admin"],
      catalog_status: ["draft", "active", "archived"],
      club_status: ["active", "archived"],
      league_season_club_status: ["active", "withdrawn"],
      league_season_status: ["draft", "published", "completed", "archived"],
      match_status: [
        "draft",
        "published",
        "postponed",
        "cancelled",
        "completed",
        "abandoned",
      ],
      matchday_phase: ["first_leg", "second_leg"],
      matchday_status: ["draft", "published", "completed", "archived"],
      membership_status: ["active", "left", "removed", "anonymized"],
      profile_status: ["active", "deletion_pending", "disabled"],
      result_decision: ["official", "excluded"],
      round_role: ["owner", "member"],
      round_status: ["active", "archived"],
    },
  },
} as const

