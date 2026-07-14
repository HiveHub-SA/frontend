/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "surface": "#f9f9f9",
        "surface-tint": "#7e5700",
        "outline": "#847560",
        "primary": "#7e5700",
        "inverse-primary": "#ffba38",
        "tertiary-fixed-dim": "#8dcdff",
        "on-secondary": "#ffffff",
        "outline-variant": "#d6c4ac",
        "on-tertiary-fixed-variant": "#004b70",
        "on-tertiary-fixed": "#001e30",
        "tertiary": "#006493",
        "on-secondary-container": "#623300",
        "background": "#f9f9f9",
        "secondary-container": "#ff8f06",
        "primary-fixed-dim": "#ffba38",
        "on-surface": "#1a1c1c",
        "surface-dim": "#dadada",
        "secondary-fixed-dim": "#ffb77b",
        "surface-variant": "#e2e2e2",
        "on-primary-fixed": "#281900",
        "inverse-surface": "#2f3131",
        "surface-container-low": "#f3f3f3",
        "tertiary-fixed": "#cae6ff",
        "error": "#ba1a1a",
        "on-tertiary-container": "#00547c",
        "tertiary-container": "#80c9ff",
        "secondary-fixed": "#ffdcc2",
        "surface-container-high": "#e8e8e8",
        "on-secondary-fixed": "#2e1500",
        "inverse-on-surface": "#f1f1f1",
        "surface-bright": "#f9f9f9",
        "on-primary": "#ffffff",
        "primary-fixed": "#ffdeac",
        "on-primary-fixed-variant": "#604100",
        "on-secondary-fixed-variant": "#6d3a00",
        "error-container": "#ffdad6",
        "on-primary-container": "#6b4900",
        "primary-container": "#ffb300",
        "on-error-container": "#93000a",
        "surface-container-lowest": "#ffffff",
        "surface-container-highest": "#e2e2e2",
        "secondary": "#8f4e00",
        "on-error": "#ffffff",
        "on-background": "#1a1c1c",
        "on-tertiary": "#ffffff",
        "surface-container": "#eeeeee",
        "on-surface-variant": "#514532"
      },
      borderRadius: {
        "DEFAULT": "1rem",
        "lg": "2rem",
        "xl": "3rem",
        "full": "9999px"
      },
      spacing: {
        "xs": "4px",
        "margin": "20px",
        "sm": "12px",
        "md": "20px",
        "gutter": "16px",
        "xl": "48px",
        "base": "8px",
        "lg": "32px"
      },
      fontFamily: {
        "body-lg": ["Nunito Sans"],
        "headline-md": ["Quicksand"],
        "body-md": ["Nunito Sans"],
        "label-sm": ["Quicksand"],
        "label-lg": ["Quicksand"],
        "headline-lg": ["Quicksand"],
        "headline-sm": ["Quicksand"]
      },
      fontSize: {
        "body-lg": ["18px", { "lineHeight": "26px", "fontWeight": "500" }],
        "headline-md": ["24px", { "lineHeight": "32px", "fontWeight": "700" }],
        "body-md": ["16px", { "lineHeight": "24px", "fontWeight": "400" }],
        "label-sm": ["12px", { "lineHeight": "16px", "letterSpacing": "1px", "fontWeight": "700" }],
        "label-lg": ["16px", { "lineHeight": "20px", "letterSpacing": "0.5px", "fontWeight": "700" }],
        "headline-lg": ["32px", { "lineHeight": "40px", "fontWeight": "700" }],
        "headline-sm": ["20px", { "lineHeight": "28px", "fontWeight": "700" }]
      }
    }
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries'),
  ],
}
