export interface MusicPreset {
  id: string;
  title: string;
  artist: string;
  url: string;
  genre: string;
}

export const MUSIC_PRESETS: MusicPreset[] = [
  {
    id: 'the-way-you-look-at-me',
    title: 'The Way You Look At Me',
    artist: 'Paul Aro & Andi Rianto',
    url: '/music/the-way-you-look-at-me.mp3',
    genre: 'Romantic Wedding Ballad',
  },
  {
    id: 'romantic-piano-melody',
    title: 'Romantic Wedding Piano Melody',
    artist: 'Instrumental Piano',
    url: 'https://assets.mixkit.co/music/preview/mixkit-romantic-wedding-piano-melody-670.mp3',
    genre: 'Soft Piano Solo',
  },
  {
    id: 'acoustic-guitar-love',
    title: 'Acoustic Serenade',
    artist: 'Acoustic Strings',
    url: 'https://assets.mixkit.co/music/preview/mixkit-serene-view-443.mp3',
    genre: 'Warm Acoustic Guitar',
  },
];

/**
 * Resolves a given music URL or YouTube link into a playable audio source.
 */
export function resolveMusicSrc(url?: string | null): string {
  if (!url) return '/music/the-way-you-look-at-me.mp3';

  // If user pasted the YouTube link for "The Way You Look At Me"
  if (url.includes('SgSOAPwTOdc') || url.toLowerCase().includes('the way you look at me')) {
    return '/music/the-way-you-look-at-me.mp3';
  }

  // Migrate legacy mixkit default to Paul Aro
  if (url.includes('mixkit-romantic-wedding-piano-melody-670.mp3')) {
    return '/music/the-way-you-look-at-me.mp3';
  }

  return url;
}
