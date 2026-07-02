import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { DateTimeRangePicker } from "@/components/ui/date-time-picker"
import type { EventFormState } from "@/utils/eventForm"
import { eventTimeError } from "@/utils/eventForm"

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
  const timeError = eventTimeError(form.start_time, form.end_time)
  const canSave = form.title.trim().length > 0 && !timeError
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-4 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{eventId ? "Edit event" : "New event"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={form.title} onChange={(e) => { onFormChange({ ...form, title: e.target.value }) }} />
          </div>
          <DateTimeRangePicker
            start={form.start_time}
            end={form.end_time}
            onChange={(start_time, end_time) => { onFormChange({ ...form, start_time, end_time }) }}
          />
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input id="location" value={form.location} onChange={(e) => { onFormChange({ ...form, location: e.target.value }) }} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" rows={3} value={form.description} onChange={(e) => { onFormChange({ ...form, description: e.target.value }) }} className="resize-none" />
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
