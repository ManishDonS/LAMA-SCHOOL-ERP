/**
 * Template Engine - Advanced template system with inheritance and slots
 * Similar to Odoo's QWeb but for React
 */

import React, {
  ComponentType,
  ReactNode,
  createContext,
  useContext,
  useState,
  useMemo,
} from 'react';
import { ModuleTemplate, TemplateSlot } from './types';

/**
 * Template Context
 */
interface TemplateContextValue {
  slots: Map<string, ReactNode>;
  setSlot: (name: string, content: ReactNode) => void;
  getSlot: (name: string) => ReactNode | undefined;
  data: Record<string, any>;
}

const TemplateContext = createContext<TemplateContextValue | null>(null);

export const useTemplate = () => {
  const context = useContext(TemplateContext);
  if (!context) {
    throw new Error('useTemplate must be used within a TemplateProvider');
  }
  return context;
};

/**
 * Template Provider
 */
interface TemplateProviderProps {
  children: ReactNode;
  initialData?: Record<string, any>;
}

export const TemplateProvider: React.FC<TemplateProviderProps> = ({
  children,
  initialData = {},
}) => {
  const [slots, setSlots] = useState<Map<string, ReactNode>>(new Map());
  const [data] = useState(initialData);

  const value: TemplateContextValue = useMemo(
    () => ({
      slots,
      setSlot: (name: string, content: ReactNode) => {
        setSlots((prev) => new Map(prev).set(name, content));
      },
      getSlot: (name: string) => slots.get(name),
      data,
    }),
    [slots, data]
  );

  return <TemplateContext.Provider value={value}>{children}</TemplateContext.Provider>;
};

/**
 * Slot Component - Defines a placeholder in a template
 */
interface SlotProps {
  name: string;
  children?: ReactNode;
  required?: boolean;
}

export const Slot: React.FC<SlotProps> = ({ name, children, required = false }) => {
  const { getSlot } = useTemplate();
  const content = getSlot(name);

  if (required && !content) {
    console.warn(`Required slot "${name}" has no content`);
  }

  return <>{content || children}</>;
};

/**
 * Fill Component - Provides content for a slot
 */
interface FillProps {
  slot: string;
  children: ReactNode;
}

export const Fill: React.FC<FillProps> = ({ slot, children }) => {
  const { setSlot } = useTemplate();

  React.useEffect(() => {
    setSlot(slot, children);
  }, [slot, children, setSlot]);

  return null;
};

/**
 * Template Engine Class
 */
export class TemplateEngine {
  private templates: Map<string, ModuleTemplate> = new Map();
  private components: Map<string, ComponentType<any>> = new Map();
  private inheritance: Map<string, string> = new Map(); // child -> parent

  /**
   * Register a template
   */
  registerTemplate(template: ModuleTemplate, component?: ComponentType<any>): void {
    this.templates.set(template.id, template);

    if (component) {
      this.components.set(template.id, component);
    }

    if (template.extends) {
      this.inheritance.set(template.id, template.extends);
    }
  }

  /**
   * Unregister a template
   */
  unregisterTemplate(templateId: string): void {
    this.templates.delete(templateId);
    this.components.delete(templateId);
    this.inheritance.delete(templateId);
  }

  /**
   * Get a template component with inheritance applied
   */
  getTemplate(templateId: string): ComponentType<any> | undefined {
    const template = this.templates.get(templateId);
    if (!template) {
      return undefined;
    }

    // Get base component
    let BaseComponent = this.components.get(templateId);
    if (!BaseComponent) {
      return undefined;
    }

    // Apply inheritance
    if (template.extends) {
      const ParentComponent = this.getTemplate(template.extends);
      if (ParentComponent) {
        BaseComponent = this.createInheritedComponent(BaseComponent, ParentComponent);
      }
    }

    return BaseComponent;
  }

  /**
   * Create inherited component
   */
  private createInheritedComponent(
    Child: ComponentType<any>,
    Parent: ComponentType<any>
  ): ComponentType<any> {
    return (props: any) => (
      <TemplateProvider initialData={props}>
        <Parent {...props}>
          <Child {...props} />
        </Parent>
      </TemplateProvider>
    );
  }

  /**
   * Render a template
   */
  render(templateId: string, props?: any): ReactNode {
    const Component = this.getTemplate(templateId);
    if (!Component) {
      console.error(`Template not found: ${templateId}`);
      return null;
    }

    return React.createElement(Component, props);
  }

