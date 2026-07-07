import { useState, useMemo } from "react";

// ── 台股慣例：紅漲綠跌、紅買綠賣 ──
const C = {
  bg: "#101418",
  panel: "#171D23",
  panelSoft: "#1E262E",
  line: "#2A343E",
  text: "#E8EDF2",
  dim: "#8A97A5",
  red: "#E5484D",     // 買進 / 加碼
  green: "#2FBF71",   // 賣出 / 減碼
  amber: "#F5B93E",   // 警示
  blue: "#5B9BD5",
};

const mono = "'JetBrains Mono','SFMono-Regular',ui-monospace,Menlo,monospace";
const sans = "'Noto Sans TC','PingFang TC',system-ui,sans-serif";

// 響應式樣式：手機優先
const responsiveCSS = `
  * { box-sizing: border-box; }
  .flt-inputs { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; width: 100%; }
  .flt-inputs > * { min-width: 0; }
  .flt-inputs input { width: 100%; min-width: 0; }
  .flt-field-label { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .flt-stats3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
  .flt-stats3 > div, .flt-stats2 > div { min-width: 0; }
  .flt-stats2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .flt-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; margin: 0 -4px; padding: 0 4px; }
  .flt-table { width: 100%; border-collapse: collapse; min-width: 340px; }
  .flt-table td, .flt-table th { padding: 6px 4px; white-space: nowrap; }
  input[type="number"]::-webkit-inner-spin-button,
  input[type="number"]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
  input[type="number"] { -moz-appearance: textfield; appearance: textfield; }

  @media (max-width: 430px) {
    .flt-inputs { grid-template-columns: 1fr 1fr; gap: 10px; }
    .flt-inputs .flt-wide { grid-column: 1 / -1; }
    .flt-stats3 { grid-template-columns: 1fr 1fr; gap: 10px; }
    .flt-stats3 > div:last-child { grid-column: 1 / -1; }
    .flt-stats2 { gap: 10px; }
    .flt-title { font-size: 19px !important; }
    .flt-action-verb { font-size: 22px !important; }
    .flt-stat-value { font-size: 16px !important; }
    .flt-panel { padding: 13px !important; }
    .flt-field-label { font-size: 11px !important; }
  }
  @media (max-width: 350px) {
    .flt-inputs { grid-template-columns: 1fr; }
    .flt-stats2 { grid-template-columns: 1fr; }
  }
`;

const fmt = (n, d = 0) =>
  isFinite(n)
    ? n.toLocaleString("zh-TW", { minimumFractionDigits: d, maximumFractionDigits: d })
    : "—";

function Field({ label, value, onChange, suffix, step = "any", hint }) {
  return (
    <label style={{ display: "block", minWidth: 0 }}>
      <div className="flt-field-label" style={{ fontSize: 12, color: C.dim, marginBottom: 6, letterSpacing: "0.03em" }}>
        {label}
        {hint && <span style={{ marginLeft: 6 }}>{hint}</span>}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          background: C.panelSoft,
          border: `1px solid ${C.line}`,
          borderRadius: 8,
          overflow: "hidden",
          minWidth: 0,
        }}
      >
        <input
          type="number"
          inputMode="decimal"
          step={step}
          size={1}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            flex: 1,
            width: "100%",
            minWidth: 0,
            background: "transparent",
            border: "none",
            outline: "none",
            color: C.text,
            fontFamily: mono,
            fontSize: 17,
            padding: "10px 10px",
          }}
        />
        {suffix && (
          <span style={{ padding: "0 8px 0 2px", color: C.dim, fontSize: 12, whiteSpace: "nowrap", flexShrink: 0 }}>
            {suffix}
          </span>
        )}
      </div>
    </label>
  );
}

function Stat({ label, value, unit, color }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: C.dim, letterSpacing: "0.06em", marginBottom: 4 }}>{label}</div>
      <div className="flt-stat-value" style={{ fontFamily: mono, fontSize: 18, color: color || C.text, fontWeight: 600, fontVariantNumeric: "tabular-nums", wordBreak: "keep-all" }}>
        {value}
        {unit && <span style={{ fontSize: 12, color: C.dim, marginLeft: 4, fontWeight: 400 }}>{unit}</span>}
      </div>
    </div>
  );
}

