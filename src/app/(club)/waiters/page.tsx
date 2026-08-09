import { Container } from "@/components/layout/container";
import { WaiterGallery } from "@/components/waiter/waiter-gallery";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata() {
  return { title: (await getT())("waiterGallery.metaTitle") };
}

export default async function WaitersPage() {
  const t = await getT();

  return (
    <Container className="py-16 sm:py-20">
      <div className="max-w-2xl">
        <p className="label-caps">{t("waiterGallery.eyebrow")}</p>
        <h1 className="mt-4 font-display text-4xl leading-tight break-keep text-ivory sm:text-5xl">
          {t("waiterGallery.titleLine1")}
          <span className="text-champagne">
            {t("waiterGallery.titleAccent")}
          </span>
          {t("waiterGallery.titleLine1Tail")}
          <br />
          {t("waiterGallery.titleLine2")}
        </h1>
        <p className="mt-5 text-[1.0625rem] leading-relaxed break-keep text-muted">
          {t("waiterGallery.intro")}
        </p>
      </div>

      <WaiterGallery />
    </Container>
  );
}
