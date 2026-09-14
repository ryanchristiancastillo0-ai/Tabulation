/**
 * Config-driven data table used across the admin/leaderboard surfaces.
 *
 * Each column is described by a config object:
 *   {
 *     key?,          // stable key (optional)
 *     header,        // node/string for the <th>
 *     headerClass,   // classes applied to the <th> (padding/align/width)
 *     cellClass,     // classes applied to every <td> in this column
 *     render?,       // (row, index) => node — full control over cell content
 *     value?,        // (row, index) => node — shorthand when render not needed
 *   }
 */
export default function Table({
  id,
  columns = [],
  rows = [],
  rowKey,
  minWidth,
  emptyMessage = 'No data to show yet.',
  emptyColSpan = columns.length,
  banner,
  rowClassName,
  className = '',
}) {
  return (
    <div id={id} className={`bg-[var(--surface)] border border-[var(--border)] rounded-sm overflow-hidden ${className}`}>
      {banner}
      <div className="overflow-x-auto">
        <table className="w-full text-xs sm:text-sm" style={minWidth ? { minWidth: typeof minWidth === 'number' ? `${minWidth}px` : minWidth } : undefined}>
          <thead className="bg-[var(--accent)] text-white">
            <tr>
              {columns.map((col, i) => (
                <th
                  key={col.key ?? i}
                  className={`text-[10px] uppercase tracking-wider font-semibold ${col.headerClass || ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={emptyColSpan} className="px-4 py-8 text-center text-[var(--text3)] italic text-sm">
                  {emptyMessage}
                </td>
              </tr>
            ) : rows.map((row, idx) => (
              <tr
                key={rowKey ? rowKey(row, idx) : idx}
                className={`border-b border-[var(--border)] transition-colors hover:bg-[var(--accent-lt)] ${rowClassName ? rowClassName(row, idx) : ''}`}
              >
                {columns.map((col, i) => (
                  <td key={col.key ?? i} className={col.cellClass || 'px-3 sm:px-4 py-2.5 sm:py-3'}>
                    {col.render ? col.render(row, idx) : col.value ? col.value(row, idx) : row[col.key ?? '']}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}