export function Button({ variant = 'outline', className = '', children, ...props }) {
  return <button data-slot="button" data-variant={variant} className={`ui-button ui-button-${variant} ${className}`} {...props}>{children}</button>;
}

export function Badge({ tone = 'neutral', className = '', children, ...props }) {
  return <span data-slot="badge" className={`ui-badge ui-badge-${tone} ${className}`} {...props}>{children}</span>;
}

export function Card({ className = '', children, ...props }) {
  return <div data-slot="card" className={`ui-card ${className}`} {...props}>{children}</div>;
}

export function Table({ className = '', children, ...props }) {
  return <table data-slot="table" className={`ui-table ${className}`} {...props}>{children}</table>;
}
