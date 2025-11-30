-- VM-AI Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User Profiles Table
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  agency_name TEXT,
  subscription_tier TEXT NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'enterprise')),
  credits_remaining INTEGER DEFAULT 3,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Campaigns Table
CREATE TABLE IF NOT EXISTS public.campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_name TEXT NOT NULL,
  product_description TEXT NOT NULL,
  target_audience JSONB DEFAULT '{}',
  desired_emotion TEXT DEFAULT 'neutral',
  budget_range TEXT,
  platform TEXT DEFAULT 'tiktok' CHECK (platform IN ('tiktok', 'instagram_reels', 'youtube_shorts')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Generated Ideas Table
CREATE TABLE IF NOT EXISTS public.generated_ideas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  concept_title TEXT NOT NULL,
  concept_description TEXT,
  hook_script TEXT,
  full_script TEXT NOT NULL,
  virality_score FLOAT CHECK (virality_score >= 0 AND virality_score <= 100),
  predicted_views INTEGER,
  predicted_shares INTEGER,
  predicted_watch_time FLOAT,
  features JSONB DEFAULT '{}',
  storyboard_url TEXT,
  voiceover_url TEXT,
  rough_video_url TEXT,
  rank INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Idea Analytics Table
CREATE TABLE IF NOT EXISTS public.idea_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  idea_id UUID NOT NULL REFERENCES public.generated_ideas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('viewed', 'exported', 'launched', 'reported_results')),
  actual_views INTEGER,
  actual_roi FLOAT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idea_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for campaigns
CREATE POLICY "Users can view own campaigns" ON public.campaigns
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create campaigns" ON public.campaigns
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own campaigns" ON public.campaigns
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own campaigns" ON public.campaigns
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for generated_ideas
CREATE POLICY "Users can view ideas for own campaigns" ON public.generated_ideas
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE campaigns.id = generated_ideas.campaign_id
      AND campaigns.user_id = auth.uid()
    )
  );

-- RLS Policies for idea_analytics
CREATE POLICY "Users can view own analytics" ON public.idea_analytics
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create analytics" ON public.idea_analytics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON public.campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_ideas_campaign_id ON public.generated_ideas(campaign_id);
CREATE INDEX IF NOT EXISTS idx_ideas_virality_score ON public.generated_ideas(virality_score DESC);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, agency_name, subscription_tier, credits_remaining)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'agency_name', 'free', 3);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();