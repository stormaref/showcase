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
          justifyContent: "center",
          padding: "80px",
          background: "linear-gradient(145deg, #1c1917 0%, #292524 45%, #44403c 100%)",
          direction: isRtl ? "rtl" : "ltr",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              "radial-gradient(circle at 20% 80%, rgba(168, 162, 158, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(214, 211, 209, 0.1) 0%, transparent 40%)",
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "24px",
            position: "relative",
          }}
        >
          <div
            style={{
              width: "64px",
              height: "4px",
              background: "#d6d3d1",
              borderRadius: "2px",
            }}
          />
          <div
            style={{
              fontSize: 72,
              fontWeight: 600,
              color: "#fafaf9",
              lineHeight: 1.1,
              letterSpacing: isRtl ? 0 : "-0.02em",
              maxWidth: "900px",
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: 32,
              color: "#a8a29e",
              lineHeight: 1.4,
              maxWidth: "800px",
            }}
          >
            {tagline}
          </div>
        </div>
      </div>
    ),
    { ...socialImageSize },
  );
}
