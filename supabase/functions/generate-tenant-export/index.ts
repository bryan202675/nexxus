// Equivalente a exports.generateTenantExport (nexxus/backend/index.js:436).
import { getCaller, sameCompany, safeString, withHandler, writeAuditLog, HttpError } from "../_shared/nexxus.ts";

const EXPORT_DATASETS: Record<string, string[]> = {
  request_reports: ["reportes", "solicitudes_internas", "solicitudes_ausencia"],
  payroll: ["nominas"],
  attendance: ["asistencias"],
};
const EXPORT_FORMATS = new Set(["csv", "pdf"]);

function csvEscape(value: unknown): string {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function buildCsvBase64(rows: Record<string, unknown>[]): string {
  const headers = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
  const csv = [
    headers.map(csvEscape).join(","),
    ...rows.map((row) => headers.map((h) => csvEscape(row[h])).join(",")),
  ].join("\n");
  return btoa(unescape(encodeURIComponent(`﻿${csv}`)));
}

function escapePdfText(value: unknown): string {
  return String(value ?? "").replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}
function chunkText(value: string, size = 96): string[] {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += size) chunks.push(text.slice(i, i + size));
  return chunks.length ? chunks : [""];
}
function buildSimplePdfBase64(title: string, lines: string[]): string {
  const contentLines = [
    "BT", "/F1 16 Tf", "50 790 Td", `(${escapePdfText(title)}) Tj`, "/F1 9 Tf", "0 -24 Td",
    ...lines.slice(0, 42).flatMap((line) => chunkText(line).flatMap((chunk) => [`(${escapePdfText(chunk)}) Tj`, "0 -13 Td"])),
    "ET",
  ];
  const stream = contentLines.join("\n");
  const encoder = new TextEncoder();
  const objects = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
    "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj",
    "4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj",
    `5 0 obj << /Length ${encoder.encode(stream).length} >> stream\n${stream}\nendstream endobj`,
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (const obj of objects) {
    offsets.push(encoder.encode(pdf).length);
    pdf += `${obj}\n`;
  }
  const xrefOffset = encoder.encode(pdf).length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i += 1) pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return btoa(unescape(encodeURIComponent(pdf)));
}

Deno.serve(withHandler(async (req, admin) => {
  const caller = await getCaller(req, admin);
  const body = await req.json();
  const dataset = safeString(body?.dataset, 40);
  const format = safeString(body?.format, 10).toLowerCase();
  const empresaId = safeString(body?.empresaId, 120) || caller.empresa_id;
  if (!EXPORT_DATASETS[dataset] || !EXPORT_FORMATS.has(format)) throw new HttpError(400, "Exportación inválida.");
  if (!empresaId || !sameCompany(caller, empresaId)) throw new HttpError(403, "No tienes acceso a esta empresa.");
  if (!["admin_empresa", "jefe", "jefe_sector", "super_admin"].includes(caller.rol)) {
    throw new HttpError(403, "No puedes exportar datos empresariales.");
  }

  const tables = EXPORT_DATASETS[dataset];
  const results = await Promise.all(tables.map((table) =>
    admin.from(table).select("*").eq("empresa_id", empresaId).limit(80).then((res) => {
      if (res.error) throw new HttpError(500, res.error.message);
      return (res.data || []).map((row) => ({ ...row, origen: table }));
    })
  ));
  const rows = results.flat();

  const title = `Nexxus ${dataset} ${new Date().toISOString().slice(0, 10)}`;
  const baseName = `${dataset}_${empresaId}_${new Date().toISOString().slice(0, 10)}`;
  const file = format === "csv"
    ? { filename: `${baseName}.csv`, mimeType: "text/csv;charset=utf-8", base64: buildCsvBase64(rows || []) }
    : {
        filename: `${baseName}.pdf`,
        mimeType: "application/pdf",
        base64: buildSimplePdfBase64(title, (rows || []).map((row) => Object.entries(row).map(([k, v]) => `${k}: ${v}`).join(" | "))),
      };

  await writeAuditLog(admin, {
    empresaId,
    actorId: caller.id,
    accion: "Exportación generada",
    modulo: "Exportaciones",
    detalles: `${dataset}.${format} (${(rows || []).length} filas)`,
    targetId: empresaId,
  });

  return { ...file, rows: (rows || []).length, dataset, format };
}));
