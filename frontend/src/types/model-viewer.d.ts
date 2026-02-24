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
        src?: string;
        alt?: string;
        poster?: string;
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
