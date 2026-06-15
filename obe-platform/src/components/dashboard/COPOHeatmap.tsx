'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Network } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// These will be fetched from DB when CO-PO mappings are saved
const rows = ['CO1', 'CO2', 'CO3', 'CO4', 'CO5'];
const cols = ['PO1', 'PO2', 'PO3', 'PO4', 'PO5'];

function getCellColor(value: number): string {
  switch (value) {
    case 3: return 'bg-green-600 dark:bg-green-500 text-white';
    case 2: return 'bg-green-400/60 dark:bg-green-600/50 text-green-900 dark:text-green-100';
    case 1: return 'bg-green-200/60 dark:bg-green-800/30 text-green-800 dark:text-green-300';
    default: return 'bg-muted/30 text-muted-foreground/30';
  }
}

function getCellLabel(value: number): string {
  switch (value) {
    case 3: return 'High correlation';
    case 2: return 'Medium correlation';
    case 1: return 'Low correlation';
    default: return 'No correlation';
  }
}

export function COPOHeatmap() {
  // When CO-PO mappings are saved to DB, this will fetch real data
  // For now, show empty grid indicating no mappings yet
  const getValue = (_row: string, _col: string): number => {
    return 0; // No mock data — real mappings come from DB
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.9, duration: 0.4 }}
    >
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">CO-PO Mapping Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="w-12 h-8" />
                  {cols.map((col) => (
                    <th
                      key={col}
                      className="text-[11px] font-semibold text-muted-foreground text-center h-8 w-10"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, rowIdx) => (
                  <tr key={row}>
                    <td className="text-[11px] font-semibold text-muted-foreground pr-2 h-10">
                      {row}
                    </td>
                    {cols.map((col, colIdx) => {
                      const value = getValue(row, col);
                      return (
                        <td key={col} className="p-0.5">
                          <Tooltip>
                            <TooltipTrigger
                                className={cn(
                                  'w-full h-9 rounded-md flex items-center justify-center text-xs font-bold cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all',
                                  getCellColor(value)
                                )}
                              >
                                {value || '-'}
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">
                                {row} × {col}: {getCellLabel(value)} ({value})
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-3 mt-4 justify-center">
            {[
              { label: 'High (3)', color: 'bg-green-600' },
              { label: 'Med (2)', color: 'bg-green-400/60' },
              { label: 'Low (1)', color: 'bg-green-200/60' },
              { label: 'None', color: 'bg-muted/30' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-1">
                <div
                  className={cn('h-3 w-3 rounded-sm', item.color)}
                />
                <span className="text-[10px] text-muted-foreground">
                  {item.label}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-4 flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-primary hover:text-primary/80"
            >
              View Full Map
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
