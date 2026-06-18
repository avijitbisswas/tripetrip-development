import { useEffect, useMemo, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  createCommunityPost,
  getCommunityProfile,
  listCommunityPosts,
  type CommunityPost,
  type CommunityProfile,
} from '@/src/services/community';
import {
  ArrowLeft,
  Building2,
  CalendarClock,
  CircleSlash,
  Flag,
  Globe2,
  Heart,
  Image as ImageIcon,
  ListChecks,
  Loader2,
  MapPin,
  MessageCircle,
  Share2,
  Smile,
  Sparkles,
  UserRound,
} from 'lucide-react';
import { toast } from 'sonner';

function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function timeLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Now';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function roleTheme(role?: string) {
  if (role === 'vendor') {
    return {
      label: 'Vendor circle',
      title: 'Trade notes from travel partners',
      accent: 'emerald',
      Icon: Building2,
    };
  }

  return {
    label: 'Traveler circle',
    title: 'Field notes from travelers',
    accent: 'indigo',
    Icon: UserRound,
  };
}

function Avatar({ profile }: { profile: CommunityProfile }) {
  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-sm font-black text-white shadow-sm">
      {profile.avatarUrl ? <img src={profile.avatarUrl} alt="" className="h-full w-full rounded-2xl object-cover" /> : initials(profile.fullName)}
    </div>
  );
}

