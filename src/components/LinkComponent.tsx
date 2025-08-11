import React from 'react';

interface LinkProps {
  url: string;
  children: React.ReactNode;
}

const LinkComponent: React.FC<LinkProps> = ({ url, children }) => {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      style={{ color: 'inherit', textDecoration: 'underline' }}
    >
      {children}
    </a>
  );
};

export default LinkComponent;
