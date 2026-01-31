import {
  createConnection,
  TextDocuments,
  Diagnostic,
  DiagnosticSeverity,
  Hover,
  InitializeParams,
  TextDocumentSyncKind
} from "vscode-languageserver/node";

import { TextDocument } from "vscode-languageserver-textdocument";

const connection = createConnection();
const documents = new TextDocuments(TextDocument);

connection.onInitialize((_params: InitializeParams) => {
  return {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
      hoverProvider: true
    }
  };
});

documents.onDidChangeContent(change => {
  try {
    const text = change.document.getText();
    const diagnostics: Diagnostic[] = [];

    let balance = 0;

    for (let i = 0; i < text.length; i++) {
      if (text[i] === "(") balance++;
      if (text[i] === ")") balance--;

      if (balance < 0) {
        try {
          diagnostics.push({
            severity: DiagnosticSeverity.Error,
            range: {
              start: change.document.positionAt(i),
              end: change.document.positionAt(i + 1)
            },
            message: "Unmatched closing parenthesis"
          });
        } catch (error) {
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
          severity: DiagnosticSeverity.Error,
          range: {
            start: change.document.positionAt(lastPos),
            end: change.document.positionAt(text.length)
          },
          message: "Missing closing parenthesis"
        });
      } catch (error) {
        // If positionAt fails, skip this diagnostic
        connection.console.error(`Error creating diagnostic at end: ${error}`);
      }
    }

    connection.sendDiagnostics({
      uri: change.document.uri,
      diagnostics
    });
  } catch (error) {
    connection.console.error(`Error processing document change: ${error}`);
  }
});

connection.onHover((params): Hover | null => {
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
  } catch (error) {
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
