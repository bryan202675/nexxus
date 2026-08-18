const Color = require("colorjs.io").default;

const oklchColors = [
  'oklch(19% 0.018 290)', 'oklch(23% 0.022 292)', 'oklch(31% 0.03 292)',
  'oklch(95% 0.008 290)', 'oklch(68% 0.018 290)', 'oklch(16% 0.018 290)',
  'oklch(32% 0.09 296)', 'oklch(86% 0.05 296)', 'oklch(33% 0.10 296)',
  'oklch(88% 0.05 296)', 'oklch(27% 0.02 292)', 'oklch(25% 0.02 292)',
  'oklch(78% 0.02 290)', 'oklch(97.5% 0.008 290)', '#ffffff', 'oklch(92% 0.012 290)',
  'oklch(22% 0.03 290)', 'oklch(50% 0.02 290)', 'oklch(94% 0.035 296)',
  'oklch(42% 0.19 296)', 'oklch(94% 0.04 296)', 'oklch(42% 0.20 296)',
  'oklch(45% 0.02 290)',
  // Extra gradients/colors from html:
  'oklch(45% 0.20 296)', 'oklch(38% 0.20 296)', 'oklch(70% 0.03 290)',
  'oklch(56% 0.22 300)', 'oklch(64% 0.17 322)', 'oklch(56% 0.19 296)',
  'oklch(48% 0.20 300)', 'oklch(58% 0.19 318)', 'oklch(64% 0.15 330)',
  'oklch(58% 0.19 302)', 'oklch(72% 0.10 302)', 'oklch(80% 0.06 296)',
  'oklch(62% 0.16 296)', 'oklch(48% 0.20 305)', 'oklch(62% 0.16 288)',
  'oklch(52% 0.19 300)', 'oklch(52% 0.19 300)'
];

const res = {};
for (const color of oklchColors) {
    if (color === '#ffffff') continue;
    try {
        let c = new Color(color);
        res[color] = c.to('srgb').toString({format: "hex"});
    } catch(e) {
        console.error(e);
    }
}
console.log(JSON.stringify(res, null, 2));
