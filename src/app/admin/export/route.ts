import { NextResponse } from "next/server";
import { getAdminExportRows } from "@/lib/admin";
import { isAdminAuthenticated, isAdminConfigured } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isAdminConfigured() || !(await isAdminAuthenticated())) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const rows = await getAdminExportRows();
  const csv = toCsv([
    ["nickname", "phone", "submitted_at", "match", "predicted_score"],
    ...rows.map((row) => [
      row.nickname,
      row.exportPhone ?? row.maskedPhone,
      row.submittedAt,
      row.matchTitle,
      row.predictedScore,
    ]),
  ]);

  return new NextResponse(`\uFEFF${csv}`, {
    headers: {
      "Content-Disposition": 'attachment; filename="korea-score-winners.csv"',
      "Content-Type": "text/csv; charset=utf-8",
    },
  });
}

function toCsv(rows: string[][]) {
  return rows.map((row) => row.map(escapeCsvCell).join(",")).join("\n");
}

function escapeCsvCell(value: string) {
  const escaped = value.replaceAll('"', '""');
  return `"${escaped}"`;
}
