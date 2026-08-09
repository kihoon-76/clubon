/**
 * 사전은 한국어(기준)와 같은 모양이되 **부분적으로만 채워도** 됩니다.
 *
 * 언어를 열어 두고 사전은 차차 채우는 방식이라, 빠진 키는 타입 오류가 아니라
 * 폴백으로 다뤄야 합니다. 채운 키는 오타를 잡아 주고, 안 채운 키는 영어로
 * 떨어집니다.
 */
export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

/** `t()`에 넘기는 치환값. `{이름}` 자리에 그대로 들어갑니다. */
export type TranslateVars = Record<string, string | number>;

/** 문구를 찾아 주는 함수. 서버·클라이언트가 같은 모양을 씁니다. */
export type Translate = (key: string, vars?: TranslateVars) => string;
