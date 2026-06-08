import "./globals.css";

export const metadata = {
  title: "FitShare | 초등학교 스마트 의류 나눔 & 재활용 옷장",
  description: "작아져서 입지 못하는 교복, 체육복, 아동용 의류를 스마트폰 카메라로 쉽고 정확하게 실측하고, 필요로 하는 이웃 자녀에게 나누는 따뜻한 자원 절약 플랫폼입니다.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>
        {children}
      </body>
    </html>
  );
}
