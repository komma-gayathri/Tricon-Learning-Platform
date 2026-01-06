import React from 'react';

const Card = ({ title, subtitle, children, actions }) => {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      {(title || subtitle || actions) && (
        <header className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            {title && (
              <div className="text-sm font-semibold tracking-wide text-slate-800 break-words">
                {title}
              </div>
            )}
            {subtitle && (
              <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
            )}
          </div>
          {actions && (
            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
              {actions}
            </div>
          )}
        </header>
      )}
      <div>{children}</div>
    </section>
  );
};
export default Card;