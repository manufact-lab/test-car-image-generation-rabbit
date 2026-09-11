import {
  CLEANSING_ROWS,
  CLEANSING_TOTAL,
  RAW_LINE_COUNT,
  KEPT_LINE_COUNT,
  EXCLUDED_LINES,
} from "@/lib/analysis-data"
import { SectionShell, Hl } from "./section-shell"

export function CleansingSection() {
  return (
    <SectionShell
      tag="2.1"
      title="데이터 분석 개요 · 클렌징"
      summary={
        <>
          14차종 9개 라인 <Hl>182,246건</Hl>의 출하 데이터 중 생산일자가 없는 데이터{" "}
          <Hl>1,261건</Hl>을 분석 대상에서 제외하여, 7개 라인 <Hl>180,985건</Hl>을 기준으로
          분석하였습니다.
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto]">
        {/* 라인별 클렌징 결과 테이블 */}
        <div className="overflow-hidden rounded-lg border border-border">
          <div className="border-b border-border bg-secondary/50 px-3 py-2 text-xs font-semibold text-foreground">
            라인별 데이터 클렌징 결과
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="px-3 py-2 text-left font-medium">라인</th>
                  <th className="px-3 py-2 text-right font-medium">원본</th>
                  <th className="px-3 py-2 text-right font-medium">삭제</th>
                  <th className="px-3 py-2 text-right font-medium">분석 대상</th>
                  <th className="px-3 py-2 text-right font-medium">비고</th>
                </tr>
              </thead>
              <tbody>
                {CLEANSING_ROWS.map((r) => (
                  <tr
                    key={r.line}
                    className={`border-b border-border/60 last:border-0 ${
                      r.excluded ? "bg-destructive/5" : ""
                    }`}
                  >
                    <td className="px-3 py-1.5 text-foreground">{r.line}</td>
                    <td className="px-3 py-1.5 text-right font-mono tabular-nums text-foreground">
                      {r.raw.toLocaleString()}
                    </td>
                    <td className="px-3 py-1.5 text-right font-mono tabular-nums text-destructive">
                      {r.deleted > 0 ? r.deleted.toLocaleString() : "-"}
                    </td>
                    <td className="px-3 py-1.5 text-right font-mono tabular-nums text-foreground">
                      {r.kept.toLocaleString()}
                    </td>
                    <td className="px-3 py-1.5 text-right">
                      {r.excluded && (
                        <span className="rounded border border-destructive/40 bg-destructive/10 px-1.5 py-0.5 text-xs font-medium text-destructive">
                          제외
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                <tr className="bg-secondary/60 font-semibold">
                  <td className="px-3 py-2 text-foreground">합계</td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums text-foreground">
                    {CLEANSING_TOTAL.raw.toLocaleString()}
                  </td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums text-destructive">
                    {CLEANSING_TOTAL.deleted.toLocaleString()}
                  </td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums text-primary">
                    {CLEANSING_TOTAL.kept.toLocaleString()}
                  </td>
                  <td />
                </tr>
              </tbody>
            </table>
          </div>
          <p className="border-t border-border px-3 py-2 text-xs text-muted-foreground">
            ※ 삭제 데이터 = 생산일자 누락 / 전량 삭제된 2개 라인은 분석 대상에서 제외
          </p>
        </div>

        {/* 분석 기준 콜아웃 */}
        <div className="flex flex-col justify-center rounded-lg border border-primary/30 bg-primary/5 p-5 lg:w-64">
          <p className="text-xs font-medium text-muted-foreground">분석 기준 데이터</p>
          <p className="mt-1 font-mono text-4xl font-bold tabular-nums text-primary">
            180,985
            <span className="text-lg font-semibold">건</span>
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">{KEPT_LINE_COUNT}개 라인</p>

          <dl className="mt-4 space-y-1.5 border-t border-primary/20 pt-3 text-xs">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">원본</dt>
              <dd className="font-mono tabular-nums text-foreground">
                {CLEANSING_TOTAL.raw.toLocaleString()}건 ({RAW_LINE_COUNT}라인)
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">생산일자 누락</dt>
              <dd className="font-mono tabular-nums text-destructive">
                {CLEANSING_TOTAL.deleted.toLocaleString()}건
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">분석 대상</dt>
              <dd className="font-mono tabular-nums text-primary">
                {CLEANSING_TOTAL.kept.toLocaleString()}건
              </dd>
            </div>
          </dl>

          <div className="mt-3 rounded-md border border-destructive/30 bg-destructive/5 px-2.5 py-2">
            <p className="text-xs font-medium text-destructive">제외 라인 (2개)</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{EXCLUDED_LINES.join(", ")}</p>
          </div>
        </div>
      </div>
    </SectionShell>
  )
}
