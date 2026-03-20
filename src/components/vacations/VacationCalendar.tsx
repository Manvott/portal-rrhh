"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Users, Plus, Calendar, X, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

interface EmployeeData {
  first_name: string;
  last_name: string;
  department: string | null;
}

interface ApprovedVacation {
  id: string;
  start_date: string;
  end_date: string;
  type: string;
  employee?: EmployeeData | EmployeeData[] | null;
}

interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string;
  type: "event" | "fair" | "holiday" | "other";
  color: string | null;
}

function getEmployee(employee: EmployeeData | EmployeeData[] | undefined | null): EmployeeData | null {
  if (!employee) return null;
  if (Array.isArray(employee)) return employee[0] ?? null;
  return employee;
}

interface Props {
  approvedVacations: ApprovedVacation[];
  calendarEvents: CalendarEvent[];
  userRole: string;
}

const EMPLOYEE_COLORS = [
  { bg: "bg-blue-200", text: "text-blue-800", dot: "bg-blue-500" },
  { bg: "bg-green-200", text: "text-green-800", dot: "bg-green-500" },
  { bg: "bg-purple-200", text: "text-purple-800", dot: "bg-purple-500" },
  { bg: "bg-orange-200", text: "text-orange-800", dot: "bg-orange-500" },
  { bg: "bg-pink-200", text: "text-pink-800", dot: "bg-pink-500" },
  { bg: "bg-teal-200", text: "text-teal-800", dot: "bg-teal-500" },
  { bg: "bg-red-200", text: "text-red-800", dot: "bg-red-500" },
  { bg: "bg-indigo-200", text: "text-indigo-800", dot: "bg-indigo-500" },
];

const EVENT_STYLES: Record<string, { bg: string; text: string; dot: string; label: string; icon: string }> = {
  holiday: { bg: "bg-red-100", text: "text-red-700", dot: "bg-red-500", label: "Festivo", icon: "🏖️" },
  fair:    { bg: "bg-purple-100", text: "text-purple-700", dot: "bg-purple-500", label: "Feria", icon: "🎪" },
  event:   { bg: "bg-yellow-100", text: "text-yellow-800", dot: "bg-yellow-500", label: "Evento", icon: "📅" },
  other:   { bg: "bg-gray-100", text: "text-gray-700", dot: "bg-gray-400", label: "Otro", icon: "📌" },
};

const MONTHS_ES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const DAYS_ES = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];

function getInitials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

