"use client";

import { useActionState, useState } from "react";

import {
  registerAbsence,
  type RegisterAbsenceState,
} from "@/app/(protected)/attendance/actions";
import type { AbsenceDate } from "@/lib/mykids/types";

const initialState: RegisterAbsenceState = { status: "idle", message: "" };

export function RegisterAbsenceForm({
  studentName,
  studentId,
  groupId,
  dates,
  concepts,
}: {
  studentName: string;
  studentId: string;
  groupId: string;
  dates: AbsenceDate[];
  concepts: string[];
}) {
  const choices = dates.filter((item) => item.date && item.followUpId);
  const reasons = concepts.filter((item) => item.length > 0);
  const [followUpId, setFollowUpId] = useState("");
  const [reason, setReason] = useState("");
  const [review, setReview] = useState(false);
  const [state, formAction, pending] = useActionState(
    registerAbsence.bind(null, studentId, groupId),
    initialState,
  );
  const selectedDate = choices.find((item) => item.followUpId === followUpId);
  const selectedReason = reasons.find((item) => item === reason);
  const reviewing = review && Boolean(selectedDate && selectedReason);
  const result = state.message ? (
    <p
      aria-live="polite"
      role={state.status === "error" ? "alert" : undefined}
      className={
        state.status === "error"
          ? "text-sm text-red-700"
          : "text-sm text-emerald-700"
      }
    >
      {state.message}
    </p>
  ) : null;

  if (choices.length === 0) {
    return (
      <div className="mt-3 space-y-2">
        {result}
        <p className="text-sm text-slate-500">
          No sessions are currently available for absence registration.
        </p>
      </div>
    );
  }

  if (reasons.length === 0) {
    return (
      <div className="mt-3 space-y-2">
        {result}
        <p className="text-sm text-slate-500">
          Absence registration is temporarily unavailable.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="mt-5 space-y-4">
      {reviewing ? (
        <>
          <input type="hidden" name="followUpId" value={followUpId} />
          <input type="hidden" name="reason" value={reason} />
          <div className="rounded-xl border border-[#d9ded8] bg-[#f8f6f1] p-4">
            <h3 className="font-semibold text-[#173f43]">Review absence</h3>
            <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-slate-500">Student</dt>
                <dd className="font-medium text-slate-800">{studentName}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Class or date</dt>
                <dd className="font-medium text-slate-800">
                  {selectedDate?.date}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Reason</dt>
                <dd className="font-medium text-slate-800">{selectedReason}</dd>
              </div>
            </dl>
          </div>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              disabled={pending}
              onClick={() => setReview(false)}
              className="rounded-xl border border-[#d9ded8] bg-white px-5 py-3 text-sm font-semibold text-[#173f43] disabled:opacity-50"
            >
              Back
            </button>
            <button disabled={pending} className="button sm:min-w-48">
              {pending ? "Registering…" : "Register absence"}
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-[#173f43]">
              Class or date
              <select
                name="followUpId"
                required
                disabled={pending}
                value={followUpId}
                onChange={(event) => setFollowUpId(event.target.value)}
                className="field"
              >
                <option value="">Choose a class or date</option>
                {choices.map((item) => (
                  <option key={item.followUpId} value={item.followUpId}>
                    {item.date}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium text-[#173f43]">
              Reason
              <select
                name="reason"
                required
                disabled={pending}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                className="field"
              >
                <option value="">Choose a reason</option>
                {reasons.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              disabled={pending || !selectedDate || !selectedReason}
              onClick={() => setReview(true)}
              className="button sm:min-w-48"
            >
              Review absence
            </button>
          </div>
        </>
      )}
      {result}
    </form>
  );
}
