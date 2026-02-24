// Type declarations for <model-viewer> custom element
// https://modelviewer.dev

declare namespace JSX {
  interface IntrinsicElements {
    "model-viewer": React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement>,
      HTMLElement
    > & {
      src?: string;
      alt?: string;
      poster?: string;
      "auto-rotate"?: boolean | "";
      "camera-controls"?: boolean | "";
      "shadow-intensity"?: string;
      "environment-image"?: string;
      exposure?: string;
      ar?: boolean | "";
      "ar-modes"?: string;
      style?: React.CSSProperties;
      class?: string;
    };
  }
}
