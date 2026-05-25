const fs = require("fs");
const os = require("os");
const path = require("path");
const sharp = require(path.join(os.tmpdir(), "amelia-image-tools", "node_modules", "sharp"));

const conversions = [
    ["assets/img/struct-slider/structslider1.png", "assets/img/struct-slider/structslider1.webp"],
    ["assets/img/struct-slider/structslider2.png", "assets/img/struct-slider/structslider2.webp"],
    ["assets/img/struct-slider/structslider3.png", "assets/img/struct-slider/structslider3.webp"],
    ["assets/img/struct-slider/stuctslider4.jpg", "assets/img/struct-slider/stuctslider4.webp"],
    ["assets/img/struct-slider/structslider5.png", "assets/img/struct-slider/structslider5.webp"],
    ["assets/img/struct-slider/structslider6.jpg", "assets/img/struct-slider/structslider6.webp"],
    [
        "assets/img/Differentiation Banner/89913c4de3bacd517a6920d106fe6f7082f9f0a4.jpg",
        "assets/img/Differentiation Banner/89913c4de3bacd517a6920d106fe6f7082f9f0a4.webp"
    ]
];

const mb = (bytes) => `${(bytes / 1024 / 1024).toFixed(2)} MB`;

(async () => {
    const results = [];

    for (const [source, target] of conversions) {
        await sharp(source)
            .resize({ width: 2560, height: 2560, fit: "inside", withoutEnlargement: true })
            .webp({ quality: 84, effort: 6, smartSubsample: true })
            .toFile(target);

        const sourceBytes = fs.statSync(source).size;
        const targetBytes = fs.statSync(target).size;
        results.push({ source, target, sourceBytes, targetBytes });
    }

    results.forEach(({ source, target, sourceBytes, targetBytes }) => {
        const useTarget = targetBytes < sourceBytes;
        console.log(`${useTarget ? "USE" : "KEEP SOURCE"} ${source} -> ${target}: ${mb(sourceBytes)} -> ${mb(targetBytes)}`);
    });
})();