function LeverageTab() {
  const [equity, setEquity] = useState("1000000");
  const [price, setPrice] = useState("100");
  const [targetLev, setTargetLev] = useState("3");
  const [bigLots, setBigLots] = useState("15");
  const [miniLots, setMiniLots] = useState("0");
  const [threshold, setThreshold] = useState("10");
  const [marginRate, setMarginRate] = useState("13.5");
  const [useMini, setUseMini] = useState(true);

  const r = useMemo(() => {
    const E = parseFloat(equity) || 0;
    const P = parseFloat(price) || 0;
    const L = parseFloat(targetLev) || 0;
    const big = parseInt(bigLots) || 0;
    const mini = parseInt(miniLots) || 0;
    const th = (parseFloat(threshold) || 0) / 100;
    const mr = (parseFloat(marginRate) || 0) / 100;

    if (E <= 0 || P <= 0 || L <= 0) return null;

    const exposure = big * 2000 * P + mini * 100 * P;
    const actualLev = exposure / E;

    // 目標曝險 → 換算股數 → 拆成大口 + 小口
    const targetShares = (L * E) / P;
    let tBig, tMini;
    if (useMini) {
      tBig = Math.floor(targetShares / 2000);
      tMini = Math.round((targetShares - tBig * 2000) / 100);
      if (tMini === 20) { tBig += 1; tMini = 0; }
    } else {
      tBig = Math.round(targetShares / 2000);
      tMini = 0;
    }
    const targetExposure = (tBig * 2000 + tMini * 100) * P;
    const resultLev = targetExposure / E;

    const dBig = tBig - big;
    const dMini = tMini - mini;

    const deviation = L > 0 ? Math.abs(actualLev - L) / L : 0;
    const needAction = deviation > th && (dBig !== 0 || dMini !== 0);

    // 保證金（以目標部位計）
    const initMargin = targetExposure * mr;
    const maintMargin = targetExposure * mr * (10.35 / 13.5); // 依原始/維持常見比例縮放估算
    const buffer = E - maintMargin;
    const marginOK = E >= initMargin;

    // ── 風險價格試算（多單假設，持有目標部位、不再平衡的情況下）──
    // 權益隨價格變動：E(P) = E + S×(P − P0)
    // 維持保證金隨價格變動：S×P×mm
    const shares = targetExposure / P;
    const mm = mr * (10.35 / 13.5); // 維持保證金比例估算
    const Lr = resultLev;

    // 追繳價：E(P) = S×P×mm ⇒ P = (S×P0 − E) / (S×(1 − mm))
    const callPrice =
      shares > 0 && Lr > 1 ? (shares * P - E) / (shares * (1 - mm)) : 0;

    // 強制平倉價：盤中風險指標 = 權益數/原始保證金 低於25%時期貨商得代為沖銷
    // E(P) = 0.25 × S×P×im ⇒ P = (S×P0 − E) / (S×(1 − 0.25×im))
    const liqPrice =
      shares > 0 && Lr > 1 ? (shares * P - E) / (shares * (1 - 0.25 * mr)) : 0;

    const callDrop = callPrice > 0 ? (1 - callPrice / P) * 100 : 100;
    const liqDrop = liqPrice > 0 ? (1 - liqPrice / P) * 100 : 100;
    const dropToCall = callDrop;

    return {
      exposure, actualLev, tBig, tMini, targetExposure, resultLev,
      dBig, dMini, deviation, needAction, initMargin, maintMargin,
      buffer, marginOK, dropToCall,
      callPrice, liqPrice, callDrop, liqDrop, mm,
    };
  }, [equity, price, targetLev, bigLots, miniLots, threshold, marginRate, useMini]);

  const L = parseFloat(targetLev) || 0;

  // 槓桿刻度條
  const gauge = () => {
    if (!r) return null;
    const max = Math.max(L * 2, r.actualLev * 1.2, 1);
    const pos = (v) => `${Math.min((v / max) * 100, 100)}%`;
    const over = r.actualLev > L;
    return (
      <div style={{ marginTop: 8 }}>
        <div
          style={{
            position: "relative",
            height: 14,
            background: C.panelSoft,
            borderRadius: 7,
            border: `1px solid ${C.line}`,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: pos(r.actualLev),
              background: over ? `${C.green}55` : `${C.red}55`,
              transition: "width .3s",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: pos(L),
              top: -2,
              bottom: -2,
              width: 2,
              background: C.amber,
            }}
          />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.dim, marginTop: 4, fontFamily: mono }}>
          <span>0x</span>
          <span style={{ color: C.amber }}>目標 {L}x</span>
          <span>{fmt(max, 1)}x</span>
        </div>
      </div>
    );
  };

  const actionColor = r && (r.dBig > 0 || (r.dBig === 0 && r.dMini > 0)) ? C.red : C.green;
  const actionVerb = r && (r.dBig > 0 || (r.dBig === 0 && r.dMini > 0)) ? "買進加碼" : "賣出減碼";

  return (
    <>
        {/* 輸入區 */}
        <div
          className="flt-inputs flt-panel"
          style={{
            background: C.panel,
            border: `1px solid ${C.line}`,
            borderRadius: 12,
            padding: 16,
          }}
        >
          <div className="flt-wide">
            <Field label="帳戶權益數" value={equity} onChange={setEquity} suffix="元" />
          </div>
          <Field label="目前股價" value={price} onChange={setPrice} suffix="元" />
          <Field label="目標槓桿" value={targetLev} onChange={setTargetLev} suffix="倍" step="0.1" />
          <Field label="現有一般股期" value={bigLots} onChange={setBigLots} suffix="口" step="1" />
          <Field label="現有小型股期" value={miniLots} onChange={setMiniLots} suffix="口" step="1" />
          <Field label="再平衡門檻" value={threshold} onChange={setThreshold} suffix="±%" />
          <Field label="保證金比例" value={marginRate} onChange={setMarginRate} suffix="%" />
          <label
            className="flt-wide"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "6px 2px 0",
              cursor: "pointer",
              userSelect: "none",
              minHeight: 44,
            }}
          >
            <input
              type="checkbox"
              checked={useMini}
              onChange={(e) => setUseMini(e.target.checked)}
              style={{ width: 20, height: 20, accentColor: C.blue, flexShrink: 0 }}
            />
            <span style={{ fontSize: 14, color: C.dim }}>用小型股期補零頭（部位更貼近目標槓桿）</span>
          </label>
        </div>

        {r && (
          <>
            {/* 槓桿現況 */}
            <div
              className="flt-panel"
              style={{
                background: C.panel,
                border: `1px solid ${C.line}`,
                borderRadius: 12,
                padding: 16,
                marginTop: 14,
              }}
            >
              <div className="flt-stats3">
                <Stat label="目前曝險" value={fmt(r.exposure)} unit="元" />
                <Stat
                  label="實際槓桿"
                  value={fmt(r.actualLev, 2)}
                  unit="x"
                  color={r.actualLev > L ? C.green : r.actualLev < L ? C.red : C.text}
                />
                <Stat label="偏離幅度" value={fmt(r.deviation * 100, 1)} unit="%" color={r.needAction ? C.amber : C.dim} />
              </div>
              {gauge()}
            </div>

            {/* 動作判定 */}
            <div
              className="flt-panel"
              style={{
                background: C.panel,
                border: `1px solid ${r.needAction ? actionColor : C.line}`,
                borderRadius: 12,
                padding: 16,
                marginTop: 14,
              }}
            >
              {r.needAction ? (
                <>
                  <div style={{ fontSize: 11, color: C.dim, letterSpacing: "0.08em", marginBottom: 8 }}>
                    ▎再平衡指令
                  </div>
                  <div className="flt-action-verb" style={{ fontFamily: mono, fontSize: 26, fontWeight: 700, color: actionColor }}>
                    {actionVerb}
                  </div>
                  <div style={{ fontFamily: mono, fontSize: 16, marginTop: 8, lineHeight: 1.8 }}>
                    {r.dBig !== 0 && (
                      <div>
                        一般股期：
                        <span style={{ color: r.dBig > 0 ? C.red : C.green, fontWeight: 700 }}>
                          {r.dBig > 0 ? " 買進 " : " 賣出 "}
                          {Math.abs(r.dBig)} 口
                        </span>
                      </div>
                    )}
                    {r.dMini !== 0 && (
                      <div>
                        小型股期：
                        <span style={{ color: r.dMini > 0 ? C.red : C.green, fontWeight: 700 }}>
                          {r.dMini > 0 ? " 買進 " : " 賣出 "}
                          {Math.abs(r.dMini)} 口
                        </span>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div style={{ textAlign: "center", padding: "6px 0" }}>
                  <div style={{ fontFamily: mono, fontSize: 20, fontWeight: 700, color: C.dim }}>
                    ─ 未達門檻，暫不動作 ─
                  </div>
                  <div style={{ fontSize: 12, color: C.dim, marginTop: 4 }}>
                    偏離 {fmt(r.deviation * 100, 1)}%，門檻 ±{threshold}%
                  </div>
                </div>
              )}

              <div
                className="flt-stats2"
                style={{
                  marginTop: 14,
                  paddingTop: 12,
                  borderTop: `1px dashed ${C.line}`,
                }}
              >
                <Stat
                  label="目標部位"
                  value={`${r.tBig} 大 + ${r.tMini} 小`}
                  unit="口"
                />
                <Stat label="調整後槓桿" value={fmt(r.resultLev, 2)} unit="x" />
              </div>
            </div>

            {/* 保證金檢查 */}
            <div
              className="flt-panel"
              style={{
                background: C.panel,
                border: `1px solid ${r.marginOK ? C.line : C.red}`,
                borderRadius: 12,
                padding: 16,
                marginTop: 14,
              }}
            >
              <div style={{ fontSize: 11, color: C.dim, letterSpacing: "0.08em", marginBottom: 10 }}>
                ▎保證金體檢（以目標部位估算）
              </div>
              <div className="flt-stats2">
                <Stat label="所需原始保證金" value={fmt(r.initMargin)} unit="元" />
                <Stat label="估計維持保證金" value={fmt(r.maintMargin)} unit="元" />
                <Stat
                  label="追繳前緩衝"
                  value={fmt(r.buffer)}
                  unit="元"
                  color={r.buffer > 0 ? C.text : C.red}
                />
                <Stat
                  label="約可承受跌幅"
                  value={fmt(r.dropToCall, 1)}
                  unit="%"
                  color={r.dropToCall < 5 ? C.red : r.dropToCall < 10 ? C.amber : C.green}
                />
              </div>
              {!r.marginOK && (
                <div
                  style={{
                    marginTop: 12,
                    padding: "8px 12px",
                    background: `${C.red}22`,
                    border: `1px solid ${C.red}`,
                    borderRadius: 8,
                    fontSize: 13,
                    color: C.red,
                  }}
                >
                  ⚠ 權益數不足支付原始保證金，此槓桿無法建立，請降低目標槓桿。
                </div>
              )}
            </div>

            {/* 強制平倉風險 */}
            <div
              className="flt-panel"
              style={{
                background: C.panel,
                border: `1px solid ${r.liqDrop < 15 ? C.red : C.amber}`,
                borderRadius: 12,
                padding: 16,
                marginTop: 14,
              }}
            >
              <div style={{ fontSize: 11, color: C.amber, letterSpacing: "0.06em", marginBottom: 10, lineHeight: 1.6 }}>
                ⚠ 強制平倉風險提醒<br />
                <span style={{ color: C.dim }}>多單 · 假設觸價前未再平衡、未補繳</span>
              </div>
              <div className="flt-stats2">
                <Stat
                  label="追繳警戒價"
                  value={r.callPrice > 0 ? fmt(r.callPrice, 1) : "不會觸發"}
                  unit={r.callPrice > 0 ? "元" : ""}
                  color={C.amber}
                />
                <Stat
                  label="距追繳跌幅"
                  value={r.callPrice > 0 ? `−${fmt(r.callDrop, 1)}` : "—"}
                  unit="%"
                  color={C.amber}
                />
                <Stat
                  label="強制平倉價"
                  value={r.liqPrice > 0 ? fmt(r.liqPrice, 1) : "不會觸發"}
                  unit={r.liqPrice > 0 ? "元" : ""}
                  color={C.red}
                />
                <Stat
                  label="距斷頭跌幅"
                  value={r.liqPrice > 0 ? `−${fmt(r.liqDrop, 1)}` : "—"}
                  unit="%"
                  color={C.red}
                />
              </div>

              {/* 價格軸示意 */}
              {r.liqPrice > 0 && (
                <div style={{ marginTop: 14 }}>
                  <div
                    style={{
                      position: "relative",
                      height: 12,
                      borderRadius: 6,
                      background: `linear-gradient(to right, ${C.red} 0%, ${C.red} ${Math.max(100 - r.callDrop * (100 / Math.max(r.callDrop * 1.4, 20)), 0)}%, ${C.panelSoft} 100%)`,
                      border: `1px solid ${C.line}`,
                      overflow: "hidden",
                    }}
                  >
                    {(() => {
                      const span = Math.max(r.callDrop * 1.4, 20); // 顯示範圍：跌幅0%~span%
                      const posOf = (drop) => `${Math.min(Math.max((drop / span) * 100, 0), 100)}%`;
                      return (
                        <>
                          <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 2, background: C.text }} />
                          <div style={{ position: "absolute", left: `calc(100% - ${posOf(r.callDrop)})`, top: -2, bottom: -2, width: 2, background: C.amber }} />
                          <div style={{ position: "absolute", left: `calc(100% - ${posOf(r.liqDrop)})`, top: -2, bottom: -2, width: 2, background: C.red }} />
                        </>
                      );
                    })()}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, fontFamily: mono, marginTop: 4 }}>
                    <span style={{ color: C.red }}>斷頭 {fmt(r.liqPrice, 0)}</span>
                    <span style={{ color: C.amber }}>追繳 {fmt(r.callPrice, 0)}</span>
                    <span style={{ color: C.text }}>現價 {fmt(parseFloat(price), 0)}</span>
                  </div>
                </div>
              )}

              {/* 各槓桿倍率對照表 */}
              <div style={{ marginTop: 16, paddingTop: 12, borderTop: `1px dashed ${C.line}` }}>
                <div style={{ fontSize: 11, color: C.dim, letterSpacing: "0.08em", marginBottom: 8 }}>
                  ▎各倍率安全距離對照（同一套遊戲規則）
                </div>
                <div className="flt-table-wrap">
                <table className="flt-table" style={{ fontFamily: mono, fontSize: 12, fontVariantNumeric: "tabular-nums" }}>
                  <thead>
                    <tr style={{ color: C.dim, textAlign: "right" }}>
                      <th style={{ textAlign: "left", padding: "4px 0", fontWeight: 400 }}>槓桿</th>
                      <th style={{ fontWeight: 400 }}>追繳價</th>
                      <th style={{ fontWeight: 400 }}>距追繳</th>
                      <th style={{ fontWeight: 400 }}>斷頭價</th>
                      <th style={{ fontWeight: 400 }}>距斷頭</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[1.5, 2, 3, 4, 5, 6, 7].map((lev) => {
                      const E = parseFloat(equity) || 0;
                      const P = parseFloat(price) || 0;
                      const mr2 = (parseFloat(marginRate) || 0) / 100;
                      const mm2 = mr2 * (10.35 / 13.5);
                      const S = (lev * E) / P;
                      const cp = lev > 1 ? (S * P - E) / (S * (1 - mm2)) : 0;
                      const lp = lev > 1 ? (S * P - E) / (S * (1 - 0.25 * mr2)) : 0;
                      const cd = cp > 0 ? (1 - cp / P) * 100 : 100;
                      const ld = lp > 0 ? (1 - lp / P) * 100 : 100;
                      const isSel = Math.abs(lev - L) < 0.01;
                      const overMax = lev > 1 / mr2;
                      return (
                        <tr
                          key={lev}
                          style={{
                            textAlign: "right",
                            color: overMax ? C.red : isSel ? C.text : C.dim,
                            background: isSel ? `${C.blue}22` : "transparent",
                            opacity: overMax ? 0.6 : 1,
                          }}
                        >
                          <td style={{ textAlign: "left", padding: "5px 0", fontWeight: isSel ? 700 : 400 }}>
                            {lev}x{isSel ? " ◀" : ""}{overMax ? " 超限" : ""}
                          </td>
                          <td>{cp > 0 ? fmt(cp, 0) : "—"}</td>
                          <td style={{ color: cd < 10 ? C.red : cd < 20 ? C.amber : undefined }}>
                            {cp > 0 ? `−${fmt(cd, 1)}%` : "—"}
                          </td>
                          <td>{lp > 0 ? fmt(lp, 0) : "—"}</td>
                          <td style={{ color: ld < 10 ? C.red : ld < 20 ? C.amber : undefined }}>
                            {lp > 0 ? `−${fmt(ld, 1)}%` : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                </div>
              </div>

              <div
                style={{
                  marginTop: 12,
                  padding: "8px 12px",
                  background: `${C.amber}18`,
                  border: `1px solid ${C.amber}55`,
                  borderRadius: 8,
                  fontSize: 12,
                  color: C.text,
                  lineHeight: 1.7,
                }}
              >
                <strong style={{ color: C.amber }}>遊戲規則：</strong>
                權益數跌破<span style={{ color: C.amber }}>維持保證金</span>→ 收到追繳通知，須於期限內補足至原始保證金；
                盤中<span style={{ color: C.red }}>風險指標（權益數÷原始保證金）低於25%</span>→ 期貨商可直接代為沖銷（斷頭），不等你補錢。
                個股漲跌幅一天±10%，高槓桿下單日跳空就可能直接穿越追繳、觸及斷頭。
              </div>
            </div>

            <div style={{ fontSize: 11, color: C.dim, marginTop: 14, lineHeight: 1.7 }}>
              維持保證金以原始比例 ×(10.35/13.5) 估算；斷頭以風險指標25%計算，各期貨商砍倉標準略有差異，請以你的期貨商規定為準。
              風險價格假設觸價前未執行再平衡——實際上固定槓桿策略若確實執行「跌時減碼」，會在觸及追繳前就先降低部位，這正是此策略的保護機制。
              本工具僅供試算參考，不構成投資建議。結算日（每月第三個週三）前記得轉倉並順便再平衡。
            </div>
          </>
        )}
    </>
  );
}

