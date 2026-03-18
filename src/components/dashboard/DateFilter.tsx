import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export type FilterOption = "today" | "7days" | "month" | "all" | "custom";

interface DateFilterProps {
  filter: FilterOption;
  onFilterChange: (value: FilterOption) => void;
  customFrom: Date | undefined;
  customTo: Date | undefined;
  onCustomFromChange: (date: Date | undefined) => void;
  onCustomToChange: (date: Date | undefined) => void;
}

const DateFilter = ({
  filter,
  onFilterChange,
  customFrom,
  customTo,
  onCustomFromChange,
  onCustomToChange,
}: DateFilterProps) => {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={filter} onValueChange={(v) => onFilterChange(v as FilterOption)}>
        <SelectTrigger className="w-[180px] bg-card/70 backdrop-blur-md border-border/40 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="today">Hoy</SelectItem>
          <SelectItem value="7days">Últimos 7 días</SelectItem>
          <SelectItem value="month">Este Mes</SelectItem>
          <SelectItem value="all">Todo el Histórico</SelectItem>
          <SelectItem value="custom">Personalizado</SelectItem>
        </SelectContent>
      </Select>

      {filter === "custom" && (
        <>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[140px] justify-start text-left text-sm font-normal bg-card/70 backdrop-blur-md border-border/40",
                  !customFrom && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {customFrom ? format(customFrom, "dd MMM yyyy", { locale: es }) : "Desde"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={customFrom}
                onSelect={onCustomFromChange}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[140px] justify-start text-left text-sm font-normal bg-card/70 backdrop-blur-md border-border/40",
                  !customTo && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {customTo ? format(customTo, "dd MMM yyyy", { locale: es }) : "Hasta"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={customTo}
                onSelect={onCustomToChange}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </>
      )}
    </div>
  );
};

export default DateFilter;
