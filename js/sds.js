let menu = [];
let headingIdCounter = 0;
let translated = false
const urlParams = new URLSearchParams(window.location.search);

//Get query param and load compound.
document.addEventListener('DOMContentLoaded', function () {
    const query = urlParams.get('q');
    if (query) {
        const inputField = document.getElementById("chemical_name");
        if (inputField) {
            inputField.value = decodeURIComponent(query);
            loadCompound();
        }
    }
});

//Handle enter press event on chemical name input.
var chemical_name_input = document.getElementById("chemical_name");
if (chemical_name_input) {
    chemical_name_input.addEventListener("keypress", function (event) {
        if (event.key === "Enter") {
            event.preventDefault();
            loadCompound();
        }
    });
}

//Handle submit button
if (document.getElementById("chemical_search_btn")) {
    var chemical_search_btn = document.getElementById("chemical_search_btn");
    chemical_search_btn.addEventListener('click', () => {
        loadCompound()
    });
}

function updateQuery(query) {
    const printCommand = urlParams.get('print');
    const translateCommand = urlParams.get('translate');
    if (!printCommand && !translateCommand) {
        window.history.pushState({}, "", "?q=" + encodeURIComponent(query));
    }
}

async function loadCompound() {
    const result = document.getElementById("result");
    const menuList = document.getElementById("menuList");
    const name = document.getElementById("chemical_name").value.trim();

    if (document.getElementById("menuElement")) {
        document.getElementById("menuElement").style.display = "block"
    }

    //Dynamically update query param.
    updateQuery(name);

    if (result) {
        result.innerHTML = "";
    }
    if (menuList) {
        menuList.innerHTML = "";
    }
    menu = [];
    headingIdCounter = 0;
    translated = false;
    acc = "";

    if (!name && result) {
        result.innerHTML = `<p class="error">โปรดกรอกชื่อสารเคมีเป็นภาษาอังกฤษ หรือ CAS Number หรือ สูตรเคมี เช่น CH3CH3NH2.</p>`;
        return;
    }

    try {
        if (result) {
            result.innerHTML = `<p class="loading">กำลังค้นหา CID จาก PubChem...</p>`;
        }

        const cidRes = await fetch(
            `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(name)}/cids/JSON`
        );
        if (!cidRes.ok) throw new Error("พบปัญหาในการค้นหา CID");

        const cidJson = await cidRes.json();
        const cid = cidJson?.IdentifierList?.CID?.[0];
        if (!cid) throw new Error("ไม่พบผลการค้นหา CID");

        if (result) {
            result.innerHTML = `<p class="loading">Loading full compound record for CID ${cid}...</p>`;
        }

        const recordRes = await fetch(
            `https://pubchem.ncbi.nlm.nih.gov/rest/pug_view/data/compound/${cid}/JSON/?response_type=display`
        );
        if (!recordRes.ok) throw new Error("พบปัญหาในการดึงข้อมูลจาก PubChem");

        const data = await recordRes.json();
        const isOfficial = urlParams.get('official') === "yes";

        if (isOfficial) {
            const record = data?.Record;
            const sdsData = buildSdsData(record);
            urlParams.set('translate', 'yes') //Set translate to yes if printing official document.

            populatePrintSds(sdsData, record);

            document.getElementById("composition_table").innerHTML =
                renderCompositionTable(sdsData);
        } else {
            renderRecord(data, result);
        }

        //Check and add onclick attribute.
        if (document.getElementById('translateBtn')) {
            if (!document.getElementById('translateBtn').hasAttribute('onclick')) {
                document.getElementById('translateBtn').setAttribute("onclick", "setTimeout(triggerTranslateEnglishThenThai, 1000)");
            }
        }
        if (document.getElementById('printPageBtn')) {
            if (!document.getElementById('printPageBtn').hasAttribute('onclick')) {
                document.getElementById('printPageBtn').setAttribute("onclick", "printPage()");
            }
        }
        if (document.getElementById('officialPrintPageBtn')) {
            if (!document.getElementById('officialPrintPageBtn').hasAttribute('onclick')) {
                document.getElementById('officialPrintPageBtn').setAttribute("onclick", "officialPrintPage()");
            }
        }
    } catch (err) {
        console.error(err);
        if (result) {
            result.innerHTML = `<p class="error">${escapeHtml(err.message)}</p>`;
        }
    }
}

function renderRecord(data, container) {
    const record = data?.Record;
    if (!record && container) {
        container.innerHTML = `<p class="error">ไม่พบข้อมูลสารเคมีดังกล่าว โปรดตรวจสอบความถูกต้องอีกครั้ง</p>`;
        return;
    }

    const header = document.createElement("div");
    header.className = "section";
    header.innerHTML = `
        <h2>${escapeHtml(record.RecordTitle || "Untitled")}</h2>
        <div class="meta">
          Record Type: ${escapeHtml(record.RecordType || "")}<br>
          CID: ${escapeHtml(String(record.RecordNumber || ""))}
        </div>
      `;
    if (container) {
        container.innerHTML = "";
        container.setAttribute("lang", "en");
        container.appendChild(header);

        (record.Section || []).forEach(section => {
            container.appendChild(renderSection(section, 2));
        });
    }

    createMenu();
}

function renderSection(section, level = 2) {
    const wrap = document.createElement("div");
    wrap.className = "section";

    const title = section.TOCHeading || section.Name || "Section";
    const headingTag = `h${Math.min(level, 6)}`;
    const heading = document.createElement(headingTag);

    const safeId = makeSafeId(title);
    heading.textContent = title;
    heading.id = safeId;

    menu.push({
        id: safeId,
        title: title,
        level: Math.min(level, 6)
    });

    wrap.appendChild(heading);

    if (section.Description) {
        const desc = document.createElement("p");
        desc.className = "meta";
        desc.textContent = section.Description;
        wrap.appendChild(desc);
    }

    if (section.URL) {
        const link = document.createElement("p");
        link.innerHTML = `<a href="${escapeAttr(section.URL)}" target="_blank" rel="noopener noreferrer">${escapeHtml(section.URL)}</a>`;
        wrap.appendChild(link);
    }

    if (Array.isArray(section.Information) && section.Information.length) {
        const infoBlock = document.createElement("div");
        section.Information.forEach(info => {
            infoBlock.appendChild(renderInformation(info));
        });
        wrap.appendChild(infoBlock);
    }

    if (Array.isArray(section.Section) && section.Section.length) {
        section.Section.forEach(sub => {
            wrap.appendChild(renderSection(sub, level + 1));
        });
    }

    return wrap;
}

function renderInformation(info) {
    const div = document.createElement("div");
    div.className = "info";

    if (info.Name) {
        const label = document.createElement("div");
        label.className = "label";
        label.textContent = info.Name;
        div.appendChild(label);
    }

    if (info.Description) {
        const desc = document.createElement("div");
        desc.className = "meta";
        desc.textContent = info.Description;
        div.appendChild(desc);
    }

    if (info.URL) {
        const p = document.createElement("p");
        p.innerHTML = `<a href="${escapeAttr(info.URL)}" target="_blank" rel="noopener noreferrer">${escapeHtml(info.URL)}</a>`;
        div.appendChild(p);
    }

    if (Array.isArray(info.Reference) && info.Reference.length) {
        const ul = document.createElement("ul");

        info.Reference.forEach(ref => {
            const li = document.createElement("li");
            li.textContent = ref;
            ul.appendChild(li);
        });

        if (!urlParams.get('print')) {
            const details = document.createElement("details");
            details.innerHTML = `<summary>References (${info.Reference.length})</summary>`;

            details.appendChild(ul);
            div.appendChild(details);
        } else {
            const details = document.createElement("div");
            details.innerHTML = `<p>References (${info.Reference.length})</p>`;

            details.appendChild(ul);
            div.appendChild(details);
        }

    }

    if (info.Value) {
        let valueNode;

        // กลุ่ม hazard classification ใช้ renderer พิเศษ
        if (isHazardInfo(info.Name)) {
            valueNode = renderHazardValue(info);
        }

        // fallback ปกติ
        if (!valueNode) {
            valueNode = renderValue(info.Value);
        }

        // inline layout สำหรับค่ามาตรฐาน
        if (
            info.Name === "Standard non-polar" ||
            info.Name === "Semi-standard non-polar" ||
            info.Name === "Standard polar"
        ) {
            valueNode.classList.add("stay-inline");
        }

        div.appendChild(valueNode);
    }
    return div;
}

function isHazardInfo(name = "") {
    return [
        "Pictogram(s)",
        "Signal",
        "GHS Hazard Statements",
        "Precautionary Statement Codes",
        "Note",
        "NFPA 704 Diamond",
        "NFPA Health Rating",
        "NFPA Fire Rating",
        "NFPA Instability Rating",
        "NFPA Special Hazard"
    ].includes(name);
}

