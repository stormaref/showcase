import { ImageResponse } from "next/og";

export const socialImageSize = { width: 1200, height: 630 };
export const socialImageContentType = "image/png";

type SocialImageProps = {
  title: string;
  tagline: string;
  locale: string;
};

export function renderSocialImage({ title, tagline, locale }: SocialImageProps) {
  const isRtl = locale === "fa";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px",
          background: "#fbfaf7",
          direction: isRtl ? "rtl" : "ltr",
        }}
      >
        <div
          style={{
            fontSize: 24,
            fontWeight: 600,
            color: "#171310",
            textTransform: "uppercase",
            letterSpacing: isRtl ? 0 : "0.35em",
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: 58,
            fontWeight: 300,
            color: "#171310",
            lineHeight: 1.15,
            letterSpacing: isRtl ? 0 : "-0.02em",
            maxWidth: "900px",
          }}
        >
          {tagline}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <div style={{ width: "160px", height: "1px", background: "#c9c5ba" }} />
          <div style={{ width: "14px", height: "14px", background: "#a5471d" }} />
        </div>
      </div>
    ),
    { ...socialImageSize },
  );
}
