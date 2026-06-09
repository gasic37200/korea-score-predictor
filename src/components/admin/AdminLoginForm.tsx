"use client";

import { useActionState } from "react";
import { loginAdmin, type AdminLoginState } from "@/app/admin/actions";

const initialState: AdminLoginState = {
  status: "idle",
  message: "",
};

export function AdminLoginForm() {
  const [state, action, isPending] = useActionState(loginAdmin, initialState);

  return (
    <form
      action={action}
      className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-[0_18px_40px_rgba(30,41,59,0.08)]"
    >
      <label className="flex flex-col gap-2">
        <span className="text-sm font-semibold">관리자 비밀번호</span>
        <input
          autoComplete="current-password"
          className="h-12 rounded-md border border-slate-300 px-3 text-base outline-none transition focus:border-red-700 focus:ring-2 focus:ring-red-100"
          name="password"
          type="password"
        />
      </label>

      {state.message ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="status">
          {state.message}
        </p>
      ) : null}

      <button
        className="h-12 rounded-md bg-slate-950 px-4 text-base font-bold text-white transition hover:bg-slate-800 disabled:cursor-wait disabled:bg-slate-400"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "확인 중" : "관리자 로그인"}
      </button>
    </form>
  );
}
