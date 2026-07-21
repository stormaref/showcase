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
          background: "linear-gradient(145deg, #221611 0%, #2e1c12 55%, #45231a 100%)",
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
              "radial-gradient(circle at 80% 10%, rgba(176, 66, 28, 0.45) 0%, transparent 55%), radial-gradient(circle at 15% 90%, rgba(201, 134, 43, 0.25) 0%, transparent 45%)",
          }}
        />
        {/* Kiln arches */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            right: isRtl ? undefined : "70px",
            left: isRtl ? "70px" : undefined,
            display: "flex",
            alignItems: "flex-end",
            gap: "18px",
          }}
        >
          <div
            style={{
              width: "90px",
              height: "180px",
              borderRadius: "45px 45px 0 0",
              background: "linear-gradient(180deg, #c9862b, #b0421c)",
              opacity: 0.9,
            }}
          />
          <div
            style={{
              width: "120px",
              height: "260px",
              borderRadius: "60px 60px 0 0",
              background: "linear-gradient(180deg, #b0421c, #8c3113)",
            }}
          />
          <div
            style={{
              width: "100px",
              height: "210px",
              borderRadius: "50px 50px 0 0",
              background: "rgba(247, 239, 227, 0.12)",
              border: "1px solid rgba(247, 239, 227, 0.3)",
            }}
          />
        </div>
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
              height: "5px",
              background: "linear-gradient(90deg, #b0421c, #c9862b)",
              borderRadius: "3px",
            }}
          />
          <div
            style={{
              fontSize: 72,
              fontWeight: 600,
              color: "#f7efe3",
              lineHeight: 1.1,
              letterSpacing: isRtl ? 0 : "-0.02em",
              maxWidth: "820px",
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: 32,
              color: "#d8c3ab",
              lineHeight: 1.4,
              maxWidth: "760px",
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
