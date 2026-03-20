"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Users } from "lucide-react";
import { cn } from "@/lib/utils";

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

function getEmployee(employee: EmployeeData | EmployeeData[] | undefined | null): EmployeeData | null {
  if (!employee) return null;
  if (Array.isArray(employee)) return employee[0] ?? null;
  return employee;
}

interface Props {
  approvedVacations: ApprovedVacation[];
}

// Paleta de colores para cada empleado
const EMPLOYEE_COLORS = [
  { bg: "bg-blue-200", text: "text-blue-800", dot: "bg-blue-500", border: "border-blue-300" },
  { bg: "bg-green-200", text: "text-green-800", dot: "bg-green-500", border: "border-green-300" },
  { bg: "bg-purple-200", text: "text-purple-800", dot: "bg-purple-500", border: "border-purple-300" },
  { bg: "bg-orange-200", text: "text-orange-800", dot: "bg-orange-500", border: "border-orange-300" },
  { bg: "bg-pink-200", text: "text-pink-800", dot: "bg-pink-500", border: "border-pink-300" },
  { bg: "bg-teal-200", text: "text-teal-800", dot: "bg-teal-500", border: "border-teal-300" },
  { bg: "bg-red-200", text: "text-red-800", dot: "bg-red-500", border: "border-red-300" },
  { bg: "bg-indigo-200", text: "text-indigo-800", dot: "bg-indigo-500", border: "border-indigo-300" },
];

