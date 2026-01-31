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
            hoverProvider: true
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
