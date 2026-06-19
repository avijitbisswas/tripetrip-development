import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent, ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  createCommunityPost,
  getCommunityProfile,
  listCommunityPosts,
  type CommunityAudience,
  type CommunityMedia,
  type CommunityPost,
  type CommunityProfile,
  type CommunityVisibility,
} from '@/src/services/community';
import { uploadImageToCloudinary } from '@/src/services/media';
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

const audienceOptions: Array<{ value: CommunityAudience; label: string }> = [
  { value: 'everyone', label: 'Everyone can reply' },
  { value: 'circle', label: 'Circle can reply' },
  { value: 'mentions', label: 'Mentioned only' },
];

const visibilityOptions: Array<{ value: CommunityVisibility; label: string }> = [
  { value: 'feed', label: 'Visible in feed' },
  { value: 'profile', label: 'Profile only' },
];

const emojiOptions = ['🌿', '📍', '✨', '🧳', '☕'];

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

function scheduleLabel(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return `Scheduled ${new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)}`;
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
            {post.important && (
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-700">
                Important
              </span>
            )}
            {post.visibility === 'profile' && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-slate-500">
                Profile only
              </span>
            )}
            <span className="text-xs font-semibold text-slate-400">{timeLabel(post.createdAt)}</span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-black uppercase tracking-wider text-slate-400">
            {post.location && (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-slate-500">
                <MapPin className="h-3.5 w-3.5" />
                {post.location}
              </span>
            )}
            {scheduleLabel(post.scheduledAt) && (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-slate-500">
                <CalendarClock className="h-3.5 w-3.5" />
                {scheduleLabel(post.scheduledAt)}
              </span>
            )}
            {post.audience && post.audience !== 'everyone' && (
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-500">
                {audienceOptions.find((item) => item.value === post.audience)?.label || post.audience}
              </span>
            )}
          </div>
          <p className="mt-3 whitespace-pre-wrap text-[15px] font-medium leading-7 text-slate-700">{post.content}</p>
          {post.media && (
            <div className="mt-4 overflow-hidden rounded-3xl border border-slate-200 bg-slate-100">
              <img
                src={post.media.url}
                alt={post.media.alt || 'Community attachment preview'}
                className="h-auto max-h-[420px] w-full object-cover"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            </div>
          )}
          {post.poll && post.poll.options.length > 0 && (
            <div className="mt-4 space-y-2 rounded-3xl border border-slate-200 bg-slate-50 p-3">
              {post.poll.options.map((option) => (
                <div key={option} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  <div className="flex items-center justify-between px-3 py-2 text-sm font-black text-slate-700">
                    <span>{option}</span>
                    <span className="text-xs text-slate-400">Open</span>
                  </div>
                </div>
              ))}
            </div>
          )}
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
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const [viewer, setViewer] = useState<CommunityProfile | null>(null);
  const [profile, setProfile] = useState<CommunityProfile | null>(null);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [content, setContent] = useState('');
  const [audience, setAudience] = useState<CommunityAudience>('everyone');
  const [visibility, setVisibility] = useState<CommunityVisibility>('feed');
  const [location, setLocation] = useState('');
  const [locationOpen, setLocationOpen] = useState(false);
  const [gifUrl, setGifUrl] = useState('');
  const [gifOpen, setGifOpen] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [pollOpen, setPollOpen] = useState(false);
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');
  const [important, setImportant] = useState(false);
  const [media, setMedia] = useState<CommunityMedia | null>(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const theme = useMemo(() => roleTheme(viewer?.role), [viewer?.role]);
  const isProfileMode = Boolean(userId);
  const remaining = 280 - content.length;
  const cleanPollOptions = pollOptions.map((option) => option.trim()).filter(Boolean);
  const canPost = !posting && !uploadingMedia && content.trim().length >= 2;
  const audienceLabel = audienceOptions.find((item) => item.value === audience)?.label || 'Everyone can reply';
  const visibilityLabel = visibilityOptions.find((item) => item.value === visibility)?.label || 'Visible in feed';

  const insertComposerText = (value: string) => {
    setContent((current) => `${current}${current ? ' ' : ''}${value}`.slice(0, 280));
  };

  const cycleAudience = () => {
    const currentIndex = audienceOptions.findIndex((item) => item.value === audience);
    const next = audienceOptions[(currentIndex + 1) % audienceOptions.length];
    setAudience(next.value);
  };

  const toggleVisibility = () => {
    setVisibility((current) => (current === 'feed' ? 'profile' : 'feed'));
  };

  const updatePollOption = (index: number, value: string) => {
    setPollOptions((current) => current.map((option, optionIndex) => (optionIndex === index ? value : option)));
  };

  const addPollOption = () => {
    setPollOptions((current) => (current.length >= 4 ? current : [...current, '']));
  };

  const removeMedia = () => {
    setMedia(null);
    setGifUrl('');
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingMedia(true);
    try {
      const url = await uploadImageToCloudinary(file);
      setMedia({
        type: 'image',
        url,
        alt: 'Community attachment preview',
      });
      setGifUrl('');
      setGifOpen(false);
      toast.success('Image attached');
    } catch (uploadError) {
      toast.error(uploadError instanceof Error ? uploadError.message : 'Unable to upload image');
    } finally {
      setUploadingMedia(false);
    }
  };

  const attachGif = () => {
    const trimmed = gifUrl.trim();
    if (!trimmed) return;
    setMedia({
      type: 'gif',
      url: trimmed,
      alt: 'Community attachment preview',
    });
    setGifOpen(false);
    toast.success('GIF attached');
  };

  const resetComposer = () => {
    setContent('');
    setAudience('everyone');
    setVisibility('feed');
    setLocation('');
    setLocationOpen(false);
    setGifUrl('');
    setGifOpen(false);
    setEmojiOpen(false);
    setPollOpen(false);
    setPollOptions(['', '']);
    setScheduleOpen(false);
    setScheduledAt('');
    setImportant(false);
    setMedia(null);
    if (imageInputRef.current) imageInputRef.current.value = '';
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
      const { post } = await createCommunityPost({
        content: trimmed,
        audience,
        visibility,
        location: location.trim() || null,
        scheduledAt: scheduledAt || null,
        important,
        media,
        poll: cleanPollOptions.length >= 2 ? { options: cleanPollOptions } : null,
      });
      setPosts((current) => [post, ...current]);
      resetComposer();
      toast.success(scheduledAt ? 'Community post scheduled' : 'Posted to community');
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
                    onClick={cycleAudience}
                    className="mb-4 inline-flex items-center gap-1.5 rounded-full px-1 text-sm font-black text-emerald-600 transition-colors hover:bg-emerald-50"
                  >
                    <Globe2 className="h-4 w-4" />
                    {audienceLabel}
                  </button>
                  {(locationOpen || gifOpen || pollOpen || scheduleOpen || emojiOpen || media || location || important || visibility === 'profile') && (
                    <div className="mb-4 space-y-3 rounded-3xl border border-slate-200 bg-slate-50 p-3">
                      {media && (
                        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
                          <img
                            src={media.url}
                            alt={media.alt || 'Community attachment preview'}
                            className="h-auto max-h-64 w-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <div className="flex items-center justify-between px-3 py-2 text-xs font-black uppercase tracking-wider text-slate-500">
                            <span>{media.type}</span>
                            <button type="button" className="text-rose-500" onClick={removeMedia}>
                              Remove
                            </button>
                          </div>
                        </div>
                      )}
                      {gifOpen && (
                        <div className="space-y-2 rounded-2xl bg-white p-3">
                          <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500" htmlFor="community-gif-url">
                            GIF URL
                          </label>
                          <div className="flex flex-col gap-2 sm:flex-row">
                            <input
                              id="community-gif-url"
                              value={gifUrl}
                              onChange={(event) => setGifUrl(event.target.value)}
                              placeholder="https://..."
                              className="h-10 flex-1 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-emerald-500"
                            />
                            <Button type="button" className="rounded-full bg-slate-950 text-white hover:bg-slate-800" onClick={attachGif}>
                              Attach GIF
                            </Button>
                          </div>
                        </div>
                      )}
                      {locationOpen && (
                        <div className="space-y-2 rounded-2xl bg-white p-3">
                          <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500" htmlFor="community-location">
                            Post location
                          </label>
                          <input
                            id="community-location"
                            value={location}
                            onChange={(event) => setLocation(event.target.value.slice(0, 60))}
                            placeholder="City, region, or stay"
                            className="h-10 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-emerald-500"
                          />
                        </div>
                      )}
                      {pollOpen && (
                        <div className="space-y-2 rounded-2xl bg-white p-3">
                          {pollOptions.map((option, index) => (
                            <input
                              key={`poll-${index}`}
                              aria-label={`Poll option ${index + 1}`}
                              value={option}
                              onChange={(event) => updatePollOption(index, event.target.value.slice(0, 50))}
                              placeholder={`Option ${index + 1}`}
                              className="h-10 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-emerald-500"
                            />
                          ))}
                          {pollOptions.length < 4 && (
                            <button type="button" className="text-xs font-black uppercase tracking-wider text-emerald-600" onClick={addPollOption}>
                              Add option
                            </button>
                          )}
                        </div>
                      )}
                      {scheduleOpen && (
                        <div className="space-y-2 rounded-2xl bg-white p-3">
                          <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500" htmlFor="community-schedule">
                            Schedule date and time
                          </label>
                          <input
                            id="community-schedule"
                            type="datetime-local"
                            value={scheduledAt}
                            onChange={(event) => setScheduledAt(event.target.value)}
                            className="h-10 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-emerald-500"
                          />
                        </div>
                      )}
                      {emojiOpen && (
                        <div className="flex flex-wrap gap-2 rounded-2xl bg-white p-3">
                          {emojiOptions.map((emoji) => (
                            <button
                              key={emoji}
                              type="button"
                              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-xl transition-colors hover:bg-emerald-50"
                              onClick={() => {
                                insertComposerText(emoji);
                                setEmojiOpen(false);
                              }}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      )}
                      <div className="flex flex-wrap gap-2 text-[11px] font-black uppercase tracking-wider text-slate-500">
                        <span className="rounded-full bg-white px-3 py-1">{visibilityLabel}</span>
                        {important && <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-700">Important</span>}
                        {location && <span className="rounded-full bg-white px-3 py-1">{location}</span>}
                      </div>
                    </div>
                  )}
                  <div className="flex flex-col gap-3 border-t border-slate-100 pt-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="-ml-2 flex min-w-0 flex-wrap items-center gap-1">
                      <input
                        ref={imageInputRef}
                        id="community-image-upload"
                        aria-label="Upload image"
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={handleImageUpload}
                      />
                      <ComposerToolButton label="Add image" onClick={() => imageInputRef.current?.click()}>
                        <ImageIcon className="h-5 w-5" />
                      </ComposerToolButton>
                      <ComposerToolButton
                        label="Add GIF"
                        onClick={() => {
                          setGifOpen((current) => !current);
                          setLocationOpen(false);
                          setPollOpen(false);
                          setScheduleOpen(false);
                          setEmojiOpen(false);
                        }}
                      >
                        <span className="rounded-[4px] border border-current px-1 text-[9px] font-black leading-4">GIF</span>
                      </ComposerToolButton>
                      <ComposerToolButton label="Limit visibility" onClick={toggleVisibility}>
                        <CircleSlash className="h-5 w-5" />
                      </ComposerToolButton>
                      <ComposerToolButton
                        label="Add poll"
                        onClick={() => {
                          setPollOpen((current) => !current);
                          setGifOpen(false);
                          setLocationOpen(false);
                          setScheduleOpen(false);
                          setEmojiOpen(false);
                        }}
                      >
                        <ListChecks className="h-5 w-5" />
                      </ComposerToolButton>
                      <ComposerToolButton
                        label="Add emoji"
                        onClick={() => {
                          setEmojiOpen((current) => !current);
                          setGifOpen(false);
                          setLocationOpen(false);
                          setPollOpen(false);
                          setScheduleOpen(false);
                        }}
                      >
                        <Smile className="h-5 w-5" />
                      </ComposerToolButton>
                      <ComposerToolButton
                        label="Schedule post"
                        onClick={() => {
                          setScheduleOpen((current) => !current);
                          setGifOpen(false);
                          setLocationOpen(false);
                          setPollOpen(false);
                          setEmojiOpen(false);
                        }}
                      >
                        <CalendarClock className="h-5 w-5" />
                      </ComposerToolButton>
                      <ComposerToolButton
                        label="Add location"
                        onClick={() => {
                          setLocationOpen((current) => !current);
                          setGifOpen(false);
                          setPollOpen(false);
                          setScheduleOpen(false);
                          setEmojiOpen(false);
                        }}
                      >
                        <MapPin className="h-5 w-5" />
                      </ComposerToolButton>
                      <ComposerToolButton label="Mark important" onClick={() => setImportant((current) => !current)}>
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
                        {(posting || uploadingMedia) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