function PostCard({ post }: { post: CommunityPost }) {
  return (
    <article className="border-b border-slate-200 bg-white px-5 py-5 transition-colors hover:bg-slate-50/80">
      <div className="flex gap-4">
        <Link to={`/community/profile/${post.author.id}`} className="shrink-0">
          <Avatar profile={post.author} />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <Link to={`/community/profile/${post.author.id}`} className="font-black text-slate-950 hover:text-emerald-600">
              {post.author.fullName}
            </Link>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-slate-500">
              {post.role}
            </span>
            <span className="text-xs font-semibold text-slate-400">{timeLabel(post.createdAt)}</span>
          </div>
          <p className="mt-3 whitespace-pre-wrap text-[15px] font-medium leading-7 text-slate-700">{post.content}</p>
          <div className="mt-4 flex max-w-sm items-center justify-between text-slate-400">
            <button className="inline-flex items-center gap-2 text-xs font-black transition-colors hover:text-emerald-600" type="button">
              <MessageCircle className="h-4 w-4" />
              Reply
            </button>
            <button className="inline-flex items-center gap-2 text-xs font-black transition-colors hover:text-rose-500" type="button">
              <Heart className="h-4 w-4" />
              Like
            </button>
            <button className="inline-flex items-center gap-2 text-xs font-black transition-colors hover:text-slate-900" type="button">
              <Share2 className="h-4 w-4" />
              Share
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function ComposerToolButton({
  label,
  children,
  onClick,
}: {
  label: string;
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-emerald-50 hover:text-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
    >
      {children}
    </button>
  );
}

export default function Community() {
  const { userId } = useParams();
  const [viewer, setViewer] = useState<CommunityProfile | null>(null);
  const [profile, setProfile] = useState<CommunityProfile | null>(null);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const theme = useMemo(() => roleTheme(viewer?.role), [viewer?.role]);
  const isProfileMode = Boolean(userId);
  const remaining = 280 - content.length;
  const canPost = !posting && content.trim().length >= 2;

  const insertComposerText = (value: string) => {
    setContent((current) => `${current}${current ? ' ' : ''}${value}`.slice(0, 280));
  };

  const composerToast = (feature: string) => {
    toast.message(`${feature} composer control is ready. Storage support can be connected next.`);
  };

  useEffect(() => {
    let mounted = true;

    async function loadCommunity() {
      setLoading(true);
      setError(null);
      try {
        const feed = await listCommunityPosts(userId);
        let activeProfile: CommunityProfile | null = null;
        if (userId) {
          activeProfile = (await getCommunityProfile(userId)).profile;
        }
        if (mounted) {
          setViewer(feed.viewer);
          setProfile(activeProfile);
          setPosts(feed.posts);
        }
      } catch (loadError) {
        if (mounted) {
          setError(loadError instanceof Error ? loadError.message : 'Community is unavailable');
          setViewer(null);
          setProfile(null);
          setPosts([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadCommunity();

    return () => {
      mounted = false;
    };
  }, [userId]);

  const handlePost = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;

    setPosting(true);
    try {
      const { post } = await createCommunityPost(trimmed);
      setPosts((current) => [post, ...current]);
      setContent('');
      toast.success('Posted to community');
    } catch (postError) {
      toast.error(postError instanceof Error ? postError.message : 'Unable to post');
    } finally {
      setPosting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (error) {
    return (
      <main className="min-h-[70vh] bg-slate-50 px-4 py-16">
        <div className="mx-auto max-w-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <Sparkles className="h-5 w-5" />
          </div>
          <h1 className="mt-5 text-2xl font-black text-slate-950">Community</h1>
          <p className="mt-3 text-sm font-semibold leading-6 text-slate-500">{error}</p>
          <div className="mt-6 flex justify-center gap-3">
            <Link to="/login">
              <Button className="bg-emerald-600 text-white hover:bg-emerald-700">Login</Button>
            </Link>
            <Link to="/register">
              <Button variant="outline">Join</Button>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const activeProfile = profile || viewer;
  const ThemeIcon = theme.Icon;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 lg:grid-cols-[260px_minmax(0,1fr)_280px]">
        <aside className="hidden lg:block">
          <div className="sticky top-24 border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <ThemeIcon className="h-6 w-6" />
            </div>
            <p className="mt-5 text-xs font-black uppercase tracking-widest text-emerald-600">{theme.label}</p>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950">{theme.title}</h1>
            <p className="mt-4 text-sm font-semibold leading-6 text-slate-500">
              {viewer?.role === 'vendor'
                ? 'Partners exchange operational wins, supply notes, and market signals.'
                : 'Travelers trade plans, routes, stay ideas, and trip stories.'}
            </p>
          </div>
        </aside>

        <section className="overflow-hidden border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur">
            {isProfileMode ? (
              <div className="flex items-center gap-3">
                <Link to="/community" className="rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-950">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
                <div>
                  <h2 className="text-xl font-black text-slate-950">{activeProfile?.fullName || 'Profile'}</h2>
                  <p className="text-xs font-bold text-slate-400">{posts.length} posts</p>
                </div>
              </div>
            ) : (
              <div>
                <h2 className="text-xl font-black text-slate-950">Community</h2>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{theme.label}</p>
              </div>
            )}
          </div>

          {isProfileMode && activeProfile ? (
            <div className="border-b border-slate-200 bg-gradient-to-r from-slate-950 to-emerald-950 px-5 py-8 text-white">
              <div className="flex items-end gap-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-3xl border-4 border-white bg-white text-xl font-black text-slate-950">
                  {initials(activeProfile.fullName)}
                </div>
                <div>
                  <h1 className="text-3xl font-black tracking-tight">{activeProfile.fullName}</h1>
                  <p className="mt-1 text-xs font-black uppercase tracking-widest text-emerald-200">{activeProfile.role}</p>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handlePost} className="border-b border-slate-200 bg-white p-5">
              <div className="flex gap-4">
                {viewer && <Avatar profile={viewer} />}
                <div className="min-w-0 flex-1">
                  <textarea
                    value={content}
                    onChange={(event) => setContent(event.target.value.slice(0, 280))}
                    rows={2}
                    className="min-h-[76px] w-full resize-none border-0 bg-transparent pt-1 text-xl font-semibold leading-8 text-slate-900 outline-none placeholder:text-slate-400"
                    placeholder="What's happening?"
                  />
                  <button
                    type="button"
                    aria-label="Change reply audience"
                    title="Change reply audience"
                    onClick={() => composerToast('Reply audience')}
                    className="mb-4 inline-flex items-center gap-1.5 rounded-full px-1 text-sm font-black text-emerald-600 transition-colors hover:bg-emerald-50"
                  >
                    <Globe2 className="h-4 w-4" />
                    Everyone can reply
                  </button>
                  <div className="flex flex-col gap-3 border-t border-slate-100 pt-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="-ml-2 flex min-w-0 flex-wrap items-center gap-1">
                      <ComposerToolButton label="Add image" onClick={() => composerToast('Image upload')}>
                        <ImageIcon className="h-5 w-5" />
                      </ComposerToolButton>
                      <ComposerToolButton label="Add GIF" onClick={() => composerToast('GIF')}>
                        <span className="rounded-[4px] border border-current px-1 text-[9px] font-black leading-4">GIF</span>
                      </ComposerToolButton>
                      <ComposerToolButton label="Limit visibility" onClick={() => composerToast('Visibility')}>
                        <CircleSlash className="h-5 w-5" />
                      </ComposerToolButton>
                      <ComposerToolButton label="Add poll" onClick={() => insertComposerText('Poll:')}>
                        <ListChecks className="h-5 w-5" />
                      </ComposerToolButton>
                      <ComposerToolButton label="Add emoji" onClick={() => insertComposerText(':smile:')}>
                        <Smile className="h-5 w-5" />
                      </ComposerToolButton>
                      <ComposerToolButton label="Schedule post" onClick={() => composerToast('Scheduled post')}>
                        <CalendarClock className="h-5 w-5" />
                      </ComposerToolButton>
                      <ComposerToolButton label="Add location" onClick={() => insertComposerText('Location:')}>
                        <MapPin className="h-5 w-5" />
                      </ComposerToolButton>
                      <ComposerToolButton label="Mark important" onClick={() => insertComposerText('Important:')}>
                        <Flag className="h-5 w-5" />
                      </ComposerToolButton>
                    </div>
                    <div className="flex items-center justify-end gap-3">
                      {remaining < 40 && (
                        <span className={`text-xs font-black ${remaining < 20 ? 'text-rose-500' : 'text-slate-400'}`}>{remaining}</span>
                      )}
                      <Button
                        type="submit"
                        disabled={!canPost}
                        className={`rounded-full px-5 font-black text-white shadow-none disabled:opacity-100 ${
                          canPost ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-200 disabled:bg-slate-200 disabled:text-white'
                        }`}
                      >
                        {posting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Post
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          )}

          {posts.length ? (
            posts.map((post) => <PostCard key={post.id} post={post} />)
          ) : (
            <div className="px-5 py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                <MessageCircle className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-lg font-black text-slate-950">Quiet for now</h3>
              <p className="mt-2 text-sm font-semibold text-slate-500">Start the first thread in this circle.</p>
            </div>
          )}
        </section>

        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-4">
            <div className="border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Active profile</h3>
              {viewer && (
                <Link to={`/community/profile/${viewer.id}`} className="mt-4 flex items-center gap-3 rounded-2xl p-2 hover:bg-slate-50">
                  <Avatar profile={viewer} />
                  <div>
                    <div className="text-sm font-black text-slate-950">{viewer.fullName}</div>
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400">{viewer.role}</div>
                  </div>
                </Link>
              )}
            </div>
            <div className="border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Pulse</h3>
              <div className="mt-4 space-y-3">
                {['Routes', 'Stays', 'Direct deals'].map((item) => (
                  <div key={item} className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-black text-slate-700">
                    #{item.replace(/\s+/g, '')}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
