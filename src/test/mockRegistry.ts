import { vi, beforeAll } from 'vitest';
import React from 'react';

// Types for the Select context
interface SelectContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: string;
  onValueChange: (value: string) => void;
}

// Mock pointer capture methods
const mockPointerCapture = {
  setPointerCapture: vi.fn(),
  releasePointerCapture: vi.fn(),
  hasPointerCapture: vi.fn(() => false),
};

// Mock the Select component
vi.mock('@radix-ui/react-select', () => {
  const SelectContext = React.createContext<SelectContextValue>({
    open: false,
    onOpenChange: (open: boolean) => {},
    value: '',
    onValueChange: (value: string) => {},
  });

  const Root = React.forwardRef((props: any, ref) => {
    const [open, setOpen] = React.useState(false);
    const [value, setValue] = React.useState(props.value || '');

    return React.createElement(SelectContext.Provider, {
      value: {
        open,
        onOpenChange: (newOpen: boolean) => {
          setOpen(newOpen);
          props.onOpenChange?.(newOpen);
        },
        value,
        onValueChange: (newValue: string) => {
          setValue(newValue);
          props.onValueChange?.(newValue);
        },
      },
    }, props.children);
  });

  const Trigger = React.forwardRef((props: any, ref) => {
    const ctx = React.useContext(SelectContext);
    return React.createElement('button', {
      ...props,
      'aria-expanded': ctx.open,
      'data-state': ctx.open ? 'open' : 'closed',
      onClick: (e: any) => {
        ctx.onOpenChange(!ctx.open);
        props.onClick?.(e);
      },
      role: 'combobox',
      type: 'button',
      ...mockPointerCapture,
    });
  });

  const Content = React.forwardRef((props: any, ref) => {
    const ctx = React.useContext(SelectContext);
    
    // IMPORTANT: Always render options in tests, regardless of open state
    // This makes them accessible to testing-library - even if they're visually hidden
    return React.createElement('div', {
      role: 'listbox',
      'aria-orientation': 'vertical',
      'data-state': ctx.open ? 'open' : 'closed',
      ...props,
      style: { 
        position: 'absolute', 
        top: '100%', 
        left: 0, 
        width: '100%', 
        zIndex: 1000,
        // Only visually hide when closed, but keep accessible to tests
        // Using display: 'block' instead of opacity to ensure findability
        display: 'block',
        ...props.style
      },
      ...mockPointerCapture,
    });
  });

  const Item = React.forwardRef((props: any, ref) => {
    const ctx = React.useContext(SelectContext);
    const { children, value, ...rest } = props;

    const content = typeof children === 'function' ? children() : children;
    
    return React.createElement('div', {
      role: 'option',
      'aria-selected': ctx.value === value,
      'data-value': value,
      'data-radix-select-item': true,
      onClick: (e: any) => {
        ctx.onValueChange(value);
        ctx.onOpenChange(false);
        props.onClick?.(e);
      },
      ...rest,
      children: content,
      ...mockPointerCapture,
    });
  });

  const ItemText = React.forwardRef((props: any, ref) => {
    return React.createElement('span', {
      ...props,
      children: props.children,
    });
  });

  const Value = React.forwardRef((props: any, ref) => {
    const ctx = React.useContext(SelectContext);
    return React.createElement('span', {
      ...props,
      'data-slot': 'select-value',
      'data-value': ctx.value,
      children: props.children || ctx.value,
    });
  });

  const Portal = React.forwardRef((props: any, ref) => React.createElement('div', props));
  const Viewport = React.forwardRef((props: any, ref) => React.createElement('div', props));
  const ItemIndicator = React.forwardRef((props: any, ref) => React.createElement('span', props));
  const Group = React.forwardRef((props: any, ref) => React.createElement('div', props));
  const Label = React.forwardRef((props: any, ref) => React.createElement('label', props));
  const Separator = React.forwardRef((props: any, ref) => React.createElement('div', props));
  const ScrollUpButton = React.forwardRef((props: any, ref) => React.createElement('div', props));
  const ScrollDownButton = React.forwardRef((props: any, ref) => React.createElement('div', props));
  const Arrow = React.forwardRef((props: any, ref) => React.createElement('div', props));
  const Icon = React.forwardRef((props: any, ref) => React.createElement('span', props));

  return {
    Root,
    Trigger,
    Content,
    Item,
    Value,
    Portal,
    Viewport,
    ItemText,
    ItemIndicator,
    Group,
    Label,
    Separator,
    ScrollUpButton,
    ScrollDownButton,
    Arrow,
    Icon,
  };
});