const MONTHS_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
const DAYS_ES = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function getInitials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function VacationCalendar({ approvedVacations }: Props) {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth()); // 0-indexed
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  // Asignar color único por nombre de empleado
  const employeeColorMap = useMemo(() => {
    const map: Record<string, typeof EMPLOYEE_COLORS[0]> = {};
    let colorIdx = 0;
    approvedVacations.forEach((v) => {
      const emp = getEmployee(v.employee);
      if (emp) {
        const key = `${emp.first_name} ${emp.last_name}`;
        if (!map[key]) {
          map[key] = EMPLOYEE_COLORS[colorIdx % EMPLOYEE_COLORS.length];
          colorIdx++;
        }
      }
    });
    return map;
  }, [approvedVacations]);

  // Construir mapa: "YYYY-MM-DD" → lista de vacaciones en ese día
  const vacationsByDay = useMemo(() => {
    const map: Record<string, ApprovedVacation[]> = {};
    approvedVacations.forEach((v) => {
      const start = new Date(v.start_date + "T00:00:00");
      const end = new Date(v.end_date + "T00:00:00");
      const cur = new Date(start);
      while (cur <= end) {
        const key = cur.toISOString().split("T")[0];
        if (!map[key]) map[key] = [];
        map[key].push(v);
        cur.setDate(cur.getDate() + 1);
      }
    });
    return map;
  }, [approvedVacations]);

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
  };

  // Generar días del calendario (con padding inicial)
  const firstDay = new Date(currentYear, currentMonth, 1);
  // lunes=0, ..., domingo=6
  const startPadding = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const calendarCells: (number | null)[] = [
    ...Array(startPadding).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  // Pad to complete last row
  while (calendarCells.length % 7 !== 0) calendarCells.push(null);

  const selectedKey = selectedDay;
  const selectedVacations = selectedKey ? (vacationsByDay[selectedKey] ?? []) : [];

  // Empleados con vacaciones este mes (para la leyenda)
  const employeesThisMonth = useMemo(() => {
    const seen = new Set<string>();
    const result: { name: string; color: typeof EMPLOYEE_COLORS[0] }[] = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const key = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      (vacationsByDay[key] ?? []).forEach((v) => {
        const emp = getEmployee(v.employee);
        if (emp) {
          const name = `${emp.first_name} ${emp.last_name}`;
          if (!seen.has(name)) {
            seen.add(name);
            result.push({ name, color: employeeColorMap[name] ?? EMPLOYEE_COLORS[0] });
          }
        }
      });
    }
    return result;
  }, [currentYear, currentMonth, daysInMonth, vacationsByDay, employeeColorMap]);

  return (
    <div className="bg-white rounded-lg border border-ava-gray-medium overflow-hidden">
      {/* Header del calendario */}
      <div className="px-6 py-4 border-b border-ava-gray-medium flex items-center justify-between">
        <h2 className="font-semibold text-ava-charcoal flex items-center gap-2">
          <Users className="w-4 h-4" />
          Calendario de Ausencias — Vacaciones aprobadas del equipo
        </h2>
        <div className="flex items-center gap-3">
          <button
            onClick={prevMonth}
            className="p-1.5 rounded-lg hover:bg-ava-gray transition-colors text-ava-charcoal-light hover:text-ava-charcoal"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-semibold text-ava-charcoal min-w-[140px] text-center">
            {MONTHS_ES[currentMonth]} {currentYear}
          </span>
          <button
            onClick={nextMonth}
            className="p-1.5 rounded-lg hover:bg-ava-gray transition-colors text-ava-charcoal-light hover:text-ava-charcoal"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Cabecera días de semana */}
        <div className="grid grid-cols-7 gap-1">
          {DAYS_ES.map((d) => (
            <div key={d} className="text-center text-xs font-semibold text-ava-charcoal-light uppercase py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Celdas del calendario */}
        <div className="grid grid-cols-7 gap-1">
          {calendarCells.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} className="h-16" />;
            }
            const key = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const dayvacs = vacationsByDay[key] ?? [];
            const isToday =
              day === today.getDate() &&
              currentMonth === today.getMonth() &&
              currentYear === today.getFullYear();
            const isSelected = selectedDay === key;
            // Corregir: usamos el índice en calendarCells para saber el día de semana
            const dayOfWeek = (startPadding + day - 1) % 7; // 0=lun,...,6=dom
            const isWknd = dayOfWeek >= 5;

            return (
              <div
                key={key}
                onClick={() => setSelectedDay(isSelected ? null : key)}
                className={cn(
                  "h-16 rounded-lg p-1 cursor-pointer transition-colors flex flex-col",
                  isWknd ? "bg-ava-gray/40" : "bg-white hover:bg-ava-gray/30",
                  isSelected && "ring-2 ring-ava-yellow",
                  isToday && "ring-2 ring-ava-charcoal"
                )}
              >
                <span
                  className={cn(
                    "text-xs font-medium self-end leading-none mb-1",
                    isToday
                      ? "w-5 h-5 bg-ava-charcoal text-white rounded-full flex items-center justify-center text-[10px]"
                      : isWknd
                      ? "text-ava-charcoal-light"
                      : "text-ava-charcoal"
                  )}
                >
                  {day}
                </span>
                {/* Indicadores de vacaciones (máx 3 visibles) */}
                <div className="flex flex-wrap gap-0.5 overflow-hidden">
                  {dayvacs.slice(0, 3).map((v, i) => {
                    const emp = getEmployee(v.employee);
                    const empName = emp
                      ? `${emp.first_name} ${emp.last_name}`
                      : "?";
                    const color = employeeColorMap[empName] ?? EMPLOYEE_COLORS[0];
                    const initials = emp
                      ? getInitials(emp.first_name, emp.last_name)
                      : "?";
                    return (
                      <span
                        key={i}
                        className={cn(
                          "text-[9px] font-bold px-1 rounded leading-4",
                          color.bg, color.text
                        )}
                        title={empName}
                      >
                        {initials}
                      </span>
                    );
                  })}
                  {dayvacs.length > 3 && (
                    <span className="text-[9px] text-ava-charcoal-light leading-4">
                      +{dayvacs.length - 3}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Detalle del día seleccionado */}
        {selectedDay && (
          <div className="mt-2 p-4 bg-ava-gray/30 rounded-lg border border-ava-gray-medium">
            <p className="text-sm font-semibold text-ava-charcoal mb-2">
              {new Date(selectedDay + "T12:00:00").toLocaleDateString("es-ES", {
                weekday: "long", day: "numeric", month: "long", year: "numeric",
              })}
            </p>
            {selectedVacations.length === 0 ? (
              <p className="text-sm text-ava-charcoal-light">Sin ausencias este día.</p>
            ) : (
              <div className="space-y-1.5">
                {selectedVacations.map((v) => {
                  const emp = getEmployee(v.employee);
                  const empName = emp
                    ? `${emp.first_name} ${emp.last_name}`
                    : "Empleado";
                  const color = employeeColorMap[empName] ?? EMPLOYEE_COLORS[0];
                  const TYPE_LABELS: Record<string, string> = {
                    vacation: "Vacaciones",
                    sick: "Baja médica",
                    personal: "Asunto personal",
                    other: "Otro",
                  };
                  return (
                    <div key={v.id} className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg", color.bg)}>
                      <div className={cn("w-2 h-2 rounded-full shrink-0", color.dot)} />
                      <span className={cn("text-sm font-medium", color.text)}>{empName}</span>
                      <span className={cn("text-xs", color.text, "opacity-70")}>
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

        {/* Leyenda de empleados este mes */}
        {employeesThisMonth.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-ava-gray-medium">
            {employeesThisMonth.map(({ name, color }) => (
              <div key={name} className="flex items-center gap-1.5">
                <div className={cn("w-2.5 h-2.5 rounded-full", color.dot)} />
                <span className="text-xs text-ava-charcoal-light">{name}</span>
              </div>
            ))}
          </div>
        )}

        {approvedVacations.length === 0 && (
          <div className="py-8 text-center text-ava-charcoal-light text-sm">
            No hay vacaciones aprobadas registradas.
          </div>
        )}
      </div>
    </div>
  );
}
