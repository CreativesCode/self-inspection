export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      activities: {
        Row: {
          activity_text: string
          created_at: string
          id: string
          inspection_type_id: string
          updated_at: string
        }
        Insert: {
          activity_text: string
          created_at?: string
          id?: string
          inspection_type_id: string
          updated_at?: string
        }
        Update: {
          activity_text?: string
          created_at?: string
          id?: string
          inspection_type_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_inspection_type_id_fkey"
            columns: ["inspection_type_id"]
            isOneToOne: false
            referencedRelation: "inspection_types"
            referencedColumns: ["id"]
          },
        ]
      }
      answers: {
        Row: {
          answer_text: Database["public"]["Enums"]["answer_choice"]
          created_at: string
          id: string
          observation_id: string | null
          poll_id: string
          question_id: string
          updated_at: string
        }
        Insert: {
          answer_text?: Database["public"]["Enums"]["answer_choice"]
          created_at?: string
          id?: string
          observation_id?: string | null
          poll_id: string
          question_id: string
          updated_at?: string
        }
        Update: {
          answer_text?: Database["public"]["Enums"]["answer_choice"]
          created_at?: string
          id?: string
          observation_id?: string | null
          poll_id?: string
          question_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "answers_observation_id_fkey"
            columns: ["observation_id"]
            isOneToOne: false
            referencedRelation: "observations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "answers_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      auth_group: {
        Row: {
          id: number
          name: string
        }
        Insert: {
          id?: number
          name: string
        }
        Update: {
          id?: number
          name?: string
        }
        Relationships: []
      }
      auth_group_permissions: {
        Row: {
          group_id: number
          id: number
          permission_id: number
        }
        Insert: {
          group_id: number
          id?: number
          permission_id: number
        }
        Update: {
          group_id?: number
          id?: number
          permission_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "auth_group_permissio_permission_id_84c5c92e_fk_auth_perm"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "auth_permission"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auth_group_permissions_group_id_b120cbf9_fk_auth_group_id"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "auth_group"
            referencedColumns: ["id"]
          },
        ]
      }
      auth_permission: {
        Row: {
          codename: string
          content_type_id: number
          id: number
          name: string
        }
        Insert: {
          codename: string
          content_type_id: number
          id?: number
          name: string
        }
        Update: {
          codename?: string
          content_type_id?: number
          id?: number
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "auth_permission_content_type_id_2f476e4b_fk_django_co"
            columns: ["content_type_id"]
            isOneToOne: false
            referencedRelation: "django_content_type"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          client_name: string
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          client_name: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          client_name?: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      django_admin_log: {
        Row: {
          action_flag: number
          action_time: string
          change_message: string
          content_type_id: number | null
          id: number
          object_id: string | null
          object_repr: string
          user_id: number
        }
        Insert: {
          action_flag: number
          action_time: string
          change_message: string
          content_type_id?: number | null
          id?: number
          object_id?: string | null
          object_repr: string
          user_id: number
        }
        Update: {
          action_flag?: number
          action_time?: string
          change_message?: string
          content_type_id?: number | null
          id?: number
          object_id?: string | null
          object_repr?: string
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "django_admin_log_content_type_id_c4bce8eb_fk_django_co"
            columns: ["content_type_id"]
            isOneToOne: false
            referencedRelation: "django_content_type"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "django_admin_log_user_id_c564eba6_fk_user_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_user"
            referencedColumns: ["id"]
          },
        ]
      }
      django_celery_beat_clockedschedule: {
        Row: {
          clocked_time: string
          id: number
        }
        Insert: {
          clocked_time: string
          id?: number
        }
        Update: {
          clocked_time?: string
          id?: number
        }
        Relationships: []
      }
      django_celery_beat_crontabschedule: {
        Row: {
          day_of_month: string
          day_of_week: string
          hour: string
          id: number
          minute: string
          month_of_year: string
          timezone: string
        }
        Insert: {
          day_of_month: string
          day_of_week: string
          hour: string
          id?: number
          minute: string
          month_of_year: string
          timezone: string
        }
        Update: {
          day_of_month?: string
          day_of_week?: string
          hour?: string
          id?: number
          minute?: string
          month_of_year?: string
          timezone?: string
        }
        Relationships: []
      }
      django_celery_beat_intervalschedule: {
        Row: {
          every: number
          id: number
          period: string
        }
        Insert: {
          every: number
          id?: number
          period: string
        }
        Update: {
          every?: number
          id?: number
          period?: string
        }
        Relationships: []
      }
      django_celery_beat_periodictask: {
        Row: {
          args: string
          clocked_id: number | null
          crontab_id: number | null
          date_changed: string
          description: string
          enabled: boolean
          exchange: string | null
          expire_seconds: number | null
          expires: string | null
          headers: string
          id: number
          interval_id: number | null
          kwargs: string
          last_run_at: string | null
          name: string
          one_off: boolean
          priority: number | null
          queue: string | null
          routing_key: string | null
          solar_id: number | null
          start_time: string | null
          task: string
          total_run_count: number
        }
        Insert: {
          args: string
          clocked_id?: number | null
          crontab_id?: number | null
          date_changed: string
          description: string
          enabled: boolean
          exchange?: string | null
          expire_seconds?: number | null
          expires?: string | null
          headers: string
          id?: number
          interval_id?: number | null
          kwargs: string
          last_run_at?: string | null
          name: string
          one_off: boolean
          priority?: number | null
          queue?: string | null
          routing_key?: string | null
          solar_id?: number | null
          start_time?: string | null
          task: string
          total_run_count: number
        }
        Update: {
          args?: string
          clocked_id?: number | null
          crontab_id?: number | null
          date_changed?: string
          description?: string
          enabled?: boolean
          exchange?: string | null
          expire_seconds?: number | null
          expires?: string | null
          headers?: string
          id?: number
          interval_id?: number | null
          kwargs?: string
          last_run_at?: string | null
          name?: string
          one_off?: boolean
          priority?: number | null
          queue?: string | null
          routing_key?: string | null
          solar_id?: number | null
          start_time?: string | null
          task?: string
          total_run_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "django_celery_beat_p_clocked_id_47a69f82_fk_django_ce"
            columns: ["clocked_id"]
            isOneToOne: false
            referencedRelation: "django_celery_beat_clockedschedule"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "django_celery_beat_p_crontab_id_d3cba168_fk_django_ce"
            columns: ["crontab_id"]
            isOneToOne: false
            referencedRelation: "django_celery_beat_crontabschedule"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "django_celery_beat_p_interval_id_a8ca27da_fk_django_ce"
            columns: ["interval_id"]
            isOneToOne: false
            referencedRelation: "django_celery_beat_intervalschedule"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "django_celery_beat_p_solar_id_a87ce72c_fk_django_ce"
            columns: ["solar_id"]
            isOneToOne: false
            referencedRelation: "django_celery_beat_solarschedule"
            referencedColumns: ["id"]
          },
        ]
      }
      django_celery_beat_periodictasks: {
        Row: {
          ident: number
          last_update: string
        }
        Insert: {
          ident: number
          last_update: string
        }
        Update: {
          ident?: number
          last_update?: string
        }
        Relationships: []
      }
      django_celery_beat_solarschedule: {
        Row: {
          event: string
          id: number
          latitude: number
          longitude: number
        }
        Insert: {
          event: string
          id?: number
          latitude: number
          longitude: number
        }
        Update: {
          event?: string
          id?: number
          latitude?: number
          longitude?: number
        }
        Relationships: []
      }
      django_content_type: {
        Row: {
          app_label: string
          id: number
          model: string
        }
        Insert: {
          app_label: string
          id?: number
          model: string
        }
        Update: {
          app_label?: string
          id?: number
          model?: string
        }
        Relationships: []
      }
      django_migrations: {
        Row: {
          app: string
          applied: string
          id: number
          name: string
        }
        Insert: {
          app: string
          applied: string
          id?: number
          name: string
        }
        Update: {
          app?: string
          applied?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      django_session: {
        Row: {
          expire_date: string
          session_data: string
          session_key: string
        }
        Insert: {
          expire_date: string
          session_data: string
          session_key: string
        }
        Update: {
          expire_date?: string
          session_data?: string
          session_key?: string
        }
        Relationships: []
      }
      evaluations: {
        Row: {
          created_at: string
          id: string
          inspection_id: string
          max_possible_score: number
          percentage: number | null
          poll_id: string
          rating: Database["public"]["Enums"]["evaluation_rating"] | null
          total_score: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          inspection_id: string
          max_possible_score?: number
          percentage?: number | null
          poll_id: string
          rating?: Database["public"]["Enums"]["evaluation_rating"] | null
          total_score?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          inspection_id?: string
          max_possible_score?: number
          percentage?: number | null
          poll_id?: string
          rating?: Database["public"]["Enums"]["evaluation_rating"] | null
          total_score?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "evaluations_inspection_id_fkey"
            columns: ["inspection_id"]
            isOneToOne: false
            referencedRelation: "inspections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluations_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: true
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
        ]
      }
      headers: {
        Row: {
          created_at: string
          header_text: string
          id: string
          inspection_type_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          header_text: string
          id?: string
          inspection_type_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          header_text?: string
          id?: string
          inspection_type_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "headers_inspection_type_id_fkey"
            columns: ["inspection_type_id"]
            isOneToOne: false
            referencedRelation: "inspection_types"
            referencedColumns: ["id"]
          },
        ]
      }
      inspection_activities: {
        Row: {
          activity_id: string
          inspection_id: string
        }
        Insert: {
          activity_id: string
          inspection_id: string
        }
        Update: {
          activity_id?: string
          inspection_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspection_activities_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspection_activities_inspection_id_fkey"
            columns: ["inspection_id"]
            isOneToOne: false
            referencedRelation: "inspections"
            referencedColumns: ["id"]
          },
        ]
      }
      inspection_activity: {
        Row: {
          activity_text: string
          created_at: string
          id: number
          inspection_type_id: number
          updated_at: string
        }
        Insert: {
          activity_text: string
          created_at: string
          id?: number
          inspection_type_id: number
          updated_at: string
        }
        Update: {
          activity_text?: string
          created_at?: string
          id?: number
          inspection_type_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspection_activity_inspection_type_id_b5880ae9_fk_inspectio"
            columns: ["inspection_type_id"]
            isOneToOne: false
            referencedRelation: "inspection_inspectiontype"
            referencedColumns: ["id"]
          },
        ]
      }
      inspection_client: {
        Row: {
          client_name: string
          created_at: string
          id: number
          updated_at: string
        }
        Insert: {
          client_name: string
          created_at: string
          id?: number
          updated_at: string
        }
        Update: {
          client_name?: string
          created_at?: string
          id?: number
          updated_at?: string
        }
        Relationships: []
      }
      inspection_evaluation: {
        Row: {
          created_at: string
          id: number
          inspection_id: number
          max_possible_score: number
          poll_id: number
          total_score: number
          updated_at: string
        }
        Insert: {
          created_at: string
          id?: number
          inspection_id: number
          max_possible_score: number
          poll_id: number
          total_score: number
          updated_at: string
        }
        Update: {
          created_at?: string
          id?: number
          inspection_id?: number
          max_possible_score?: number
          poll_id?: number
          total_score?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspection_evaluatio_inspection_id_bf3b7c56_fk_inspectio"
            columns: ["inspection_id"]
            isOneToOne: false
            referencedRelation: "inspection_inspection"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspection_evaluation_poll_id_81c62cb9_fk_poll_poll_id"
            columns: ["poll_id"]
            isOneToOne: true
            referencedRelation: "poll_poll"
            referencedColumns: ["id"]
          },
        ]
      }
      inspection_inspection: {
        Row: {
          client_id: number
          created_at: string
          date_time: string
          GPS_latitude: number
          GPS_longitude: number
          id: number
          inspection_type_id: number
          instalation_name: string
          observation_id: number | null
          project_code: string
          updated_at: string
          user_id: number
        }
        Insert: {
          client_id: number
          created_at: string
          date_time: string
          GPS_latitude: number
          GPS_longitude: number
          id?: number
          inspection_type_id: number
          instalation_name: string
          observation_id?: number | null
          project_code: string
          updated_at: string
          user_id: number
        }
        Update: {
          client_id?: number
          created_at?: string
          date_time?: string
          GPS_latitude?: number
          GPS_longitude?: number
          id?: number
          inspection_type_id?: number
          instalation_name?: string
          observation_id?: number | null
          project_code?: string
          updated_at?: string
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "inspection_inspectio_client_id_471240cb_fk_inspectio"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "inspection_client"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspection_inspectio_inspection_type_id_7914d8bb_fk_inspectio"
            columns: ["inspection_type_id"]
            isOneToOne: false
            referencedRelation: "inspection_inspectiontype"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspection_inspectio_observation_id_a31cb6cb_fk_inspectio"
            columns: ["observation_id"]
            isOneToOne: false
            referencedRelation: "inspection_observation"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspection_inspection_user_id_68677cae_fk_user_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_user"
            referencedColumns: ["id"]
          },
        ]
      }
      inspection_inspection_activity: {
        Row: {
          activity_id: number
          id: number
          inspection_id: number
        }
        Insert: {
          activity_id: number
          id?: number
          inspection_id: number
        }
        Update: {
          activity_id?: number
          id?: number
          inspection_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "inspection_inspectio_activity_id_aebbe938_fk_inspectio"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "inspection_activity"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspection_inspectio_inspection_id_e218c60f_fk_inspectio"
            columns: ["inspection_id"]
            isOneToOne: false
            referencedRelation: "inspection_inspection"
            referencedColumns: ["id"]
          },
        ]
      }
      inspection_inspection_subcontrate_name: {
        Row: {
          id: number
          inspection_id: number
          subcontratename_id: number
        }
        Insert: {
          id?: number
          inspection_id: number
          subcontratename_id: number
        }
        Update: {
          id?: number
          inspection_id?: number
          subcontratename_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "inspection_inspectio_inspection_id_c2115d09_fk_inspectio"
            columns: ["inspection_id"]
            isOneToOne: false
            referencedRelation: "inspection_inspection"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspection_inspectio_subcontratename_id_5086ddd2_fk_inspectio"
            columns: ["subcontratename_id"]
            isOneToOne: false
            referencedRelation: "inspection_subcontratename"
            referencedColumns: ["id"]
          },
        ]
      }
      inspection_inspectiontype: {
        Row: {
          created_at: string
          id: number
          name: string
          updated_at: string
        }
        Insert: {
          created_at: string
          id?: number
          name: string
          updated_at: string
        }
        Update: {
          created_at?: string
          id?: number
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      inspection_observation: {
        Row: {
          created_at: string
          id: number
          observation_text: string | null
          updated_at: string
        }
        Insert: {
          created_at: string
          id?: number
          observation_text?: string | null
          updated_at: string
        }
        Update: {
          created_at?: string
          id?: number
          observation_text?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      inspection_observationphoto: {
        Row: {
          created_at: string
          id: number
          observation_id: number
          photo: string
        }
        Insert: {
          created_at: string
          id?: number
          observation_id: number
          photo: string
        }
        Update: {
          created_at?: string
          id?: number
          observation_id?: number
          photo?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspection_observati_observation_id_8c4c4b0d_fk_inspectio"
            columns: ["observation_id"]
            isOneToOne: false
            referencedRelation: "inspection_observation"
            referencedColumns: ["id"]
          },
        ]
      }
      inspection_reportjob: {
        Row: {
          created_at: string
          download_url: string | null
          error: string | null
          expires_at: string | null
          format: string
          id: number
          inspection_id: number
          locale: string
          object_key: string | null
          requested_by_id: number | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at: string
          download_url?: string | null
          error?: string | null
          expires_at?: string | null
          format: string
          id?: number
          inspection_id: number
          locale: string
          object_key?: string | null
          requested_by_id?: number | null
          status: string
          updated_at: string
        }
        Update: {
          created_at?: string
          download_url?: string | null
          error?: string | null
          expires_at?: string | null
          format?: string
          id?: number
          inspection_id?: number
          locale?: string
          object_key?: string | null
          requested_by_id?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspection_reportjob_inspection_id_0c739875_fk_inspectio"
            columns: ["inspection_id"]
            isOneToOne: false
            referencedRelation: "inspection_inspection"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspection_reportjob_requested_by_id_b7ce4201_fk_user_user_id"
            columns: ["requested_by_id"]
            isOneToOne: false
            referencedRelation: "user_user"
            referencedColumns: ["id"]
          },
        ]
      }
      inspection_subcontracts: {
        Row: {
          inspection_id: string
          subcontrate_name_id: string
        }
        Insert: {
          inspection_id: string
          subcontrate_name_id: string
        }
        Update: {
          inspection_id?: string
          subcontrate_name_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspection_subcontracts_inspection_id_fkey"
            columns: ["inspection_id"]
            isOneToOne: false
            referencedRelation: "inspections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspection_subcontracts_subcontrate_name_id_fkey"
            columns: ["subcontrate_name_id"]
            isOneToOne: false
            referencedRelation: "subcontrate_names"
            referencedColumns: ["id"]
          },
        ]
      }
      inspection_subcontratename: {
        Row: {
          created_at: string
          id: number
          subcontrate_name: string
          updated_at: string
        }
        Insert: {
          created_at: string
          id?: number
          subcontrate_name: string
          updated_at: string
        }
        Update: {
          created_at?: string
          id?: number
          subcontrate_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      inspection_types: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      inspections: {
        Row: {
          client_id: string
          created_at: string
          date_time: string
          gps_latitude: number
          gps_longitude: number
          id: string
          inspection_type_id: string
          instalation_name: string
          observation_id: string | null
          project_code: string
          updated_at: string
          user_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          date_time: string
          gps_latitude: number
          gps_longitude: number
          id?: string
          inspection_type_id: string
          instalation_name: string
          observation_id?: string | null
          project_code: string
          updated_at?: string
          user_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          date_time?: string
          gps_latitude?: number
          gps_longitude?: number
          id?: string
          inspection_type_id?: string
          instalation_name?: string
          observation_id?: string | null
          project_code?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspections_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspections_inspection_type_id_fkey"
            columns: ["inspection_type_id"]
            isOneToOne: false
            referencedRelation: "inspection_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspections_observation_id_fkey"
            columns: ["observation_id"]
            isOneToOne: false
            referencedRelation: "observations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_label: string
          action_url: string
          body: string
          category: Database["public"]["Enums"]["notification_category"]
          created_at: string
          id: string
          inspection_id: string | null
          is_read: boolean
          read_at: string | null
          recipient_id: string
          report_job_id: string | null
          title: string
          tone: Database["public"]["Enums"]["notification_tone"]
          type: Database["public"]["Enums"]["notification_type"]
        }
        Insert: {
          action_label?: string
          action_url?: string
          body?: string
          category?: Database["public"]["Enums"]["notification_category"]
          created_at?: string
          id?: string
          inspection_id?: string | null
          is_read?: boolean
          read_at?: string | null
          recipient_id: string
          report_job_id?: string | null
          title: string
          tone?: Database["public"]["Enums"]["notification_tone"]
          type: Database["public"]["Enums"]["notification_type"]
        }
        Update: {
          action_label?: string
          action_url?: string
          body?: string
          category?: Database["public"]["Enums"]["notification_category"]
          created_at?: string
          id?: string
          inspection_id?: string | null
          is_read?: boolean
          read_at?: string | null
          recipient_id?: string
          report_job_id?: string | null
          title?: string
          tone?: Database["public"]["Enums"]["notification_tone"]
          type?: Database["public"]["Enums"]["notification_type"]
        }
        Relationships: [
          {
            foreignKeyName: "notifications_inspection_id_fkey"
            columns: ["inspection_id"]
            isOneToOne: false
            referencedRelation: "inspections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_report_job_fk"
            columns: ["report_job_id"]
            isOneToOne: false
            referencedRelation: "report_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications_notification: {
        Row: {
          action_label: string
          action_url: string
          body: string
          category: string
          created_at: string
          id: number
          inspection_id: number | null
          is_read: boolean
          read_at: string | null
          recipient_id: number
          report_job_id: number | null
          title: string
          tone: string
          type: string
        }
        Insert: {
          action_label: string
          action_url: string
          body: string
          category: string
          created_at: string
          id?: number
          inspection_id?: number | null
          is_read: boolean
          read_at?: string | null
          recipient_id: number
          report_job_id?: number | null
          title: string
          tone: string
          type: string
        }
        Update: {
          action_label?: string
          action_url?: string
          body?: string
          category?: string
          created_at?: string
          id?: number
          inspection_id?: number | null
          is_read?: boolean
          read_at?: string | null
          recipient_id?: number
          report_job_id?: number | null
          title?: string
          tone?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_notifi_inspection_id_5139a53d_fk_inspectio"
            columns: ["inspection_id"]
            isOneToOne: false
            referencedRelation: "inspection_inspection"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_notifi_recipient_id_d055f3f0_fk_user_user"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "user_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_notifi_report_job_id_195edb05_fk_inspectio"
            columns: ["report_job_id"]
            isOneToOne: false
            referencedRelation: "inspection_reportjob"
            referencedColumns: ["id"]
          },
        ]
      }
      observation_photos: {
        Row: {
          created_at: string
          id: string
          observation_id: string
          storage_path: string
        }
        Insert: {
          created_at?: string
          id?: string
          observation_id: string
          storage_path: string
        }
        Update: {
          created_at?: string
          id?: string
          observation_id?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "observation_photos_observation_id_fkey"
            columns: ["observation_id"]
            isOneToOne: false
            referencedRelation: "observations"
            referencedColumns: ["id"]
          },
        ]
      }
      observations: {
        Row: {
          created_at: string
          id: string
          observation_text: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          observation_text?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          observation_text?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      poll_answer: {
        Row: {
          answer_text: string
          created_at: string
          id: number
          observation_id: number | null
          poll_id: number
          question_id: number
          updated_at: string
        }
        Insert: {
          answer_text: string
          created_at: string
          id?: number
          observation_id?: number | null
          poll_id: number
          question_id: number
          updated_at: string
        }
        Update: {
          answer_text?: string
          created_at?: string
          id?: number
          observation_id?: number | null
          poll_id?: number
          question_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "poll_answer_observation_id_9e9d9fc1_fk_inspectio"
            columns: ["observation_id"]
            isOneToOne: false
            referencedRelation: "inspection_observation"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "poll_answer_poll_id_d8ca13d9_fk_poll_poll_id"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "poll_poll"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "poll_answer_question_id_5315c1b7_fk_poll_question_id"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "poll_question"
            referencedColumns: ["id"]
          },
        ]
      }
      poll_header: {
        Row: {
          created_at: string
          header_text: string
          id: number
          inspection_type_id: number
          updated_at: string
        }
        Insert: {
          created_at: string
          header_text: string
          id?: number
          inspection_type_id: number
          updated_at: string
        }
        Update: {
          created_at?: string
          header_text?: string
          id?: number
          inspection_type_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "poll_header_inspection_type_id_a64c70d9_fk_inspectio"
            columns: ["inspection_type_id"]
            isOneToOne: false
            referencedRelation: "inspection_inspectiontype"
            referencedColumns: ["id"]
          },
        ]
      }
      poll_poll: {
        Row: {
          created_at: string
          id: number
          inspection_id: number
          status: string
          updated_at: string
        }
        Insert: {
          created_at: string
          id?: number
          inspection_id: number
          status: string
          updated_at: string
        }
        Update: {
          created_at?: string
          id?: number
          inspection_id?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "poll_poll_inspection_id_b05bb611_fk_inspection_inspection_id"
            columns: ["inspection_id"]
            isOneToOne: true
            referencedRelation: "inspection_inspection"
            referencedColumns: ["id"]
          },
        ]
      }
      poll_poll_question: {
        Row: {
          id: number
          poll_id: number
          question_id: number
        }
        Insert: {
          id?: number
          poll_id: number
          question_id: number
        }
        Update: {
          id?: number
          poll_id?: number
          question_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "poll_poll_question_poll_id_375dc375_fk_poll_poll_id"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "poll_poll"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "poll_poll_question_question_id_fd52e1a4_fk_poll_question_id"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "poll_question"
            referencedColumns: ["id"]
          },
        ]
      }
      poll_question: {
        Row: {
          created_at: string
          header_id: number
          id: number
          question_text: string
          updated_at: string
        }
        Insert: {
          created_at: string
          header_id: number
          id?: number
          question_text: string
          updated_at: string
        }
        Update: {
          created_at?: string
          header_id?: number
          id?: number
          question_text?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "poll_question_header_id_d46e79d3_fk_poll_header_id"
            columns: ["header_id"]
            isOneToOne: false
            referencedRelation: "poll_header"
            referencedColumns: ["id"]
          },
        ]
      }
      poll_questions: {
        Row: {
          poll_id: string
          question_id: string
        }
        Insert: {
          poll_id: string
          question_id: string
        }
        Update: {
          poll_id?: string
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "poll_questions_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "poll_questions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      polls: {
        Row: {
          created_at: string
          id: string
          inspection_id: string
          status: Database["public"]["Enums"]["poll_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          inspection_id: string
          status?: Database["public"]["Enums"]["poll_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          inspection_id?: string
          status?: Database["public"]["Enums"]["poll_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "polls_inspection_id_fkey"
            columns: ["inspection_id"]
            isOneToOne: true
            referencedRelation: "inspections"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          bio: string | null
          created_at: string
          email: string
          first_name: string
          id: string
          is_active: boolean
          last_name: string
          phone_number: string | null
          profile_picture: string | null
          updated_at: string
          user_type: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          address?: string | null
          bio?: string | null
          created_at?: string
          email: string
          first_name: string
          id: string
          is_active?: boolean
          last_name: string
          phone_number?: string | null
          profile_picture?: string | null
          updated_at?: string
          user_type?: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          address?: string | null
          bio?: string | null
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          is_active?: boolean
          last_name?: string
          phone_number?: string | null
          profile_picture?: string | null
          updated_at?: string
          user_type?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: []
      }
      questions: {
        Row: {
          created_at: string
          header_id: string
          id: string
          question_text: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          header_id: string
          id?: string
          question_text: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          header_id?: string
          id?: string
          question_text?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_header_id_fkey"
            columns: ["header_id"]
            isOneToOne: false
            referencedRelation: "headers"
            referencedColumns: ["id"]
          },
        ]
      }
      refresh_token_refreshtoken: {
        Row: {
          created: string
          id: number
          revoked: string | null
          token: string
          user_id: number
        }
        Insert: {
          created: string
          id?: number
          revoked?: string | null
          token: string
          user_id: number
        }
        Update: {
          created?: string
          id?: number
          revoked?: string | null
          token?: string
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "refresh_token_refreshtoken_user_id_45383307_fk_user_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_user"
            referencedColumns: ["id"]
          },
        ]
      }
      report_jobs: {
        Row: {
          created_at: string
          download_url: string | null
          error: string | null
          expires_at: string | null
          format: Database["public"]["Enums"]["report_format"]
          id: string
          inspection_id: string
          locale: string
          requested_by: string | null
          status: Database["public"]["Enums"]["report_status"]
          storage_path: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          download_url?: string | null
          error?: string | null
          expires_at?: string | null
          format?: Database["public"]["Enums"]["report_format"]
          id?: string
          inspection_id: string
          locale?: string
          requested_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          storage_path?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          download_url?: string | null
          error?: string | null
          expires_at?: string | null
          format?: Database["public"]["Enums"]["report_format"]
          id?: string
          inspection_id?: string
          locale?: string
          requested_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          storage_path?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_jobs_inspection_id_fkey"
            columns: ["inspection_id"]
            isOneToOne: false
            referencedRelation: "inspections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_jobs_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subcontrate_names: {
        Row: {
          created_at: string
          id: string
          subcontrate_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          subcontrate_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          subcontrate_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_user: {
        Row: {
          date_joined: string
          email: string
          first_name: string
          id: number
          is_active: boolean
          is_staff: boolean
          is_superuser: boolean
          last_login: string
          last_name: string
          password: string
          user_type: string
        }
        Insert: {
          date_joined: string
          email: string
          first_name: string
          id?: number
          is_active: boolean
          is_staff: boolean
          is_superuser: boolean
          last_login: string
          last_name: string
          password: string
          user_type: string
        }
        Update: {
          date_joined?: string
          email?: string
          first_name?: string
          id?: number
          is_active?: boolean
          is_staff?: boolean
          is_superuser?: boolean
          last_login?: string
          last_name?: string
          password?: string
          user_type?: string
        }
        Relationships: []
      }
      user_user_groups: {
        Row: {
          group_id: number
          id: number
          user_id: number
        }
        Insert: {
          group_id: number
          id?: number
          user_id: number
        }
        Update: {
          group_id?: number
          id?: number
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_user_groups_group_id_c57f13c0_fk_auth_group_id"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "auth_group"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_user_groups_user_id_13f9a20d_fk_user_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_user"
            referencedColumns: ["id"]
          },
        ]
      }
      user_user_user_permissions: {
        Row: {
          id: number
          permission_id: number
          user_id: number
        }
        Insert: {
          id?: number
          permission_id: number
          user_id: number
        }
        Update: {
          id?: number
          permission_id?: number
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_user_user_permi_permission_id_ce49d4de_fk_auth_perm"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "auth_permission"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_user_user_permissions_user_id_31782f58_fk_user_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_user"
            referencedColumns: ["id"]
          },
        ]
      }
      user_userprofile: {
        Row: {
          address: string | null
          bio: string | null
          created_at: string
          id: number
          phone_number: string | null
          profile_picture: string | null
          updated_at: string
          user_id: number
        }
        Insert: {
          address?: string | null
          bio?: string | null
          created_at: string
          id?: number
          phone_number?: string | null
          profile_picture?: string | null
          updated_at: string
          user_id: number
        }
        Update: {
          address?: string | null
          bio?: string | null
          created_at?: string
          id?: number
          phone_number?: string | null
          profile_picture?: string | null
          updated_at?: string
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_userprofile_user_id_2474538d_fk_user_user_id"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_user"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_and_jefe_recipients: {
        Args: { p_exclude_user?: string }
        Returns: string[]
      }
      auth_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      inspection_detail_url: {
        Args: { p_inspection_id: string }
        Returns: string
      }
      is_active_user: { Args: never; Returns: boolean }
      is_admin: { Args: never; Returns: boolean }
      is_admin_or_jefe: { Args: never; Returns: boolean }
      is_operational_user: { Args: never; Returns: boolean }
      recalculate_evaluation: {
        Args: { p_poll_id: string }
        Returns: undefined
      }
      remind_pending_inspections: { Args: never; Returns: number }
    }
    Enums: {
      answer_choice: "good" | "regular" | "bad" | "not_applicable"
      evaluation_rating: "excelente" | "bueno" | "regular" | "deficiente"
      notification_category: "inspections" | "team" | "system" | "critical"
      notification_tone: "ok" | "warn" | "bad" | "info" | "neutral"
      notification_type:
        | "inspection_created"
        | "inspection_completed"
        | "inspection_pending"
        | "ranking_changed"
        | "report_ready"
      poll_status: "pending" | "completed"
      report_format: "pdf" | "docx"
      report_status: "queued" | "running" | "done" | "failed"
      user_role:
        | "administrador"
        | "jefe_de_obra"
        | "tecnico"
        | "jefe_de_trabajo"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      answer_choice: ["good", "regular", "bad", "not_applicable"],
      evaluation_rating: ["excelente", "bueno", "regular", "deficiente"],
      notification_category: ["inspections", "team", "system", "critical"],
      notification_tone: ["ok", "warn", "bad", "info", "neutral"],
      notification_type: [
        "inspection_created",
        "inspection_completed",
        "inspection_pending",
        "ranking_changed",
        "report_ready",
      ],
      poll_status: ["pending", "completed"],
      report_format: ["pdf", "docx"],
      report_status: ["queued", "running", "done", "failed"],
      user_role: [
        "administrador",
        "jefe_de_obra",
        "tecnico",
        "jefe_de_trabajo",
      ],
    },
  },
} as const
