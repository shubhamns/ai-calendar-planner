import { format, isSameDay } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/utils/cn"
import { applyDateToDatetimeLocal, applyTimeToDatetimeLocal, addHoursToDatetimeLocal, datetimeLocalToMs, splitDatetimeLocal } from "@/utils/datetime"
import { eventTimeError } from "@/utils/eventForm"

type DateTimeRangePickerProps = {
  start: string
  end: string
  onChange: (start: string, end: string) => void
  className?: string
}

function DateButton({ value, onChange, className }: { value: string; onChange: (date: Date) => void; className?: string }) {
  const { date } = splitDatetimeLocal(value)
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className={cn("h-10 w-full justify-start font-normal", !date && "text-muted-foreground", className)}>
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
          <span className="truncate">{date ? format(date, "MMM d, yyyy") : "Pick date"}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={date} onSelect={(next) => { if (next) onChange(next) }} />
      </PopoverContent>
    </Popover>
  )
}

export function DateTimeRangePicker({ start, end, onChange, className }: DateTimeRangePickerProps) {
  const startParts = splitDatetimeLocal(start)
  const endParts = splitDatetimeLocal(end)
  const error = eventTimeError(start, end)
  const bumpEnd = (nextStart: string, nextEnd: string) => {
    if (datetimeLocalToMs(nextEnd) <= datetimeLocalToMs(nextStart)) {
      return addHoursToDatetimeLocal(nextStart, 1)
    }
    return nextEnd
  }
  const setStartDate = (date: Date) => {
    const oldStartDate = splitDatetimeLocal(start).date
    const oldEndDate = splitDatetimeLocal(end).date
    const nextStart = applyDateToDatetimeLocal(start, date)
    let nextEnd = end
    if (oldStartDate && oldEndDate && isSameDay(oldStartDate, oldEndDate)) {
      nextEnd = applyDateToDatetimeLocal(end, date)
    }
    onChange(nextStart, bumpEnd(nextStart, nextEnd))
  }
  const setStartTime = (time: string) => {
    const nextStart = applyTimeToDatetimeLocal(start, time)
    onChange(nextStart, bumpEnd(nextStart, end))
  }
  const setEndDate = (date: Date) => {
    onChange(start, applyDateToDatetimeLocal(end, date))
  }
  const setEndTime = (time: string) => {
    onChange(start, applyTimeToDatetimeLocal(end, time))
  }
  const setEndSameDay = () => {
    const startDate = splitDatetimeLocal(start).date
    if (!startDate) return
    onChange(start, bumpEnd(start, applyDateToDatetimeLocal(end, startDate)))
  }
  return (
    <div className={cn("space-y-4", className)}>
      <div className="space-y-2">
        <Label>Start</Label>
        <div className="flex items-center gap-2">
          <DateButton value={start} onChange={setStartDate} className="min-w-0 flex-1" />
          <Input type="time" value={startParts.time} onChange={(e) => { setStartTime(e.target.value) }} className="h-10 w-[7.25rem] shrink-0 px-2" aria-label="Start time" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Label>End</Label>
          <Button type="button" variant="link" className="h-auto px-0 text-xs" onClick={setEndSameDay}>Same day</Button>
        </div>
        <div className="flex items-center gap-2">
          <DateButton value={end} onChange={setEndDate} className="min-w-0 flex-1" />
          <Input type="time" value={endParts.time} onChange={(e) => { setEndTime(e.target.value) }} className="h-10 w-[7.25rem] shrink-0 px-2" aria-label="End time" />
        </div>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