function renderHazardValue(info) {
    const value = info?.Value;
    if (!value) return null;

    const wrap = document.createElement("div");
    wrap.className = "hazard-value";

    // 1) pictogram / icon
    if (Array.isArray(value.StringWithMarkup)) {
        for (const item of value.StringWithMarkup) {
            const markup = Array.isArray(item?.Markup) ? item.Markup : [];
            const icons = markup.filter(m => m?.URL && m?.Type === "Icon");

            if (icons.length) {
                const row = document.createElement("div");
                row.className = "hazard-icon-row";

                icons.forEach(icon => {
                    const img = document.createElement("img");
                    img.src = icon.URL;
                    img.alt = icon.Extra || info.Name || "Hazard icon";
                    img.title = icon.Extra || info.Name || "Hazard icon";
                    img.className = "icon";
                    row.appendChild(img);
                });

                wrap.appendChild(row);
            }
        }
    }

    // 2) external image URL เช่น NFPA diamond image
    if (Array.isArray(value.ExternalDataURL) && value.ExternalDataURL.length) {
        const row = document.createElement("div");
        row.className = "hazard-icon-row";

        value.ExternalDataURL.forEach(url => {
            const img = document.createElement("img");
            img.src = url;
            img.alt = info.Name || "Hazard image";
            img.title = info.Name || "Hazard image";
            img.className = "figure";
            row.appendChild(img);
        });

        wrap.appendChild(row);
    }

    // 3) string list
    const items = [];

    if (Array.isArray(value.StringWithMarkup)) {
        value.StringWithMarkup.forEach(item => {
            const txt = item?.String?.trim();
            if (txt) items.push(txt);
        });
    }

    if (Array.isArray(value.String)) {
        value.String.forEach(str => {
            const txt = String(str).trim();
            if (txt) items.push(txt);
        });
    }

    if (Array.isArray(value.Number)) {
        value.Number.forEach(num => {
            items.push(String(num));
        });
    }

    if (typeof value.Boolean === "boolean") {
        items.push(String(value.Boolean));
    }

    if (items.length) {
        // ถ้าเป็นค่าเดียว เช่น NFPA rating = 3
        if (items.length === 1) {
            const p = document.createElement("p");
            p.textContent = items[0];
            wrap.appendChild(p);
        } else {
            const ul = document.createElement("ul");
            ul.className = "hazard-list";

            items.forEach(text => {
                const li = document.createElement("li");
                li.textContent = text;
                ul.appendChild(li);
            });

            wrap.appendChild(ul);
        }
    }

    // 4) ถ้าไม่มีอะไรเลยค่อยคืน null ให้ fallback renderer ทำงาน
    if (!wrap.childNodes.length) return null;

    return wrap;
}

function getValueBySectionHeading(sections = [], headings = [], fallback = "ไม่มีข้อมูล") {
    const sec = findSectionByPossibleNames(sections, headings);
    if (!sec) return fallback;

    const values = extractAllStringsFromInfoArray(sec.Information || [])
        .map(v => String(v).trim())
        .filter(Boolean);

    if (!values.length) return fallback;

    const joined = values.join(" ");

    // ใส่ unit ถ้ามี
    const firstInfo = Array.isArray(sec.Information) ? sec.Information[0] : null;
    const unit =
        firstInfo?.Value?.Unit && !joined.includes(firstInfo.Value.Unit)
            ? ` ${firstInfo.Value.Unit}`
            : "";

    return joined + unit;
}

function renderValue(value) {
    const container = document.createElement("div");

    if (Array.isArray(value.String)) {
        value.String.forEach(str => {
            const p = document.createElement("p");
            p.textContent = str;

            if (looksLikeChemicalNotation(str)) {
                p.classList.add("notranslate");
                p.setAttribute("translate", "no");
            }

            container.appendChild(p);
        });
    }

    if (Array.isArray(value.Number)) {
        value.Number.forEach(num => {
            const p = document.createElement("p");
            p.textContent = typeof num === "object" ? JSON.stringify(num) : String(num);
            container.appendChild(p);
        });
    }

    if (typeof value.Boolean === "boolean") {
        const p = document.createElement("p");
        p.textContent = String(value.Boolean);
        container.appendChild(p);
    }

    if (Array.isArray(value.ExternalDataURL)) {
        value.ExternalDataURL.forEach(url => {
            if ((value.MimeType || "").startsWith("image/")) {
                const img = document.createElement("img");
                img.src = url;
                img.className = "figure";
                img.alt = "External image";
                container.appendChild(img);
            } else {
                const p = document.createElement("p");
                p.innerHTML = `<a href="${escapeAttr(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(url)}</a>`;
                container.appendChild(p);
            }
        });
    }

    const knownKeys = new Set([
        "StringWithMarkup", "String", "Number", "Boolean", "ExternalDataURL", "MimeType"
    ]);

    Object.keys(value).forEach(key => {
        if (!knownKeys.has(key)) {
            const details = document.createElement(urlParams.get('print') ? "div" : "details");
            if (urlParams.get('print')) {
                details.innerHTML = `<p>${escapeHtml(key)}</p><pre>${escapeHtml(JSON.stringify(value[key], null, 2))}</pre>`;
            } else {
                details.innerHTML = `<summary>${escapeHtml(key)}</summary><pre>${escapeHtml(JSON.stringify(value[key], null, 2))}</pre>`;
            }
            container.appendChild(details);
        }
    });

    return container;
}

let acc = ""
let blacklists = [
    "(the list is too long and has been truncated)"
]

function renderStringWithMarkup(item) {
    const block = document.createElement("div");
    const raw = item?.String || "";
    const markup = Array.isArray(item?.Markup) ? item.Markup : [];
    block.className = "kv";

    // รองรับ pictogram/icon โดยไม่สนว่าข้อความจะเป็นช่องว่างหรือไม่
    const iconMarkup = markup.filter(m => m?.URL && m.Type === "Icon");

    if (iconMarkup.length > 0) {
        const row = document.createElement("div");
        row.className = "pictogram-row";

        iconMarkup.forEach(m => {
            const img = document.createElement("img");
            img.src = m.URL;
            img.alt = m.Extra || "Icon";
            img.title = m.Extra || "Icon";
            img.className = "icon";
            row.appendChild(img);
        });

        block.appendChild(row);
        return block;
    }

    if (!markup.length) {
        if (!blacklists.includes(raw) && raw.trim()) {
            if (acc !== raw) {
                const p = document.createElement("p");
                p.textContent = raw;
                block.appendChild(p);
                acc = raw;
            }
        }
        return block;
    }

    const fragments = [];
    let cursor = 0;
    const sorted = [...markup].sort((a, b) => (a.Start || 0) - (b.Start || 0));

    for (const m of sorted) {
        const start = m.Start ?? 0;
        const length = m.Length ?? 0;
        const end = start + length;

        if (cursor < start) {
            fragments.push(escapeHtml(raw.slice(cursor, start)));
        }

        const text = raw.slice(start, end);
        let rendered = escapeHtml(text);

        if (m.URL) {
            rendered = `<a href="${escapeAttr(m.URL)}" target="_blank" rel="noopener noreferrer">${rendered || escapeHtml(m.URL)}</a>`;
        } else if (m.Type === "Italics") {
            rendered = `<em>${rendered}</em>`;
        } else if (m.Type === "Superscript") {
            rendered = `<sup>${rendered}</sup>`;
        } else if (m.Type === "Subscript") {
            rendered = `<sub>${rendered}</sub>`;
        } else if (m.Type === "Color") {
            rendered = `<span>${rendered}</span>`;
        }

        fragments.push(rendered);
        cursor = end;
    }

    if (cursor < raw.length) {
        fragments.push(escapeHtml(raw.slice(cursor)));
    }

    const html = fragments.join("").trim();
    if (html) {
        const p = document.createElement("p");
        p.innerHTML = html;
        block.appendChild(p);
    }

    return block;
}

function looksLikeChemicalNotation(text = "") {
    const t = text.trim();

    // CAS เช่น 64-17-5
    const casPattern = /^\d{2,7}-\d{2}-\d$/;

    // สูตร/SMILES แบบหยาบ ๆ
    const chemicalPattern = /^[A-Za-z0-9@+\-\[\]\(\)=#$\\/%.,:;]+$/;

    // keyword ที่ไม่ควรแปล
    const protectedWords = [
        "SMILES", "InChI", "InChIKey", "CID", "CAS", "UNII",
        "Formula", "Molecular Formula"
    ];

    if (protectedWords.some(word => t.includes(word))) return true;
    if (casPattern.test(t)) return true;

    // ข้อความสั้น ๆ ที่เป็น chemical notation
    if (t.length <= 120 && chemicalPattern.test(t)) return true;

    return false;
}

function makeSafeId(text) {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, 'ไม่มีข้อมูล');
}

