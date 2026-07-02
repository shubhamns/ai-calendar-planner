import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { DateTimeRangePicker } from "@/components/ui/date-time-picker"
import type { EventFormState } from "@/utils/eventForm"
import { EVENT_LOCATION_MAX, EVENT_NOTES_MAX, EVENT_TITLE_MAX, clampField, eventTimeError } from "@/utils/eventForm"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  form: EventFormState
  onFormChange: (form: EventFormState) => void
  eventId?: number
  busy?: boolean
  onSave: () => void
  onDelete?: () => void
}

export function EventDialog({ open, onOpenChange, form, onFormChange, eventId, busy, onSave, onDelete }: Props) {
  const timeError: string | null = eventTimeError(form.start_time, form.end_time)
  const canSave = form.title.trim().length > 0 && !timeError
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-4 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{eventId ? "Edit event" : "New event"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="title">Title</Label>
              <span className="text-xs text-muted-foreground">{form.title.length}/{EVENT_TITLE_MAX}</span>
            </div>
            <Input id="title" value={form.title} maxLength={EVENT_TITLE_MAX} onChange={(e) => { onFormChange({ ...form, title: clampField(e.target.value, EVENT_TITLE_MAX) }) }} />
          </div>
          <DateTimeRangePicker
            start={form.start_time}
            end={form.end_time}
            onChange={(start_time, end_time) => { onFormChange({ ...form, start_time, end_time }) }}
          />
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="location">Location <span className="font-normal text-muted-foreground">(optional)</span></Label>
              <span className="text-xs text-muted-foreground">{form.location.length}/{EVENT_LOCATION_MAX}</span>
            </div>
            <Input id="location" value={form.location} maxLength={EVENT_LOCATION_MAX} onChange={(e) => { onFormChange({ ...form, location: clampField(e.target.value, EVENT_LOCATION_MAX) }) }} />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="notes">Notes <span className="font-normal text-muted-foreground">(optional)</span></Label>
              <span className="text-xs text-muted-foreground">{form.description.length}/{EVENT_NOTES_MAX}</span>
            </div>
            <Textarea id="notes" rows={3} value={form.description} maxLength={EVENT_NOTES_MAX} onChange={(e) => { onFormChange({ ...form, description: clampField(e.target.value, EVENT_NOTES_MAX) }) }} className="resize-none" />
          </div>
        </div>
        <DialogFooter className="gap-2 pt-2 sm:justify-end">
          {eventId && onDelete && (
            <Button type="button" variant="destructive" className="mr-auto w-full sm:w-auto" disabled={busy} onClick={onDelete}>Delete</Button>
          )}
          <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => { onOpenChange(false) }}>Cancel</Button>
          <Button type="button" className="w-full sm:w-auto" disabled={!canSave || busy} onClick={onSave}>
            {busy ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
