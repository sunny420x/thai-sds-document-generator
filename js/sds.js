let menu = [];
let headingIdCounter = 0;
let translated = false
const urlParams = new URLSearchParams(window.location.search);

//Get query param and load compound.
document.addEventListener('DOMContentLoaded', function() {
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
chemical_name_input.addEventListener("keypress", function(event) {
  if (event.key === "Enter") {
    event.preventDefault();
    loadCompound();
  }
});

function updateQuery(query) {
    const printCommand = urlParams.get('print');
    const translateCommand = urlParams.get('translate');
    if (!printCommand && !translateCommand) {
        window.history.pushState({}, "", "?q="+query);
    }
}

async function loadCompound() {
    const result = document.getElementById("result");
    const menuList = document.getElementById("menuList");
    const name = document.getElementById("chemical_name").value.trim();

    if(document.getElementById("menuElement")) {
        document.getElementById("menuElement").style.display = "block"
    }

    //Dynamically update query param.
    updateQuery(name);

    result.innerHTML = "";
    if (menuList) {
        menuList.innerHTML = "";
    }
    menu = [];
    headingIdCounter = 0;
    translated = false;
    acc = "";

    if (!name) {
        result.innerHTML = `<p class="error">โปรดกรอกชื่อสารเคมีเป็นภาษาอังกฤษ หรือ CAS Number หรือ สูตรเคมี เช่น CH3CH3NH2.</p>`;
        return;
    }

    try {
        result.innerHTML = `<p class="loading">กำลังค้นหา CID จาก PubChem...</p>`;

        const cidRes = await fetch(
            `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(name)}/cids/JSON`
        );
        if (!cidRes.ok) throw new Error("พบปัญหาในการค้นหา CID");

        const cidJson = await cidRes.json();
        const cid = cidJson?.IdentifierList?.CID?.[0];
        if (!cid) throw new Error("ไม่พบผลการค้นหา CID");

        result.innerHTML = `<p class="loading">Loading full compound record for CID ${cid}...</p>`;

        const recordRes = await fetch(
            `https://pubchem.ncbi.nlm.nih.gov/rest/pug_view/data/compound/${cid}/JSON/?response_type=display`
        );
        if (!recordRes.ok) throw new Error("พบปัญหาในการดึงข้อมูลจาก PubChem");

        const data = await recordRes.json();

        renderRecord(data, result);

        //Check and add onclick attribute.
        if(document.getElementById('translateBtn')) {
            if(!document.getElementById('translateBtn').hasAttribute('onclick')) {
                document.getElementById('translateBtn').setAttribute("onclick", "setTimeout(triggerTranslateEnglishThenThai, 1000)");
            }
        }
        if(document.getElementById('printPageBtn')) {
            if(!document.getElementById('printPageBtn').hasAttribute('onclick')) {
                document.getElementById('printPageBtn').setAttribute("onclick", "printPage()");
            }
        }
    } catch (err) {
        console.error(err);
        result.innerHTML = `<p class="error">${escapeHtml(err.message)}</p>`;
    }
}

function renderRecord(data, container) {
    const record = data?.Record;
    if (!record) {
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
    container.innerHTML = "";
    container.setAttribute("lang", "en");
    container.appendChild(header);

    (record.Section || []).forEach(section => {
        container.appendChild(renderSection(section, 2));
    });

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

        if(!urlParams.get('print')) {
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
        div.appendChild(renderValue(info.Value));
    }

    return div;
}

function renderValue(value) {
    const container = document.createElement("div");

    if (Array.isArray(value.StringWithMarkup)) {
        value.StringWithMarkup.forEach(item => {
            container.appendChild(renderStringWithMarkup(item));
        });
    }

    if (Array.isArray(value.String)) {
        value.String.forEach(str => {
            const p = document.createElement("p");
            p.textContent = str;
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
            if(!urlParams.get('print')) {
                const details = document.createElement("details");
                details.innerHTML = `<summary>${escapeHtml(key)}</summary><pre>${escapeHtml(JSON.stringify(value[key], null, 2))}</pre>`;
                container.appendChild(details);
            } else {
                const details = document.createElement("div");
                details.innerHTML = `<p>${escapeHtml(key)}</p><pre>${escapeHtml(JSON.stringify(value[key], null, 2))}</pre>`;
                container.appendChild(details);
            }
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

    if (!markup.length) {
        if(!blacklists.includes(raw)) {
            if(acc != raw) {
                const p = document.createElement("p");
                p.textContent = raw;
                block.appendChild(p);
                acc = raw
            } else {
                block.setAttribute("class", "");
            }
            return block;
        }
    }

    const iconOnly = markup.every(m => m.URL && m.Type === "Icon");
    if (iconOnly) {
        const row = document.createElement("div");
        markup.forEach(m => {
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

        const text = raw.slice(start, end) || raw;
        let rendered = escapeHtml(text);

        if (m.URL) {
            if(rendered.length <= 10 && !isNaN(rendered)) {
                rendered = `<a href="${escapeAttr(m.URL)}" target="_blank" rel="noopener noreferrer" class="float-left" style="padding: 0 10px 0 0">${rendered}</a>`;
            } else {
                rendered = `<a href="${escapeAttr(m.URL)}" target="_blank" rel="noopener noreferrer">${rendered}</a>`;
            }
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

    const p = document.createElement("p");
    p.innerHTML = fragments.join("");
    if (looksLikeChemicalNotation(raw)) {
        p.classList.add("notranslate");
        p.setAttribute("translate", "no");
    }
    block.appendChild(p);
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
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
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
    return text.replace(/"/g, '&quot;');
}

function setGoogleTranslateLanguage(lang, callback) {
    const combo = document.querySelector('.goog-te-combo');
    if (!combo) return false;

    combo.value = lang;
    combo.dispatchEvent(new Event('change'));

    if (typeof callback === 'function') {
        setTimeout(callback, 1200);
    }
    translated = true
    return true;
}

function triggerTranslateEnglishThenThai() {
    let attempts = 0;
    const maxAttempts = 30;

    const result = document.getElementById("result");
    result.setAttribute("lang", "en");
    result.setAttribute("translate", "yes");

    //Translates only when the page is not marked as "translated".
    if(!translated) {
        const timer = setInterval(() => {
            const combo = document.querySelector('.goog-te-combo');
            if (combo) {
                clearInterval(timer);

                console.log("triggerTranslateEnglishThenThai is called")

                // รอบแรก: บังคับให้ทั้งหน้าเปลี่ยนออกจากภาษาไทยก่อน
                setGoogleTranslateLanguage('en', () => {
                    // รอบสอง: ค่อยกลับมาเป็นไทย
                    setGoogleTranslateLanguage('th');
                });
            }

            attempts++;
            if (attempts >= maxAttempts) {
                clearInterval(timer);
            }
        }, 500);
    }
}

function scrollToBottomThenPrint() {
    const step = window.innerHeight;
    const delay = 200;

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

document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const printCommand = urlParams.get('print');
    const translateCommand = urlParams.get('translate');
    if (printCommand == "yes") {
        if(translateCommand == "yes") {
            new Promise(resolve => setTimeout(resolve, 1000))
            .then(() => {
                setTimeout(triggerTranslateEnglishThenThai, 1000)
                scrollToBottomThenPrint();
            });
        } else {
            new Promise(resolve => setTimeout(resolve, 500))
            .then(() => {
                document.getElementsByClassName('waitingScreen')[0].style.display = "none";
                window.print();
            })
        }
    }
})

function printPage() {
    q = document.getElementById("chemical_name").value
    window.location.href=`/sds-print/?q=${q}&print=yes&translate=${translated ? "yes" : "no"}`
}