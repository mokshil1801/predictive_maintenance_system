type TableProps = {
  columns: string[];
  rows: React.ReactNode[][];
};

export function Table({ columns, rows }: TableProps) {
  return (
    <div className="overflow-hidden rounded-[24px] border border-border bg-surface">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border text-left">
          <thead className="bg-surface-strong">
            <tr>
              {columns.map((column) => (
                <th
                  key={column}
                  className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-primary-strong"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/80">
            {rows.map((row, index) => (
              <tr key={index} className="align-top">
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="px-5 py-4 text-sm text-text-muted">
                    {cell}
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
