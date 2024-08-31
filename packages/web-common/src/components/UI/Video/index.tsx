import FloatVideo from './floatVideo';
import VideoModal from './videoModal';

interface PlayState {
  duration?: number;
  currentTime?: number;
  ended?: boolean;
  playRate?: number;
}

export { FloatVideo, VideoModal, PlayState };
