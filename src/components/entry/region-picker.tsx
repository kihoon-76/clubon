"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";

import { useT } from "@/lib/i18n/client";
import {
  COUNTRIES_BY_CONTINENT,
  KOREA,
  KR_REGIONS,
  krRegionLabel,
} from "@/lib/regions";

/**
 * 지역 선택 — 나라를 고르고, 대한민국이면 시·도를 한 번 더 고릅니다.
 *
 * 폼이 실제로 보내는 값은 `regionCode` 하나입니다. 나라와 시·도는 고르는
 * 과정일 뿐이라, 서버가 받는 것은 언제나 완성된 지역 코드 하나여야 합니다.
 *
 * 해외 국가는 **영어로** 적습니다. 자기 나라를 찾는 사람에게 한국어 표기는
 * 아무 도움이 되지 않기 때문입니다.
 */
export function RegionPicker({
  defaultValue = null,
}: {
  /** 이미 정해진 지역 코드 (다시 신청할 때 이어받습니다) */
  defaultValue?: string | null;
}) {
  const t = useT();
  const isKr = Boolean(defaultValue?.startsWith("kr-"));
  const [country, setCountry] = useState(
    defaultValue ? (isKr ? KOREA : defaultValue) : "",
  );
  const [krRegion, setKrRegion] = useState(isKr ? (defaultValue as string) : "");

  // 서버로 나가는 값. 대한민국이면 시·도까지 골라야 완성됩니다.
  const regionCode = country === KOREA ? krRegion : country;

  return (
    <div className="space-y-4">
      <input type="hidden" name="regionCode" value={regionCode} />

      <label className="block">
        <span className="label-caps mb-2 block">{t("entry.country")}</span>
        <Select
          value={country}
          onChange={(v) => {
            setCountry(v);
            if (v !== KOREA) setKrRegion("");
          }}
          required
        >
          <option value="">{t("entry.select")}</option>
          <option value={KOREA}>{t("regions.korea")}</option>
          {COUNTRIES_BY_CONTINENT.map((group) => (
            <optgroup key={group.continent} label={group.label}>
              {group.countries.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </optgroup>
          ))}
        </Select>
      </label>

      {country === KOREA ? (
        <label className="block">
          <span className="label-caps mb-2 block">{t("entry.krRegion")}</span>
          <Select value={krRegion} onChange={setKrRegion} required>
            <option value="">{t("entry.select")}</option>
            {KR_REGIONS.map((r) => (
              <option key={r.code} value={r.code}>
                {krRegionLabel(r, t)}
              </option>
            ))}
          </Select>
        </label>
      ) : null}

      <p className="flex items-start gap-2 text-xs leading-relaxed break-keep text-faint">
        <MapPin aria-hidden className="mt-0.5 size-3.5 shrink-0 text-champagne" />
        {t("entry.regionNote")}
      </p>
    </div>
  );
}

function Select({
  value,
  onChange,
  required,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      className="w-full rounded-[var(--radius-control)] border border-line bg-surface-raised px-4 py-3 text-[0.9375rem] text-ivory transition-colors focus:border-champagne-dim focus:outline-none"
    >
      {children}
    </select>
  );
}