const P_CODE_DICT = {
    P101: "หากต้องปรึกษาแพทย์ ให้เตรียมภาชนะบรรจุหรือฉลากผลิตภัณฑ์ไปด้วย",
    P102: "เก็บให้พ้นมือเด็ก",
    P103: "อ่านฉลากก่อนใช้",
    P201: "ขอคำแนะนำพิเศษก่อนใช้งาน",
    P202: "ห้ามใช้งานก่อนอ่านและทำความเข้าใจข้อควรระวังด้านความปลอดภัยทั้งหมด",
    P210: "เก็บให้ห่างจากความร้อน พื้นผิวร้อน ประกายไฟ เปลวไฟ และแหล่งจุดติดไฟอื่น ๆ ห้ามสูบบุหรี่",
    P211: "ห้ามฉีดพ่นลงบนเปลวไฟหรือแหล่งจุดติดไฟอื่น",
    P220: "เก็บ/จัดเก็บให้ห่างจากเสื้อผ้าและวัสดุที่ติดไฟได้",
    P221: "ใช้มาตรการป้องกันการผสมกับวัสดุไวไฟ",
    P222: "ห้ามสัมผัสกับอากาศ",
    P223: "ห้ามสัมผัสกับน้ำ",
    P230: "เก็บให้ชื้นด้วย...",
    P231: "จัดการภายใต้บรรยากาศเฉื่อย",
    P232: "ป้องกันความชื้น",
    P233: "ปิดภาชนะบรรจุให้สนิท",
    P234: "เก็บในภาชนะบรรจุเดิมเท่านั้น",
    P235: "เก็บในที่เย็น",
    P240: "ต่อสายดินและเชื่อมประสานภาชนะบรรจุและอุปกรณ์รับถ่าย",
    P241: "ใช้อุปกรณ์ไฟฟ้า/ระบายอากาศ/แสงสว่างแบบป้องกันการระเบิด",
    P242: "ใช้เครื่องมือที่ไม่เกิดประกายไฟ",
    P243: "ใช้มาตรการป้องกันไฟฟ้าสถิต",
    P244: "รักษาความสะอาดของวาล์วลดแรงดัน",
    P250: "ห้ามบด/กระแทก/เสียดสี",
    P251: "ห้ามเจาะหรือเผา แม้ภาชนะจะว่างแล้ว",
    P260: "ห้ามสูดดมฝุ่น/ควัน/ก๊าซ/หมอก/ไอระเหย/ละออง",
    P261: "หลีกเลี่ยงการสูดดมฝุ่น/ควัน/ก๊าซ/หมอก/ไอระเหย/ละออง",
    P262: "ห้ามให้สัมผัสตา ผิวหนัง หรือเสื้อผ้า",
    P263: "หลีกเลี่ยงการสัมผัสระหว่างตั้งครรภ์หรือขณะให้นมบุตร",
    P264: "ล้างมือให้สะอาดหลังการใช้งาน",
    P265: "ห้ามสัมผัสดวงตา",
    P270: "ห้ามรับประทาน ดื่ม หรือสูบบุหรี่ระหว่างใช้ผลิตภัณฑ์",
    P271: "ใช้เฉพาะในที่โล่งหรือบริเวณที่มีการระบายอากาศดี",
    P272: "ห้ามนำเสื้อผ้าที่ปนเปื้อนออกนอกสถานที่ทำงาน",
    P273: "หลีกเลี่ยงการปล่อยสู่สิ่งแวดล้อม",
    P280: "สวมถุงมือป้องกัน เสื้อผ้าป้องกัน และอุปกรณ์ป้องกันตา/ใบหน้า",
    P281: "ใช้อุปกรณ์ป้องกันส่วนบุคคลตามที่กำหนด",
    P282: "สวมถุงมือกันความเย็นและอุปกรณ์ป้องกันใบหน้า",
    P283: "สวมเสื้อผ้ากันไฟหรือกันความร้อน",
    P301: "หากกลืนกิน",
    P302: "หากสัมผัสผิวหนัง",
    P303: "หากสัมผัสผิวหนังหรือเส้นผม",
    P304: "หากสูดดม",
    P305: "หากเข้าตา",
    P306: "หากสัมผัสเสื้อผ้า",
    P307: "หากสัมผัสหรือมีความเสี่ยงต่อการสัมผัส",
    P308: "หากสัมผัสหรือสงสัยว่าสัมผัส",
    P309: "หากสัมผัสหรือรู้สึกไม่สบาย",
    P310: "ติดต่อศูนย์พิษวิทยาหรือแพทย์ทันที",
    P311: "ติดต่อศูนย์พิษวิทยาหรือแพทย์",
    P312: "โทรติดต่อศูนย์พิษวิทยาหรือแพทย์หากรู้สึกไม่สบาย",
    P313: "รับคำแนะนำทางการแพทย์",
    P314: "ขอคำแนะนำทางการแพทย์หากรู้สึกไม่สบาย",
    P315: "รับการรักษาทางการแพทย์ทันที",
    P317: "ขอความช่วยเหลือทางการแพทย์ / รับความช่วยเหลือทางการแพทย์",
    P319: "ขอความช่วยเหลือทางการแพทย์หากรู้สึกไม่สบาย",
    P320: "ต้องการการรักษาเฉพาะทันที",
    P321: "การรักษาเฉพาะ",
    P322: "การรักษาเฉพาะ",
    P330: "บ้วนปาก",
    P331: "ห้ามทำให้อาเจียน",
    P332: "หากเกิดการระคายเคืองผิวหนัง",
    P333: "หากเกิดการระคายเคืองหรือผื่นผิวหนัง",
    P334: "แช่ในน้ำเย็นหรือใช้ผ้าชุบน้ำเย็น",
    P335: "ปัดฝุ่นออกจากผิวหนัง",
    P336: "ละลายน้ำแข็งด้วยน้ำอุ่น ห้ามถู",
    P337: "หากการระคายเคืองตายังคงอยู่",
    P338: "ถอดคอนแทคเลนส์ถ้ามีและสามารถทำได้ง่าย",
    P340: "ย้ายผู้ป่วยไปยังที่มีอากาศบริสุทธิ์",
    P341: "หากหายใจลำบาก ให้ย้ายไปยังที่มีอากาศบริสุทธิ์",
    P342: "หากมีอาการทางระบบทางเดินหายใจ",
    P350: "ล้างอย่างเบามือด้วยสบู่และน้ำจำนวนมาก",
    P351: "ล้างด้วยน้ำอย่างระมัดระวังเป็นเวลาหลายนาที",
    P352: "ล้างด้วยน้ำและสบู่จำนวนมาก",
    P353: "ล้างผิวหนังด้วยน้ำหรืออาบน้ำ",
    P360: "ล้างเสื้อผ้าที่ปนเปื้อนทันที",
    P361: "ถอดเสื้อผ้าที่ปนเปื้อนออกทันที",
    P362: "ถอดเสื้อผ้าที่ปนเปื้อนและซักก่อนใช้ใหม่",
    P363: "ซักเสื้อผ้าที่ปนเปื้อนก่อนนำกลับมาใช้ใหม่",
    P370: "ในกรณีเกิดไฟไหม้",
    P371: "ในกรณีเกิดไฟไหม้ใหญ่",
    P372: "อันตรายจากการระเบิดในกรณีไฟไหม้",
    P373: "ห้ามดับไฟเมื่อไฟลุกถึงวัตถุระเบิด",
    P374: "ดับไฟจากระยะปลอดภัย",
    P375: "ดับไฟจากระยะไกลเนื่องจากอันตรายจากการระเบิด",
    P376: "หยุดการรั่วไหลหากสามารถทำได้อย่างปลอดภัย",
    P377: "ไฟไหม้ก๊าซรั่ว ห้ามดับไฟจนกว่าจะหยุดการรั่ว",
    P378: "ใช้สารดับเพลิงที่เหมาะสม",
    P380: "อพยพพื้นที่",
    P381: "กำจัดแหล่งจุดติดไฟหากสามารถทำได้อย่างปลอดภัย",
    P390: "ดูดซับสารหกรั่วไหลเพื่อป้องกันความเสียหาย",
    P401: "เก็บรักษาตามคำแนะนำ",
    P402: "เก็บในที่แห้ง",
    P403: "เก็บในที่มีการระบายอากาศดี",
    P404: "เก็บในภาชนะปิดสนิท",
    P405: "เก็บในที่ล็อก",
    P406: "เก็บในภาชนะที่ทนต่อการกัดกร่อน",
    P407: "เว้นระยะระหว่างกองสินค้า",
    P410: "ป้องกันแสงแดด",
    P411: "เก็บที่อุณหภูมิไม่เกิน...",
    P412: "ห้ามเก็บที่อุณหภูมิเกิน 50°C",
    P413: "เก็บในปริมาณมากที่อุณหภูมิไม่เกิน...",
    P420: "เก็บให้ห่างจากวัสดุอื่น",
    P501: "กำจัดสาร/ภาชนะบรรจุตามข้อกำหนดของท้องถิ่น",
    P203: "ขอ รับ และปฏิบัติตามคำแนะนำด้านความปลอดภัยทั้งหมดก่อนใช้งาน",
    P284: "สวมอุปกรณ์ป้องกันระบบทางเดินหายใจหากการระบายอากาศไม่เพียงพอ",
    P316: "รับการช่วยเหลือทางการแพทย์ฉุกเฉินทันที",
    P317: "รับความช่วยเหลือทางการแพทย์",
    P318: "หากสัมผัสหรือมีความกังวลว่ามีการสัมผัส ให้รับคำแนะนำทางการแพทย์",
};

function parsePCodes(text = "") {
    return text
        .replace(/\band\b/g, "")
        .split(",")
        .map(v => v.trim())
        .filter(Boolean);
}

function translatePCode(code) {

    const parts = code.split("+").map(v => v.trim());

    const texts = parts
        .map(p => P_CODE_DICT[p])
        .filter(Boolean);

    if (!texts.length) return "ไม่มีข้อมูล";

    // ตัวแรกใช้ colon
    let result = texts[0];

    if (texts.length > 1) {
        result += ": " + texts.slice(1).join(" และ ");
    }

    return result;
}

function getPrecautionaryStatementsTranslated(sections = []) {
    const raw = getInfoTextFromSections(sections, "Precautionary Statement Codes", "ไม่มีข้อมูล");
    if (!raw || raw === "ไม่มีข้อมูล") return [];

    const codes = parsePCodes(raw);

    return codes.map(code => ({
        code,
        text: translatePCode(code) || "ไม่มีข้อมูล"
    }));
}

function renderPrecautionaryStatementsTranslated(items = []) {
    if (!items.length) return "<p>ไม่มีข้อมูล</p>";

    return `
        <ul>
            ${items.map(item => `
                <li>
                    ${escapeHtml(item.code)} : ${escapeHtml(item.text)}
                </li>
            `).join("")}
        </ul>
    `;
}

function parseFirstAidFromGeneral(text = "") {

    const result = {
        inhalation: "ไม่มีข้อมูล",
        skin: "ไม่มีข้อมูล",
        eye: "ไม่มีข้อมูล",
        ingestion: "ไม่มีข้อมูล"
    };

    if (!text) return result;

    const patterns = {
        eye: /(EYES?|Eye):([\s\S]*?)(?=(SKIN|INHALATION|INGESTION|Breathing|Swallow|$))/i,
        skin: /(SKIN|Skin):([\s\S]*?)(?=(EYE|INHALATION|INGESTION|Breathing|Swallow|$))/i,
        inhalation: /(INHALATION|Breathing):([\s\S]*?)(?=(EYE|SKIN|INGESTION|Swallow|$))/i,
        ingestion: /(INGESTION|Swallow):([\s\S]*?)(?=(EYE|SKIN|INHALATION|$))/i
    };

    for (const key in patterns) {
        const m = text.match(patterns[key]);
        if (m) {
            result[key] = m[2].trim();
        }
    }

    return result;
}

function extractExtinguishingMedia(text = "") {
    if (!text || text === "ไม่มีข้อมูล") return "ไม่มีข้อมูล";

    const clean = String(text).replace(/\s+/g, " ").trim();

    const match = clean.match(/Suitable extinguishing media:\s*([^.]*)/i);

    if (match && match[1]) {
        return match[1].trim();
    }

    return "ไม่มีข้อมูล";
}

