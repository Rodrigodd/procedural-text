let editor = document.getElementById("editor");

let rule_text = window.localStorage.getItem("rules");
if (rule_text == null) {
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
}

while (editor.firstChild) {
    editor.removeChild(editor.firstChild);
}

for (line of rule_text.split(/\r?\n/)) {
    if (line.length > 0) {
        let div = document.createElement("div");
        div.textContent = line;
        editor.appendChild(div);
    } else {
        continue;
    }
}

function getRuleText() {
    let text = "";
    for (child of editor.childNodes) {
        text = text.concat(child.textContent).concat("\n");
    }
    return text;
}

function onInput() {
    const sel = window.getSelection();
    // console.log(sel.focusNode.parentNode, sel.anchorNode);

    let colors = ["#000010","#000020"];
    let i = 0;
    
    for (child of editor.childNodes) {
        if (child.textContent.length > 0 && child.textContent[child.textContent.length-1] == ":") {
            i++;
            child.style = `background-color:${colors[i%2]};`;
            child.className = "editortitle";
        } else {
            child.style = `background-color:${colors[i%2]};`;
            child.className = "editorline";

            function renderText(text) {
                const key = /(&lt;(?:(?!&gt).)+&gt;)/g;
                const special = /(\\n)/g;
                if (text.length == 0){
                    return "<br>";
                } else {
                    return HtmlEncode(text)
                        .replace(key, "<span style=\"color:#00ff00\">$1</span>")
                        .replace(special, "<span style=\"color:cyan\">$1</span>");
                }
            }
            // restore cursor code from: https://codepen.io/brianmearns/pen/YVjZWw
            const textSegments = getTextSegments(child);
            const textContent = textSegments.map(({text}) => text).join('');
            let anchorIndex = null;
            let focusIndex = null;
            let currentIndex = 0;
            textSegments.forEach(({text, node}) => {
                if (node === sel.anchorNode) {
                    anchorIndex = currentIndex + sel.anchorOffset;
                }
                if (node === sel.focusNode) {
                    focusIndex = currentIndex + sel.focusOffset;
                }
                currentIndex += text.length;
            });
            
            child.innerHTML = renderText(textContent);
            
            if (anchorIndex != null && focusIndex != null) {
                restoreSelection(child, anchorIndex, focusIndex);
            }
        }
    }

    let rule_text = getRuleText();
    window.localStorage.setItem("rules", rule_text);
    rules = parseText(rule_text);
}
editor.addEventListener("input", onInput, false);
onInput();


function getTextSegments(element) {
    const textSegments = [];
    Array.from(element.childNodes).forEach((node) => {
        switch(node.nodeType) {
            case Node.TEXT_NODE:
                textSegments.push({text: node.nodeValue, node});
                break;
                
            case Node.ELEMENT_NODE:
                textSegments.splice(textSegments.length, 0, ...(getTextSegments(node)));
                break;
                
            default:
                throw new Error(`Unexpected node type: ${node.nodeType}`);
        }
    });
    return textSegments;
}

function restoreSelection(node, absoluteAnchorIndex, absoluteFocusIndex) {
    const sel = window.getSelection();
    const textSegments = getTextSegments(node);
    let anchorNode = node;
    let anchorIndex = 0;
    let focusNode = node;
    let focusIndex = 0;
    let currentIndex = 0;
    textSegments.forEach(({text, node}) => {
        const startIndexOfNode = currentIndex;
        const endIndexOfNode = startIndexOfNode + text.length;
        if (startIndexOfNode <= absoluteAnchorIndex && absoluteAnchorIndex <= endIndexOfNode) {
            anchorNode = node;
            anchorIndex = absoluteAnchorIndex - startIndexOfNode;
        }
        if (startIndexOfNode <= absoluteFocusIndex && absoluteFocusIndex <= endIndexOfNode) {
            focusNode = node;
            focusIndex = absoluteFocusIndex - startIndexOfNode;
        }
        currentIndex += text.length;
    });
    sel.setBaseAndExtent(anchorNode,anchorIndex,focusNode,focusIndex);
}


function HtmlEncode(s) {
    var el = document.createElement("div");
    el.innerText = el.textContent = s;
    s = el.innerHTML;
    return s;
}