// ══════════════════════ 風險預算倉位分頁（固定風險比例＋凱莉檢查）══════════════════════
function KellyTab() {
  const [capital, setCapital] = useState("1000000");
  const [riskPct, setRiskPct] = useState("2");
  const [entry, setEntry] = useState("500");
  const [takeProfit, setTakeProfit] = useState("575");
  const [stopLoss, setStopLoss] = useState("475");
  const [winRate, setWinRate] = useState("40");

  const k = useMemo(() => {
    const cap = parseFloat(capital) || 0;
    const R = (parseFloat(riskPct) || 0) / 100;
    const P = parseFloat(entry) || 0;
    const tp = parseFloat(takeProfit) || 0;
    const sl = parseFloat(stopLoss) || 0;
    const pRaw = parseFloat(winRate);
    const hasP = isFinite(pRaw) && pRaw > 0 && pRaw < 100;
    const p = hasP ? pRaw / 100 : null;

    if (cap <= 0 || R <= 0 || P <= 0 || sl >= P || sl <= 0) return null;

    const a = (P - sl) / P;                    // 停損幅度
    const hasTp = tp > P;
    const b = hasTp ? (tp - P) / P : null;     // 停利幅度

    // ── 核心：固定風險反推部位 ──
    const riskBudget = cap * R;                // 這筆最多能虧的錢
    const perShareRisk = P - sl;               // 每股風險
    const rawShares = Math.floor(riskBudget / perShareRisk);
    // 不開槓桿：投入金額不得超過總資金
    const maxSharesByCash = Math.floor(cap / P);
    const shares = Math.min(rawShares, maxSharesByCash);
    const cashCapped = rawShares > maxSharesByCash;

    const lots = Math.floor(shares / 1000);
    const oddShares = shares - lots * 1000;
    const investAmt = shares * P;
    const investPct = cap > 0 ? investAmt / cap : 0;
    const actualLoss = shares * perShareRisk;  // 實際打停損虧損
    const actualRiskPct = cap > 0 ? (actualLoss / cap) * 100 : 0;

    // ── 存活儀表板：連錯N次剩多少 ──
    const survival = [5, 10, 15, 20].map((n) => ({
      n,
      remain: Math.pow(1 - R, n) * 100,
    }));

    // ── 凱莉檢查員（需要停利價與勝率才啟用）──
    let kelly = null;
    if (hasTp && p !== null) {
      const q = 1 - p;
      const ev = p * b - q * a;
      const breakEvenP = a / (a + b);
      const fullKelly = p / a - q / b;
      const kellyRiskCap = Math.max(fullKelly, 0) * a; // 凱莉上限換算成「每筆風險%」
      kelly = {
        ev, breakEvenP, fullKelly, kellyRiskCap,
        rr: b / a,
        negative: fullKelly <= 0,
        overKelly: R > kellyRiskCap && fullKelly > 0,
        overHalfKelly: R > kellyRiskCap / 2 && fullKelly > 0,
      };
    }

    return {
      a, b, hasTp, riskBudget, perShareRisk, shares, lots, oddShares,
      investAmt, investPct, actualLoss, actualRiskPct, cashCapped,
      survival, kelly, R,
    };
  }, [capital, riskPct, entry, takeProfit, stopLoss, winRate]);

  return (
    <>
      {/* 輸入區 */}
      <div
        className="flt-inputs flt-panel"
        style={{
          background: C.panel,
          border: `1px solid ${C.line}`,
          borderRadius: 12,
          padding: 16,
        }}
      >
        <Field label="總資金規模" value={capital} onChange={setCapital} suffix="元" />
        <Field label="每筆風險上限" value={riskPct} onChange={setRiskPct} suffix="%" step="0.5" />
        <Field label="買入價" value={entry} onChange={setEntry} suffix="元" />
        <Field label="停損價（必填）" value={stopLoss} onChange={setStopLoss} suffix="元" />
        <Field label="停利價（選填）" value={takeProfit} onChange={setTakeProfit} suffix="元" />
        <Field label="勝率估計（選填）" value={winRate} onChange={setWinRate} suffix="%" />
      </div>

      {!k && (
        <div
          className="flt-panel"
          style={{
            background: C.panel, border: `1px solid ${C.line}`, borderRadius: 12,
            padding: 16, marginTop: 14, fontSize: 13, color: C.dim, lineHeight: 1.7,
          }}
        >
          請確認：買入價 &gt; 停損價 &gt; 0，總資金與風險上限為正數。
        </div>
      )}

      {k && (
        <>
          {/* 主輸出：部位拆分 */}
          <div
            className="flt-panel"
            style={{
              background: C.panel, border: `1px solid ${C.blue}`, borderRadius: 12,
              padding: 16, marginTop: 14,
            }}
          >
            <div style={{ fontSize: 11, color: C.dim, letterSpacing: "0.08em", marginBottom: 8 }}>
              ▎本筆拆分結果（風險 {riskPct}% = {fmt(k.riskBudget)} 元）
            </div>
            <div className="flt-action-verb" style={{ fontFamily: mono, fontSize: 26, fontWeight: 700, color: C.red }}>
              買進 {k.lots > 0 ? `${k.lots} 張` : ""}{k.oddShares > 0 ? ` ${fmt(k.oddShares)} 股` : k.lots === 0 ? `${fmt(k.shares)} 股` : ""}
            </div>
            <div style={{ fontFamily: mono, fontSize: 14, color: C.dim, marginTop: 6, lineHeight: 1.7 }}>
              投入 {fmt(k.investAmt)} 元（資金的 {fmt(k.investPct * 100, 1)}%）<br />
              計算：{fmt(k.riskBudget)} ÷ 每股風險 {fmt(k.perShareRisk, 1)} 元 = {fmt(k.shares)} 股
            </div>

            <div
              className="flt-stats2"
              style={{ marginTop: 14, paddingTop: 12, borderTop: `1px dashed ${C.line}` }}
            >
              <Stat
                label="打到停損虧損"
                value={`−${fmt(k.actualLoss)}`}
                unit="元"
                color={C.green}
              />
              <Stat
                label="實際占總資金"
                value={`−${fmt(k.actualRiskPct, 2)}`}
                unit="%"
                color={C.green}
              />
            </div>

            {k.cashCapped && (
              <div
                style={{
                  marginTop: 12, padding: "8px 12px",
                  background: `${C.amber}18`, border: `1px solid ${C.amber}55`,
                  borderRadius: 8, fontSize: 12, color: C.text, lineHeight: 1.7,
                }}
              >
                <strong style={{ color: C.amber }}>提示：</strong>
                停損很近，風險預算算出的股數超過現金能買的量，已封頂為全額現股。
                實際風險因此低於你設的 {riskPct}%。若想吃滿風險預算，可到「固定槓桿」分頁用股期放大部位。
              </div>
            )}
          </div>

          {/* 存活儀表板 */}
          <div
            className="flt-panel"
            style={{
              background: C.panel, border: `1px solid ${C.line}`, borderRadius: 12,
              padding: 16, marginTop: 14,
            }}
          >
            <div style={{ fontSize: 11, color: C.dim, letterSpacing: "0.08em", marginBottom: 10 }}>
              ▎存活儀表板：連續虧損後剩餘資金（每筆固定 {riskPct}%）
            </div>
            {k.survival.map((s) => (
              <div key={s.n} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <span style={{ fontFamily: mono, fontSize: 12, color: C.dim, width: 64, flexShrink: 0 }}>
                  連錯{s.n}次
                </span>
                <div style={{ flex: 1, height: 12, background: C.panelSoft, borderRadius: 6, border: `1px solid ${C.line}`, overflow: "hidden" }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${s.remain}%`,
                      background: s.remain > 80 ? `${C.green}88` : s.remain > 60 ? `${C.amber}88` : `${C.red}88`,
                      transition: "width .3s",
                    }}
                  />
                </div>
                <span style={{ fontFamily: mono, fontSize: 12, width: 46, textAlign: "right", flexShrink: 0,
                  color: s.remain > 80 ? C.green : s.remain > 60 ? C.amber : C.red }}>
                  {fmt(s.remain, 0)}%
                </span>
              </div>
            ))}
            <div style={{ fontSize: 11, color: C.dim, marginTop: 6, lineHeight: 1.6 }}>
              存活由風險上限 R 直接控制，與勝率估得準不準無關——這就是「先保證活著」的機制。
            </div>
          </div>

          {/* 凱莉檢查員 */}
          <div
            className="flt-panel"
            style={{
              background: C.panel,
              border: `1px solid ${k.kelly?.negative ? C.red : C.line}`,
              borderRadius: 12, padding: 16, marginTop: 14,
            }}
          >
            <div style={{ fontSize: 11, color: C.dim, letterSpacing: "0.08em", marginBottom: 10 }}>
              ▎凱莉檢查員（填入停利價＋勝率後啟用）
            </div>

            {!k.kelly ? (
              <div style={{ fontSize: 13, color: C.dim, lineHeight: 1.7 }}>
                填入停利價與勝率，可加驗兩件事：這筆期望值是否為正、你設的風險上限是否超過凱莉理論天花板。
              </div>
            ) : k.kelly.negative ? (
              <>
                <div style={{ fontFamily: mono, fontSize: 20, fontWeight: 700, color: C.red, textAlign: "center" }}>
                  ✕ 期望值為負，這筆不該做
                </div>
                <div style={{ fontSize: 13, color: C.dim, marginTop: 8, lineHeight: 1.7, textAlign: "center" }}>
                  每元期望值 {fmt(k.kelly.ev * 100, 2)}%。
                  以此盈虧比需要勝率 &gt; {fmt(k.kelly.breakEvenP * 100, 1)}% 才值得下注，
                  你的估計是 {winRate}%。倉位算得再好也救不了負期望值。
                </div>
              </>
            ) : (
              <>
                <div className="flt-stats3">
                  <Stat label="每元期望值" value={`+${fmt(k.kelly.ev * 100, 2)}`} unit="%" color={C.red} />
                  <Stat label="盈虧比" value={fmt(k.kelly.rr, 2)} unit=": 1" />
                  <Stat label="兩平勝率" value={fmt(k.kelly.breakEvenP * 100, 1)} unit="%" />
                </div>
                <div
                  className="flt-stats2"
                  style={{ marginTop: 12, paddingTop: 12, borderTop: `1px dashed ${C.line}` }}
                >
                  <Stat
                    label="凱莉風險天花板"
                    value={fmt(k.kelly.kellyRiskCap * 100, 1)}
                    unit="% /筆"
                    color={C.dim}
                  />
                  <Stat
                    label="你的風險設定"
                    value={riskPct}
                    unit="% /筆"
                    color={k.kelly.overKelly ? C.red : k.kelly.overHalfKelly ? C.amber : C.green}
                  />
                </div>
                <div
                  style={{
                    marginTop: 12, padding: "8px 12px",
                    background: k.kelly.overKelly ? `${C.red}18` : `${C.panelSoft}`,
                    border: `1px solid ${k.kelly.overKelly ? C.red : C.line}`,
                    borderRadius: 8, fontSize: 12, color: C.text, lineHeight: 1.7,
                  }}
                >
                  {k.kelly.overKelly ? (
                    <><strong style={{ color: C.red }}>超過凱莉上限：</strong>
                    你設的每筆風險 {riskPct}% 超過全凱莉天花板 {fmt(k.kelly.kellyRiskCap * 100, 1)}%，
                    長期而言這個下注規模在數學上會拖慢甚至摧毀資金成長，請調低。</>
                  ) : k.kelly.overHalfKelly ? (
                    <><strong style={{ color: C.amber }}>介於半凱莉與全凱莉之間：</strong>
                    數學上可行，但勝率若高估就會越線，建議保守一點。</>
                  ) : (
                    <><strong style={{ color: C.green }}>✓ 通過：</strong>
                    你的 {riskPct}% 低於半凱莉（{fmt(k.kelly.kellyRiskCap * 50, 1)}%），
                    期望值為正、下注規模保守，符合長期存活邏輯。</>
                  )}
                </div>
              </>
            )}
          </div>

          <div style={{ fontSize: 11, color: C.dim, marginTop: 14, lineHeight: 1.7 }}>
            部位公式：股數 = (總資金×R%) ÷ (買入價−停損價)。凱莉天花板 = f*×a，f* = p/a − q/b。
            假設停損確實成交；跳空缺口會使實際虧損大於預算。本工具僅供試算參考，不構成投資建議。
          </div>
        </>
      )}
    </>
  );
}

// ══════════════════════ 組合熱度分頁（多檔風險預算）══════════════════════
let _pid = 3;
function PortfolioTab() {
  const [capital, setCapital] = useState("1000000");
  const [heatCap, setHeatCap] = useState("6");
  const [perRisk, setPerRisk] = useState("2");
  const [positions, setPositions] = useState([
    { id: 1, name: "標的A", entry: "500", stop: "475", group: "1" },
    { id: 2, name: "標的B", entry: "80", stop: "74", group: "1" },
    { id: 3, name: "標的C", entry: "35", stop: "31.5", group: "2" },
  ]);

  const addPos = () => {
    _pid += 1;
    setPositions((ps) => [
      ...ps,
      { id: _pid, name: `標的${String.fromCharCode(64 + _pid)}`, entry: "", stop: "", group: "" },
    ]);
  };
  const removePos = (id) => setPositions((ps) => ps.filter((x) => x.id !== id));
  const updatePos = (id, key, val) =>
    setPositions((ps) => ps.map((x) => (x.id === id ? { ...x, [key]: val } : x)));

  const r = useMemo(() => {
    const cap = parseFloat(capital) || 0;
    const H = (parseFloat(heatCap) || 0) / 100;
    const R = (parseFloat(perRisk) || 0) / 100;
    if (cap <= 0 || H <= 0 || R <= 0) return null;

    const maxSlots = Math.floor(H / R + 1e-9);
    const riskBudget = cap * R;

    // 第一輪：依風險預算算原始股數
    const rawRows = positions.map((pos) => {
      const P = parseFloat(pos.entry) || 0;
      const sl = parseFloat(pos.stop) || 0;
      const valid = P > 0 && sl > 0 && sl < P;
      if (!valid) return { ...pos, valid, P: 0, sl: 0, perShareRisk: 0, rawShares: 0 };
      const perShareRisk = P - sl;
      const rawShares = Math.floor(riskBudget / perShareRisk);
      return { ...pos, valid, P, sl, perShareRisk, rawShares };
    });

    // 第二輪：現金上限檢查——合計投入超過總資金時，等比例縮減全部標的
    const totalInvestRaw = rawRows.reduce((s, x) => s + (x.valid ? x.rawShares * x.P : 0), 0);
    const cashScale = totalInvestRaw > cap && totalInvestRaw > 0 ? cap / totalInvestRaw : 1;
    const cashConstrained = cashScale < 1;

    const rows = rawRows.map((x) => {
      if (!x.valid) return { ...x, shares: 0, lots: 0, odd: 0, invest: 0, risk: 0, riskPct: 0, stopDist: 0, scaled: false };
      const shares = Math.floor(x.rawShares * cashScale);
      const invest = shares * x.P;
      const risk = shares * x.perShareRisk;
      return {
        ...x,
        shares,
        lots: Math.floor(shares / 1000),
        odd: shares % 1000,
        invest, risk,
        riskPct: cap > 0 ? (risk / cap) * 100 : 0,
        stopDist: (x.perShareRisk / x.P) * 100,
        scaled: cashConstrained && shares < x.rawShares,
        rawShares: x.rawShares,
      };
    });

    const validRows = rows.filter((x) => x.valid);
    const totalHeat = validRows.reduce((s, x) => s + x.riskPct, 0);
    const totalInvest = validRows.reduce((s, x) => s + x.invest, 0);
    const heatLeft = H * 100 - totalHeat;
    const overHeat = totalHeat > H * 100 + 1e-9;
    const overCash = false; // 已由等比例縮減處理，不再出現超額
    const slotsLeft = Math.max(maxSlots - validRows.length, 0);

    // 群組集中度：同群組風險加總
    const groups = {};
    validRows.forEach((x) => {
      const g = (x.group || "").trim();
      if (!g) return;
      groups[g] = (groups[g] || 0) + x.riskPct;
    });
    const groupWarnings = Object.entries(groups)
      .filter(([, v]) => v > H * 100 * 0.67)
      .map(([g, v]) => ({ g, v }));

    // 全滅情境
    const wipeout = validRows.reduce((s, x) => s + x.risk, 0);

    return {
      rows, validRows, totalHeat, totalInvest, heatLeft, overHeat, overCash,
      maxSlots, slotsLeft, riskBudget, groupWarnings, wipeout, H, R, cap,
      cashConstrained, cashScale,
    };
  }, [capital, heatCap, perRisk, positions]);

  const inputStyle = {
    width: "100%", minWidth: 0, background: C.panelSoft,
    border: `1px solid ${C.line}`, borderRadius: 6,
    color: C.text, fontFamily: mono, fontSize: 15,
    padding: "8px 8px", outline: "none",
  };

  return (
    <>
      {/* 全域設定 */}
      <div
        className="flt-inputs flt-panel"
        style={{
          background: C.panel, border: `1px solid ${C.line}`,
          borderRadius: 12, padding: 16,
        }}
      >
        <div className="flt-wide">
          <Field label="總資金規模" value={capital} onChange={setCapital} suffix="元" />
        </div>
        <Field label="總熱度上限 H" value={heatCap} onChange={setHeatCap} suffix="%" step="0.5" />
        <Field label="每筆風險 R" value={perRisk} onChange={setPerRisk} suffix="%" step="0.5" />

        {/* 計算方式即時說明 */}
        <div
          className="flt-wide"
          style={{
            background: C.panelSoft,
            border: `1px solid ${C.line}`,
            borderRadius: 8,
            padding: "10px 12px",
            fontSize: 12,
            color: C.dim,
            lineHeight: 1.9,
          }}
        >
          <div style={{ color: C.text, fontWeight: 700, fontSize: 12, marginBottom: 4 }}>
            ▎這三個數字怎麼運作
          </div>
          <div style={{ fontFamily: mono, fontSize: 12 }}>
            可持有檔數 = H ÷ R = {heatCap || "?"}% ÷ {perRisk || "?"}%
            {(() => {
              const H = parseFloat(heatCap), R = parseFloat(perRisk);
              return H > 0 && R > 0
                ? <span style={{ color: C.blue, fontWeight: 700 }}> = {Math.floor(H / R + 1e-9)} 檔</span>
                : null;
            })()}
          </div>
          <div style={{ fontFamily: mono, fontSize: 12 }}>
            每檔風險預算 = 總資金 × R
            {(() => {
              const cap = parseFloat(capital), R = parseFloat(perRisk);
              return cap > 0 && R > 0
                ? <span style={{ color: C.blue, fontWeight: 700 }}> = {fmt(cap * R / 100)} 元</span>
                : null;
            })()}
          </div>
          <div style={{ fontFamily: mono, fontSize: 12 }}>
            每檔股數 = 風險預算 ÷ (買入價−停損價)
          </div>
          <div style={{ marginTop: 6, borderTop: `1px dashed ${C.line}`, paddingTop: 6 }}>
            <span style={{ color: C.amber }}>H</span>：全部標的同一天打到停損，帳戶最多虧 H%——這是你的總承受天花板。
            <br />
            <span style={{ color: C.amber }}>R</span>：任何單一檔停損，只虧總資金的 R%。
            <br />
            想拿更多檔：放大 H（更激進）或調小 R（每檔更小），數學上二選一。
          </div>
        </div>
      </div>

      {r && (
        <>
          {/* 熱度儀表板 */}
          <div
            className="flt-panel"
            style={{
              background: C.panel,
              border: `1px solid ${r.overHeat ? C.red : C.line}`,
              borderRadius: 12, padding: 16, marginTop: 14,
            }}
          >
            <div style={{ fontSize: 11, color: C.dim, letterSpacing: "0.08em", marginBottom: 10 }}>
              ▎組合熱度（全部同時停損的總傷害）
            </div>
            <div style={{ position: "relative", height: 16, background: C.panelSoft, borderRadius: 8, border: `1px solid ${C.line}`, overflow: "hidden" }}>
              <div
                style={{
                  height: "100%",
                  width: `${Math.min((r.totalHeat / (r.H * 100)) * 100, 100)}%`,
                  background: r.overHeat ? C.red : r.totalHeat / (r.H * 100) > 0.8 ? `${C.amber}AA` : `${C.green}88`,
                  transition: "width .3s",
                }}
              />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: mono, fontSize: 11, color: C.dim, marginTop: 4 }}>
              <span>0%</span>
              <span style={{ color: r.overHeat ? C.red : C.text }}>
                目前 {fmt(r.totalHeat, 1)}%
              </span>
              <span>上限 {fmt(r.H * 100, 0)}%</span>
            </div>

            <div className="flt-stats3" style={{ marginTop: 14, paddingTop: 12, borderTop: `1px dashed ${C.line}` }}>
              <Stat
                label="剩餘熱度"
                value={fmt(Math.max(r.heatLeft, 0), 1)}
                unit="%"
                color={r.heatLeft <= 0 ? C.red : C.text}
              />
              <Stat label="可開新倉" value={`${r.slotsLeft}`} unit={`/ ${r.maxSlots} 檔`} />
              <Stat
                label="全滅虧損"
                value={`−${fmt(r.wipeout)}`}
                unit="元"
                color={C.green}
              />
            </div>
            <div className="flt-stats2" style={{ marginTop: 12 }}>
              <Stat
                label="總投入金額"
                value={fmt(r.totalInvest)}
                unit="元"
                color={r.cashConstrained ? C.amber : C.text}
              />
              <Stat
                label="資金使用率"
                value={fmt(r.cap > 0 ? (r.totalInvest / r.cap) * 100 : 0, 1)}
                unit="%"
                color={r.cashConstrained ? C.amber : C.text}
              />
            </div>

            {r.overHeat && (
              <div style={{ marginTop: 12, padding: "8px 12px", background: `${C.red}18`, border: `1px solid ${C.red}`, borderRadius: 8, fontSize: 12, color: C.red, lineHeight: 1.7 }}>
                ⚠ 總熱度 {fmt(r.totalHeat, 1)}% 超過上限 {fmt(r.H * 100, 0)}%——同時全部停損的傷害超出你的承受設定，請減少檔數或調低每筆風險。
              </div>
            )}
            {r.overCash && (
              <div style={{ marginTop: 8, padding: "8px 12px", background: `${C.amber}18`, border: `1px solid ${C.amber}55`, borderRadius: 8, fontSize: 12, color: C.text, lineHeight: 1.7 }}>
                <strong style={{ color: C.amber }}>現金不足：</strong>
                各檔投入合計 {fmt(r.totalInvest)} 元超過總資金，需開槓桿或縮減部位。
              </div>
            )}
            {r.cashConstrained && (
              <div style={{ marginTop: 8, padding: "8px 12px", background: `${C.amber}18`, border: `1px solid ${C.amber}55`, borderRadius: 8, fontSize: 12, color: C.text, lineHeight: 1.7 }}>
                <strong style={{ color: C.amber }}>現金上限已生效：</strong>
                風險預算原需投入超過總資金（停損太近、部位放很大時會發生），已將全部標的等比例縮減至 {fmt(r.cashScale * 100, 0)}%，
                總投入 {fmt(r.totalInvest)} 元塞進資金內。代價是每檔實際風險低於設定的 {perRisk}%（見各標的卡片）。
                若想吃滿風險預算，需放寬停損距離或用「固定槓桿」分頁以股期放大曝險。
              </div>
            )}
            {r.groupWarnings.map((w) => (
              <div key={w.g} style={{ marginTop: 8, padding: "8px 12px", background: `${C.amber}18`, border: `1px solid ${C.amber}55`, borderRadius: 8, fontSize: 12, color: C.text, lineHeight: 1.7 }}>
                <strong style={{ color: C.amber }}>相關性集中：</strong>
                群組「{w.g}」的風險合計 {fmt(w.v, 1)}%，占熱度上限過高。高相關標的會同天觸發停損，等於同一注下了多次。
              </div>
            ))}
          </div>

          {/* 各標的列表 */}
          {r.rows.map((row, i) => (
            <div
              key={row.id}
              className="flt-panel"
              style={{
                background: C.panel, border: `1px solid ${C.line}`,
                borderRadius: 12, padding: 14, marginTop: 12,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <input
                  value={row.name}
                  onChange={(e) => updatePos(row.id, "name", e.target.value)}
                  style={{ ...inputStyle, fontFamily: sans, fontSize: 14, fontWeight: 700, flex: 1 }}
                />
                <input
                  value={row.group}
                  onChange={(e) => updatePos(row.id, "group", e.target.value)}
                  placeholder="群組"
                  style={{ ...inputStyle, width: 64, flex: "none", textAlign: "center", fontSize: 13 }}
                />
                <button
                  onClick={() => removePos(row.id)}
                  style={{
                    width: 36, height: 36, flexShrink: 0, borderRadius: 8,
                    border: `1px solid ${C.line}`, background: C.panelSoft,
                    color: C.dim, fontSize: 16, cursor: "pointer",
                  }}
                >
                  ✕
                </button>
              </div>
              <div className="flt-stats2" style={{ gap: 10 }}>
                <div>
                  <div className="flt-field-label" style={{ fontSize: 11, color: C.dim, marginBottom: 4 }}>買入價</div>
                  <input
                    type="number" inputMode="decimal" size={1}
                    value={row.entry}
                    onChange={(e) => updatePos(row.id, "entry", e.target.value)}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <div className="flt-field-label" style={{ fontSize: 11, color: C.dim, marginBottom: 4 }}>停損價</div>
                  <input
                    type="number" inputMode="decimal" size={1}
                    value={row.stop}
                    onChange={(e) => updatePos(row.id, "stop", e.target.value)}
                    style={inputStyle}
                  />
                </div>
              </div>

              {row.valid ? (
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px dashed ${C.line}` }}>
                  <div style={{ fontFamily: mono, fontSize: 16, fontWeight: 700, color: C.red }}>
                    買 {row.lots > 0 ? `${row.lots}張` : ""}{row.odd > 0 ? `${fmt(row.odd)}股` : row.lots === 0 ? "0股" : ""}
                    <span style={{ fontSize: 12, color: C.dim, fontWeight: 400, marginLeft: 8 }}>
                      投入 {fmt(row.invest)} 元
                    </span>
                    {row.scaled && (
                      <span style={{ fontSize: 11, color: C.amber, fontWeight: 400, marginLeft: 6 }}>
                        （現金縮減，原 {fmt(row.rawShares)} 股）
                      </span>
                    )}
                  </div>
                  <div style={{ fontFamily: mono, fontSize: 11, color: C.dim, marginTop: 4 }}>
                    停損距離 −{fmt(row.stopDist, 1)}% · 觸發虧 {fmt(row.risk)} 元（{fmt(row.riskPct, 2)}%{row.scaled ? ` / 設定 ${perRisk}%` : ""}）
                  </div>
                </div>
              ) : (
                <div style={{ marginTop: 10, fontSize: 12, color: C.dim }}>
                  填入買入價與停損價（停損 &lt; 買入）後自動計算
                </div>
              )}
            </div>
          ))}

          {/* 新增按鈕 */}
          <button
            onClick={addPos}
            style={{
              width: "100%", marginTop: 12, padding: "12px 0", minHeight: 48,
              borderRadius: 12, border: `1px dashed ${C.line}`,
              background: "transparent", color: C.dim,
              fontFamily: sans, fontSize: 14, cursor: "pointer",
            }}
          >
            ＋ 新增標的{r.slotsLeft <= 0 ? "（熱度已滿，新增將超標）" : ""}
          </button>

          <div style={{ fontSize: 11, color: C.dim, marginTop: 14, lineHeight: 1.7 }}>
            兩層預算：總熱度 H 控制帳戶同時暴露的風險天花板，每筆 R 控制單檔傷害；可持有檔數 = H ÷ R。
            停損距離遠的標的自動配小部位、近的配大部位（波動度調整內建於公式）。
            「群組」欄填同產業或高相關標的的代號，同群組風險過度集中會警告。
            獲利部位停損上移至成本以上後，該檔熱度歸零、可釋放預算開新倉。本工具僅供試算參考，不構成投資建議。
          </div>
        </>
      )}
    </>
  );
}

