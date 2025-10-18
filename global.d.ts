// Global type declarations

// Type declarations for ldrs custom web components
import 'react';

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'l-bouncy': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          size?: string;
          speed?: string;
          color?: string;
        },
        HTMLElement
      >;
    }
  }
}
