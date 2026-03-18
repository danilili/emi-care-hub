import { useMemo } from "react";
import {
  startOfDay,
  subDays,
  startOfMonth,
  isWithinInterval,
  parseISO,
  endOfDay,
} from "date-fns";
import type { ResumenDiario } from "./useResumenDiario";
import type { FilterOption } from "@/components/dashboard/DateFilter";

export function useFilteredData(
  data: ResumenDiario[],
  filter: FilterOption,
  customFrom: Date | undefined,
  customTo: Date | undefined
) {
  return useMemo(() => {
    if (!data.length) return [];

    const today = new Date();

    return data.filter((row) => {
      if (!row.fecha) return false;
      const fecha = parseISO(row.fecha);

      switch (filter) {
        case "today":
          return (
            fecha >= startOfDay(today) && fecha <= endOfDay(today)
          );
        case "7days":
          return (
            fecha >= startOfDay(subDays(today, 6)) &&
            fecha <= endOfDay(today)
          );
        case "month":
          return (
            fecha >= startOfMonth(today) && fecha <= endOfDay(today)
          );
        case "all":
          return true;
        case "custom": {
          if (!customFrom && !customTo) return true;
          const from = customFrom ? startOfDay(customFrom) : new Date(0);
          const to = customTo ? endOfDay(customTo) : endOfDay(today);
          return isWithinInterval(fecha, { start: from, end: to });
        }
        default:
          return true;
      }
    });
  }, [data, filter, customFrom, customTo]);
}
