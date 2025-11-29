// frontend/src/core/Pluggable.tsx
import React from 'react';
import { getComponent } from './component_registry';

interface PluggableProps {
  componentName: string;
  defaultComponent?: React.ComponentType<any>;
  children?: React.ReactNode;
  [key: string]: any; // Allow for other props to be passed to the component
}

const Pluggable: React.FC<PluggableProps> = ({ componentName, defaultComponent: DefaultComponent, children, ...rest }) => {
  const RegisteredComponent = getComponent(componentName);

  if (RegisteredComponent) {
    return <RegisteredComponent {...rest}>{children}</RegisteredComponent>;
  }

  if (DefaultComponent) {
    return <DefaultComponent {...rest}>{children}</DefaultComponent>;
  }

  // If no registered component and no default component, render children or nothing
  return <>{children}</>;
};

export default Pluggable;
