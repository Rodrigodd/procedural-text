let text_elem;

var rawFile = new XMLHttpRequest();
rawFile.open("GET", "rules.txt", false);
rawFile.onreadystatechange = function() {
  if (rawFile.readyState === 4) {
    if (rawFile.status === 200 || rawFile.status == 0) {
        rule_text = rawFile.responseText;
    }
  }
};
rawFile.send(null);

function parseText(text) {
    let lines = text.split("\n");
    let scope = "main";
    let obj = { main: [] };
    for (let i = 0; i<lines.length; i++) {
        let line = lines[i].trim();
        if (line.length == 0) {
            continue;
        }
        line = line.replace(/\\n/g, "\n");
        if (line.startsWith("#")) {
            scope = line.slice(1).trim();
        } else {
            if (obj[scope] == undefined)  obj[scope] = [];
            obj[scope].push(line);
        }
    }
    return obj;
}
let rules = parseText(rule_text);

function generateText() {
    let r = Math.floor(Math.random()*rules["main"].length);
    let text = rules["main"][r];

    typingEffect(text);
}

let cancel_control = false;
let anim = null;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

String.prototype.splice = function(idx, rem, str) {
    return this.slice(0, idx) + str + this.slice(idx + Math.abs(rem));
};

function typingEffect(txt) {
    let i = 0;
    const speed = 10;
    async function type() {
        text_elem.textContent = "";
        cancel_control = false;
        while (i < txt.length) {
            text_elem.textContent += txt.charAt(i);
            i++;
            if (cancel_control) return;
            await sleep(speed);
        }
    }

    async function develop() {
        const regex = /<[^<^>]+>/;

        let s = text_elem.textContent.search(regex);
        if (s == -1) {
            return;
        }

        let scope = text_elem.textContent.match(regex)[0].slice(1,-1).trim();
        if (rules[scope] == undefined) {
            text_elem.textContent = text_elem.textContent.replace(regex, (m) => ("!" + m.slice(1,-1) + "!"));
            return await develop();
        }
        let r = Math.floor(Math.random()*rules[scope].length);
        let replace = rules[scope][r];

        let next_text = text_elem.textContent.replace(regex, replace);
        
        await sleep(200);
        if (cancel_control) return;

        let i = s;
        while(text_elem.textContent.charAt(i)!='>' && i<text_elem.textContent.length) {
            if (i-s < replace.length) {
                text_elem.textContent = text_elem.textContent.splice(i,1, replace[i-s]);
            } else {
                text_elem.textContent = text_elem.textContent.splice(i,1, "");
            }
            i++;
            if (cancel_control) return;
            await sleep(speed);
        }
        while (i-s < replace.length) {
            let subs = 0;
            if (i-s == replace.length - 1) subs = 1;
            text_elem.textContent = text_elem.textContent.splice(i, subs, replace[i-s]);
            i++;
            if (cancel_control) return;
            await sleep(speed);
        }
        text_elem.textContent = next_text;

        if (cancel_control) return;
        await develop();
    }
    if (anim != null) {
        cancel_control = true;
        anim = anim.then(type).then(develop);
    } else {
        anim = type().then(develop);
    }
}

function onGenButton() {
    generateText();
    console.log(text_elem.innerHTML);
}

window.addEventListener('load', function () {
    text_elem = document.getElementById("generated")
    generateText();
})