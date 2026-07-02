import { useEffect, useState } from "react"
import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import timeGridPlugin from "@fullcalendar/timegrid"
import interactionPlugin from "@fullcalendar/interaction"
import type { DateSelectArg, EventClickArg, EventDropArg, EventInput } from "@fullcalendar/core"
import type { EventResizeDoneArg } from "@fullcalendar/interaction"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ChevronDown, ChevronUp, Plus, Sparkles } from "lucide-react"
import { MainLayout } from "@/components/layout/MainLayout"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { EventDialog } from "@/components/calendar/EventDialog"
import { aiApi, eventsApi } from "@/services/api"
import type { AIPlanResponse, CalendarEvent } from "@/types/api"
import { ensureUtcIso } from "@/utils/datetime"
import { blankEventForm, eventToForm, formToPayload } from "@/utils/eventForm"
import { toastError, toastSuccess } from "@/utils/toast"

const panel = "panel overflow-hidden"

export function AppPage() {
  const qc = useQueryClient()
  const [isPhone, setIsPhone] = useState(() => window.matchMedia("(max-width: 640px)").matches)
  const [range, setRange] = useState<{ start: string; end: string } | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState(blankEventForm())
  const [editId, setEditId] = useState<number>()
  const [prompt, setPrompt] = useState("")
  const [aiText, setAiText] = useState("")
  const [aiOpen, setAiOpen] = useState(!isPhone)
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)")
    const onChange = () => { setIsPhone(mq.matches) }
    mq.addEventListener("change", onChange)
    return () => { mq.removeEventListener("change", onChange) }
  }, [])
  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["stats"] })
    void qc.invalidateQueries({ queryKey: ["events"] })
  }
  const { data: stats } = useQuery({ queryKey: ["stats"], queryFn: eventsApi.stats })
  const { data: events = [] } = useQuery({
    queryKey: ["events", range],
    queryFn: () => {
      if (!range) throw new Error("Missing calendar range")
      return eventsApi.list(range.start, range.end)
    },
    enabled: !!range,
  })
  const saveEvent = useMutation<CalendarEvent, Error, ReturnType<typeof formToPayload>>({
    mutationFn: async (values: ReturnType<typeof formToPayload>) => {
      if (editId) return eventsApi.update(editId, values)
      return eventsApi.create(values)
    },
    onSuccess: () => {
      toastSuccess(editId ? "Event updated" : "Event created")
      setDialogOpen(false)
      setEditId(undefined)
      refresh()
    },
    onError: (error) => { toastError(error, "Could not save event") },
  })
  const removeEvent = useMutation<undefined, Error, number>({
    mutationFn: async (id: number) => {
      await eventsApi.delete(id)
    },
    onSuccess: () => {
      toastSuccess("Event deleted")
      setDialogOpen(false)
      setEditId(undefined)
      refresh()
    },
    onError: (error) => { toastError(error, "Could not delete event") },
  })
  const aiPlan = useMutation<AIPlanResponse>({
    mutationFn: () => aiApi.plan(prompt),
    onSuccess: (res) => {
      setAiText(res.response)
      setPrompt("")
      if (isPhone) setAiOpen(true)
      toastSuccess("AI plan ready")
    },
    onError: (error) => { toastError(error, "Something went wrong.") },
  })
  const fcEvents: EventInput[] = events.map((e) => ({
    id: String(e.id),
    title: e.title,
    start: ensureUtcIso(e.start_time),
    end: ensureUtcIso(e.end_time),
  }))
  const openNew = (start?: Date, end?: Date) => {
    setEditId(undefined)
    setForm(blankEventForm(start, end))
    setDialogOpen(true)
  }
  const openEdit = (event: CalendarEvent) => {
    setEditId(event.id)
    setForm(eventToForm(event))
    setDialogOpen(true)
  }
  const pushTimeChange = (id: number, start: Date, end: Date) => {
    void eventsApi.update(id, { start_time: start.toISOString(), end_time: end.toISOString() })
      .then(() => {
        refresh()
        toastSuccess("Event rescheduled")
      })
      .catch((error: unknown) => { toastError(error, "Could not move event") })
  }
  const onDragOrResize = (info: EventDropArg | EventResizeDoneArg) => {
    const { event } = info
    if (!event.start || !event.end) return
    pushTimeChange(Number(event.id), event.start, event.end)
  }
  return (
    <MainLayout>
      <div className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold sm:text-3xl">Schedule</h1>
            <p className="mt-1 text-sm text-muted-foreground">Drag on the grid to create an event</p>
          </div>
          <Button className="hidden rounded-lg sm:inline-flex" onClick={() => { openNew() }}>
            <Plus className="mr-2 h-4 w-4" />
            Add event
          </Button>
        </div>
        <div className="flex gap-3 sm:max-w-xs">
          <div className="panel flex-1 px-4 py-3">
            <p className="text-xs text-muted-foreground">Today</p>
            <p className="text-2xl font-semibold text-primary">{stats?.events_today ?? 0}</p>
          </div>
          <div className="panel flex-1 px-4 py-3">
            <p className="text-xs text-muted-foreground">Upcoming</p>
            <p className="text-2xl font-semibold text-primary">{stats?.events_upcoming ?? 0}</p>
          </div>
        </div>
        <div className="grid gap-5 lg:grid-cols-5">
          <div className={`${panel} p-2 sm:p-3 lg:col-span-3`}>
            <div className="fc-theme min-h-[420px] sm:min-h-[540px]">
              <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView={isPhone ? "timeGridDay" : "dayGridMonth"}
                headerToolbar={{
                  left: "prev,next today",
                  center: "title",
                  right: isPhone ? "timeGridDay,dayGridMonth" : "dayGridMonth,timeGridWeek,timeGridDay",
                }}
                height="auto"
                selectable
                editable
                dayMaxEvents
                events={fcEvents}
                select={(info: DateSelectArg) => {
                  openNew(info.start, info.end)
                  info.view.calendar.unselect()
                }}
                eventClick={(info: EventClickArg) => {
                  const hit = events.find((e) => String(e.id) === info.event.id)
                  if (hit) openEdit(hit)
                }}
                eventDrop={onDragOrResize}
                eventResize={onDragOrResize}
                datesSet={(info) => { setRange({ start: info.startStr, end: info.endStr }) }}
              />
            </div>
          </div>
          <div className={`${panel} lg:col-span-2`}>
            <button
              type="button"
              className="flex w-full items-center justify-between p-4 sm:cursor-default sm:p-5"
              onClick={() => { if (isPhone) setAiOpen((v) => !v) }}
            >
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="font-medium">AI planner</span>
              </div>
              {isPhone && (aiOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
            </button>
            {(!isPhone || aiOpen) && (
              <div className="space-y-3 border-t px-4 pb-4 pt-3 sm:border-0 sm:px-5 sm:pb-5">
                <Textarea
                  placeholder="What should I plan around this week?"
                  value={prompt}
                  onChange={(e) => { setPrompt(e.target.value) }}
                  rows={isPhone ? 3 : 4}
                  className="resize-none bg-muted/40"
                />
                <Button className="w-full rounded-lg" disabled={!prompt.trim() || aiPlan.isPending} onClick={() => { aiPlan.mutate() }}>
                  {aiPlan.isPending ? "Working on it..." : "Ask AI"}
                </Button>
                {aiText && <div className="rounded-lg bg-muted/40 p-3 text-sm whitespace-pre-wrap">{aiText}</div>}
                {aiPlan.data && <p className="text-center text-xs text-muted-foreground">{aiPlan.data.prompts_remaining} left today</p>}
              </div>
            )}
          </div>
        </div>
      </div>
      <Button size="icon" className="fixed bottom-4 right-4 z-40 h-12 w-12 rounded-xl shadow-lg sm:hidden" style={{ marginBottom: "env(safe-area-inset-bottom)" }} onClick={() => { openNew() }} aria-label="Add event">
        <Plus className="h-5 w-5" />
      </Button>
      <EventDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        form={form}
        onFormChange={setForm}
        eventId={editId}
        busy={saveEvent.isPending || removeEvent.isPending}
        onSave={() => { saveEvent.mutate(formToPayload(form)) }}
        onDelete={editId ? () => { removeEvent.mutate(editId) } : undefined}
      />
    </MainLayout>
  )
}
