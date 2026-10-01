/* =========================================================
   POWERPOINT STUDIO
   Browser-based PowerPoint Generator
========================================================= */

const input = document.getElementById("contentInput");
const previewArea = document.getElementById("previewArea");

const slideCount = document.getElementById("slideCount");

const titleInput = document.getElementById("presentationTitle");
const fileNameInput = document.getElementById("fileName");

const themeInput = document.getElementById("theme");
const layoutInput = document.getElementById("layout");

const generateBtn = document.getElementById("generateBtn");
const clearBtn = document.getElementById("clearBtn");

const toast = document.getElementById("toast");
const toastText = document.getElementById("toastText");


/* =========================================================
   TOAST
========================================================= */

function showToast(message) {

    toastText.textContent = message;

    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}


/* =========================================================
   PERSIAN DIGITS
========================================================= */

function normalizeDigits(text) {

    const persian = "۰۱۲۳۴۵۶۷۸۹";
    const arabic = "٠١٢٣٤٥٦٧٨٩";

    return text
        .replace(/[۰-۹]/g, d => persian.indexOf(d))
        .replace(/[٠-٩]/g, d => arabic.indexOf(d));
}


/* =========================================================
   PARSE SLIDES
========================================================= */

function parseSlides(text) {

    text = text.trim();

    if (!text) {
        return [];
    }

    const normalized = normalizeDigits(text);

    /*
        Supported:

        [اسلاید ۱]
        [اسلاید 1]
        اسلاید ۱
        اسلاید 1
    */

    const markerRegex =
        /(?:^|\n)\s*\[?\s*اسلاید\s*\d+\s*\]?\s*(?=\n|$)/gi;

    const matches = [...normalized.matchAll(markerRegex)];


    /* -----------------------------------------------------
       MANUAL SLIDES
    ----------------------------------------------------- */

    if (matches.length > 0) {

        const slides = [];

        for (let i = 0; i < matches.length; i++) {

            const start =
                matches[i].index + matches[i][0].length;

            const end =
                i + 1 < matches.length
                    ? matches[i + 1].index
                    : normalized.length;

            const block =
                normalized
                    .substring(start, end)
                    .trim();

            if (!block) continue;

            const lines =
                block
                    .split("\n")
                    .map(x => x.trim())
                    .filter(Boolean);

            let title = lines[0] || `اسلاید ${i + 1}`;

            let body =
                lines
                    .slice(1)
                    .join("\n");

            slides.push({
                title,
                body
            });
        }

        return slides;
    }


    /* -----------------------------------------------------
       AUTOMATIC MODE
    ----------------------------------------------------- */

    const blocks =
        normalized
            .split(/\n\s*\n+/)
            .map(x => x.trim())
            .filter(Boolean);


    if (blocks.length > 1) {

        return blocks.map((block, index) => {

            const lines =
                block
                    .split("\n")
                    .map(x => x.trim())
                    .filter(Boolean);

            return {
                title: lines[0] || `اسلاید ${index + 1}`,
                body: lines.slice(1).join("\n")
            };

        });

    }


    /* -----------------------------------------------------
       LONG TEXT AUTO SPLIT
    ----------------------------------------------------- */

    const lines =
        normalized
            .split("\n")
            .map(x => x.trim())
            .filter(Boolean);

    const chunkSize = 6;

    const slides = [];

    for (let i = 0; i < lines.length; i += chunkSize) {

        const chunk =
            lines.slice(i, i + chunkSize);

        slides.push({
            title: chunk[0] || `اسلاید ${slides.length + 1}`,
            body: chunk.slice(1).join("\n")
        });

    }

    return slides;
}


/* =========================================================
   THEME
========================================================= */

function getTheme(theme) {

    const themes = {

        dark: {
            bg: "111827",
            accent: "6C63FF",
            accent2: "8B5CF6",
            title: "FFFFFF",
            text: "D8DEEA",
            muted: "8E9BB3"
        },

        blue: {
            bg: "0B2844",
            accent: "19A7CE",
            accent2: "146C94",
            title: "FFFFFF",
            text: "D9F0FF",
            muted: "9CC7DF"
        },

        purple: {
            bg: "24123D",
            accent: "A855F7",
            accent2: "7C3AED",
            title: "FFFFFF",
            text: "E9D5FF",
            muted: "C4B5FD"
        },

        clean: {
            bg: "F4F6FA",
            accent: "4F46E5",
            accent2: "6366F1",
            title: "111827",
            text: "374151",
            muted: "6B7280"
        }

    };

    return themes[theme] || themes.dark;
}