function dateKey(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export function VacationCalendar({ approvedVacations, calendarEvents: initialEvents, userRole }: Props) {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [showEventForm, setShowEventForm] = useState(false);
  const [eventForm, setEventForm] = useState({ title: "", type: "event" as CalendarEvent["type"], start_date: "", end_date: "", description: "" });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents);

  const employeeColorMap = useMemo(() => {
    const map: Record<string, typeof EMPLOYEE_COLORS[0]> = {};
    let idx = 0;
    approvedVacations.forEach((v) => {
      const emp = getEmployee(v.employee);
      if (emp) {
        const key = `${emp.first_name} ${emp.last_name}`;
        if (!map[key]) { map[key] = EMPLOYEE_COLORS[idx % EMPLOYEE_COLORS.length]; idx++; }
      }
    });
    return map;
  }, [approvedVacations]);

  const vacationsByDay = useMemo(() => {
    const map: Record<string, ApprovedVacation[]> = {};
    approvedVacations.forEach((v) => {
      const cur = new Date(v.start_date + "T00:00:00");
      const end = new Date(v.end_date + "T00:00:00");
      while (cur <= end) {
        const k = cur.toISOString().split("T")[0];
        if (!map[k]) map[k] = [];
        map[k].push(v);
        cur.setDate(cur.getDate() + 1);
      }
    });
    return map;
  }, [approvedVacations]);

  const eventsByDay = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    events.forEach((ev) => {
      const cur = new Date(ev.start_date + "T00:00:00");
      const end = new Date(ev.end_date + "T00:00:00");
      while (cur <= end) {
        const k = cur.toISOString().split("T")[0];
        if (!map[k]) map[k] = [];
        map[k].push(ev);
        cur.setDate(cur.getDate() + 1);
      }
    });
    return map;
  }, [events]);

  const prevMonth = () => { if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); } else setCurrentMonth(m => m - 1); };
  const nextMonth = () => { if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); } else setCurrentMonth(m => m + 1); };

  const firstDay = new Date(currentYear, currentMonth, 1);
  const startPadding = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const calendarCells: (number | null)[] = [...Array(startPadding).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (calendarCells.length % 7 !== 0) calendarCells.push(null);

  const selectedVacations = selectedDay ? (vacationsByDay[selectedDay] ?? []) : [];
  const selectedEvents = selectedDay ? (eventsByDay[selectedDay] ?? []) : [];

  const employeesThisMonth = useMemo(() => {
    const seen = new Set<string>();
    const result: { name: string; color: typeof EMPLOYEE_COLORS[0] }[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const k = dateKey(currentYear, currentMonth, d);
      (vacationsByDay[k] ?? []).forEach((v) => {
        const emp = getEmployee(v.employee);
        if (emp) {
          const name = `${emp.first_name} ${emp.last_name}`;
          if (!seen.has(name)) { seen.add(name); result.push({ name, color: employeeColorMap[name] ?? EMPLOYEE_COLORS[0] }); }
        }
      });
    }
    return result;
  }, [currentYear, currentMonth, daysInMonth, vacationsByDay, employeeColorMap]);

  const eventsThisMonth = useMemo(() => {
    const seen = new Set<string>();
    const result: CalendarEvent[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const k = dateKey(currentYear, currentMonth, d);
      (eventsByDay[k] ?? []).forEach((ev) => {
        if (!seen.has(ev.id)) { seen.add(ev.id); result.push(ev); }
      });
    }
    return result;
  }, [currentYear, currentMonth, daysInMonth, eventsByDay]);

  const handleSaveEvent = async () => {
    setFormError(null);
    if (!eventForm.title.trim()) { setFormError("El título es obligatorio."); return; }
    if (eventForm.title.trim().length > 100) { setFormError("El título no puede superar 100 caracteres."); return; }
    if (!eventForm.start_date) { setFormError("La fecha de inicio es obligatoria."); return; }
    const endDate = eventForm.end_date || eventForm.start_date;
    if (endDate < eventForm.start_date) { setFormError("La fecha de fin no puede ser anterior a la de inicio."); return; }

    setSaving(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("calendar_events")
        .insert({ title: eventForm.title.trim(), type: eventForm.type, start_date: eventForm.start_date, end_date: endDate, description: eventForm.description || null })
        .select("id, title, description, start_date, end_date, type, color")
        .single();
      if (error) throw error;
      setEvents(prev => [...prev, data as CalendarEvent]);
      setShowEventForm(false);
      setEventForm({ title: "", type: "event", start_date: "", end_date: "", description: "" });
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Error al guardar el evento.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm("¿Eliminar este evento del calendario?")) return;
    const supabase = createClient();
    await supabase.from("calendar_events").delete().eq("id", id);
    setEvents(prev => prev.filter(e => e.id !== id));
    setSelectedDay(null);
  };

  return (
    <div className="bg-white rounded-lg border border-ava-gray-medium overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-ava-gray-medium flex items-center justify-between flex-wrap gap-2">
        <h2 className="font-semibold text-ava-charcoal flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Calendario del Equipo
        </h2>
        <div className="flex items-center gap-3">
          <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-ava-gray transition-colors text-ava-charcoal-light hover:text-ava-charcoal">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-semibold text-ava-charcoal min-w-[140px] text-center">
            {MONTHS_ES[currentMonth]} {currentYear}
          </span>
          <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-ava-gray transition-colors text-ava-charcoal-light hover:text-ava-charcoal">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Cabecera días */}
        <div className="grid grid-cols-7 gap-1">
          {DAYS_ES.map((d) => (
            <div key={d} className="text-center text-xs font-semibold text-ava-charcoal-light uppercase py-1">{d}</div>
          ))}
        </div>

        {/* Celdas */}
        <div className="grid grid-cols-7 gap-1">
          {calendarCells.map((day, idx) => {
            if (day === null) return <div key={`empty-${idx}`} className="h-20" />;
            const k = dateKey(currentYear, currentMonth, day);
            const dayvacs = vacationsByDay[k] ?? [];
            const dayevs = eventsByDay[k] ?? [];
            const isToday = day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
            const isSelected = selectedDay === k;
            const dayOfWeek = (startPadding + day - 1) % 7;
            const isWknd = dayOfWeek >= 5;
            const isHoliday = dayevs.some(e => e.type === "holiday");

            return (
              <div
                key={k}
                onClick={() => setSelectedDay(isSelected ? null : k)}
                className={cn(
                  "h-20 rounded-lg p-1 cursor-pointer transition-colors flex flex-col gap-0.5",
                  isHoliday ? "bg-red-50" : isWknd ? "bg-ava-gray/40" : "bg-white hover:bg-ava-gray/30",
                  isSelected && "ring-2 ring-ava-yellow",
                  isToday && !isSelected && "ring-2 ring-ava-charcoal"
                )}
              >
                <span className={cn(
                  "text-xs font-medium self-end leading-none",
                  isToday ? "w-5 h-5 bg-ava-charcoal text-white rounded-full flex items-center justify-center text-[10px]"
                    : isHoliday ? "text-red-600 font-bold"
                    : isWknd ? "text-ava-charcoal-light"
                    : "text-ava-charcoal"
                )}>
                  {day}
                </span>

                {/* Eventos/Ferias/Festivos */}
                {dayevs.slice(0, 2).map((ev) => {
                  const style = EVENT_STYLES[ev.type] ?? EVENT_STYLES.other;
                  return (
                    <span key={ev.id} className={cn("text-[8px] font-semibold px-1 rounded leading-3 truncate", style.bg, style.text)} title={ev.title}>
                      {style.icon} {ev.title}
                    </span>
                  );
                })}

                {/* Indicadores de vacaciones */}
                <div className="flex flex-wrap gap-0.5 overflow-hidden mt-auto">
                  {dayvacs.slice(0, 3).map((v, i) => {
                    const emp = getEmployee(v.employee);
                    const empName = emp ? `${emp.first_name} ${emp.last_name}` : "?";
                    const color = employeeColorMap[empName] ?? EMPLOYEE_COLORS[0];
                    const initials = emp ? getInitials(emp.first_name, emp.last_name) : "?";
                    return (
                      <span key={i} className={cn("text-[9px] font-bold px-1 rounded leading-4", color.bg, color.text)} title={empName}>
                        {initials}
                      </span>
                    );
                  })}
                  {dayvacs.length > 3 && <span className="text-[9px] text-ava-charcoal-light leading-4">+{dayvacs.length - 3}</span>}
                </div>
              </div>
            );
          })}
        </div>

        {/* Detalle del día seleccionado */}
        {selectedDay && (
          <div className="p-4 bg-ava-gray/30 rounded-lg border border-ava-gray-medium">
            <p className="text-sm font-semibold text-ava-charcoal mb-3">
              {new Date(selectedDay + "T12:00:00").toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
            {selectedEvents.length === 0 && selectedVacations.length === 0 && (
              <p className="text-sm text-ava-charcoal-light">Sin eventos ni ausencias este día.</p>
            )}
            {/* Eventos primero */}
            {selectedEvents.length > 0 && (
              <div className="space-y-1.5 mb-3">
                {selectedEvents.map((ev) => {
                  const style = EVENT_STYLES[ev.type] ?? EVENT_STYLES.other;
                  return (
                    <div key={ev.id} className={cn("flex items-center gap-2 px-3 py-2 rounded-lg", style.bg)}>
                      <span className="text-base">{style.icon}</span>
                      <div className="flex-1 min-w-0">
                        <span className={cn("text-sm font-semibold", style.text)}>{ev.title}</span>
                        <span className={cn("text-xs ml-2 opacity-70", style.text)}>{style.label}</span>
                        {ev.description && <p className={cn("text-xs mt-0.5", style.text, "opacity-70")}>{ev.description}</p>}
                      </div>
                      {userRole === "admin" && (
                        <button onClick={() => handleDeleteEvent(ev.id)} className="p-1 rounded hover:bg-black/10 transition-colors" title="Eliminar evento">
                          <X className="w-3 h-3 text-gray-500" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            {/* Vacaciones */}
            {selectedVacations.length > 0 && (
              <div className="space-y-1.5">
                {selectedVacations.map((v) => {
                  const emp = getEmployee(v.employee);
                  const empName = emp ? `${emp.first_name} ${emp.last_name}` : "Empleado";
                  const color = employeeColorMap[empName] ?? EMPLOYEE_COLORS[0];
                  const TYPE_LABELS: Record<string, string> = { vacation: "Vacaciones", sick: "Baja médica", personal: "Asunto personal", other: "Otro" };
                  return (
                    <div key={v.id} className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg", color.bg)}>
                      <Users className={cn("w-3.5 h-3.5 shrink-0", color.text)} />
                      <span className={cn("text-sm font-medium", color.text)}>{empName}</span>
                      <span className={cn("text-xs opacity-70", color.text)}>
                        · {TYPE_LABELS[v.type] ?? v.type}
                        {" · "}
                        {new Date(v.start_date + "T12:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                        {" — "}
                        {new Date(v.end_date + "T12:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Leyenda */}
        <div className="flex flex-wrap gap-x-4 gap-y-2 pt-2 border-t border-ava-gray-medium">
          {/* Tipos de eventos */}
          {Object.entries(EVENT_STYLES).map(([type, style]) => {
            const hasThisMonth = eventsThisMonth.some(e => e.type === type);
            if (!hasThisMonth) return null;
            return (
              <div key={type} className="flex items-center gap-1.5">
                <div className={cn("w-2.5 h-2.5 rounded-full", style.dot)} />
                <span className="text-xs text-ava-charcoal-light">{style.label}</span>
              </div>
            );
          })}
          {/* Empleados */}
          {employeesThisMonth.map(({ name, color }) => (
            <div key={name} className="flex items-center gap-1.5">
              <div className={cn("w-2.5 h-2.5 rounded-full", color.dot)} />
              <span className="text-xs text-ava-charcoal-light">{name}</span>
            </div>
          ))}
        </div>

        {/* Formulario de añadir evento — solo admin */}
        {userRole === "admin" && (
          <div className="border-t border-ava-gray-medium pt-4">
            {!showEventForm ? (
              <button
                onClick={() => setShowEventForm(true)}
                className="flex items-center gap-2 text-sm text-ava-charcoal-light hover:text-ava-charcoal transition-colors"
              >
                <Plus className="w-4 h-4" />
                Añadir evento al calendario
              </button>
            ) : (
              <div className="bg-ava-gray/30 rounded-lg p-4 space-y-3">
                <h3 className="font-semibold text-ava-charcoal text-sm">Nuevo evento</h3>
                {formError && (
                  <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {formError}
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-xs font-medium text-ava-charcoal">Título *</label>
                    <input
                      type="text"
                      value={eventForm.title}
                      onChange={e => setEventForm(f => ({ ...f, title: e.target.value }))}
                      maxLength={100}
                      placeholder="Nombre del evento..."
                      className="w-full px-3 py-2 rounded-lg border border-ava-gray-medium focus:outline-none focus:ring-2 focus:ring-ava-yellow text-sm"
                    />
                    <p className="text-xs text-ava-charcoal-light text-right">{eventForm.title.length}/100</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-ava-charcoal">Tipo *</label>
                    <select
                      value={eventForm.type}
                      onChange={e => setEventForm(f => ({ ...f, type: e.target.value as CalendarEvent["type"] }))}
                      className="w-full px-3 py-2 rounded-lg border border-ava-gray-medium focus:outline-none focus:ring-2 focus:ring-ava-yellow text-sm"
                    >
                      <option value="event">📅 Evento empresa</option>
                      <option value="fair">🎪 Feria</option>
                      <option value="holiday">🏖️ Festivo</option>
                      <option value="other">📌 Otro</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-ava-charcoal">Fecha inicio *</label>
                    <input
                      type="date"
                      value={eventForm.start_date}
                      onChange={e => setEventForm(f => ({ ...f, start_date: e.target.value, end_date: f.end_date || e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-ava-gray-medium focus:outline-none focus:ring-2 focus:ring-ava-yellow text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-ava-charcoal">Fecha fin</label>
                    <input
                      type="date"
                      value={eventForm.end_date}
                      min={eventForm.start_date}
                      onChange={e => setEventForm(f => ({ ...f, end_date: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-ava-gray-medium focus:outline-none focus:ring-2 focus:ring-ava-yellow text-sm"
                    />
                  </div>
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-xs font-medium text-ava-charcoal">Descripción (opcional)</label>
                    <textarea
                      value={eventForm.description}
                      onChange={e => setEventForm(f => ({ ...f, description: e.target.value }))}
                      rows={2}
                      maxLength={300}
                      placeholder="Detalles del evento..."
                      className="w-full px-3 py-2 rounded-lg border border-ava-gray-medium focus:outline-none focus:ring-2 focus:ring-ava-yellow text-sm resize-none"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveEvent}
                    disabled={saving}
                    className="flex items-center gap-2 bg-ava-yellow hover:bg-ava-yellow-dark text-ava-charcoal font-semibold px-4 py-2 rounded-lg transition-colors text-sm disabled:opacity-60"
                  >
                    {saving ? "Guardando..." : "Guardar"}
                  </button>
                  <button
                    onClick={() => { setShowEventForm(false); setFormError(null); }}
                    className="px-4 py-2 rounded-lg border border-ava-gray-medium text-ava-charcoal hover:bg-ava-gray transition-colors text-sm"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
