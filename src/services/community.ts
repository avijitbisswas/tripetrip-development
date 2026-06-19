import { supabase } from '@/src/lib/supabase';

export type CommunityRole = 'traveler' | 'vendor' | 'admin';
export type CommunityAudience = 'everyone' | 'circle' | 'mentions';
export type CommunityVisibility = 'feed' | 'profile';

export interface CommunityMedia {
  type: 'image' | 'gif';
  url: string;
  alt?: string;
}

export interface CommunityPoll {
  options: string[];
}

export interface CommunityProfile {
  id: string;
  fullName: string;
  role: CommunityRole;
  avatarUrl: string | null;
}

export interface CommunityPost {
  id: string;
  authorId: string;
  role: CommunityRole;
  content: string;
  createdAt: string;
  audience?: CommunityAudience;
  visibility?: CommunityVisibility;
  location?: string | null;
  scheduledAt?: string | null;
  important?: boolean;
  media?: CommunityMedia | null;
  poll?: CommunityPoll | null;
  author: CommunityProfile;
}

export interface CreateCommunityPostInput {
  content: string;
  audience?: CommunityAudience;
  visibility?: CommunityVisibility;
  location?: string | null;
  scheduledAt?: string | null;
  important?: boolean;
  media?: CommunityMedia | null;
  poll?: CommunityPoll | null;
}

async function getAccessToken() {
  const { data, error } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  if (error || !token) {
    throw new Error('Log in to use the community feed');
  }

  return token;
}

async function communityFetch<T>(path: string, init: RequestInit = {}) {
  const token = await getAccessToken();
  const response = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...init.headers,
    },
  });
  const payload = (await response.json().catch(() => ({}))) as T & { error?: string };

  if (!response.ok) {
    throw new Error(payload.error || 'Community request failed');
  }

  return payload;
}

export async function listCommunityPosts(authorId?: string) {
  const search = authorId ? `?authorId=${encodeURIComponent(authorId)}` : '';
  return communityFetch<{ viewer: CommunityProfile; posts: CommunityPost[] }>(`/api/community/posts${search}`);
}

export async function createCommunityPost(input: CreateCommunityPostInput) {
  return communityFetch<{ post: CommunityPost }>('/api/community/posts', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function getCommunityProfile(profileId: string) {
  return communityFetch<{ viewer: CommunityProfile; profile: CommunityProfile }>(
    `/api/community/profile/${encodeURIComponent(profileId)}`,
  );
}
