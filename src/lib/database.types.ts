export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ThemeConfig = {
  preset?: "mint" | "midnight" | "sunset" | "mono" | "candy";
  accent?: string;
  background?: string;
  buttonStyle?: "solid" | "outline" | "soft";
  font?: "sans" | "serif" | "mono";
  cornerStyle?: "rounded" | "pill" | "square";
  avatarShape?: "circle" | "squircle" | "square";
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          display_name: string;
          bio: string;
          avatar_url: string | null;
          theme_config: Json;
          created_at: string;
        };
        Insert: {
          id: string;
          username: string;
          display_name?: string;
          bio?: string;
          avatar_url?: string | null;
          theme_config?: Json;
          created_at?: string;
        };
        Update: {
          id?: never;
          username?: string;
          display_name?: string;
          bio?: string;
          avatar_url?: string | null;
          theme_config?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      links: {
        Row: {
          id: string;
          profile_id: string;
          title: string;
          url: string;
          icon: string;
          position: number;
          is_active: boolean;
          display_mode: "classic" | "featured";
          thumbnail_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          title: string;
          url: string;
          icon?: string;
          position?: number;
          is_active?: boolean;
          display_mode?: "classic" | "featured";
          thumbnail_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          title?: string;
          url?: string;
          icon?: string;
          position?: number;
          is_active?: boolean;
          display_mode?: "classic" | "featured";
          thumbnail_url?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "links_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      analytics_events: {
        Row: {
          id: number;
          profile_id: string;
          link_id: string | null;
          event_type: "page_view" | "link_click";
          referrer: string | null;
          created_at: string;
        };
        Insert: {
          id?: never;
          profile_id: string;
          link_id?: string | null;
          event_type: "page_view" | "link_click";
          referrer?: string | null;
          created_at?: string;
        };
        Update: {
          id?: never;
          profile_id?: string;
          link_id?: string | null;
          event_type?: "page_view" | "link_click";
          referrer?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "analytics_events_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "analytics_events_link_id_fkey";
            columns: ["link_id"];
            isOneToOne: false;
            referencedRelation: "links";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      reorder_links: {
        Args: { p_order: string[] };
        Returns: undefined;
      };
      record_link_click: {
        Args: { p_link_id: string; p_referrer?: string | null };
        Returns: undefined;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type Profile = Tables<"profiles">;
export type Link = Tables<"links">;
