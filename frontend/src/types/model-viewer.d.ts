// Type declarations for <model-viewer> custom element
// React 18 requires augmenting React.JSX.IntrinsicElements

import "react";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        ref?: React.Ref<HTMLElement>;
        src?: string;
        alt?: string;
        poster?: string;
        autoplay?: string;
        "animation-name"?: string;
        orientation?: string;
        "camera-orbit"?: string;
        "min-camera-orbit"?: string;
        "auto-rotate"?: string;
        "camera-controls"?: string;
        "shadow-intensity"?: string;
        "environment-image"?: string;
        exposure?: string;
        ar?: string;
        "ar-modes"?: string;
        style?: React.CSSProperties;
        class?: string;
      };
    }
  }
}
