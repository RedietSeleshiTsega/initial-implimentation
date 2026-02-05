"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_1 = require("vscode-languageserver/node");
const vscode_languageserver_textdocument_1 = require("vscode-languageserver-textdocument");
console.error("=== METTA LANGUAGE SERVER STARTING ===");
console.error("Process ID: " + process.pid);
console.error("Node version: " + process.version);
// Create a connection using all proposed features
const connection = (0, node_1.createConnection)(node_1.ProposedFeatures.all);
// Create document manager
const documents = new node_1.TextDocuments(vscode_languageserver_textdocument_1.TextDocument);
// Initialize the server
connection.onInitialize((params) => {
    console.error("=== SERVER INITIALIZING ===");
    const result = {
        capabilities: {
            textDocumentSync: node_1.TextDocumentSyncKind.Incremental,
            hoverProvider: true,
            referencesProvider: true,
            documentFormattingProvider: true
        }
    };
    console.error("Server capabilities registered:", JSON.stringify(result.capabilities, null, 2));
    return result;
});
connection.onInitialized(() => {
    console.error("=== SERVER INITIALIZED SUCCESSFULLY ===");
    connection.console.log("Metta Language Server is ready!");
});
// FEATURE 1: Parenthesis Balance Checking
documents.onDidChangeContent(change => {
    console.error(`Checking document: ${change.document.uri}`);
    validateDocument(change.document);
});
function validateDocument(textDocument) {
    const text = textDocument.getText();
    const diagnostics = [];
    let balance = 0;
    let firstError = -1;
    for (let i = 0; i < text.length; i++) {
        if (text[i] === "(") {
            balance++;
        }
        else if (text[i] === ")") {
            balance--;
            if (balance < 0 && firstError === -1) {
                firstError = i;
                diagnostics.push({
                    severity: node_1.DiagnosticSeverity.Error,
                    range: {
                        start: textDocument.positionAt(i),
                        end: textDocument.positionAt(i + 1)
                    },
                    message: "Unmatched closing parenthesis",
                    source: "metta-ls"
                });
                break;
            }
        }
    }
    if (balance > 0) {
        const end = text.length;
        diagnostics.push({
            severity: node_1.DiagnosticSeverity.Error,
            range: {
                start: textDocument.positionAt(Math.max(0, end - 1)),
                end: textDocument.positionAt(end)
            },
            message: `Missing ${balance} closing parenthesis${balance > 1 ? "es" : ""}`,
            source: "metta-ls"
        });
    }
    console.error(`Found ${diagnostics.length} diagnostic(s)`);
    connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
}
// FEATURE 2: Hover Provider
connection.onHover((params) => {
    console.error(`Hover request at ${params.position.line}:${params.position.character}`);
    const document = documents.get(params.textDocument.uri);
    if (!document) {
        console.error("Document not found for hover");
        return null;
    }
    const word = getWordAtPosition(document, params.position);
    console.error(`Word at position: "${word}"`);
    if (!word) {
        return {
            contents: {
                kind: "markdown",
                value: "**Metta Language**\n\nHover over a symbol to see information."
            }
        };
    }
    const occurrences = findWordOccurrences(document, word);
    console.error(`Found ${occurrences.length} occurrences of "${word}"`);
    return {
        contents: {
            kind: "markdown",
            value: `**Symbol:** \`${word}\`\n\nFound ${occurrences.length} occurrence${occurrences.length !== 1 ? "s" : ""} in this file.`
        }
    };
});
// FEATURE 3: Find All References
connection.onReferences((params) => {
    console.error(`References request at ${params.position.line}:${params.position.character}`);
    const document = documents.get(params.textDocument.uri);
    if (!document) {
        console.error("Document not found for references");
        return null;
    }
    const word = getWordAtPosition(document, params.position);
    if (!word) {
        console.error("No word found at position");
        return [];
    }
    console.error(`Finding references for: "${word}"`);
    const locations = [];
    // Search in all open documents
    for (const doc of documents.all()) {
        const docLocations = findWordOccurrences(doc, word);
        locations.push(...docLocations);
    }
    console.error(`Found ${locations.length} total references`);
    return locations;
});
// FEATURE 4: Document Formatting
connection.onDocumentFormatting((params) => {
    console.error(`Format request for: ${params.textDocument.uri}`);
    const document = documents.get(params.textDocument.uri);
    if (!document) {
        console.error("Document not found for formatting");
        return [];
    }
    const text = document.getText();
    const formatted = formatMettaCode(text);
    console.error("Formatting complete");
    return [
        node_1.TextEdit.replace(node_1.Range.create(node_1.Position.create(0, 0), document.positionAt(text.length)), formatted)
    ];
});
// Helper: Get word at cursor position
function getWordAtPosition(document, position) {
    const text = document.getText();
    const offset = document.offsetAt(position);
    // Metta identifier pattern
    const wordPattern = /[a-zA-Z0-9_\-$%&*+./:<=>?@^|~!]+/g;
    let match;
    while ((match = wordPattern.exec(text)) !== null) {
        if (offset >= match.index && offset <= match.index + match[0].length) {
            return match[0];
        }
    }
    return null;
}
// Helper: Find all occurrences of a word
function findWordOccurrences(document, word) {
    const locations = [];
    const text = document.getText();
    // Escape special regex characters
    const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // Word boundary pattern for Metta
    const boundaryChars = "[\\s()\\[\\]{}\"'\\`,]";
    const pattern = new RegExp(`(?:^|${boundaryChars}|\\b)${escapedWord}(?:${boundaryChars}|\\b|$)`, "g");
    let match;
    while ((match = pattern.exec(text)) !== null) {
        // Find actual word start
        let wordStart = match.index;
        const matchText = match[0];
        const wordIndexInMatch = matchText.indexOf(word);
        if (wordIndexInMatch > 0) {
            wordStart += wordIndexInMatch;
        }
        const start = document.positionAt(wordStart);
        const end = document.positionAt(wordStart + word.length);
        locations.push({
            uri: document.uri,
            range: { start, end }
        });
    }
    return locations;
}
// Helper: Format Metta code
function formatMettaCode(text) {
    const lines = [];
    let currentLine = "";
    let indentLevel = 0;
    const indentSize = 2;
    let inString = false;
    let inComment = false;
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const prevChar = i > 0 ? text[i - 1] : "";
        const nextChar = i < text.length - 1 ? text[i + 1] : "";
        // Handle strings
        if (char === '"' && prevChar !== "\\") {
            inString = !inString;
            currentLine += char;
            continue;
        }
        if (inString) {
            currentLine += char;
            continue;
        }
        // Handle comments
        if (char === ";" && (currentLine.trim() === "" || prevChar === "\n")) {
            inComment = true;
        }
        if (inComment) {
            if (char === "\n") {
                lines.push(" ".repeat(indentLevel * indentSize) + currentLine.trim());
                currentLine = "";
                inComment = false;
            }
            else {
                currentLine += char;
            }
            continue;
        }
        // Handle parentheses
        if (char === "(") {
            if (currentLine.trim() !== "" && prevChar !== "(") {
                lines.push(" ".repeat(indentLevel * indentSize) + currentLine.trim());
                currentLine = "";
            }
            currentLine += char;
            indentLevel++;
            if (nextChar !== ")" && nextChar !== " ") {
                lines.push(" ".repeat((indentLevel - 1) * indentSize) + currentLine.trim());
                currentLine = "";
            }
        }
        else if (char === ")") {
            indentLevel = Math.max(0, indentLevel - 1);
            currentLine += char;
            if (nextChar !== ")") {
                lines.push(" ".repeat(indentLevel * indentSize) + currentLine.trim());
                currentLine = "";
            }
        }
        else if (char === "\n" || char === "\r") {
            if (currentLine.trim() !== "") {
                lines.push(" ".repeat(indentLevel * indentSize) + currentLine.trim());
                currentLine = "";
            }
        }
        else {
            currentLine += char;
        }
    }
    if (currentLine.trim() !== "") {
        lines.push(" ".repeat(indentLevel * indentSize) + currentLine.trim());
    }
    return lines.filter(line => line.trim() !== "").join("\n") + "\n";
}
// Start listening
documents.listen(connection);
connection.listen();
console.error("=== SERVER LISTENING FOR REQUESTS ===");
