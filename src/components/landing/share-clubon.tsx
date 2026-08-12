"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Check, Copy, Share2 } from "lucide-react";
import QRCode from "qrcode";

import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n/client";

const SHARE_URL = "https://www.club-on.app/";

export function ShareClubOn() {
  const t = useT();
  const [qrCode, setQrCode] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    void QRCode.toDataURL(SHARE_URL, {
      width: 320,
      margin: 2,
      color: { dark: "#0b0b0cff", light: "#f4f1eaff" },
      errorCorrectionLevel: "H",
    }).then(setQrCode);
  }, []);

  async function copyLink() {
    await navigator.clipboard.writeText(SHARE_URL);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  async function shareLink() {
    if (navigator.share) {
      await navigator.share({
        title: "ClubOn",
        text: t("landing.shareText"),
        url: SHARE_URL,
      });
      return;
    }
    await copyLink();
  }

  return (
    <section className="border-b border-line/70 bg-surface/30">
      <Container className="py-16 sm:py-20">
        <div className="overflow-hidden rounded-[var(--radius-card)] border border-champagne-dim/35 bg-surface-raised shadow-[0_20px_70px_rgba(0,0,0,0.35)]">
          <div className="grid lg:grid-cols-[1fr_auto]">
            <div className="p-5 sm:p-8 lg:p-10">
              <p className="label-caps">{t("landing.shareEyebrow")}</p>
              <h2 className="mt-4 max-w-xl font-display text-[1.8rem] leading-tight break-keep text-ivory sm:text-4xl">
                {t("landing.shareTitle")}
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-relaxed break-keep text-muted sm:text-base">
                {t("landing.shareBody")}
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Button type="button" onClick={shareLink} className="w-full sm:w-auto">
                  <Share2 aria-hidden className="size-4" />
                  {t("landing.shareButton")}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={copyLink}
                  className="w-full sm:w-auto"
                >
                  {copied ? (
                    <Check aria-hidden className="size-4 text-success" />
                  ) : (
                    <Copy aria-hidden className="size-4" />
                  )}
                  {copied ? t("landing.shareCopied") : t("landing.shareCopy")}
                </Button>
              </div>

              <p className="mt-4 font-mono text-xs tracking-wide text-faint">
                club-on.app
              </p>
            </div>

            <div className="flex items-center justify-center border-t border-line bg-ivory p-6 lg:border-t-0 lg:border-l lg:p-8">
              {qrCode ? (
                <Image
                  src={qrCode}
                  alt={t("landing.shareQrAlt")}
                  width={220}
                  height={220}
                  unoptimized
                  className="size-44 sm:size-52"
                />
              ) : (
                <div className="size-44 animate-pulse rounded-xl bg-line sm:size-52" />
              )}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