/* =========================================================
   PREVIEW
========================================================= */

function updatePreview() {

    const slides =
        parseSlides(input.value);

    slideCount.textContent =
        slides.length;


    if (slides.length === 0) {

        previewArea.innerHTML = `
            <div class="empty-preview">

                <div class="empty-icon">
                    📊
                </div>

                <h3>هنوز اسلایدی ساخته نشده</h3>

                <p>
                    متن خودت را وارد کن تا پیش‌نمایش اینجا نمایش داده شود.
                </p>

            </div>
        `;

        return;
    }


    const theme =
        themeInput.value;


    previewArea.innerHTML =
        slides.map((slide, index) => {

            const safeTitle =
                escapeHTML(slide.title);

            const safeBody =
                escapeHTML(slide.body);

            return `
                <div class="preview-slide theme-${theme}">

                    <div class="preview-number">
                        ${index + 1}
                    </div>

                    <div class="preview-title">
                        ${safeTitle}
                    </div>

                    <div class="preview-text">
                        ${safeBody}
                    </div>

                </div>
            `;

        }).join("");
}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(text) {

    return text
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


/* =========================================================
   PPTX GENERATOR
========================================================= */

async function generatePowerPoint() {

    const text =
        input.value.trim();

    if (!text) {

        showToast("اول متن ارائه را وارد کن!");

        return;
    }


    const slides =
        parseSlides(text);

    if (slides.length === 0) {

        showToast("متنی برای ساخت پاورپوینت پیدا نشد.");

        return;
    }


    generateBtn.disabled = true;

    generateBtn.innerHTML =
        "⏳ در حال ساخت...";


    try {

        const pptx =
            new PptxGenJS();


        /* ---------------------------------------------
           SETTINGS
        --------------------------------------------- */

        pptx.layout =
            layoutInput.value;

        pptx.author =
            "PowerPoint Studio";

        pptx.company =
            "PowerPoint Studio";

        pptx.subject =
            titleInput.value || "Presentation";

        pptx.title =
            titleInput.value || "PowerPoint Studio";

        pptx.lang =
            "fa-IR";

        pptx.theme = {

            headFontFace: "Arial",
            bodyFontFace: "Arial",
            lang: "fa-IR"

        };


        const theme =
            getTheme(themeInput.value);


        /* ---------------------------------------------
           SLIDES
        --------------------------------------------- */

        slides.forEach((data, index) => {

            const slide =
                pptx.addSlide();


            slide.background = {
                color: theme.bg
            };


            /* -----------------------------------------
               TOP ACCENT
            ----------------------------------------- */

            slide.addShape(
                pptx.ShapeType.rect,
                {
                    x: 0,
                    y: 0,
                    w: 13.333,
                    h: 0.12,

                    line: {
                        color: theme.accent,
                        transparency: 100
                    },

                    fill: {
                        color: theme.accent
                    }
                }
            );


            /* -----------------------------------------
               DECORATIVE CIRCLE
            ----------------------------------------- */

            slide.addShape(
                pptx.ShapeType.ellipse,
                {
                    x: -0.7,
                    y: -0.5,
                    w: 2.1,
                    h: 2.1,

                    line: {
                        color: theme.accent,
                        transparency: 100
                    },

                    fill: {
                        color: theme.accent,
                        transparency: 80
                    }
                }
            );


            /* -----------------------------------------
               SLIDE NUMBER
            ----------------------------------------- */

            slide.addText(
                String(index + 1),
                {
                    x: 11.9,
                    y: 0.4,
                    w: 0.7,
                    h: 0.35,

                    fontFace: "Arial",
                    fontSize: 11,

                    bold: true,

                    color: theme.muted,

                    align: "right",
                    rtlMode: true,

                    margin: 0
                }
            );


            /* -----------------------------------------
               TITLE
            ----------------------------------------- */

            slide.addText(
                data.title || `اسلاید ${index + 1}`,
                {
                    x: 0.7,
                    y: 1.15,
                    w: 11.9,
                    h: 0.8,

                    fontFace: "Arial",

                    fontSize: 27,

                    bold: true,

                    color: theme.title,

                    align: "right",

                    valign: "mid",

                    rtlMode: true,

                    margin: 0.05,

                    breakLine: false,

                    fit: "shrink"
                }
            );


            /* -----------------------------------------
               ACCENT LINE
            ----------------------------------------- */

            slide.addShape(
                pptx.ShapeType.roundRect,
                {
                    x: 9.8,
                    y: 2.08,
                    w: 2.8,
                    h: 0.08,

                    rectRadius: 0.04,

                    line: {
                        color: theme.accent,
                        transparency: 100
                    },

                    fill: {
                        color: theme.accent
                    }
                }
            );


            /* -----------------------------------------
               BODY
            ----------------------------------------- */

            let body =
                data.body || "";


            /*
                Convert normal newlines into readable
                paragraph spacing.
            */

            body =
                body
                    .replace(/\r/g, "")
                    .split("\n")
                    .map(line => {

                        const trimmed =
                            line.trim();

                        if (!trimmed) {
                            return "";
                        }

                        return "• " + trimmed;

                    })
                    .join("\n");


            slide.addText(
                body,
                {
                    x: 0.8,
                    y: 2.45,
                    w: 11.7,
                    h: 3.8,

                    fontFace: "Arial",

                    fontSize: 17,

                    color: theme.text,

                    align: "right",

                    valign: "top",

                    rtlMode: true,

                    breakLine: false,

                    margin: 0.08,

                    fit: "shrink",

                    paraSpaceAfterPt: 12,

                    breakLineOnOverflow: false
                }
            );


            /* -----------------------------------------
               FOOTER
            ----------------------------------------- */

            slide.addText(
                "PowerPoint Studio",
                {
                    x: 0.7,
                    y: 7.05,
                    w: 3,
                    h: 0.25,

                    fontFace: "Arial",

                    fontSize: 8,

                    color: theme.muted,

                    margin: 0
                }
            );


            slide.addText(
                `${index + 1} / ${slides.length}`,
                {
                    x: 11,
                    y: 7.05,
                    w: 1.6,
                    h: 0.25,

                    fontFace: "Arial",

                    fontSize: 8,

                    color: theme.muted,

                    align: "right",

                    margin: 0
                }
            );

        });


        /* ---------------------------------------------
           DOWNLOAD
        --------------------------------------------- */

        let filename =
            fileNameInput.value.trim();


        if (!filename) {
            filename = "PowerPoint_Studio";
        }


        if (!filename.toLowerCase().endsWith(".pptx")) {
            filename += ".pptx";
        }


        await pptx.writeFile({
            fileName: filename
        });


        showToast(
            `پاورپوینت با ${slides.length} اسلاید ساخته شد 🎉`
        );

    }

    catch (error) {

        console.error(error);

        showToast(
            "خطا در ساخت پاورپوینت ❌"
        );

    }

    finally {

        generateBtn.disabled = false;

        generateBtn.innerHTML =
            "<span>🚀</span> ساخت پاورپوینت";
    }
}


/* =========================================================
   EVENTS
========================================================= */

input.addEventListener(
    "input",
    updatePreview
);


themeInput.addEventListener(
    "change",
    updatePreview
);


generateBtn.addEventListener(
    "click",
    generatePowerPoint
);


clearBtn.addEventListener(
    "click",
    () => {

        input.value = "";

        titleInput.value =
            "PowerPoint Studio";

        fileNameInput.value =
            "PowerPoint_Studio";

        updatePreview();

        showToast(
            "محتوا پاک شد 🗑️"
        );
    }
);


/* =========================================================
   SAMPLE CONTENT
========================================================= */

input.value =
`[اسلاید ۱]

شغل پزشکی

پزشکی یکی از مهم‌ترین و مسئولیت‌پذیرترین حرفه‌های جامعه است.
پزشکان برای حفظ سلامت انسان‌ها تلاش می‌کنند.

[اسلاید ۲]

چگونه پزشک شویم؟

برای پزشک شدن ابتدا باید در مدرسه درس‌های مهمی مانند علوم و ریاضی را به خوبی یاد گرفت.
سپس فرد می‌تواند وارد مسیر تحصیل پزشکی شود.

[اسلاید ۳]

دانشگاه

دانشجوی پزشکی چندین سال در دانشگاه تحصیل می‌کند.
در این مسیر با علوم پایه، بیماری‌ها و روش‌های درمان آشنا می‌شود.

[اسلاید ۴]

آینده پزشکی

فناوری‌های جدید مانند هوش مصنوعی و تجهیزات پزشکی پیشرفته می‌توانند به پزشکان کمک کنند.
`;

updatePreview();