  /**
   * Get inheritance chain
   */
  getInheritanceChain(templateId: string): string[] {
    const chain: string[] = [templateId];
    let current = templateId;

    while (this.inheritance.has(current)) {
      const parent = this.inheritance.get(current)!;
      if (chain.includes(parent)) {
        console.error(`Circular template inheritance detected: ${chain.join(' -> ')} -> ${parent}`);
        break;
      }
      chain.push(parent);
      current = parent;
    }

    return chain;
  }

  /**
   * Check if template exists
   */
  hasTemplate(templateId: string): boolean {
    return this.templates.has(templateId);
  }

  /**
   * Get all templates
   */
  getAllTemplates(): ModuleTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Get templates by type
   */
  getTemplatesByType(type: ModuleTemplate['type']): ModuleTemplate[] {
    return Array.from(this.templates.values()).filter((t) => t.type === type);
  }

  /**
   * Clear all templates
   */
  clear(): void {
    this.templates.clear();
    this.components.clear();
    this.inheritance.clear();
  }
}

/**
 * Singleton instance
 */
export const templateEngine = new TemplateEngine();

/**
 * Template HOC - Wrap a component with template functionality
 */
export function withTemplate<P extends object>(
  Component: ComponentType<P>,
  templateId: string
): ComponentType<P> {
  return (props: P) => (
    <TemplateProvider initialData={props}>
      <Component {...props} />
    </TemplateProvider>
  );
}

/**
 * Extend Template - Create a new template that extends another
 */
interface ExtendTemplateProps {
  extends: string;
  children: ReactNode;
}

export const ExtendTemplate: React.FC<ExtendTemplateProps> = ({ extends: parentId, children }) => {
  const ParentTemplate = templateEngine.getTemplate(parentId);

  if (!ParentTemplate) {
    console.error(`Parent template not found: ${parentId}`);
    return <>{children}</>;
  }

  return (
    <TemplateProvider>
      <ParentTemplate>{children}</ParentTemplate>
    </TemplateProvider>
  );
};

/**
 * Template Directive Components
 */

// Conditional rendering
interface TIfProps {
  condition: boolean;
  children: ReactNode;
}

export const TIf: React.FC<TIfProps> = ({ condition, children }) => {
  return condition ? <>{children}</> : null;
};

// Loop rendering
interface TForEachProps<T> {
  items: T[];
  children: (item: T, index: number) => ReactNode;
}

export function TForEach<T>({ items, children }: TForEachProps<T>): React.ReactElement {
  return <>{items.map((item, index) => children(item, index))}</>;
}

// Dynamic attribute
interface TAttrsProps {
  attrs: Record<string, any>;
  children: ReactNode;
}

export const TAttrs: React.FC<TAttrsProps> = ({ attrs, children }) => {
  return <div {...attrs}>{children}</div>;
};

// Call function
interface TCallProps {
  fn: string;
  args?: any[];
}

export const TCall: React.FC<TCallProps> = ({ fn, args = [] }) => {
  const { data } = useTemplate();
  const func = data[fn];

  if (typeof func !== 'function') {
    console.error(`Function not found: ${fn}`);
    return null;
  }

  const result = func(...args);
  return <>{result}</>;
};

// Set variable
interface TSetProps {
  name: string;
  value: any;
  children?: ReactNode;
}

export const TSet: React.FC<TSetProps> = ({ name, value, children }) => {
  const { data } = useTemplate();
  data[name] = value;
  return <>{children}</>;
};

/**
 * Template Utilities
 */

export const templateUtils = {
  /**
   * Create a template manifest
   */
  createTemplate(
    id: string,
    name: string,
    component: ComponentType<any>,
    options: Partial<ModuleTemplate> = {}
  ): ModuleTemplate {
    return {
      id,
      name,
      path: '',
      type: 'component',
      ...options,
    };
  },

  /**
   * Register multiple templates
   */
  registerTemplates(templates: Array<{ template: ModuleTemplate; component: ComponentType<any> }>) {
    for (const { template, component } of templates) {
      templateEngine.registerTemplate(template, component);
    }
  },

  /**
   * Create a template with slots
   */
  createSlottedTemplate(
    BaseComponent: ComponentType<any>,
    slots: TemplateSlot[]
  ): ComponentType<any> {
    return (props: any) => (
      <TemplateProvider initialData={props}>
        <BaseComponent {...props} />
      </TemplateProvider>
    );
  },
};
