/**
 * Avatar videos for course creation.
 * Add .mp4 or .webm files to this folder - they will be available for avatar selection.
 * Videos are referenced via require.context for dynamic discovery.
 */
const FALLBACK_VIDEOS = [
  { id: "avatar-1", name: "Avatar 1", videoSrc: "https://storage.googleapis.com/qudemo-videos/videos/video_intro.mp4" },
  { id: "avatar-2", name: "Avatar 2", videoSrc: "https://storage.googleapis.com/qudemo-videos/videos/video_1.mp4" },
  { id: "avatar-3", name: "Avatar 3", videoSrc: "https://storage.googleapis.com/qudemo-videos/videos/video_2.mp4" },
  { id: "avatar-4", name: "Avatar 4", videoSrc: "https://storage.googleapis.com/qudemo-videos/videos/video_3.mp4" },
];

let AVATAR_VIDEOS = FALLBACK_VIDEOS;
try {
  const req = require.context(".", false, /\.(mp4|webm)$/);
  const keys = req.keys().sort((a, b) => {
    if (a.includes("Ali")) return 1;
    if (b.includes("Ali")) return -1;
    return a.localeCompare(b);
  });
  if (keys.length > 0) {
    AVATAR_VIDEOS = keys.map((key, i) => ({
      id: `avatar-${i + 1}`,
      name: key.replace(/^\.\//, "").replace(/\.(mp4|webm)$/, ""),
      videoSrc: req(key),
    }));
  }
} catch {
  // Use fallback
}

export default AVATAR_VIDEOS;