// ══════════════════════ 主元件：分頁切換 ══════════════════════
export default function TradingToolkit() {
  const [tab, setTab] = useState("kelly");

  const tabs = [
    { id: "kelly", label: "① 單筆倉位", sub: "風險預算拆分" },
    { id: "portfolio", label: "② 組合熱度", sub: "多檔分散管理" },
    { id: "leverage", label: "③ 固定槓桿", sub: "期貨部位紀律" },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: C.bg,
        color: C.text,
        fontFamily: sans,
        padding: "18px 12px 40px",
        WebkitTextSizeAdjust: "100%",
      }}
    >
      <style>{responsiveCSS}</style>
      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        {/* 標題 */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, color: C.dim, letterSpacing: "0.22em", fontFamily: mono }}>
            POSITION SIZING · RISK CONTROL
          </div>
          <h1 className="flt-title" style={{ fontSize: 22, fontWeight: 700, margin: "6px 0 2px", lineHeight: 1.3 }}>
            投資資金管理工具箱
          </h1>
          <div style={{ fontSize: 12, color: C.dim, lineHeight: 1.5 }}>
            {tab === "kelly"
              ? "風險預算制：先保證活著，凱莉當檢查員 · 紅買綠賣"
              : tab === "portfolio"
              ? "兩層預算：總熱度H × 每筆R · 相關性集中警示"
              : "股票期貨：一般 2,000股/口 · 小型 100股/口 · 紅買綠賣"}
          </div>
        </div>

        {/* 分頁切換 */}
        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 14,
            background: C.panel,
            border: `1px solid ${C.line}`,
            borderRadius: 12,
            padding: 6,
          }}
        >
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                flex: 1,
                padding: "9px 4px",
                minHeight: 52,
                borderRadius: 8,
                border: "none",
                background: tab === t.id ? C.panelSoft : "transparent",
                boxShadow: tab === t.id ? `inset 0 0 0 1px ${C.blue}` : "none",
                color: tab === t.id ? C.text : C.dim,
                fontFamily: sans,
                cursor: "pointer",
                transition: "all .15s",
              }}
            >
              <div style={{ fontSize: 13, fontWeight: tab === t.id ? 700 : 500, whiteSpace: "nowrap" }}>{t.label}</div>
              <div style={{ fontSize: 9, color: C.dim, marginTop: 2, whiteSpace: "nowrap" }}>{t.sub}</div>
            </button>
          ))}
        </div>

        {tab === "kelly" ? <KellyTab /> : tab === "portfolio" ? <PortfolioTab /> : <LeverageTab />}
      </div>
    </div>
  );
}