function createMenu() {
    const menuList = document.getElementById("menuList");
    if (!menuList) return;

    let html = "<ul>";
    menu.forEach(item => {
        html += `<li style="margin-left: ${(item.level - 2) * 20}px">
                    <a href="#${item.id}">${escapeHtml(item.title)}</a>
                 </li>`;
    });
    html += "</ul>";
    menuList.innerHTML = html;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function escapeAttr(text) {
    return String(text ?? "").replace(/"/g, '&quot;');
}

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForTranslateCombo(maxAttempts = 30, interval = 500) {
    for (let i = 0; i < maxAttempts; i++) {
        const combo = document.querySelector('.goog-te-combo');
        if (combo) return combo;
        await wait(interval);
    }
    return null;
}

function setGoogleTranslateLanguage(lang) {
    const combo = document.querySelector('.goog-te-combo');
    if (!combo) return false;

    combo.value = lang;
    combo.dispatchEvent(new Event('change'));
    return true;
}

async function triggerTranslateEnglishThenThai() {
    const result = document.getElementById("result");
    const official_result = document.getElementById("official_result")

    if (result) {
        result.setAttribute("lang", "en");
        result.setAttribute("translate", "yes");
    } else {
        official_result.setAttribute("lang", "en");
        official_result.setAttribute("translate", "yes");
    }

    if (translated) return true;

    const combo = await waitForTranslateCombo();
    if (!combo) return false;

    console.log("triggerTranslateEnglishThenThai is called");

    // บังคับออกจากไทยก่อน
    setGoogleTranslateLanguage('en');
    await wait(1500);

    // แล้วค่อยกลับมาไทย
    setGoogleTranslateLanguage('th');
    await wait(2000);

    translated = true;
    return true;
}

function scrollToBottomThenPrint() {
    const step = window.innerHeight;
    const delay = 200;
    window.scrollTo(0, 0);
    const timer = setInterval(() => {
        const scrollTop = window.scrollY + window.innerHeight;
        const pageHeight = document.documentElement.scrollHeight;

        if (scrollTop >= pageHeight) {
            clearInterval(timer);

            // small delay to allow final rendering
            setTimeout(() => {
                document.getElementsByClassName('waitingScreen')[0].style.display = "none";
                window.print();
            }, 1000);

            return;
        }

        window.scrollBy(0, step);
        document.getElementById("translatePercentage").innerHTML = Math.floor(window.scrollY / pageHeight * 100)
    }, delay);
}

//Full Print Page | Unofficial & Official
document.addEventListener('DOMContentLoaded', async function () {
    const urlParams = new URLSearchParams(window.location.search);
    const printCommand = urlParams.get('print') === "yes";
    const translateCommand = urlParams.get('translate') === "yes";
    const isOfficial = urlParams.get('official') === "yes";

    if (printCommand) {
        if (translateCommand || isOfficial) {
            await wait(1000);
            await triggerTranslateEnglishThenThai();
            await wait(1500);
            scrollToBottomThenPrint();
        } else {
            await wait(500);
            const waitingScreen = document.getElementsByClassName('waitingScreen')[0];
            if (waitingScreen) waitingScreen.style.display = "none";
            window.print();
        }
    }
});

function printPage() {
    const q = document.getElementById("chemical_name").value
    window.location.href = `/sds-print/?q=${encodeURIComponent(q)}&print=yes&translate=${translated ? "yes" : "no"}&official=no`
}

function officialPrintPage() {
    const q = document.getElementById("chemical_name").value
    window.location.href = `/official-sds-print/?q=${encodeURIComponent(q)}&print=yes&translate=${translated ? "yes" : "no"}&official=yes`
}

//Official Print Page
function findSectionsByHeading(sections = [], heading) {
    let results = [];

    for (const section of sections) {
        if (section.TOCHeading === heading || section.Name === heading) {
            results.push(section);
        }

        if (Array.isArray(section.Section)) {
            results = results.concat(findSectionsByHeading(section.Section, heading));
        }
    }

    return results;
}

function findInfosByName(sections = [], infoName) {
    let results = [];

    for (const section of sections) {
        if (Array.isArray(section.Information)) {
            results.push(...section.Information.filter(info => info.Name === infoName));
        }

        if (Array.isArray(section.Section)) {
            results = results.concat(findInfosByName(section.Section, infoName));
        }
    }

    return results;
}

function extractStringsFromValue(value) {
    const out = [];

    if (!value) return out;

    if (Array.isArray(value.StringWithMarkup)) {
        value.StringWithMarkup.forEach(item => {
            if (item?.String && item.String.trim()) {
                out.push(item.String.trim());
            }
        });
    }

    if (Array.isArray(value.String)) {
        value.String.forEach(str => {
            if (String(str).trim()) out.push(String(str).trim());
        });
    }

    if (Array.isArray(value.Number)) {
        value.Number.forEach(num => out.push(String(num)));
    }

    if (typeof value.Boolean === "boolean") {
        out.push(String(value.Boolean));
    }

    return out;
}

function extractFirstString(value, fallback = "ไม่มีข้อมูล") {
    const arr = extractStringsFromValue(value);
    return arr.length ? arr[0] : fallback;
}


function getSectionTitle(section) {
    return section?.TOCHeading || section?.Name || "";
}

function collectSectionInfo(section) {
    const results = [];

    if (!section) return results;

    if (Array.isArray(section.Information)) {
        section.Information.forEach(info => {
            results.push({
                name: info.Name || "",
                value: extractStringsFromValue(info.Value),
                raw: info
            });
        });
    }

    if (Array.isArray(section.Section)) {
        section.Section.forEach(sub => {
            results.push(...collectSectionInfo(sub));
        });
    }

    return results;
}

function findSectionByPossibleNames(sections = [], possibleNames = []) {
    for (const section of sections) {
        const title = getSectionTitle(section);

        if (possibleNames.includes(title)) {
            return section;
        }

        if (Array.isArray(section.Section)) {
            const found = findSectionByPossibleNames(section.Section, possibleNames);
            if (found) return found;
        }
    }

    return null;
}

function getInfoValueFromCollected(collected = [], possibleNames = [], fallback = "ไม่มีข้อมูล") {
    const found = collected.find(item => possibleNames.includes(item.name));
    if (!found) return fallback;
    return found.value.length ? found.value.join(" ") : fallback;
}

function getInfoListFromCollected(collected = [], possibleNames = []) {
    const found = collected.find(item => possibleNames.includes(item.name));
    if (!found) return [];
    return found.value || [];
}


function debugSection(section, label = "SECTION") {
    console.log(`===== ${label} =====`);
    console.log("TITLE:", getSectionTitle(section));
    console.log("RAW SECTION:", section);

    const collected = collectSectionInfo(section);
    collected.forEach(item => {
        console.log("INFO:", item.name, item.value);
    });

    return collected;
}

function getInfoTextFromSections(sections = [], name, fallback = "ไม่มีข้อมูล") {
    for (const section of sections) {
        const collected = collectSectionInfo(section);
        const found = collected.find(item => item.name === name && item.value?.length);
        if (found) {
            return found.value.join(" ");
        }
    }
    return fallback;
}

function getPropertyText(sections = [], possibleNames = [], fallback = "ไม่มีข้อมูล") {
    function walk(sectionList) {
        for (const section of sectionList) {
            const title = section?.TOCHeading || section?.Name || "";

            // 1) ถ้าชื่อตรงกับ section heading
            if (possibleNames.includes(title)) {
                const vals = extractAllStringsFromInfoArray(section.Information || []);
                if (vals.length) return vals.join(" ");

                // บางทีข้อมูลอยู่ลึกลงไปใน subsection
                if (Array.isArray(section.Section)) {
                    const nested = [];
                    section.Section.forEach(sub => {
                        nested.push(...extractAllStringsFromInfoArray(sub.Information || []));
                    });
                    if (nested.length) return nested.join(" ");
                }
            }

            // 2) ถ้าชื่อตรงกับ info.Name
            if (Array.isArray(section.Information)) {
                for (const info of section.Information) {
                    if (possibleNames.includes(info.Name || "")) {
                        const vals = extractStringsFromValue(info.Value);
                        if (vals.length) {
                            const unit = info?.Value?.Unit ? ` ${info.Value.Unit}` : "";
                            const text = vals.join(" ");
                            return unit && !text.includes(info.Value.Unit) ? `${text}${unit}` : text;
                        }
                    }
                }
            }

            // 3) recursive ลงลึก
            if (Array.isArray(section.Section)) {
                const found = walk(section.Section);
                if (found && found !== fallback) return found;
            }
        }

        return fallback;
    }

    return walk(sections);
}

function getInfoTextsFromSections(sections = [], name) {
    const info = findInfosByName(sections, name)[0];
    return info ? extractStringsFromValue(info.Value) : [];
}

function getSectionDescriptionFromSections(sections = [], heading, fallback = "ไม่มีข้อมูล") {
    const sec = findSectionsByHeading(sections, heading)[0];
    return sec?.Description || fallback;
}

function buildSdsData(record) {
    const sections = record.Section || [];

    const handlingStorageSection = findSectionByPossibleNames(sections, [
        "Handling and Storage"
    ]);

    const stabilitySection = findSectionByPossibleNames(sections, [
        "Stability and Reactivity"
    ]);

    const airWaterReactionsSection = findSubsectionByHeading(stabilitySection, [
        "Air and Water Reactions"
    ]);

    const reactiveGroupSection = findSubsectionByHeading(stabilitySection, [
        "Reactive Group"
    ]);

    const reactivityAlertsSection = findSubsectionByHeading(stabilitySection, [
        "Reactivity Alerts"
    ]);

    const decompositionSection = findSubsectionByHeading(stabilitySection, [
        "Decomposition"
    ]);

    const humanToxicityValues = getSectionListCleaned(sections, [
        "Human Toxicity Values"
    ]);

    const nonHumanToxicityValues = getSectionListCleaned(sections, [
        "Non-Human Toxicity Values"
    ]);

    const toxicitySummaryText = removeDuplicateSentences(
        getSectionTextByPossibleNames(sections, [
            "Toxicity Summary"
        ], "ไม่มีข้อมูล")
    );

    const generalFirstAid = getSectionTextByPossibleNames(sections, [
        "First Aid Measures",
        "General First Aid"
    ], "ไม่มีข้อมูล");

    const parsedFirstAid = parseFirstAidFromGeneral(generalFirstAid);

    function shortenGeneralFirstAid(text = "") {

        if (!text) return "ไม่มีข้อมูล";

        // ตัด reference
        text = text.replace(/\([^)]*\)/g, "");

        // ตัดส่วนที่เริ่ม EYES / SKIN / INHALATION / INGESTION
        text = text.split(/EYES:|SKIN:|INHALATION:|INGESTION:/i)[0];

        // แยกประโยค
        const sentences = text.split(/[.!?]\s+/);

        return sentences.slice(0, 3).join(". ").trim();
    }

    function truncateClean(text = "", maxLength = 300) {
        if (!text || text === "ไม่มีข้อมูล") return text;

        let clean = String(text)
            .replace(/\s+/g, " ")
            .trim();

        if (clean.length <= maxLength) return clean;

        let truncated = clean.slice(0, maxLength);

        const lastSpace = truncated.lastIndexOf(" ");
        if (lastSpace > 0) {
            truncated = truncated.slice(0, lastSpace);
        }

        // ลบวงเล็บที่เปิดแต่ไม่ปิด
        const open = (truncated.match(/\(/g) || []).length;
        const close = (truncated.match(/\)/g) || []).length;

        if (open > close) {
            truncated = truncated.substring(0, truncated.lastIndexOf("(")).trim();
        }

        return truncated + "...";
    }

    function buildTransportMode(sections = [], modeKeywords = []) {
        // หา subsection เฉพาะ mode ก่อน เช่น "ADR", "IATA"
        const modeSection = findSectionByPossibleNames(sections, modeKeywords);
        const src = modeSection ? [modeSection] : sections;

        return {
            shippingName: getPropertyText(src, [
                "Shipping Name",
                "Proper Shipping Name",
                "DOT Shipping Name",
                "UN Proper Shipping Name"
            ], record.RecordTitle),
            unNumber: getPropertyText(src, [
                "UN Number", "UN/NA Number", "ID Number"
            ]),
            hazardClass: getPropertyText(src, [
                "Hazard Class", "Hazard Class Number", "DOT Hazard Class"
            ]),
            packingGroup: getPropertyText(src, [
                "Packing Group", "DOT Packing Group"
            ]),
            environmentalHazard: getPropertyText(src, [
                "Marine Pollutant", "Environmental Hazard"
            ]),
            specialPrecautions: getPropertyText(src, [
                "Special Precautions for User",
                "Special Provisions",
                "Emergency Response Guide Number"
            ])
        };
    }

    return {
        title: record.RecordTitle || "ไม่มีข้อมูล",
        productName: record.RecordTitle || "ไม่มีข้อมูล",
        chemicalName: record.RecordTitle || "ไม่มีข้อมูล",
        synonyms: getBestSynonyms(sections, record.RecordTitle || "ไม่มีข้อมูล", [], 10),
        molecularFormula: getInfoTextFromSections(sections, "Molecular Formula"),
        molecularWeight: getInfoTextFromSections(sections, "Molecular Weight"),
        unNumber: getInfoTextFromSections(sections, "UN Number"),
        ecNumber: getInfoTextFromSections(sections, "EC Number"),
        concentration: "ไม่มีข้อมูล",
        percentage: "100%",
        commonName: record.RecordTitle || "ไม่มีข้อมูล",
        useAndRestriction: getSectionDescriptionFromSections(sections, "Use and Manufacturing"),

        section1: {
            productName: record.RecordTitle || "ไม่มีข้อมูล",
            chemicalName: record.RecordTitle || "ไม่มีข้อมูล",
            synonyms: getBestSynonyms(sections),
            formula: getBestFormulaValue(sections, "ไม่มีข้อมูล"),
            molecularWeight: getBestMolecularWeightValue(sections, "ไม่มีข้อมูล"),
            casNumber: getFirstCasValue(sections, "ไม่มีข้อมูล"),
            useAndRestrictions: truncateClean(getFirstNonDash(
                getSectionTextByPossibleNames(sections, [
                    "Use and Manufacturing",
                    "Use",
                    "Industrial Uses",
                    "Consumer Uses"
                ], "ไม่มีข้อมูล")
            ), 350)
        },

        section2: {
            precautionaryStatementsTranslated:
                getPrecautionaryStatementsTranslated(sections),
            additionalStatements: getFirstNonDash(

                getSectionTextByPossibleNames(sections, [
                    "Hazard Identification"
                ], "ไม่มีข้อมูล"),

                getSectionTextByPossibleNames(sections, [
                    "Reactivity Alerts"
                ], "ไม่มีข้อมูล"),

                getSectionTextByPossibleNames(sections, [
                    "NFPA Hazard Classification"
                ], "ไม่มีข้อมูล")

            ),
            chemicaProperties: "ไม่มีข้อมูล",
        },

        section4: {

            general: shortenGeneralFirstAid(generalFirstAid),

            inhalation: getFirstNonDash(
                getSectionTextByPossibleNames(sections, [
                    "Inhalation First Aid"
                ]),
                parsedFirstAid.inhalation
            ),

            skin: getFirstNonDash(
                getSectionTextByPossibleNames(sections, [
                    "Skin First Aid"
                ]),
                parsedFirstAid.skin
            ),

            eye: getFirstNonDash(
                getSectionTextByPossibleNames(sections, [
                    "Eye First Aid"
                ]),
                parsedFirstAid.eye
            ),

            ingestion: getFirstNonDash(
                getSectionTextByPossibleNames(sections, [
                    "Ingestion First Aid"
                ]),
                parsedFirstAid.ingestion
            )

        },

        section4_2: getFirstNonDash(
            getSectionTextByPossibleNames(sections, [
                "Effects of Short Term Exposure"
            ], "ไม่มีข้อมูล"),
            getSectionTextByPossibleNames(sections, [
                "Acute Effects"
            ], "ไม่มีข้อมูล"),
            getSectionTextByPossibleNames(sections, [
                "Health Effects"
            ], "ไม่มีข้อมูล"),
            getSectionTextByPossibleNames(sections, [
                "Signs and Symptoms"
            ], "ไม่มีข้อมูล"),
            getSectionTextByPossibleNames(sections, [
                "Toxicity Summary"
            ], "ไม่มีข้อมูล"),
            getSectionTextByPossibleNames(sections, [
                "Chronic Effects"
            ], "ไม่มีข้อมูล"),
            "ไม่มีข้อมูล"
        ),

        section5: {
            extinguishingMedia: extractExtinguishingMedia(
                getSectionTextByPossibleNames(sections, [
                    "Fire Fighting"
                ], "ไม่มีข้อมูล")
            ),

            fireHazard: getSectionTextByPossibleNames(sections, [
                "Fire Hazards"
            ], "ไม่มีข้อมูล"),

            fireFighting: getSectionTextByPossibleNames(sections, [
                "Fire Fighting"
            ], "ไม่มีข้อมูล")
        },

        section7: {
            handlingPrecautions: handlingStorageSection
                ? extractAllStringsFromInfoArray(handlingStorageSection.Information || []).join(" ") || "ไม่มีข้อมูล"
                : "ไม่มีข้อมูล",

            safeStorage: getSubsectionText(handlingStorageSection, [
                "Storage Conditions",
                "Conditions for Safe Storage",
                "Storage"
            ], "ไม่มีข้อมูล"),

            specificUse: getSubsectionText(handlingStorageSection, [
                "Specific Use",
                "Specific Uses",
                "Specific End Use(s)"
            ], "ไม่มีข้อมูล"),

            environmentalPrecautions: getSubsectionText(handlingStorageSection, [
                "Environmental Precautions"
            ], "ไม่มีข้อมูล")
        },

        section8: {
            exposureLimits: getSectionListByHeading(sections, [
                "Occupational Exposure Limits",
                "NIOSH Recommendations",
                "Exposure Limits"
            ]),

            exposureControls: getSectionListByHeading(sections, [
                "Exposure Prevention"
            ]),

            engineeringControls: getSectionTextByHeading(sections, [
                "Exposure Prevention"
            ], "ไม่มีข้อมูล"),

            ppe: getSectionTextByHeading(sections, [
                "Personal Protective Equipment (PPE)",
                "Protective Equipment and Clothing"
            ], "ไม่มีข้อมูล"),

            skinProtection: getSubsectionText(
                findSectionByPossibleNames(sections, ["Exposure Prevention"]),
                ["Skin"],
                "ไม่มีข้อมูล"
            ),

            handProtection: getSectionListByHeading(sections, [
                "Protective Equipment and Clothing"
            ]),

            respiratoryProtection: getSectionTextByHeading(sections, [
                "Respirator Recommendations"
            ], "ไม่มีข้อมูล"),

            environmentalExposureControls: getSectionTextByHeading(sections, [
                "Exposure Prevention"
            ], "ไม่มีข้อมูล")
        },

        section9: {
            concentration: "ไม่มีข้อมูล",
            appearance: getPropertyText(sections, ["Physical Description"]),
            odor: getPropertyText(sections, ["Odor"]),
            odorThreshold: getPropertyText(sections, ["Odor Threshold"]),
            molecularWeight: getPropertyText(sections, ["Molecular Weight"]),
            meltingPoint: getPropertyText(sections, ["Melting Point"]),
            boilingPoint: getPropertyText(sections, ["Boiling Point", "Boiling Point at 760 mmHg", "Normal Boiling Point"]),
            flashPoint: getPropertyText(sections, ["Flash Point"]),
            evaporationRate: getPropertyText(sections, ["Evaporation Rate"]),
            flammability: getInfoTextFromSections(sections, ["Flammability"]),
            explosiveLimitLower: getPropertyText(sections, ["Lower Explosive Limit"]),
            explosiveLimitUpper: getPropertyText(sections, ["Upper Explosive Limit"]),
            specificGravity: getPropertyText(sections, ["Specific Gravity"]),
            vaporDensity: getPropertyText(sections, ["Vapor Density"]),
            density: getPropertyText(sections, ["Density"]),
            waterSolubility: getPropertyText(sections, ["Solubility"]),
            vaporPressure: getPropertyText(sections, ["Vapor Pressure"]),
            surfaceTension: getPropertyText(sections, ["Surface Tension"]),
            viscosity: getPropertyText(sections, ["Viscosity"]),
            diffusionCoefficient: getPropertyText(sections, ["Diffusion Coefficient"]),
            ph: getInfoTextFromSections(sections, "pH"),
            partitionCoefficient: getPropertyText(sections, ["Partition Coefficient"]),
            logKow: getPropertyText(sections, ["Log Kow"]),
            autoignitionTemperature: getPropertyText(sections, ["Autoignition Temperature"]),
            decompositionTemperature: getPropertyText(sections, ["Decomposition"]),
            explosiveProperties: getPropertyText(sections, ["Explosive Limits and Potential"]),
            oxidizingProperties: getPropertyText(sections, ["Oxidizing Properties"])
        },

        section10: {
            reactivity: getAllTextFromSection(airWaterReactionsSection, "ไม่มีข้อมูล"),

            chemicalStability: getSectionTextByPossibleNames(sections, [
                "Stability/Shelf Life"
            ], "ไม่มีข้อมูล"),

            hazardousReactions: getAllTextFromSection(reactivityAlertsSection, "ไม่มีข้อมูล"),

            conditionsToAvoid: "ไม่มีข้อมูล",

            incompatibleMaterials: getAllTextFromSection(reactiveGroupSection, "ไม่มีข้อมูล"),

            hazardousDecompositionProducts: getAllTextFromSection(decompositionSection, "ไม่มีข้อมูล")
        },

        section11: {
            acuteToxicity: firstOrDash([
                ...findLinesContaining(humanToxicityValues, ["tox"]),
                ...findLinesContaining(nonHumanToxicityValues, ["ld50"]),
                ...findLinesContaining(nonHumanToxicityValues, ["lc50"]),
                limitText(toxicitySummaryText, 450)
            ].filter(v => v && v !== "ไม่มีข้อมูล")),

            acuteOralToxicity: firstOrDash([
                ...findLinesContaining(humanToxicityValues, ["oral"]),
                ...findLinesContaining(nonHumanToxicityValues, ["ld50", "oral"])
            ]),

            acuteInhalationToxicity: firstOrDash([
                ...findLinesContaining(humanToxicityValues, ["inhalation"]),
                ...findLinesContaining(nonHumanToxicityValues, ["lc50", "inhalation"])
            ]),

            skinCorrosionIrritation: getSectionTextByPossibleNames(sections, [
                "Skin Irritation",
                "Irritation"
            ], "ไม่มีข้อมูล"),

            eyeDamageIrritation: getSectionTextByPossibleNames(sections, [
                "Eye Irritation",
                "Irritation"
            ], "ไม่มีข้อมูล"),

            sensitization: getSectionTextByPossibleNames(sections, [
                "Sensitization"
            ], "ไม่มีข้อมูล"),

            germCellMutagenicity: getSectionTextByPossibleNames(sections, [
                "Mutagenicity",
                "Genotoxicity"
            ], "ไม่มีข้อมูล"),

            carcinogenicity: getSectionTextByPossibleNames(sections, [
                "Carcinogenicity",
                "Cancer Classification"
            ], "ไม่มีข้อมูล"),

            reproductiveToxicity: getSectionTextByPossibleNames(sections, [
                "Reproductive Hazard",
                "Reproductive Effects"
            ], "ไม่มีข้อมูล"),

            developmentalToxicity: getSectionTextByPossibleNames(sections, [
                "Developmental Toxicity",
                "Teratogenicity"
            ], "ไม่มีข้อมูล"),

            stotSingleExposure: getSectionTextByPossibleNames(sections, [
                "Health Effects",
                "Acute Effects"
            ], "ไม่มีข้อมูล"),

            stotRepeatedExposure: getSectionTextByPossibleNames(sections, [
                "Chronic Effects",
                "Repeated Dose Toxicity"
            ], "ไม่มีข้อมูล"),

            aspirationHazard: getSectionTextByPossibleNames(sections, [
                "Aspiration Hazard"
            ], "ไม่มีข้อมูล"),

            additionalInformation: "ไม่มีข้อมูล"
        },

        section12: {
            ecotoxicity: getSectionTextByPossibleNames(sections, [
                "Ecotoxicity Values",
                "Ecotoxicity"
            ], "ไม่มีข้อมูล"),

            persistenceDegradability: getFirstNonDash(
                getSectionTextByPossibleNames(sections, [
                    "Biodegradation",
                    "Biodegradation Summary"
                ], "ไม่มีข้อมูล"),
                getSectionTextByPossibleNames(sections, [
                    "Environmental Fate"
                ], "ไม่มีข้อมูล")
            ),

            bioaccumulation: getFirstNonDash(
                getSectionTextByPossibleNames(sections, [
                    "Bioaccumulation",
                    "Bioconcentration"
                ], "ไม่มีข้อมูล"),
                getSectionTextByPossibleNames(sections, [
                    "BCF"
                ], "ไม่มีข้อมูล")
            ),

            mobilitySoil: getFirstNonDash(
                getSectionTextByPossibleNames(sections, [
                    "Soil Adsorption/Mobility"
                ], "ไม่มีข้อมูล"),
                getSectionTextByPossibleNames(sections, [
                    "Environmental Fate"
                ], "ไม่มีข้อมูล")
            ),

            otherEffects: getSectionTextByPossibleNames(sections, [
                "Environmental Fate",
                "Environmental Exposure"
            ], "ไม่มีข้อมูล")
        },

        section13: {
            productDisposal: getSectionTextByPossibleNames(sections, [
                "Disposal Methods"
            ], "ไม่มีข้อมูล"),

            contaminatedPackaging: getSectionTextByPossibleNames(sections, [
                "Disposal Methods"
            ], "ไม่มีข้อมูล")
        },

        section14: {
            adr: buildTransportMode(sections, [
                "ADR", "ADR/RID", "Road Transport", "Transport by Road"
            ]),
            imdg: buildTransportMode(sections, [
                "IMDG", "Sea Transport", "Transport by Sea", "Maritime"
            ]),
            iata: buildTransportMode(sections, [
                "IATA", "Air Transport", "Transport by Air", "ICAO/IATA"
            ]),
            adnr: buildTransportMode(sections, [
                "ADNR", "ADN", "Inland Waterway", "Transport by Inland Waterway"
            ])
        },

        section15: {
            regulatory: getFirstNonDash(
                getSectionTextByPossibleNames(sections, [
                    "Regulatory Information"
                ], ""),

                getSectionTextByPossibleNames(sections, [
                    "EPA Chemical Lists"
                ], ""),

                getSectionTextByPossibleNames(sections, [
                    "FDA Requirements"
                ], "")
            )
        },

        section16: {
            fullHStatements: getSectionListByPossibleNames(sections, [
                "GHS Hazard Statements"
            ]),
            references: `PubChem Compound Summary for ${record.RecordTitle}, CID ${record.RecordNumber} – https://pubchem.ncbi.nlm.nih.gov/compound/${record.RecordNumber}`
        }
    };
}

function getInfoTextFromSections(sections = [], name, fallback = "ไม่มีข้อมูล") {
    for (const section of sections) {
        const collected = collectSectionInfo(section);
        const found = collected.find(item => item.name === name && item.value?.length);
        if (found) {
            return found.value.join(" ");
        }
    }
    return fallback;
}

function getInfoTextsFromSections(sections = [], name) {
    for (const section of sections) {
        const collected = collectSectionInfo(section);
        const found = collected.find(item => item.name === name && item.value?.length);
        if (found) {
            return found.value;
        }
    }
    return [];
}

function getFirstNonDash(...values) {
    for (const v of values) {
        if (Array.isArray(v) && v.length) return v;
        if (typeof v === "string" && v.trim() && v.trim() !== "ไม่มีข้อมูล") return v.trim();
    }
    return Array.isArray(values[0]) ? [] : "ไม่มีข้อมูล";
}

function renderUl(items = []) {
    return items.length
        ? `<ul>${items.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
        : "<p>ไม่มีข้อมูล</p>";
}

function getSectionTextByPossibleNames(sections = [], names = [], fallback = "ไม่มีข้อมูล") {
    const sec = findSectionByPossibleNames(sections, names);
    if (!sec) return fallback;

    const vals = collectSectionInfo(sec)
        .flatMap(item => item.value || [])
        .map(v => String(v).trim())
        .filter(Boolean);

    return vals.length ? vals.join(" ") : fallback;
}

function getSectionListByPossibleNames(sections = [], names = []) {
    const sec = findSectionByPossibleNames(sections, names);
    if (!sec) return [];
    return extractAllStringsFromInfoArray(sec.Information || []);
}

function getSectionByHeading(sections = [], headings = []) {
    return findSectionByPossibleNames(sections, headings);
}

function getSectionByHeading(rootSections = [], headings = []) {
    return findSectionByPossibleNames(rootSections, headings);
}

function getSubsectionByHeading(section, headings = []) {
    return findSubsectionByHeading(section, headings);
}

function getAllTextFromSection(section, fallback = "ไม่มีข้อมูล") {
    if (!section) return fallback;
    const vals = extractAllStringsFromInfoArray(section.Information || []);
    return vals.length ? vals.join(" ") : fallback;
}

function getSectionRawValues(sections = [], headings = []) {
    const sec = getSectionByHeading(sections, headings);
    if (!sec) return [];

    const values = extractAllStringsFromInfoArray(sec.Information || []);
    return uniqueValues(values);
}

function getFirstCasValue(sections = [], fallback = "ไม่มีข้อมูล") {
    const values = getSectionRawValues(sections, ["CAS"]);
    const cas = values.find(v => /^\d{2,7}-\d{2}-\d$/.test(v));
    return cas || fallback;
}

function getBestFormulaValue(sections = [], fallback = "ไม่มีข้อมูล") {
    const values = getSectionRawValues(sections, ["Molecular Formula"]);
    if (!values.length) return fallback;

    // เอาค่าที่เป็น molecular formula จริงก่อน เช่น C3H6O
    const strictFormula = values.find(v =>
        /^[A-Z][A-Za-z0-9()]*([A-Z][A-Za-z0-9()]*)*$/.test(v) &&
        !v.includes("ไม่มีข้อมูล") &&
        !v.includes(" ")
    );

    return strictFormula || values[0] || fallback;
}

function getBestMolecularWeightValue(sections = [], fallback = "ไม่มีข้อมูล") {
    const sec = getSectionByHeading(sections, ["Molecular Weight"]);
    if (!sec || !Array.isArray(sec.Information)) return fallback;

    for (const info of sec.Information) {
        const values = uniqueValues(extractStringsFromValue(info.Value));
        if (!values.length) continue;

        const first = values[0];
        const unit = info?.Value?.Unit ? ` ${info.Value.Unit}` : "";

        // ถ้ายังไม่มีหน่วยในข้อความ ค่อยเติม
        return first.includes(info?.Value?.Unit || "") ? first : `${first}${unit}`;
    }

    return fallback;
}

function getSynonymsFromSections(sections = []) {
    const sec = findSectionByPossibleNames(sections, ["Synonyms"]);
    if (!sec) return [];

    const values = collectSectionInfo(sec)
        .flatMap(item => item.value || [])
        .map(v => String(v).trim())
        .filter(Boolean);

    return uniqueValues(values);
}

function getBestSynonyms(sections = [], recordTitle = "", fallback = [], limit = 10) {

    const values = getSynonymsFromSections(sections);
    const mainName = String(recordTitle || "").trim().toLowerCase();

    const filtered = values.filter(v => {

        const text = String(v).trim();
        const lower = text.toLowerCase();

        if (!text) return false;
        if (text === "ไม่มีข้อมูล") return false;
        if (lower === mainName) return false;

        // ตัด CAS
        if (/^\d{2,7}-\d{2}-\d$/.test(text)) return false;

        return true;

    });

    return filtered.slice(0, limit);
}

function getFirstValueByHeading(sections = [], headings = [], fallback = "ไม่มีข้อมูล") {
    const values = getSectionRawValues(sections, headings);
    return values[0] || fallback;
}

function getInfoFromSection(section, names = [], fallback = "ไม่มีข้อมูล") {
    if (!section || !Array.isArray(section.Information)) return fallback;

    const info = section.Information.find(i => names.includes(i.Name));

    if (!info) return fallback;

    return extractFirstString(info.Value, fallback);
}

function getInfoListFromSection(section, names = []) {
    if (!section) return [];

    if (Array.isArray(section.Information)) {
        const info = section.Information.find(i => names.includes(i.Name));
        if (info) return extractStringsFromValue(info.Value);
    }

    if (Array.isArray(section.Section)) {
        for (const sub of section.Section) {
            const fromSub = getInfoListFromSection(sub, names);
            if (fromSub.length) return fromSub;
        }
    }

    return [];
}

function extractAllStringsFromInfoArray(infoArray = []) {
    const out = [];

    infoArray.forEach(info => {
        const vals = extractStringsFromValue(info.Value);
        vals.forEach(v => {
            if (v && v.trim()) out.push(v.trim());
        });
    });

    return out;
}

function findSubsectionByHeading(section, headings = []) {
    if (!section) return null;

    if (headings.includes(section.TOCHeading || section.Name || "")) {
        return section;
    }

    if (Array.isArray(section.Section)) {
        for (const sub of section.Section) {
            const found = findSubsectionByHeading(sub, headings);
            if (found) return found;
        }
    }

    return null;
}

function getSectionTextByHeading(rootSections = [], headings = [], fallback = "ไม่มีข้อมูล") {
    const sec = findSectionByPossibleNames(rootSections, headings);
    if (!sec) return fallback;

    const vals = extractAllStringsFromInfoArray(sec.Information || []);
    return vals.length ? vals.join(" ") : fallback;
}

function getSectionListByHeading(rootSections = [], headings = []) {
    const sec = findSectionByPossibleNames(rootSections, headings);
    if (!sec) return [];

    return extractAllStringsFromInfoArray(sec.Information || []);
}

function getSubsectionText(section, headings = [], fallback = "ไม่มีข้อมูล") {
    const sub = findSubsectionByHeading(section, headings);
    if (!sub) return fallback;

    const vals = extractAllStringsFromInfoArray(sub.Information || []);
    return vals.length ? vals.join(" ") : fallback;
}

function getSubsectionList(section, headings = []) {
    const sub = findSubsectionByHeading(section, headings);
    if (!sub) return [];

    return extractAllStringsFromInfoArray(sub.Information || []);
}

function renderPictogramsFromInfo(info) {
    if (!info?.Value?.StringWithMarkup) return "";

    let html = `<div class="pictogram-row">`;

    info.Value.StringWithMarkup.forEach(item => {
        const markup = Array.isArray(item.Markup) ? item.Markup : [];
        const icons = markup.filter(m => m?.Type === "Icon" && m?.URL);

        icons.forEach(icon => {
            html += `
                <div class="pictogram-item">
                    <img src="${icon.URL}" alt="${icon.Extra || 'Pictogram'}" title="${icon.Extra || 'Pictogram'}">
                    <div>${icon.Extra || ""}</div>
                </div>
            `;
        });
    });

    html += `</div>`;
    return html;
}

function renderListFromInfo(info) {
    if (!info?.Value) return "<p>ไม่มีข้อมูล</p>";

    const items = extractStringsFromValue(info.Value);
    if (!items.length) return "<p>ไม่มีข้อมูล</p>";

    return `<ul>${items.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

function findFirstSectionByNames(sections = [], names = []) {
    for (const section of sections) {
        const heading = section.TOCHeading || section.Name || "";
        if (names.includes(heading)) return section;

        if (Array.isArray(section.Section)) {
            const found = findFirstSectionByNames(section.Section, names);
            if (found) return found;
        }
    }
    return null;
}

function findFirstInfoByNames(sections = [], names = []) {
    for (const section of sections) {
        if (Array.isArray(section.Information)) {
            const foundInfo = section.Information.find(info => names.includes(info.Name));
            if (foundInfo) return foundInfo;
        }

        if (Array.isArray(section.Section)) {
            const found = findFirstInfoByNames(section.Section, names);
            if (found) return found;
        }
    }
    return null;
}

function renderCompositionTable(data) {
    return `
        <p>ส่วนประกอบสำคัญ</p>
        <table>
            <tr>
                <th>องค์ประกอบ</th>
                <th>CAS number</th>
                <th>% โดยน้ำหนัก</th>
            </tr>
            <tr>
                <td>${escapeHtml(data.chemicalName || "ไม่มีข้อมูล")}</td>
                <td>${escapeHtml(data.section1.casNumber || "ไม่มีข้อมูล")}</td>
                <td>100</td>
            </tr>
        </table>
    `;
}

function getInfoTextByNames(sections = [], names = [], fallback = "ไม่มีข้อมูล") {
    const info = findFirstInfoByNames(sections, names);
    return info ? extractFirstString(info.Value, fallback) : fallback;
}

function getInfoListByNames(sections = [], names = []) {
    const info = findFirstInfoByNames(sections, names);
    return info ? extractStringsFromValue(info.Value) : [];
}

function normalizeText(text = "") {
    return String(text).replace(/\s+/g, " ").trim();
}

function removeDuplicateSentences(text = "") {
    const parts = text
        .split(/(?<=[.!?])\s+|;;|\n+/)
        .map(s => normalizeText(s))
        .filter(Boolean);

    const seen = new Set();
    const out = [];

    for (const part of parts) {
        if (!seen.has(part)) {
            seen.add(part);
            out.push(part);
        }
    }

    return out.join(" ");
}

function limitText(text = "", maxLength = 500) {
    const clean = normalizeText(text);
    if (clean.length <= maxLength) return clean;
    return clean.slice(0, maxLength).trim();
}

function getSectionListCleaned(sections = [], names = []) {
    const items = getSectionListByPossibleNames(sections, names);
    return items
        .map(item => normalizeText(item))
        .filter(item =>
            item &&
            !item.startsWith("For more ") &&
            !item.startsWith("Description of ") &&
            !item.startsWith("This section ")
        );
}

function findLinesContaining(items = [], keywords = []) {
    return items.filter(item => {
        const t = item.toLowerCase();
        return keywords.every(k => t.includes(k.toLowerCase()));
    });
}

function firstOrDash(items = []) {
    return items.length ? items[0] : "ไม่มีข้อมูล";
}

function uniqueValues(values = []) {
    return [...new Set(values.map(v => String(v).trim()).filter(Boolean))];
}

function populatePrintSds(data, record) {
    const sections = record.Section || [];

    const setText = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value || "ไม่มีข้อมูล";
    };

    const setHtml = (id, html) => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = html || "ไม่มีข้อมูล";
    };

    setText("chemical_name_title", data.title);
    setHtml("product_name", `${data.section1?.productName} (<span class="notranslate">${data.section1?.productName}</span>)`);
    setText("sec1_chemical_name", data.section1?.chemicalName);
    setText(
        "sec1_synonyms",
        data.section1?.synonyms?.length ? data.section1.synonyms.join(", ") : "ไม่มีข้อมูล"
    );
    setHtml(
        "ghs_precautionary_statements",
        renderPrecautionaryStatementsTranslated(
            data.section2?.precautionaryStatementsTranslated || []
        )
    );
    setHtml(
        "additional_statements",
        data.section2?.additionalStatements || "ไม่มีข้อมูล"
    );
    setText("sec1_formula", data.section1?.formula);
    setText("sec1_molecular_weight", data.section1?.molecularWeight);
    setText("sec1_cas_number", data.section1?.casNumber);
    setText("chemical_name_and_concentration", `${data.chemicalName} / ${data.percentage}`);
    setText("chemical_name_2", data.chemicalName);
    setText("chemical_synonym", data.section1?.synonyms?.length ? data.section1.synonyms.join(", ") : "ไม่มีข้อมูล");
    setText("chemical_formula", data.section1?.formula);
    setText("percentage", data.percentage);
    setText("molecular_weight", data.section1?.molecularWeight);
    setText("cas_number", data.section1?.casNumber);
    setText("un_number", data.unNumber);
    setText("ec_number", data.ecNumber);
    setHtml("chemical_properties", data.section2.chemicaProperties);
    setText("first_aid_general", data.section4?.general);
    setText("first_aid_inhalation", data.section4.inhalation);
    setText("first_aid_skin", data.section4.skin);
    setText("first_aid_eye", data.section4.eye);
    setText("first_aid_ingestion", data.section4.ingestion);
    setText("first_aid_symptoms", data.section4.symptoms);
    setText("first_aid_medical_attention", data.firstAidMedicalAttention);

    setText("fire_fighting_extinguishing_media", data.section5.extinguishingMedia);
    setText("fire_fighting_specific_hazards", data.section5.fireHazard);
    setText("fire_fighting_advice", data.section5.fireFighting);
    setText("fire_fighting_additional_info", "");
    setText(
        "sec1_use_restrictions",
        limitText(data.section1?.useAndRestrictions || "ไม่มีข้อมูล", 400)
    );
    const pictogramInfo = findInfosByName(sections, "Pictogram(s)")[0];
    const hazardInfo = findInfosByName(sections, "GHS Hazard Statements")[0];

    setHtml("ghs_pictograms", pictogramInfo ? renderPictogramsFromInfo(pictogramInfo) : "<p>ไม่มีข้อมูล</p>");
    setHtml("ghs_hazard_statements", hazardInfo ? renderListFromInfo(hazardInfo) : "<p>ไม่มีข้อมูล</p>");
    setText("section4_2", data.section4_2 || "ไม่มีข้อมูล");
    setText("sec6_personal_precautions", data.section6?.personalPrecautions);
    setText("sec6_protective_equipment", data.section6?.protectiveEquipment);
    setHtml(
        "sec6_emergency_procedures",
        data.section6?.emergencyProcedures?.length
            ? `<ul>${data.section6.emergencyProcedures.map(i => `<li>${escapeHtml(i)}</li>`).join("")}</ul>`
            : "<p>ไม่มีข้อมูล</p>"
    );
    setText("sec6_environmental_precautions", data.section6?.environmentalPrecautions);
    setText("sec6_cleanup_methods", data.section6?.cleanupMethods);

    setText("sec7_handling_precautions", data.section7?.handlingPrecautions || "หลีกเลี่ยงการสูดดมไอระเหยและการสัมผัสโดยตรง ใช้งานในบริเวณที่มีการระบายอากาศที่ดี");
    setText("sec7_safe_storage", data.section7?.safeStorage);
    setText("sec7_specific_use", data.section7?.specificUse);
    setText("sec7_environmental_precautions", data.section7?.environmentalPrecautions);

    setHtml(
        "sec8_exposure_limits",
        data.section8?.exposureLimits?.length
            ? `<ul>${data.section8.exposureLimits.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
            : "<p>ไม่มีข้อมูล</p>"
    );

    setHtml(
        "sec8_exposure_controls",
        data.section8?.exposureControls?.length
            ? `<ul>${data.section8.exposureControls.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
            : "<p>ไม่มีข้อมูล</p>"
    );

    setText("sec8_engineering_controls", data.section8?.engineeringControls);
    setText("sec8_ppe", data.section8?.ppe);
    setText("sec8_skin_protection", data.section8?.skinProtection);

    setHtml(
        "sec8_hand_protection",
        data.section8?.handProtection?.length
            ? `<ul>${data.section8.handProtection.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
            : "<p>ไม่มีข้อมูล</p>"
    );

    setText("sec8_respiratory_protection", data.section8?.respiratoryProtection);
    setText("sec8_environmental_exposure_controls", data.section8?.environmentalExposureControls);

    setText("sec9_concentration", data.section9?.concentration);
    setText("sec9_appearance", data.section9?.appearance);
    setText("sec9_odor", data.section9?.odor);
    setText("sec9_odor_threshold", data.section9?.odorThreshold);
    setText("sec9_molecular_weight", data.section9?.molecularWeight);
    setText("sec9_melting_point", data.section9?.meltingPoint);
    setText("sec9_boiling_point", data.section9?.boilingPoint);
    setText("sec9_flash_point", data.section9?.flashPoint);
    setText("sec9_evaporation_rate", data.section9?.evaporationRate);
    setText("sec9_flammability", data.section9?.flammability);
    setText("sec9_explosive_limit_lower", data.section9?.explosiveLimitLower);
    setText("sec9_explosive_limit_upper", data.section9?.explosiveLimitUpper);
    setText("sec9_specific_gravity", data.section9?.specificGravity);
    setText("sec9_vapor_density", data.section9?.vaporDensity);
    setText("sec9_density", data.section9?.density);
    setText("sec9_water_solubility", data.section9?.waterSolubility);
    setText("sec9_vapor_pressure", data.section9?.vaporPressure);
    setText("sec9_surface_tension", data.section9?.surfaceTension);
    setText("sec9_viscosity", data.section9?.viscosity);
    setText("sec9_diffusion_coefficient", data.section9?.diffusionCoefficient);
    setText("sec9_ph", data.section9?.ph);
    setText("sec9_partition_coefficient", data.section9?.partitionCoefficient);
    setText("sec9_log_kow", data.section9?.logKow);
    setText("sec9_autoignition_temperature", data.section9?.autoignitionTemperature);
    setText("sec9_decomposition_temperature", data.section9?.decompositionTemperature);
    setText("sec9_explosive_properties", data.section9?.explosiveProperties);
    setText("sec9_oxidizing_properties", data.section9?.oxidizingProperties);

    setText("sec10_reactivity", data.section10?.reactivity);
    setText("sec10_chemical_stability", data.section10?.chemicalStability);
    setText("sec10_hazardous_reactions", data.section10?.hazardousReactions);
    setText("sec10_conditions_to_avoid", data.section10?.conditionsToAvoid);
    setText("sec10_incompatible_materials", data.section10?.incompatibleMaterials);
    setText("sec10_hazardous_decomposition_products", data.section10?.hazardousDecompositionProducts);
    setText("sec11_acute_toxicity", limitText(data.section11?.acuteToxicity || "ไม่มีข้อมูล", 500));
    setText("sec11_acute_oral_toxicity", limitText(data.section11?.acuteOralToxicity || "ไม่มีข้อมูล", 250));
    setText("sec11_acute_inhalation_toxicity", limitText(data.section11?.acuteInhalationToxicity || "ไม่มีข้อมูล", 250));
    setText("sec11_skin_corrosion_irritation", data.section11?.skinCorrosionIrritation);
    setText("sec11_eye_damage_irritation", data.section11?.eyeDamageIrritation);
    setText("sec11_sensitization", data.section11?.sensitization);
    setText("sec11_germ_cell_mutagenicity", data.section11?.germCellMutagenicity);
    setText("sec11_carcinogenicity", data.section11?.carcinogenicity);
    setText("sec11_reproductive_toxicity", data.section11?.reproductiveToxicity);
    setText("sec11_developmental_toxicity", data.section11?.developmentalToxicity);
    setText("sec11_stot_single_exposure", data.section11?.stotSingleExposure);
    setText("sec11_stot_repeated_exposure", data.section11?.stotRepeatedExposure);
    setText("sec11_aspiration_hazard", data.section11?.aspirationHazard);
    setText("sec11_additional_information", data.section11?.additionalInformation);

    // Section 12
    setText("sec12_ecotoxicity", data.section12?.ecotoxicity);
    setText("sec12_persistence_degradability", data.section12?.persistenceDegradability);
    setText("sec12_bioaccumulation", data.section12?.bioaccumulation);
    setText("sec12_mobility_soil", data.section12?.mobilitySoil);
    setText("sec12_other_effects", data.section12?.otherEffects);

    // Section 13
    setText("sec13_product_disposal", data.section13?.productDisposal);
    setText("sec13_contaminated_packaging", data.section13?.contaminatedPackaging);

    // Section 14 ADR
    setText("sec14_adr_shipping_name", data.section14?.adr?.shippingName);
    setText("sec14_adr_un_number", data.section14?.adr?.unNumber);
    setText("sec14_adr_class", data.section14?.adr?.hazardClass);
    setText("sec14_adr_packing_group", data.section14?.adr?.packingGroup);
    setText("sec14_adr_tank_code", data.section14?.adr?.tankCode);
    setText("sec14_adr_environmental_hazard", data.section14?.adr?.environmentalHazard);
    setText("sec14_adr_special_precautions", data.section14?.adr?.specialPrecautions);

    // Section 14 IMDG
    setText("sec14_imdg_shipping_name", data.section14?.imdg?.shippingName);
    setText("sec14_imdg_un_number", data.section14?.imdg?.unNumber);
    setText("sec14_imdg_class", data.section14?.imdg?.hazardClass);
    setText("sec14_imdg_packing_group", data.section14?.imdg?.packingGroup);
    setText("sec14_imdg_marine_pollutant", data.section14?.imdg?.marinePollutant);
    setText("sec14_imdg_special_precautions", data.section14?.imdg?.specialPrecautions);

    // Section 14 IATA
    setText("sec14_iata_shipping_name", data.section14?.iata?.shippingName);
    setText("sec14_iata_un_number", data.section14?.iata?.unNumber);
    setText("sec14_iata_class", data.section14?.iata?.hazardClass);
    setText("sec14_iata_packing_group", data.section14?.iata?.packingGroup);
    setText("sec14_iata_environmental_hazard", data.section14?.iata?.environmentalHazard);
    setText("sec14_iata_special_precautions", data.section14?.iata?.specialPrecautions);

    // Section 14 ADNR
    setText("sec14_adnr_shipping_name", data.section14?.adnr?.shippingName);
    setText("sec14_adnr_un_number", data.section14?.adnr?.unNumber);
    setText("sec14_adnr_class", data.section14?.adnr?.hazardClass);
    setText("sec14_adnr_packing_group", data.section14?.adnr?.packingGroup);
    setText("sec14_adnr_environmental_hazard", data.section14?.adnr?.environmentalHazard);
    setText("sec14_adnr_special_precautions", data.section14?.adnr?.specialPrecautions);

    // Section 15
    setText("sec15_regulatory", data.section15?.regulatory);

    // Section 16
    setHtml("sec16_full_h_statements", renderUl(data.section16?.fullHStatements || []));
    setText("sec16_references", data.section16?.references);
}