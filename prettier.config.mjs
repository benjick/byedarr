/** @type {import('prettier').Config & import('prettier-plugin-tailwindcss').options} */
const config = {
  plugins: [
    "@trivago/prettier-plugin-sort-imports",
    // "prettier-plugin-tailwindcss", // must be last: https://github.com/tailwindlabs/prettier-plugin-tailwindcss#compatibility-with-other-prettier-plugins
  ],
  importOrder: [
    // this comment is only here to force the array to be multi-line
    "^@/.*$",
    "^[./]",
  ],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
  tabWidth: 2,
  useTabs: false,
};

export default config;

