"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_1 = require("vscode-languageserver/node");
const vscode_languageserver_textdocument_1 = require("vscode-languageserver-textdocument");
const connection = (0, node_1.createConnection)();
const documents = new node_1.TextDocuments(vscode_languageserver_textdocument_1.TextDocument);
connection.onInitialize((_params) => {
    return {
        capabilities: {
            textDocumentSync: node_1.TextDocumentSyncKind.Incremental,
            hoverProvider: true,
            referencesProvider: true
        }
    };
});
documents.onDidChangeContent(change => {
    try {
        const text = change.document.getText();
        const diagnostics = [];
        let balance = 0;
        for (let i = 0; i < text.length; i++) {
            if (text[i] === "(")
                balance++;
            if (text[i] === ")")
                balance--;
            if (balance < 0) {
                try {
                    diagnostics.push({
                        severity: node_1.DiagnosticSeverity.Error,
                        range: {
                            start: change.document.positionAt(i),
                            end: change.document.positionAt(i + 1)
                        },
                        message: "Unmatched closing parenthesis"
                    });
                }
                catch (error) {
                    // If positionAt fails, skip this diagnostic
                    connection.console.error(`Error creating diagnostic at position ${i}: ${error}`);
                }
                break;
            }
        }
        if (balance > 0) {
            try {
                const lastPos = Math.max(0, text.length - 1);
                diagnostics.push({
                    severity: node_1.DiagnosticSeverity.Error,
                    range: {
                        start: change.document.positionAt(lastPos),
                        end: change.document.positionAt(text.length)
                    },
                    message: "Missing closing parenthesis"
                });
            }
            catch (error) {
                // If positionAt fails, skip this diagnostic
                connection.console.error(`Error creating diagnostic at end: ${error}`);
            }
        }
        connection.sendDiagnostics({
            uri: change.document.uri,
            diagnostics
        });
    }
    catch (error) {
        connection.console.error(`Error processing document change: ${error}`);
    }
});
connection.onHover((params) => {
    try {
        const document = documents.get(params.textDocument.uri);
        if (!document) {
            return null;
        }
        return {
            contents: {
                kind: "markdown",
                value: "**Metta Symbol**\n\nThis is a placeholder hover."
            }
        };
    }
    catch (error) {
        connection.console.error(`Error handling hover: ${error}`);
        return null;
    }
});
// Helper function to extract the word/symbol at a given position
function getWordAtPosition(document, position) {
    try {
        const text = document.getText();
        const offset = document.offsetAt(position);
        // Metta identifier pattern: alphanumeric, underscore, dash, and some special chars
        // Word boundaries for Metta: whitespace, parentheses, brackets, quotes
        const wordPattern = /[a-zA-Z0-9_\-$%&*+./:<=>?@^|~]+/g;
        let match;
        while ((match = wordPattern.exec(text)) !== null) {
            const start = match.index;
            const end = start + match[0].length;
            if (offset >= start && offset <= end) {
                return match[0];
            }
        }
        return null;
    }
    catch (error) {
        connection.console.error(`Error extracting word at position: ${error}`);
        return null;
    }
}
// Helper function to find all occurrences of a word in a document
function findWordOccurrences(document, word) {
    const locations = [];
    try {
        const text = document.getText();
        // Escape special regex characters in the word
        const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        // For Metta, match word boundaries: whitespace, parentheses, brackets, quotes, or start/end of line
        // This handles S-expression syntax where symbols can be adjacent to parentheses
        // Use a simpler pattern that matches the word when not part of a larger identifier
        const boundaryChars = '[\\s()\\[\\]{}"\'\\`,]';
        const regex = new RegExp('(?:^|' + boundaryChars + '|\\b)' + escapedWord + '(?:' + boundaryChars + '|\\b|$)', 'g');
        let match;
        while ((match = regex.exec(text)) !== null) {
            // Find the actual start of the word (might be after a boundary character)
            let wordStart = match.index;
            const matchText = match[0];
            // Find where the actual word starts in the match
            const wordIndexInMatch = matchText.indexOf(word);
            if (wordIndexInMatch > 0) {
                wordStart += wordIndexInMatch;
            }
            const start = document.positionAt(wordStart);
            const end = document.positionAt(wordStart + word.length);
            locations.push({
                uri: document.uri,
                range: {
                    start,
                    end
                }
            });
        }
    }
    catch (error) {
        connection.console.error(`Error finding word occurrences: ${error}`);
    }
    return locations;
}
connection.onReferences((params) => {
    try {
        const document = documents.get(params.textDocument.uri);
        if (!document) {
            return null;
        }
        // Extract the word at the cursor position
        const word = getWordAtPosition(document, params.position);
        if (!word) {
            return [];
        }
        const locations = [];
        // Search in all open documents for workspace-wide references
        for (const doc of documents.all()) {
            const docLocations = findWordOccurrences(doc, word);
            locations.push(...docLocations);
        }
        return locations;
    }
    catch (error) {
        connection.console.error(`Error handling references: ${error}`);
        return [];
    }
});
connection.onDidChangeConfiguration(() => {
    connection.console.log("Configuration changed");
});
// Set up document tracking
documents.listen(connection);
// Start the server
connection.listen();
// Handle uncaught errors to prevent crashes
process.on("uncaughtException", (error) => {
    connection.console.error(`Uncaught exception: ${error.message}`);
});
process.on("unhandledRejection", (reason, promise) => {
    connection.console.error(`Unhandled rejection: ${reason}`);
});
