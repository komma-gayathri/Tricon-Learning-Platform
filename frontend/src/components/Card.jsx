import React from 'react';

const Card = ({ title, subtitle, children, actions }) => {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      {(title || subtitle || actions) && (
        <header className="mb-4 flex items-start justify-between gap-2">
          <div>
            {title && (
              <h2 className="text-sm font-semibold tracking-wide text-slate-800">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </header>
      )}
      <div>{children}</div>
    </section>
  );
};
export default Card;