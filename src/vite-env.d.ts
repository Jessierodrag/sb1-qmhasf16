/// <reference types="vite/client" />

// Extend HTMLVideoElement to support webkit fullscreen methods for iOS
interface HTMLVideoElement {
  webkitEnterFullscreen?: () => void;
  webkitExitFullscreen?: () => void;
  webkitRequestFullscreen?: () => Promise<void>;
}

// Extend Document to support webkit fullscreen properties
interface Document {
  webkitFullscreenElement?: Element;
  mozFullScreenElement?: Element;
  msFullscreenElement?: Element;
  webkitExitFullscreen?: () => Promise<void>;
  mozCancelFullScreen?: () => Promise<void>;
  msExitFullscreen?: () => Promise<void>;
}
