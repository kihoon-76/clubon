import { Container } from "@/components/layout/container";
import { WaiterGallery } from "@/components/waiter/waiter-gallery";

export const metadata = { title: "AI 라운지 매니저 선택" };

export default function WaitersPage() {
  return (
    <Container className="py-16 sm:py-20">
      <div className="max-w-2xl">
        <p className="label-caps">AI 라운지 매니저</p>
        <h1 className="mt-4 font-display text-4xl leading-tight break-keep text-ivory sm:text-5xl">
          오늘 저녁,
          <span className="text-champagne"> 어떤 매니저</span>에게
          <br />
          자리를 맡기시겠어요?
        </h1>
        <p className="mt-5 text-[1.0625rem] leading-relaxed break-keep text-muted">
          유럽 귀족가의 품격에 저마다의 개성을 더한 열 명의 라운지 매니저입니다.
          카드를 눌러 각 매니저의 장점과 특징, 개성을 확인하고 마음에 드는 이를
          선택하세요.
        </p>
      </div>

      <WaiterGallery />
    </Container>
  );
}