// Mock other Radix UI components
vi.mock('@radix-ui/react-dialog', () => ({
  Root: (props: any) => React.createElement('div', props),
  Trigger: (props: any) => React.createElement('button', props),
  Portal: (props: any) => React.createElement('div', props),
  Overlay: (props: any) => React.createElement('div', props),
  Content: (props: any) => React.createElement('div', props),
  Title: (props: any) => React.createElement('h2', props),
  Description: (props: any) => React.createElement('p', props),
  Close: (props: any) => React.createElement('button', props),
}));

vi.mock('@radix-ui/react-dismissable-layer', () => ({
  Root: (props: any) => React.createElement('div', props),
}));

vi.mock('@radix-ui/react-focus-scope', () => ({
  Root: (props: any) => React.createElement('div', props),
}));

// Browser mocks
beforeAll(() => {
  // Mock ResizeObserver
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;

  // Mock IntersectionObserver
  global.IntersectionObserver = class IntersectionObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
    root: Element | null = null;
    rootMargin: string = '0px';
    thresholds: ReadonlyArray<number> = [0];
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  } as unknown as typeof IntersectionObserver;
});

/**
 * Mock registry for common browser APIs needed by UI libraries
 */
export const setupBrowserMocks = () => {
  // Basic DOM APIs
  Element.prototype.scrollIntoView = vi.fn();
  
  // Pointer capture APIs
  Element.prototype.setPointerCapture = vi.fn();
  Element.prototype.releasePointerCapture = vi.fn();
  Element.prototype.hasPointerCapture = vi.fn().mockReturnValue(false);

  // ResizeObserver
  window.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

  // IntersectionObserver
  window.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

  // Animation Frame
  window.requestAnimationFrame = vi.fn().mockImplementation(cb => setTimeout(cb, 0));
  window.cancelAnimationFrame = vi.fn();
};

/**
 * Mock registry for Radix UI primitive layers
 */
export const setupRadixMocks = () => {
  // Portal root setup
  const portalRoot = document.createElement('div');
  portalRoot.setAttribute('id', 'radix-portal-root');
  document.body.appendChild(portalRoot);

  // Focus management
  if (document.activeElement) {
    (document.activeElement as HTMLElement).blur = vi.fn();
  }
  (Element.prototype as HTMLElement).focus = vi.fn();
  (Element.prototype as HTMLElement).blur = vi.fn();
};

/**
 * Mock registry for Shadcn UI specific features
 */
export const setupShadcnMocks = () => {
  setupRadixMocks();
};

/**
 * Helper to clean up mocks between tests
 */
export const cleanupMocks = () => {
  vi.clearAllMocks();
  
  // Clean up portals
  const portals = document.querySelectorAll('[data-radix-portal]');
  portals.forEach(portal => {
    if (portal.parentNode) {
      portal.parentNode.removeChild(portal);
    }
  });
  
  // Clean up body
  document.body.innerHTML = '';
  
  // Reset prototypes
  delete (Element.prototype as any).scrollIntoView;
  delete (Element.prototype as any).setPointerCapture;
  delete (Element.prototype as any).releasePointerCapture;
  delete (Element.prototype as any).hasPointerCapture;
  delete (Element.prototype as any).focus;
  delete (Element.prototype as any).blur;
};

/**
 * Setup all required mocks for a component test
 */
export const setupComponentTest = (options: {
  radix?: boolean;
  shadcn?: boolean;
  browser?: boolean;
} = {}) => {
  const {
    radix = false,
    shadcn = false,
    browser = true
  } = options;

  if (browser) setupBrowserMocks();
  if (radix) setupRadixMocks();
  if (shadcn) setupShadcnMocks();

  return () => cleanupMocks();
}; 